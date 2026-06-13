const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const Branch = require('../models/Branch');
const User = require('../models/User');
const AcademicYear = require('../models/AcademicYear');
const Student = require('../models/Student');
const Enrollment = require('../models/Enrollment');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const Class = require('../models/Class');
const AuditLog = require('../models/AuditLog');
const { logActivity } = require('../utils/logger');
const { login } = require('./authController');
const { TENANT_ADMIN_CREATABLE_ROLES, assertValidRoleScope } = require('../utils/rolePolicy');

const ACTIVE_ENROLLMENT_STATUSES = ['Current', 'Active', 'active'];

// ==========================================
// A) Branding & Identity
// ==========================================

/**
 * @desc    Get tenant branding
 * @route   GET /api/tenant/settings/branding
 * @access  Private (Super Admin)
 */
const getBranding = asyncHandler(async (req, res) => {
    const tenant = await Tenant.findById(req.tenantId).select('name logoUrl primaryColor secondaryColor');
    if (!tenant) {
        res.status(404);
        throw new Error('Tenant not found');
    }
    res.json(tenant);
});

/**
 * @desc    Update tenant branding
 * @route   PUT /api/tenant/settings/branding
 * @access  Private (Super Admin)
 */
const updateBranding = asyncHandler(async (req, res) => {
    const { primaryColor, secondaryColor } = req.body;
    let logoUrl = req.body.logoUrl;
    if (req.file) {
        logoUrl = `/uploads/logos/${req.file.filename}`;
    }
    
    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant) {
        res.status(404);
        throw new Error('Tenant not found');
    }

    const before = { logoUrl: tenant.logoUrl, primaryColor: tenant.primaryColor, secondaryColor: tenant.secondaryColor };
    
    tenant.logoUrl = logoUrl || tenant.logoUrl;
    tenant.primaryColor = primaryColor || tenant.primaryColor;
    tenant.secondaryColor = secondaryColor || tenant.secondaryColor;
    
    await tenant.save();

    await logActivity({
        req,
        action: 'TENANT_BRANDING_UPDATED',
        entityType: 'Tenant',
        entityId: tenant._id.toString(),
        before,
        after: { logoUrl: tenant.logoUrl, primaryColor: tenant.primaryColor, secondaryColor: tenant.secondaryColor }
    });

    res.json({ message: 'Branding updated successfully', tenant });
});

// ==========================================
// B) Branch Management
// ==========================================

/**
 * @desc    Get all branches for the tenant
 * @route   GET /api/tenant/branches
 */
const getBranches = asyncHandler(async (req, res) => {
    console.log(`[DEBUG] Fetching branches for tenantId: ${req.tenantId}`);
    try {
        const branches = await Branch.find({ tenantId: req.tenantId });
        console.log(`[DEBUG] Found ${branches.length} branches`);
        res.json(branches);
    } catch (error) {
        console.error('[DEBUG] getBranches Error:', error);
        res.status(500);
        throw new Error(`Database error while fetching branches: ${error.message}`);
    }
});

/**
 * @desc    Create a new branch
 * @route   POST /api/tenant/branches
 */
const createBranch = asyncHandler(async (req, res) => {
    const { name, code, address, phone, email, logoUrl, receiptFooter } = req.body;
    console.log(`[DEBUG] Creating branch: ${name} (${code}) for tenant: ${req.tenantId}`);

    if (!name || !code) {
        res.status(400);
        throw new Error('Branch name and code are required');
    }

    const branchExists = await Branch.findOne({ tenantId: req.tenantId, code: code.toUpperCase() });
    if (branchExists) {
        console.log(`[DEBUG] Branch code conflict: ${code}`);
        res.status(400);
        throw new Error(`Branch with code "${code}" already exists in your institution`);
    }

    try {
        const branch = await Branch.create({
            tenantId: req.tenantId,
            name,
            code: code.toUpperCase(),
            address,
            phone,
            email,
            logoUrl,
            receiptFooter
        });

        console.log(`[DEBUG] Branch created successfully: ${branch._id}`);

        await logActivity({
            req,
            action: 'BRANCH_CREATED',
            entityType: 'Branch',
            entityId: branch._id.toString(),
            after: branch
        });

        res.status(201).json(branch);
    } catch (error) {
        console.error('[DEBUG] createBranch Error:', error);
        res.status(400);
        throw new Error(`Validation or Database error: ${error.message}`);
    }
});

/**
 * @desc    Update branch info
 * @route   PUT /api/tenant/branches/:branchId
 */
const updateBranch = asyncHandler(async (req, res) => {
    const branch = await Branch.findOne({ _id: req.params.branchId, tenantId: req.tenantId });
    
    if (!branch) {
        res.status(404);
        throw new Error('Branch not found');
    }

    const before = branch.toObject();
    Object.assign(branch, req.body);
    await branch.save();

    await logActivity({
        req,
        action: 'BRANCH_UPDATED',
        entityType: 'Branch',
        entityId: branch._id.toString(),
        before,
        after: branch
    });

    res.json(branch);
});

/**
 * @desc    Activate/Deactivate branch
 * @route   PATCH /api/tenant/branches/:branchId/status
 */
const toggleBranchStatus = asyncHandler(async (req, res) => {
    const branch = await Branch.findOne({ _id: req.params.branchId, tenantId: req.tenantId });
    
    if (!branch) {
        res.status(404);
        throw new Error('Branch not found');
    }

    branch.isActive = req.body.isActive;
    await branch.save();

    await logActivity({
        req,
        action: branch.isActive ? 'BRANCH_ACTIVATED' : 'BRANCH_DEACTIVATED',
        entityType: 'Branch',
        entityId: branch._id.toString()
    });

    res.json({ message: `Branch ${branch.isActive ? 'activated' : 'deactivated'}`, branch });
});

/**
 * @desc    Assign Branch Admin to branch
 * @route   POST /api/tenant/branches/:branchId/assign-branch-admin
 */
const assignBranchAdmin = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const branchId = req.params.branchId;

    const user = await User.findOne({ _id: userId, tenantId: req.tenantId });
    if (!user) {
        res.status(404);
        throw new Error('User not found in this institution');
    }

    if (user.role !== 'branch_admin' || user.scope !== 'branch') {
        res.status(400);
        throw new Error('User must have role branch_admin and scope branch');
    }

    user.branchId = branchId;
    await user.save();

    await logActivity({
        req,
        action: 'BRANCH_ADMIN_ASSIGNED',
        entityType: 'User',
        entityId: userId,
        after: { branchId }
    });

    res.json({ message: 'Branch admin assigned successfully' });
});

// ==========================================
// C) Tenant User Management
// ==========================================

/**
 * @desc    Create a new user (Tenant or Branch scope)
 * @route   POST /api/tenant/users
 */
const createUser = asyncHandler(async (req, res) => {
    const { name, email, password, role, scope, branchId, students = [] } = req.body;
    const normalized = assertValidRoleScope(role, scope);

    if (!TENANT_ADMIN_CREATABLE_ROLES.has(normalized.role)) {
        res.status(403);
        throw new Error('This role cannot be created by a tenant administrator');
    }
    if (!name || !email || !password) {
        res.status(400);
        throw new Error('name, email, and password are required');
    }
    if (String(password).length < 8) {
        res.status(400);
        throw new Error('Password must be at least 8 characters');
    }

    // Check if email unique in tenant
    const normalizedEmail = String(email).trim().toLowerCase();
    const userExists = await User.findOne({ tenantId: req.tenantId, email: normalizedEmail });
    if (userExists) {
        res.status(400);
        throw new Error('Email already registered in this institution');
    }

    // Validation for scope/branchId
    if (normalized.scope === 'branch' && !branchId) {
        res.status(400);
        throw new Error('branchId is required for branch-scoped users');
    }
    if (normalized.scope === 'branch') {
        const branch = await Branch.findOne({ _id: branchId, tenantId: req.tenantId });
        if (!branch) {
            res.status(400);
            throw new Error('Branch not found in this institution');
        }
    }
    if (normalized.role === 'parent') {
        if (!Array.isArray(students) || students.length === 0) {
            res.status(400);
            throw new Error('At least one student must be linked to a parent account');
        }
        const linkedStudentCount = await Student.countDocuments({ tenantId: req.tenantId, _id: { $in: students } });
        if (linkedStudentCount !== new Set(students.map(String)).size) {
            res.status(400);
            throw new Error('One or more selected students do not belong to this institution');
        }
    }

    const user = await User.create({
        tenantId: req.tenantId,
        branchId: normalized.scope === 'tenant' ? null : branchId,
        name,
        email: normalizedEmail,
        passwordHash: password, // Pre-save hook will hash
        role: normalized.role,
        scope: normalized.scope,
        students: normalized.role === 'parent' ? students : [],
        isActive: true
    });

    await logActivity({
        req,
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: user._id.toString(),
        after: { name, email: normalizedEmail, role: normalized.role, scope: normalized.scope, branchId }
    });

    res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        scope: user.scope,
        branchId: user.branchId
    });
});

/**
 * @desc    Get users with filters
 * @route   GET /api/tenant/users
 */
const getUsers = asyncHandler(async (req, res) => {
    const { branchId, role } = req.query;
    const query = { tenantId: req.tenantId, role: { $ne: 'super_admin' } }; // Filter out super admins if preferred

    if (branchId) query.branchId = branchId;
    if (role) query.role = role;

    const users = await User.find(query).select('-passwordHash');
    res.json(users);
});

// ==========================================
// D) Academic Year
// ==========================================

const createAcademicYear = asyncHandler(async (req, res) => {
    const { name, startDate, endDate, isCurrent } = req.body;

    if (isCurrent) {
        // Reset others
        await AcademicYear.updateMany({ tenantId: req.tenantId }, { isCurrent: false });
    }

    const year = await AcademicYear.create({
        tenantId: req.tenantId,
        name,
        startDate,
        endDate,
        isCurrent: isCurrent || false
    });

    await logActivity({
        req,
        action: 'ACADEMIC_YEAR_CREATED',
        entityType: 'AcademicYear',
        entityId: year._id.toString(),
        after: year
    });

    res.status(201).json(year);
});

const setCurrentYear = asyncHandler(async (req, res) => {
    const yearId = req.params.yearId;

    await AcademicYear.updateMany({ tenantId: req.tenantId }, { isCurrent: false });
    const year = await AcademicYear.findOneAndUpdate(
        { _id: yearId, tenantId: req.tenantId },
        { isCurrent: true },
        { new: true }
    );

    if (!year) {
        res.status(404);
        throw new Error('Academic year not found');
    }

    await logActivity({
        req,
        action: 'ACADEMIC_YEAR_SET_CURRENT',
        entityType: 'AcademicYear',
        entityId: yearId
    });

    res.json(year);
});

// ==========================================
// E) Global Reporting
// ==========================================

const getOverviewReport = asyncHandler(async (req, res) => {
    const { branchId, academicYearId } = req.query;
    const tenantId = req.tenantId;

    const query = { tenantId: new mongoose.Types.ObjectId(tenantId) };
    if (branchId) query.branchId = new mongoose.Types.ObjectId(branchId);
    if (academicYearId) query.academicYearId = new mongoose.Types.ObjectId(academicYearId);

    // 1. Student Count
    const studentCount = await Student.countDocuments(branchId ? { tenantId, branchId } : { tenantId });

    // 2. Enrollments
    const activeEnrollments = await Enrollment.countDocuments({
        ...query,
        ...(academicYearId ? { status: { $ne: 'Withdrawn' } } : { status: 'Current' })
    });

    // 3. Revenue Totals (Paid Amount from Invoices)
    const revenueStats = await Invoice.aggregate([
        { $match: query },
        { $group: { _id: null, totalRevenue: { $sum: '$paidAmount' }, projectedRevenue: { $sum: '$totalAmount' } } }
    ]);

    // 4. Performance Summary (Average marks)
    const resultQuery = { tenantId: new mongoose.Types.ObjectId(tenantId) };
    if (branchId) resultQuery.branchId = new mongoose.Types.ObjectId(branchId);
    if (academicYearId) {
        const exams = await Exam.find(query).select('_id').lean();
        resultQuery.examId = { $in: exams.map((exam) => exam._id) };
    }
    const performanceStats = await Result.aggregate([
        { $match: resultQuery },
        { $group: { _id: null, avgMarks: { $avg: '$marksObtained' }, totalResults: { $count: {} } } }
    ]);

    res.json({
        studentCount,
        activeEnrollments,
        revenue: revenueStats[0] || { totalRevenue: 0, projectedRevenue: 0 },
        performance: performanceStats[0] || { avgMarks: 0, totalResults: 0 }
    });
});

// ==========================================
// F) Promotion & Transfer
// ==========================================

const promoteStudents = asyncHandler(async (req, res) => {
    const { fromAcademicYearId, toAcademicYearId, rules = {} } = req.body;
    const classMap = Array.isArray(rules.classMap)
        ? rules.classMap.filter((mapping) => mapping?.fromClassId && mapping?.toClassId)
        : [];

    if (!fromAcademicYearId || !toAcademicYearId || classMap.length === 0) {
        res.status(400);
        throw new Error('Source year, target year, and at least one class mapping are required');
    }
    if (String(fromAcademicYearId) === String(toAcademicYearId)) {
        res.status(400);
        throw new Error('Target academic year must be different from source year');
    }

    const [fromYear, toYear] = await Promise.all([
        AcademicYear.findOne({ _id: fromAcademicYearId, tenantId: req.tenantId }),
        AcademicYear.findOne({ _id: toAcademicYearId, tenantId: req.tenantId })
    ]);
    if (!fromYear || !toYear) {
        res.status(400);
        throw new Error('Source or target academic year is invalid for this institution');
    }

    const results = {
        promoted: 0,
        failed: 0,
        skippedExisting: 0,
        totalConsidered: 0,
        errors: []
    };

    for (const mapping of classMap) {
        const { fromClassId, toClassId } = mapping;
        const [fromClass, toClass] = await Promise.all([
            Class.findOne({ _id: fromClassId, tenantId: req.tenantId }),
            Class.findOne({ _id: toClassId, tenantId: req.tenantId })
        ]);
        if (!fromClass || !toClass) {
            results.errors.push(`Invalid class mapping ${fromClassId} -> ${toClassId}`);
            continue;
        }
        if (String(fromClass.branchId) !== String(toClass.branchId)) {
            results.errors.push(`Class mapping ${fromClass.name} -> ${toClass.name} crosses branches`);
            continue;
        }

        const enrollments = await Enrollment.find({
            tenantId: req.tenantId,
            branchId: fromClass.branchId,
            academicYearId: fromAcademicYearId,
            classId: fromClassId,
            status: { $in: ACTIVE_ENROLLMENT_STATUSES }
        });

        for (const enroll of enrollments) {
            results.totalConsidered++;

            const existingNext = await Enrollment.findOne({
                tenantId: req.tenantId,
                branchId: enroll.branchId,
                academicYearId: toAcademicYearId,
                studentId: enroll.studentId
            });

            if (existingNext) {
                await Enrollment.updateOne(
                    { _id: enroll._id, tenantId: req.tenantId, status: { $in: ACTIVE_ENROLLMENT_STATUSES } },
                    { $set: { status: 'Promoted' } }
                );
                results.skippedExisting++;
                continue;
            }

            let newEnroll;
            try {
                newEnroll = await Enrollment.create({
                    tenantId: req.tenantId,
                    branchId: enroll.branchId,
                    studentId: enroll.studentId,
                    classId: toClassId,
                    sectionId: null,
                    academicYearId: toAcademicYearId,
                    status: 'Current'
                });

                const updateResult = await Enrollment.updateOne(
                    { _id: enroll._id, tenantId: req.tenantId, status: { $in: ACTIVE_ENROLLMENT_STATUSES } },
                    { $set: { status: 'Promoted' } }
                );
                if (updateResult.matchedCount === 0) {
                    await Enrollment.deleteOne({ _id: newEnroll._id, tenantId: req.tenantId });
                    results.failed++;
                    results.errors.push(`Enrollment changed while promoting student ${enroll.studentId}`);
                    continue;
                }

                results.promoted++;
            } catch (error) {
                if (newEnroll?._id) {
                    await Enrollment.deleteOne({ _id: newEnroll._id, tenantId: req.tenantId }).catch(() => {});
                }
                results.failed++;
                results.errors.push(`Student ${enroll.studentId}: ${error.message}`);
            }
        }
    }

    await logActivity({
        req,
        action: 'STUDENTS_PROMOTED',
        entityType: 'Enrollment',
        details: { fromAcademicYearId, toAcademicYearId, ...results }
    });

    res.json({ message: `Successfully promoted ${results.promoted} students`, ...results });
});

const transferStudentBranch = asyncHandler(async (req, res) => {
    const { studentId, fromBranchId, toBranchId, classId, academicYearId } = req.body;
    if (!studentId || !fromBranchId || !toBranchId || !classId || !academicYearId) {
        res.status(400);
        throw new Error('Student, source branch, target branch, class, and academic year are required');
    }
    if (String(fromBranchId) === String(toBranchId)) {
        res.status(400);
        throw new Error('Source and target branches must be different');
    }

    const [student, sourceBranch, targetBranch, targetClass, academicYear] = await Promise.all([
        Student.findOne({ _id: studentId, tenantId: req.tenantId, branchId: fromBranchId }),
        Branch.findOne({ _id: fromBranchId, tenantId: req.tenantId, isActive: true }),
        Branch.findOne({ _id: toBranchId, tenantId: req.tenantId, isActive: true }),
        Class.findOne({ _id: classId, tenantId: req.tenantId, branchId: toBranchId }),
        AcademicYear.findOne({ _id: academicYearId, tenantId: req.tenantId })
    ]);
    if (!student) {
        res.status(404);
        throw new Error('Student was not found in the selected source branch');
    }
    if (!sourceBranch || !targetBranch || !targetClass || !academicYear) {
        res.status(400);
        throw new Error('The selected transfer context is invalid for this institution');
    }

    const currentEnrollments = await Enrollment.find({
        tenantId: req.tenantId,
        studentId,
        branchId: fromBranchId,
        status: 'Current'
    });
    if (currentEnrollments.length === 0) {
        res.status(400);
        throw new Error('Student has no current enrollment in the source branch');
    }

    let newEnroll;
    try {
        await Enrollment.updateMany(
            { _id: { $in: currentEnrollments.map((enrollment) => enrollment._id) }, tenantId: req.tenantId },
            { $set: { status: 'Transferred' } }
        );
        student.branchId = toBranchId;
        await student.save();
        newEnroll = await Enrollment.create({
            tenantId: req.tenantId,
            branchId: toBranchId,
            studentId,
            classId,
            academicYearId,
            status: 'Current'
        });
    } catch (error) {
        student.branchId = fromBranchId;
        await student.save().catch(() => {});
        await Enrollment.updateMany(
            { _id: { $in: currentEnrollments.map((enrollment) => enrollment._id) }, tenantId: req.tenantId },
            { $set: { status: 'Current' } }
        ).catch(() => {});
        throw error;
    }

    await logActivity({
        req,
        action: 'BRANCH_TRANSFER',
        entityType: 'Student',
        entityId: studentId.toString(),
        details: { fromBranchId, toBranchId }
    });

    res.json({ message: 'Student transferred successfully', enrollment: newEnroll });
});

const getBranchClasses = asyncHandler(async (req, res) => {
    const branch = await Branch.findOne({ _id: req.params.branchId, tenantId: req.tenantId, isActive: true });
    if (!branch) {
        res.status(404);
        throw new Error('Branch not found');
    }
    const classes = await Class.find({ tenantId: req.tenantId, branchId: branch._id }).sort({ name: 1 });
    res.json(classes);
});

// ==========================================
// G) Audit Logs
// ==========================================

const getAuditLogs = asyncHandler(async (req, res) => {
    const { branchId, action, from, to } = req.query;
    const query = { tenantId: req.tenantId };

    if (branchId) query.branchId = branchId;
    if (action) query.action = action;
    if (from || to) {
        query.createdAt = {};
        if (from) query.createdAt.$gte = new Date(from);
        if (to) query.createdAt.$lte = new Date(to);
    }

    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(100);
    res.json(logs);
});

module.exports = {
    login,
    getBranding, updateBranding,
    getBranches, createBranch, updateBranch, toggleBranchStatus, assignBranchAdmin,
    createUser, getUsers,
    createAcademicYear, setCurrentYear,
    getOverviewReport,
    promoteStudents, transferStudentBranch, getBranchClasses,
    getAuditLogs
};
