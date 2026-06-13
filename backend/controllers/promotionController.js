const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');

// @desc    Promote students to next class
// @route   POST /api/academic/promote
const promoteStudents = async (req, res) => {
    const { studentIds, nextClassId, nextAcademicYearId } = req.body;

    try {
        const promotions = await Promise.all(studentIds.map(async (studentId) => {
            // 1. Mark old enrollment as promoted
            await Enrollment.updateMany(
                { studentId, tenantId: req.tenantId, status: 'active' },
                { status: 'promoted' }
            );

            // 2. Create new enrollment
            return await Enrollment.create({
                tenantId: req.tenantId,
                branchId: req.branchId, // Assuming promotion within same branch
                studentId,
                classId: nextClassId,
                academicYearId: nextAcademicYearId,
                status: 'active'
            });
        }));

        res.status(200).json(promotions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Transfer student to another branch
// @route   POST /api/academic/transfer
const transferStudent = async (req, res) => {
    const { studentId, newBranchId, newClassId, newAcademicYearId } = req.body;

    try {
        // 1. Update Student record branchId
        await Student.findByIdAndUpdate(studentId, { branchId: newBranchId });

        // 2. Mark old enrollments as withdrawn/transferred
        await Enrollment.updateMany(
            { studentId, tenantId: req.tenantId, status: 'active' },
            { status: 'withdrawn' }
        );

        // 3. Create new enrollment in new branch
        const enrollment = await Enrollment.create({
            tenantId: req.tenantId,
            branchId: newBranchId,
            studentId,
            classId: newClassId,
            academicYearId: newAcademicYearId,
            status: 'active'
        });

        res.status(200).json(enrollment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { promoteStudents, transferStudent };
