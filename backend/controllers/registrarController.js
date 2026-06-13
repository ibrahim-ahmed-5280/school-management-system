const Student = require('../models/Student');
const Enrollment = require('../models/Enrollment');
const Class = require('../models/Class');
const Section = require('../models/Section');
const AcademicYear = require('../models/AcademicYear');
const Branch = require('../models/Branch');
const { logAction } = require('../services/auditLogService');
const mongoose = require('mongoose');

// @desc    Get Current Academic Year for Branch/Tenant
// @route   GET /api/registrar/academic-years/current
// @access  Private (Registrar)
exports.getCurrentAcademicYear = async (req, res) => {
    try {
        const currentYear = await AcademicYear.findOne({
            tenantId: req.user.tenantId,
            isCurrent: true
        });

        if (!currentYear) {
            return res.status(404).json({ success: false, message: 'No active academic year found for this tenant.' });
        }

        res.json({ success: true, data: currentYear });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const { getNextStudentCode } = require('../services/counterService');
const User = require('../models/User');
const { generateTemporaryPassword } = require('../utils/passwords');

// @desc    Create Student + Enrollment (Admission)
// @route   POST /api/registrar/students
// @access  Private (Registrar)
exports.createStudentAdmission = async (req, res) => {
    // NOTE: Removed transactions as current MongoDB instance is standalone.
    
    try {
        const {
            firstName,
            lastName,
            DOB,
            gender,
            guardianInfo,
            status,
            classId,
            sectionId,
            sectionName,
            academicYearId
        } = req.body;

        // 1. Generate Student ID / Admission Number automatically
        const generatedStudentId = await getNextStudentCode(req.user.tenantId, req.user.branchId);
        const studentCode = generatedStudentId;
        const finalAdmissionNumber = generatedStudentId;

        if (!guardianInfo?.address) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: [{ field: 'guardianInfo.address', message: 'Guardian address is required.' }]
            });
        }

        // 1. Validation: Check Admission Number Uniqueness (Tenant Scope)
        const existingStudent = await Student.findOne({ 
            tenantId: req.user.tenantId, 
            admissionNumber: finalAdmissionNumber 
        });

        if (existingStudent) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: [{ field: 'admissionNumber', message: 'Admission number already exists in this tenant.' }]
            });
        }

        // 2. Resolve Academic Year
        let useYearId = academicYearId;
        if (!useYearId) {
            const currentYear = await AcademicYear.findOne({ tenantId: req.user.tenantId, isCurrent: true });
            if (!currentYear) {
                return res.status(400).json({ success: false, message: 'No current academic year found. Please specify one.' });
            }
            useYearId = currentYear._id;
        }

        // 3. Validate Class existence and scope
        const classObj = await Class.findOne({ _id: classId, tenantId: req.user.tenantId, branchId: req.user.branchId });
        if (!classObj) {
            return res.status(400).json({ success: false, message: 'Invalid Class ID for this branch.' });
        }

        // 3.5 Resolve Section (existing or create by name)
        let resolvedSectionId = null;
        if (sectionId) {
            const sectionObj = await Section.findOne({
                _id: sectionId,
                tenantId: req.user.tenantId,
                branchId: req.user.branchId,
                classId
            });
            if (!sectionObj) {
                return res.status(400).json({ success: false, message: 'Invalid Section ID for selected class.' });
            }
            resolvedSectionId = sectionObj._id;
        } else if (sectionName && sectionName.trim()) {
            const normalizedSectionName = sectionName.trim();
            let sectionObj = await Section.findOne({
                tenantId: req.user.tenantId,
                branchId: req.user.branchId,
                classId,
                name: normalizedSectionName
            });
            if (!sectionObj) {
                sectionObj = await Section.create({
                    tenantId: req.user.tenantId,
                    branchId: req.user.branchId,
                    classId,
                    name: normalizedSectionName
                });
            }
            resolvedSectionId = sectionObj._id;
        }

        // 3.6 Student login must be the student ID (admission number)
        const loginUsername = finalAdmissionNumber;
        const existingLogin = await User.findOne({
            tenantId: req.user.tenantId,
            username: loginUsername
        });
        if (existingLogin) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: [{ field: 'admissionNumber', message: 'Student ID already in use for login.' }]
            });
        }

        // 4. Create Student
        const newStudent = new Student({
            tenantId: req.user.tenantId,
            branchId: req.user.branchId,
            admissionNumber: finalAdmissionNumber,
            studentCode,
            firstName,
            lastName,
            DOB,
            gender,
            guardianInfo,
            status: status || 'Active'
        });
        await newStudent.save();

        // 4.5 Create Student User Account
        const defaultPassword = generateTemporaryPassword();

        const studentUser = new User({
            tenantId: req.user.tenantId,
            branchId: req.user.branchId,
            studentId: newStudent._id,
            name: `${firstName} ${lastName}`,
            username: loginUsername,
            passwordHash: defaultPassword, // Hashing is handled by User model pre-save hook
            role: 'student',
            scope: 'branch',
            mustChangePassword: true,
            isActive: true
        });
        await studentUser.save();

        // 5. Create Enrollment
        const newEnrollment = new Enrollment({
            tenantId: req.user.tenantId,
            branchId: req.user.branchId,
            studentId: newStudent._id,
            classId,
            sectionId: resolvedSectionId,
            academicYearId: useYearId,
            status: 'Current'
        });
        await newEnrollment.save();

        // 6. Audit Logs
        try {
             await logAction({
                tenantId: req.user.tenantId,
                branchId: req.user.branchId,
                actorUserId: req.user._id,
                actorRole: 'registrar',
                action: 'STUDENT_CREATED',
                entityType: 'Student',
                entityId: newStudent._id,
                after: newStudent.toObject(),
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
        } catch (auditErr) { console.error("Audit Log Error:", auditErr); }

        res.status(201).json({
            success: true,
            data: {
                student: newStudent,
                enrollment: newEnrollment,
                account: {
                    username: loginUsername,
                    defaultPassword: defaultPassword
                }
            }
        });

    } catch (error) {
        console.error("Admission Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Reset Student Password
// @route   PUT /api/registrar/students/:id/reset-password
// @access  Private (Registrar)
exports.resetStudentPassword = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid student ID format' });
        }

        const student = await Student.findOne({ _id: req.params.id, tenantId: req.user.tenantId, branchId: req.user.branchId });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const userAccount = await User.findOne({ studentId: student._id, tenantId: req.user.tenantId });
        if (!userAccount) return res.status(404).json({ success: false, message: 'User account not found' });

        const defaultPassword = generateTemporaryPassword();
        userAccount.passwordHash = defaultPassword; // Pre-save hook hashes this
        userAccount.mustChangePassword = true;
        await userAccount.save();

        await logAction({
            tenantId: req.user.tenantId,
            branchId: req.user.branchId,
            actorUserId: req.user._id,
            actorRole: 'registrar',
            action: 'STUDENT_PASSWORD_RESET',
            entityType: 'User',
            entityId: userAccount._id,
            ip: req.ip
        });

        res.json({
            success: true,
            message: 'Password reset successfully',
            data: { temporaryPassword: defaultPassword }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Students (Filtered)
// @route   GET /api/registrar/students
// @access  Private (Registrar)
exports.getStudents = async (req, res) => {
    try {
        const { classId, academicYearId, status, q } = req.query;

        // Base Query: Tenant Scoped
        let query = {
            tenantId: req.user.tenantId
        };

        // Branch Scoping for branch users
        if (req.user.scope === 'branch') {
            query.branchId = req.user.branchId;
        }

        if (status) query.status = status;
        
        if (q) {
            query.$or = [
                { firstName: { $regex: q, $options: 'i' } },
                { lastName: { $regex: q, $options: 'i' } },
                { admissionNumber: { $regex: q, $options: 'i' } }
            ];
        }

        // If filtering by class or year, we need to query Enrollments first to find student IDs
        // Or aggregate. For simplicity and performance in typical registrar views:
        // We often view students *in a class*.
        
        let studentIds = null;

        if (classId || academicYearId) {
            const enrollmentQuery = {
                tenantId: req.user.tenantId,
                branchId: req.user.branchId
            };
            if (classId) enrollmentQuery.classId = classId;
            if (academicYearId) enrollmentQuery.academicYearId = academicYearId;
            else enrollmentQuery.status = 'Current';

            const enrollments = await Enrollment.find(enrollmentQuery).select('studentId');
            studentIds = enrollments.map(e => e.studentId);
            
            // Add to main query
            query._id = { $in: studentIds };
        }

        const students = await Student.find(query).sort({ createdAt: -1 }).limit(100);

        res.json({ success: true, data: students });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Single Student Details
// @route   GET /api/registrar/students/:id
// @access  Private (Registrar)
exports.getStudentById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid student ID format' });
        }

        const query = {
            _id: req.params.id,
            tenantId: req.user.tenantId
        };

        // Branch-scoped users (Registrars, etc.) can only see their own branch
        if (req.user.scope === 'branch') {
            query.branchId = req.user.branchId;
        }

        const student = await Student.findOne(query);

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found in this branch.' });
        }

        // Get current enrollment(s)
        const enrollments = await Enrollment.find({
            studentId: student._id,
            tenantId: req.user.tenantId
        })
        .populate('classId', 'name gradeLevel')
        .populate('sectionId', 'name')
        .populate('academicYearId', 'name isCurrent')
        .populate('branchId', 'name')
        .sort({ createdAt: -1 });

        // Get associated user account (for login details)
        const userAccount = await User.findOne({ studentId: student._id }).select('username mustChangePassword');

        res.json({
            success: true,
            data: {
                ...student.toObject(),
                enrollments,
                portalAccount: userAccount
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update Student Profile
// @route   PUT /api/registrar/students/:id
// @access  Private (Registrar)
exports.updateStudent = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid student ID format' });
        }

        const { guardianInfo, status, firstName, lastName, gender, DOB } = req.body;
        
        const student = await Student.findOne({
            _id: req.params.id,
            tenantId: req.user.tenantId,
            branchId: req.user.branchId
        });

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        const oldData = student.toObject();

        // Update allowed fields
        if (guardianInfo) student.guardianInfo = { ...student.guardianInfo, ...guardianInfo };
        if (status) student.status = status;
        if (firstName) student.firstName = firstName;
        if (lastName) student.lastName = lastName;
        if (gender) student.gender = gender;
        if (DOB) student.DOB = DOB;

        await student.save();

        // Audit Log
        await logAction({
            tenantId: req.user.tenantId,
            branchId: req.user.branchId,
            actorUserId: req.user._id,
            actorRole: 'registrar',
            action: 'STUDENT_UPDATED',
            entityType: 'Student',
            entityId: student._id,
            before: oldData,
            after: student.toObject(),
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({ success: true, data: student });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create Enrollment (Re-enrollment)
// @route   POST /api/registrar/enrollments
// @access  Private (Registrar)
exports.createEnrollment = async (req, res) => {
    try {
        const { studentId, classId, sectionId, sectionName, academicYearId, status } = req.body;

        // 1. Verify Student Ownership
        const student = await Student.findOne({ _id: studentId, tenantId: req.user.tenantId, branchId: req.user.branchId });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

        // 2. Prevent Duplicate Active Enrollment
        const existingActive = await Enrollment.findOne({
            tenantId: req.user.tenantId,
            branchId: req.user.branchId,
            studentId,
            academicYearId,
            status: { $in: ['Current', 'Active'] }
        });

        if (existingActive) {
            return res.status(400).json({ success: false, message: 'Student is already enrolled in this academic year.' });
        }

        let resolvedSectionId = null;
        if (sectionId) {
            const sectionObj = await Section.findOne({
                _id: sectionId,
                tenantId: req.user.tenantId,
                branchId: req.user.branchId,
                classId
            });
            if (!sectionObj) {
                return res.status(400).json({ success: false, message: 'Invalid Section ID for selected class.' });
            }
            resolvedSectionId = sectionObj._id;
        } else if (sectionName && sectionName.trim()) {
            const normalizedSectionName = sectionName.trim();
            let sectionObj = await Section.findOne({
                tenantId: req.user.tenantId,
                branchId: req.user.branchId,
                classId,
                name: normalizedSectionName
            });
            if (!sectionObj) {
                sectionObj = await Section.create({
                    tenantId: req.user.tenantId,
                    branchId: req.user.branchId,
                    classId,
                    name: normalizedSectionName
                });
            }
            resolvedSectionId = sectionObj._id;
        }

        const newEnrollment = await Enrollment.create({
            tenantId: req.user.tenantId,
            branchId: req.user.branchId,
            studentId,
            classId,
            sectionId: resolvedSectionId,
            academicYearId,
            status: status || 'Current'
        });

        await logAction({
            tenantId: req.user.tenantId,
            branchId: req.user.branchId,
            actorUserId: req.user._id,
            actorRole: 'registrar',
            action: 'ENROLLMENT_CREATED',
            entityType: 'Enrollment',
            entityId: newEnrollment._id,
            after: newEnrollment.toObject(),
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.status(201).json({ success: true, data: newEnrollment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Transfer Student to Another Branch
// @route   POST /api/registrar/transfers/branch
// @access  Private (Registrar)
exports.transferStudentBranch = async (req, res) => {
    try {
        const { studentId, toBranchId, classId, sectionId, academicYearId, reason } = req.body;
        if (!studentId || !toBranchId || !classId || !academicYearId || !reason) {
            return res.status(400).json({ success: false, message: 'Student, target branch, class, academic year, and reason are required.' });
        }
        if (String(toBranchId) === req.user.branchId.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot transfer to the same branch.' });
        }

        const student = await Student.findOne({ _id: studentId, tenantId: req.user.tenantId, branchId: req.user.branchId });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        const [targetBranch, targetClass, targetYear] = await Promise.all([
            Branch.findOne({ _id: toBranchId, tenantId: req.user.tenantId, isActive: true }),
            Class.findOne({ _id: classId, tenantId: req.user.tenantId, branchId: toBranchId }),
            AcademicYear.findOne({ _id: academicYearId, tenantId: req.user.tenantId })
        ]);
        if (!targetBranch || !targetClass || !targetYear) {
            return res.status(400).json({ success: false, message: 'Invalid target branch, class, or academic year.' });
        }

        const currentEnrollments = await Enrollment.find({
            tenantId: req.user.tenantId,
            studentId,
            branchId: req.user.branchId,
            status: { $in: ['Current', 'Active', 'active'] }
        });
        if (currentEnrollments.length === 0) {
            return res.status(400).json({ success: false, message: 'Student has no current enrollment in this branch.' });
        }

        let newEnrollment;
        try {
            await Enrollment.updateMany(
                { _id: { $in: currentEnrollments.map((enrollment) => enrollment._id) }, tenantId: req.user.tenantId },
                { $set: { status: 'Transferred' } }
            );
            student.branchId = toBranchId;
            student.status = 'Active';
            await student.save();
            newEnrollment = await Enrollment.create({
                tenantId: req.user.tenantId,
                branchId: toBranchId,
                studentId,
                classId,
                sectionId: sectionId || null,
                academicYearId,
                status: 'Current'
            });
        } catch (error) {
            student.branchId = req.user.branchId;
            await student.save().catch(() => {});
            await Enrollment.updateMany(
                { _id: { $in: currentEnrollments.map((enrollment) => enrollment._id) }, tenantId: req.user.tenantId },
                { $set: { status: 'Current' } }
            ).catch(() => {});
            throw error;
        }

        await logAction({
             tenantId: req.user.tenantId,
             branchId: req.user.branchId,
             actorUserId: req.user._id,
             actorRole: 'registrar',
             action: 'BRANCH_TRANSFER_OUT',
             entityType: 'Student',
             entityId: student._id,
             after: { to: toBranchId, reason },
             ip: req.ip,
             userAgent: req.get('User-Agent')
        });

        res.json({ success: true, message: 'Transfer successful', data: newEnrollment });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
