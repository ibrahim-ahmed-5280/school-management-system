const TeacherAssignment = require('../models/TeacherAssignment');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Subject = require('../models/Subject');

// @desc    Assign a teacher to a class and subject
// @route   POST /api/assignments
const assignTeacher = async (req, res) => {
    let { teacherId, teacherUserId, classId, subjectId, subject, academicYearId, branchId, sectionId } = req.body;

    try {
        // Resolve Branch ID
        if (req.branchId) {
            branchId = req.branchId;
        } else if (!branchId) {
            const defaultBranch = await Branch.findOne({ tenantId: req.tenantId });
            branchId = defaultBranch ? defaultBranch._id : null;
        }

        if (!branchId) return res.status(400).json({ message: 'Branch Not Found' });

        const resolvedTeacherId = teacherUserId || teacherId;
        if (!resolvedTeacherId) return res.status(400).json({ message: 'teacherUserId is required' });
        if (!classId || !academicYearId) return res.status(400).json({ message: 'classId and academicYearId are required' });

        let resolvedSubjectId = subjectId;
        if (!resolvedSubjectId && subject) {
            const match = await Subject.findOne({
                tenantId: req.tenantId,
                branchId,
                name: new RegExp(`^${subject.trim()}$`, 'i')
            }).select('_id');
            resolvedSubjectId = match?._id;
        }
        if (!resolvedSubjectId) return res.status(400).json({ message: 'subjectId is required' });

        // Check for existing assignment
        const existingAssignment = await TeacherAssignment.findOne({
            tenantId: req.tenantId,
            classId,
            academicYearId,
            subjectId: resolvedSubjectId
        }).populate('teacherUserId', 'name');

        if (existingAssignment) {
            return res.status(400).json({ 
                message: `This class was assigned the teacher name: ${existingAssignment.teacherUserId?.name} for this subject.` 
            });
        }

        const assignment = await TeacherAssignment.create({
            tenantId: req.tenantId,
            branchId,
            teacherUserId: resolvedTeacherId,
            classId,
            academicYearId,
            sectionId: sectionId || null,
            subjectId: resolvedSubjectId,
            subject: resolvedSubjectId
        });

        res.status(201).json(assignment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get assignments for the logged-in teacher
// @route   GET /api/assignments/my
const getMyAssignments = async (req, res) => {
    try {
        const assignments = await TeacherAssignment.find({ 
            teacherUserId: req.user._id,
            tenantId: req.tenantId
        })
        .populate('classId')
        .populate('academicYearId');
        
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all assignments (for admin)
// @route   GET /api/assignments
const getAllAssignments = async (req, res) => {
    try {
        const assignments = await TeacherAssignment.find({ tenantId: req.tenantId })
            .populate('teacherUserId', 'name email')
            .populate('classId', 'name')
            .populate('academicYearId', 'name')
            .sort({ createdAt: -1 });
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { assignTeacher, getMyAssignments, getAllAssignments };
