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

// Helper to validate section ownership, active status, and capacity
const validateSectionAccess = async ({ tenantId, branchId, classId, sectionId, academicYearId }) => {
    if (!sectionId) return null;

    const section = await Section.findOne({
        _id: sectionId,
        tenantId,
        branchId,
        classId,
        isActive: { $ne: false }
    });
    
    if (!section) {
        throw new Error('Invalid section for this class or branch.');
    }

    // Verify capacity
    if (section.capacity && section.capacity > 0) {
        const activeCount = await Enrollment.countDocuments({
            tenantId,
            branchId,
            sectionId,
            academicYearId,
            status: { $in: ['Current', 'Active', 'current', 'active'] }
        });
        if (activeCount >= section.capacity) {
            throw new Error('Section capacity has been reached.');
        }
    }

    return section;
};

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
            return res.status(409).json({
                success: false,
                message: 'Admission number already exists for this school.'
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
        } else {
            const checkYear = await AcademicYear.findOne({ _id: useYearId, tenantId: req.user.tenantId });
            if (!checkYear) {
                return res.status(400).json({ success: false, message: 'Invalid academic year for this tenant.' });
            }
        }

        // 3. Validate Class existence and scope
        const classObj = await Class.findOne({ _id: classId, tenantId: req.user.tenantId, branchId: req.user.branchId });
        if (!classObj) {
            return res.status(400).json({ success: false, message: 'Invalid Class ID for this branch.' });
        }

        // 3.5 Resolve Section (existing or create by name) and validate
        let resolvedSectionId = null;
        if (sectionId) {
            try {
                await validateSectionAccess({
                    tenantId: req.user.tenantId,
                    branchId: req.user.branchId,
                    classId,
                    sectionId,
                    academicYearId: useYearId
                });
                resolvedSectionId = sectionId;
            } catch (err) {
                return res.status(400).json({ success: false, message: err.message });
            }
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
            try {
                await validateSectionAccess({
                    tenantId: req.user.tenantId,
                    branchId: req.user.branchId,
                    classId,
                    sectionId: sectionObj._id,
                    academicYearId: useYearId
                });
                resolvedSectionId = sectionObj._id;
            } catch (err) {
                return res.status(400).json({ success: false, message: err.message });
            }
        }

        // 3.6 Student login must be the student ID (admission number)
        const loginUsername = finalAdmissionNumber;
        const existingLogin = await User.findOne({
            tenantId: req.user.tenantId,
            username: loginUsername
        });
        if (existingLogin) {
            return res.status(409).json({
                success: false,
                message: 'Admission number already exists for this school.'
            });
        }

        // 4. Create Student (with all-or-nothing rollback)
        let createdStudent = null;
        let createdUser = null;
        let createdEnrollment = null;

        try {
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
            createdStudent = newStudent;

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
            createdUser = studentUser;

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
            createdEnrollment = newEnrollment;

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

            return res.status(201).json({
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
        } catch (innerError) {
            // Explicit Rollback
            if (createdEnrollment) {
                await Enrollment.deleteOne({ _id: createdEnrollment._id, tenantId: req.user.tenantId }).catch(e => console.error("Rollback enrollment error:", e));
            }
            if (createdUser) {
                await User.deleteOne({ _id: createdUser._id, tenantId: req.user.tenantId }).catch(e => console.error("Rollback user error:", e));
            }
            if (createdStudent) {
                await Student.deleteOne({ _id: createdStudent._id, tenantId: req.user.tenantId }).catch(e => console.error("Rollback student error:", e));
            }
            throw innerError;
        }

    } catch (error) {
        console.error("Admission Error:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: error.message });
        }
        if (error.code === 11000) {
            const errStr = JSON.stringify(error.keyValue || error.message || '');
            if (errStr.includes('admissionNumber') || errStr.includes('username') || errStr.includes('studentCode')) {
                return res.status(409).json({ success: false, message: 'Admission number already exists for this school.' });
            }
            if (errStr.includes('email')) {
                return res.status(409).json({ success: false, message: 'Email already exists for this school.' });
            }
            return res.status(409).json({ success: false, message: 'Duplicate key error.' });
        }
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

// @desc    Get Students (Filtered & Paginated)
// @route   GET /api/registrar/students
// @access  Private (Registrar)
exports.getStudents = async (req, res) => {
    try {
        const { classId, academicYearId, status, q } = req.query;
        let page = parseInt(req.query.page, 10) || 1;
        let limit = parseInt(req.query.limit, 10) || 10;
        if (limit > 100) limit = 100;
        if (limit < 1) limit = 10;
        if (page < 1) page = 1;

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

        const total = await Student.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        const students = await Student.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            success: true,
            data: students,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
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

        // 1.5 Validate Class ownership
        const classObj = await Class.findOne({ _id: classId, tenantId: req.user.tenantId, branchId: req.user.branchId });
        if (!classObj) {
            return res.status(400).json({ success: false, message: 'Invalid Class ID for this branch.' });
        }

        // 1.6 Validate Academic Year ownership
        const yearObj = await AcademicYear.findOne({ _id: academicYearId, tenantId: req.user.tenantId });
        if (!yearObj) {
            return res.status(400).json({ success: false, message: 'Invalid academic year for this tenant.' });
        }

        // 2. Prevent Duplicate Active Enrollment (including lowercase variations)
        const existingActive = await Enrollment.findOne({
            tenantId: req.user.tenantId,
            branchId: req.user.branchId,
            studentId,
            academicYearId,
            status: { $in: ['Current', 'Active', 'current', 'active'] }
        });

        if (existingActive) {
            return res.status(400).json({ success: false, message: 'Student is already enrolled in this academic year.' });
        }

        let resolvedSectionId = null;
        if (sectionId) {
            try {
                await validateSectionAccess({
                    tenantId: req.user.tenantId,
                    branchId: req.user.branchId,
                    classId,
                    sectionId,
                    academicYearId
                });
                resolvedSectionId = sectionId;
            } catch (err) {
                return res.status(400).json({ success: false, message: err.message });
            }
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
            try {
                await validateSectionAccess({
                    tenantId: req.user.tenantId,
                    branchId: req.user.branchId,
                    classId,
                    sectionId: sectionObj._id,
                    academicYearId
                });
                resolvedSectionId = sectionObj._id;
            } catch (err) {
                return res.status(400).json({ success: false, message: err.message });
            }
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

        // Validate target section if provided
        if (sectionId) {
            try {
                await validateSectionAccess({
                    tenantId: req.user.tenantId,
                    branchId: toBranchId,
                    classId,
                    sectionId,
                    academicYearId
                });
            } catch (err) {
                return res.status(400).json({ success: false, message: err.message });
            }
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

        const linkedUser = await User.findOne({ tenantId: req.user.tenantId, studentId, role: 'student' });
        const originalUserBranchId = linkedUser ? linkedUser.branchId : null;

        let newEnrollment;
        let studentUpdated = false;
        let enrollmentsUpdated = false;
        let userUpdated = false;

        try {
            await Enrollment.updateMany(
                { _id: { $in: currentEnrollments.map((enrollment) => enrollment._id) }, tenantId: req.user.tenantId },
                { $set: { status: 'Transferred' } }
            );
            enrollmentsUpdated = true;

            student.branchId = toBranchId;
            student.status = 'Active';
            await student.save();
            studentUpdated = true;

            newEnrollment = await Enrollment.create({
                tenantId: req.user.tenantId,
                branchId: toBranchId,
                studentId,
                classId,
                sectionId: sectionId || null,
                academicYearId,
                status: 'Current'
            });

            if (linkedUser) {
                await User.updateOne(
                    { _id: linkedUser._id, tenantId: req.user.tenantId, role: 'student', studentId },
                    { branchId: toBranchId }
                );
                userUpdated = true;
            }
        } catch (error) {
            if (userUpdated && linkedUser) {
                await User.updateOne(
                    { _id: linkedUser._id, tenantId: req.user.tenantId, role: 'student', studentId },
                    { branchId: originalUserBranchId }
                ).catch(() => {});
            }
            if (newEnrollment) {
                await Enrollment.deleteOne({ _id: newEnrollment._id }).catch(() => {});
            }
            if (studentUpdated) {
                student.branchId = req.user.branchId;
                await student.save().catch(() => {});
            }
            if (enrollmentsUpdated) {
                for (const originalEnrollment of currentEnrollments) {
                    await Enrollment.updateOne(
                        { _id: originalEnrollment._id, tenantId: req.user.tenantId },
                        { status: originalEnrollment.status }
                    ).catch(() => {});
                }
            }
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

// @desc    Get Registrar Dashboard Statistics
// @route   GET /api/registrar/stats
// @access  Private (Registrar)
exports.getRegistrarStats = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const branchId = req.user.branchId;

        // Find current academic year
        const currentYear = await AcademicYear.findOne({ tenantId, isCurrent: true });
        const currentYearId = currentYear ? currentYear._id : null;

        const totalStudents = await Student.countDocuments({ tenantId, branchId });
        const activeStudents = await Student.countDocuments({ tenantId, branchId, status: 'Active' });
        const inactiveStudents = await Student.countDocuments({ tenantId, branchId, status: 'Inactive' });
        const transferredStudents = await Student.countDocuments({ tenantId, branchId, status: 'Transferred' });
        const graduatedStudents = await Student.countDocuments({ tenantId, branchId, status: 'Graduated' });

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const newAdmissionsThisMonth = await Student.countDocuments({
            tenantId,
            branchId,
            createdAt: { $gte: startOfMonth }
        });

        let currentYearEnrollments = 0;
        if (currentYearId) {
            currentYearEnrollments = await Enrollment.countDocuments({
                tenantId,
                branchId,
                academicYearId: currentYearId,
                status: { $in: ['Current', 'Active', 'current', 'active'] }
            });
        }

        res.json({
            success: true,
            data: {
                totalStudents,
                activeStudents,
                inactiveStudents,
                transferredStudents,
                graduatedStudents,
                newAdmissionsThisMonth,
                currentYearEnrollments
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
