const Student = require('../models/Student');
const Enrollment = require('../models/Enrollment');
const TeacherAssignment = require('../models/TeacherAssignment');
const Branch = require('../models/Branch');
const Class = require('../models/Class');
const AcademicYear = require('../models/AcademicYear');
const Section = require('../models/Section');

const applyBranchScope = (req, query) => {
    if (req.scope === 'branch') query.branchId = req.branchId;
    return query;
};

const canAccessStudent = (req, studentId) => {
    if (req.role === 'student') return req.user.studentId?.toString() === studentId.toString();
    if (req.role === 'parent') {
        return (req.user.students || []).some((id) => id.toString() === studentId.toString());
    }
    return true;
};

// @desc    Admit a new student
// @route   POST /api/students
const admitStudent = async (req, res) => {
    let { 
        admissionNumber, firstName, lastName, DOB, gender, guardianInfo, 
        classId, academicYearId, branchId, sectionId
    } = req.body;

    try {
        if (!admissionNumber || !firstName || !lastName || !classId || !academicYearId) {
            return res.status(400).json({ message: 'Admission number, student name, class, and academic year are required' });
        }

        if (gender) gender = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
        
        if (req.scope === 'branch') branchId = req.branchId;
        else if (!branchId) {
            const defaultBranch = await Branch.findOne({ tenantId: req.tenantId, isActive: true });
            branchId = defaultBranch?._id;
        }

        const branch = branchId && await Branch.findOne({ _id: branchId, tenantId: req.tenantId, isActive: true });
        if (!branch) return res.status(400).json({ message: 'A valid active branch is required' });

        // Validate class
        const targetClass = await Class.findOne({ _id: classId, tenantId: req.tenantId, branchId });
        if (!targetClass) {
            return res.status(400).json({ message: 'Invalid class for this branch.' });
        }

        // Validate academic year
        const targetYear = await AcademicYear.findOne({ _id: academicYearId, tenantId: req.tenantId });
        if (!targetYear) {
            return res.status(400).json({ message: 'Invalid academic year for this tenant.' });
        }

        // Validate section (if provided)
        let resolvedSectionId = null;
        if (sectionId) {
            const section = await Section.findOne({
                _id: sectionId,
                tenantId: req.tenantId,
                branchId,
                classId,
                isActive: { $ne: false }
            });
            if (!section) {
                return res.status(400).json({ message: 'Invalid section for this class or branch.' });
            }

            // Enforce capacity check if section capacity exists
            if (section.capacity && section.capacity > 0) {
                const activeCount = await Enrollment.countDocuments({
                    tenantId: req.tenantId,
                    branchId,
                    sectionId: section._id,
                    academicYearId,
                    status: { $in: ['Current', 'Active', 'current', 'active'] }
                });
                if (activeCount >= section.capacity) {
                    return res.status(400).json({ message: 'Section capacity has been reached.' });
                }
            }
            resolvedSectionId = section._id;
        }

        const existingStudent = await Student.findOne({
            tenantId: req.tenantId,
            admissionNumber
        });
        if (existingStudent) {
            return res.status(409).json({ message: 'Admission number already exists for this school.' });
        }

        const student = await Student.create({
            tenantId: req.tenantId,
            branchId,
            admissionNumber,
            firstName,
            lastName,
            DOB,
            gender,
            guardianInfo
        });

        let enrollment;
        try {
            enrollment = await Enrollment.create({
                tenantId: req.tenantId,
                branchId,
                studentId: student._id,
                classId,
                sectionId: resolvedSectionId || null,
                academicYearId,
                status: 'Current'
            });
        } catch (error) {
            await Student.deleteOne({ _id: student._id, tenantId: req.tenantId });
            throw error;
        }

        // ... Fees and Response ...
        res.status(201).json({ student, enrollment });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        if (error.code === 11000) {
            const errStr = JSON.stringify(error.keyValue || error.message || '');
            if (errStr.includes('admissionNumber') || errStr.includes('studentCode')) {
                return res.status(409).json({ message: 'Admission number already exists for this school.' });
            }
            if (errStr.includes('email')) {
                return res.status(409).json({ message: 'Email already exists for this school.' });
            }
            return res.status(409).json({ message: 'Duplicate key error.' });
        }
        res.status(500).json({ message: error.message });
    }
};

const getStudents = async (req, res) => {
    try {
        const query = applyBranchScope(req, { tenantId: req.tenantId });
        const { q, classId, status } = req.query;
        if (status) query.status = status;
        if (q) {
            const search = String(q).trim();
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { admissionNumber: { $regex: search, $options: 'i' } },
                { studentCode: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (req.role === 'teacher') {
            const assignments = await TeacherAssignment.find({
                tenantId: req.tenantId,
                branchId: req.branchId,
                teacherUserId: req.user._id,
                isActive: true
            });
            const classIds = assignments.map(a => a.classId);
            
            const enrollments = await Enrollment.find({ 
                tenantId: req.tenantId,
                branchId: req.branchId,
                classId: { $in: classIds }, 
                status: { $in: ['Current', 'Active', 'active'] } 
            }).select('studentId');
            
            query._id = { $in: enrollments.map(e => e.studentId) };
        }
        if (classId && req.role !== 'teacher') {
            const enrollments = await Enrollment.find({
                tenantId: req.tenantId,
                ...(req.scope === 'branch' ? { branchId: req.branchId } : {}),
                classId,
                status: { $in: ['Current', 'Active', 'active'] }
            }).select('studentId');
            query._id = { $in: enrollments.map((enrollment) => enrollment.studentId) };
        }

        const students = await Student.find(query).sort({ createdAt: -1 });
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getStudentDetails = async (req, res) => {
    try {
        if (!canAccessStudent(req, req.params.id)) {
            return res.status(403).json({ message: 'Not authorized to access this student' });
        }

        const studentQuery = applyBranchScope(req, { _id: req.params.id, tenantId: req.tenantId });
        const student = await Student.findOne(studentQuery);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const enrollmentQuery = applyBranchScope(req, {
            tenantId: req.tenantId,
            studentId: student._id,
            status: { $in: ['Current', 'Active', 'active'] } 
        });
        const enrollment = await Enrollment.findOne(enrollmentQuery).populate('classId');
        res.json({ student, enrollment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getStudentsByClass = async (req, res) => {
    try {
        const { classId } = req.params;
        if (req.role === 'teacher') {
            const assigned = await TeacherAssignment.exists({
                tenantId: req.tenantId,
                branchId: req.branchId,
                teacherUserId: req.user._id,
                classId,
                isActive: true
            });
            if (!assigned) return res.status(403).json({ message: 'Not assigned to this class' });
        }

        const enrollmentQuery = applyBranchScope(req, {
            classId, 
            status: { $in: ['Current', 'Active', 'active'] },
            tenantId: req.tenantId
        });
        const enrollments = await Enrollment.find(enrollmentQuery).populate('studentId');

        const students = enrollments
            .filter(e => e.studentId)
            .map(e => e.studentId);
            
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { admitStudent, getStudents, getStudentDetails, getStudentsByClass };
