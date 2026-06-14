const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const Class = require('../models/Class');
const AcademicYear = require('../models/AcademicYear');
const Branch = require('../models/Branch');
const User = require('../models/User');

// @desc    Promote students to next class
// @route   POST /api/academic/promote
const promoteStudents = async (req, res) => {
    const { studentIds, nextClassId, nextAcademicYearId } = req.body;

    try {
        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ message: 'studentIds are required.' });
        }

        // 1. Verify nextClassId exists and belongs to the same tenant (and branch if branch-scoped)
        const classQuery = { _id: nextClassId, tenantId: req.tenantId };
        if (req.branchId) {
            classQuery.branchId = req.branchId;
        }
        const nextClass = await Class.findOne(classQuery);
        if (!nextClass) {
            return res.status(403).json({ message: 'Access denied for this academic resource.' });
        }

        // 2. Verify nextAcademicYearId belongs to the same tenant
        const nextYear = await AcademicYear.findOne({ _id: nextAcademicYearId, tenantId: req.tenantId });
        if (!nextYear) {
            return res.status(403).json({ message: 'Access denied for this academic resource.' });
        }

        // 3. Verify all studentIds exist and belong to the same tenant (and branch if branch-scoped)
        for (const studentId of studentIds) {
            const studentQuery = { _id: studentId, tenantId: req.tenantId };
            if (req.branchId) {
                studentQuery.branchId = req.branchId;
            }
            const student = await Student.findOne(studentQuery);
            if (!student) {
                return res.status(403).json({ message: 'Access denied for this academic resource.' });
            }
        }

        // Execute promotions safely
        const promotions = await Promise.all(studentIds.map(async (studentId) => {
            // Mark old enrollment as promoted
            await Enrollment.updateMany(
                { studentId, tenantId: req.tenantId, status: 'active' },
                { status: 'promoted' }
            );

            // Create new enrollment
            return await Enrollment.create({
                tenantId: req.tenantId,
                branchId: req.branchId || nextClass.branchId,
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
        // 1. Verify student exists and belongs to the same tenant (and branch if branch-scoped)
        const studentQuery = { _id: studentId, tenantId: req.tenantId };
        if (req.branchId) {
            studentQuery.branchId = req.branchId;
        }
        const student = await Student.findOne(studentQuery);
        if (!student) {
            return res.status(403).json({ message: 'Access denied for this academic resource.' });
        }

        // 2. Verify target branch belongs to the same tenant
        const targetBranch = await Branch.findOne({ _id: newBranchId, tenantId: req.tenantId });
        if (!targetBranch) {
            return res.status(403).json({ message: 'Access denied for this academic resource.' });
        }

        // 3. Verify target class belongs to the same tenant and target branch
        const targetClass = await Class.findOne({ _id: newClassId, tenantId: req.tenantId, branchId: newBranchId });
        if (!targetClass) {
            return res.status(403).json({ message: 'Access denied for this academic resource.' });
        }

        // 4. Verify target academic year belongs to the same tenant
        const targetYear = await AcademicYear.findOne({ _id: newAcademicYearId, tenantId: req.tenantId });
        if (!targetYear) {
            return res.status(403).json({ message: 'Access denied for this academic resource.' });
        }

        // Find current enrollments in the source branch
        const currentEnrollments = await Enrollment.find({
            studentId,
            tenantId: req.tenantId,
            branchId: student.branchId,
            status: { $in: ['Current', 'Active', 'active'] }
        });

        // Store original state for rollback
        const originalBranchId = student.branchId;
        const linkedUser = await User.findOne({ tenantId: req.tenantId, studentId, role: 'student' });
        const originalUserBranchId = linkedUser ? linkedUser.branchId : null;

        let studentUpdated = false;
        let enrollmentsUpdated = false;
        let newEnrollmentCreated = null;
        let userUpdated = false;

        try {
            // 5. Update Student record branchId safely
            await Student.updateOne(
                { _id: studentId, tenantId: req.tenantId },
                { branchId: newBranchId }
            );
            studentUpdated = true;

            // 6. Mark old current enrollments as Transferred
            if (currentEnrollments.length > 0) {
                await Enrollment.updateMany(
                    { _id: { $in: currentEnrollments.map(e => e._id) }, tenantId: req.tenantId },
                    { status: 'Transferred' }
                );
                enrollmentsUpdated = true;
            }

            // 7. Create new enrollment in new branch
            newEnrollmentCreated = await Enrollment.create({
                tenantId: req.tenantId,
                branchId: newBranchId,
                studentId,
                classId: newClassId,
                academicYearId: newAcademicYearId,
                status: 'Current'
            });

            // 8. Update linked student user's branchId
            if (linkedUser) {
                await User.updateOne(
                    { _id: linkedUser._id, tenantId: req.tenantId, role: 'student', studentId },
                    { branchId: newBranchId }
                );
                userUpdated = true;
            }

            res.status(200).json(newEnrollmentCreated);
        } catch (error) {
            // Explicit Rollback
            if (userUpdated && linkedUser) {
                await User.updateOne(
                    { _id: linkedUser._id, tenantId: req.tenantId, role: 'student', studentId },
                    { branchId: originalUserBranchId }
                ).catch(() => {});
            }
            if (newEnrollmentCreated) {
                await Enrollment.deleteOne({ _id: newEnrollmentCreated._id }).catch(() => {});
            }
            if (enrollmentsUpdated && currentEnrollments.length > 0) {
                await Enrollment.updateMany(
                    { _id: { $in: currentEnrollments.map(e => e._id) }, tenantId: req.tenantId },
                    { status: 'active' }
                ).catch(() => {});
            }
            if (studentUpdated) {
                await Student.updateOne(
                    { _id: studentId, tenantId: req.tenantId },
                    { branchId: originalBranchId }
                ).catch(() => {});
            }
            throw error;
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { promoteStudents, transferStudent };
