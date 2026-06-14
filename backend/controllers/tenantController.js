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
const AttendanceSession = require('../models/AttendanceSession');
const FeeStructure = require('../models/FeeStructure');
const TeacherAssignment = require('../models/TeacherAssignment');
const TimetableSlot = require('../models/TimetableSlot');
const { logActivity } = require('../utils/logger');
const { login } = require('./authController');
const { TENANT_ADMIN_CREATABLE_ROLES, assertValidRoleScope } = require('../utils/rolePolicy');
const {
    PERMISSION_CATALOG,
    getPermissionCatalogForRole,
    getUserPermissionParts,
    sanitizeAssignablePermissionsForRole
} = require('../utils/permissions');
const { generateTemporaryPassword } = require('../utils/passwords');

const ACTIVE_ENROLLMENT_STATUSES = ['Current', 'Active', 'active'];
const SEPARATE_TENANT_ACCOUNT_ROLES = new Set(['super_admin', 'finance_director']);

// ---- Helper utilities ----
const serializeUser = (user) => {
    const raw = typeof user.toObject === 'function' ? user.toObject() : user;
    delete raw.passwordHash;
    return raw;
};

const ensureTenantUser = async (req, userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        const error = new Error('Invalid user id');
        error.statusCode = 400;
        throw error;
    }
    const user = await User.findOne({
        _id: userId,
        tenantId: req.tenantId,
        role: { $ne: 'platform_owner' }
    });
    if (!user) {
        const error = new Error('User not found in this institution');
        error.statusCode = 404;
        throw error;
    }
    return user;
};

const assertNotLastActiveSuperAdmin = async (req, targetUser, nextIsActive = targetUser.isActive) => {
    if (targetUser.role !== 'super_admin' || nextIsActive) return;
    if (targetUser._id.toString() === req.user._id.toString()) {
        const error = new Error('You cannot deactivate your own super admin account');
        error.statusCode = 400;
        throw error;
    }
    const activeSuperAdmins = await User.countDocuments({
        tenantId: req.tenantId,
        role: 'super_admin',
        isActive: true
    });
    if (activeSuperAdmins <= 1) {
        const error = new Error('Cannot deactivate the last active school super admin');
        error.statusCode = 400;
        throw error;
    }
};

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

    // 1. Verify target branch exists and belongs to the same tenant
    const branch = await Branch.findOne({ _id: branchId, tenantId: req.tenantId });
    if (!branch) {
        res.status(404);
        throw new Error('Target branch not found in this institution');
    }

    // 2. Verify target branch is active
    if (branch.isActive === false) {
        res.status(400);
        throw new Error('Target branch is inactive');
    }

    // 3. Verify user exists and belongs to the same tenant
    const user = await User.findOne({ _id: userId, tenantId: req.tenantId });
    if (!user) {
        res.status(404);
        throw new Error('User not found in this institution');
    }

    // 4. Verify user has branch_admin role and branch scope
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
        res.status(409);
        throw new Error('Email already exists for this school.');
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

const getUserById = asyncHandler(async (req, res) => {
    const user = await ensureTenantUser(req, req.params.userId);
    res.json(serializeUser(user));
});

const updateUser = asyncHandler(async (req, res) => {
    const targetUser = await ensureTenantUser(req, req.params.userId);
    const before = serializeUser(targetUser);

    const nextRole = req.body.role ? String(req.body.role).trim().toLowerCase() : targetUser.role;
    const nextScope = req.body.scope ? String(req.body.scope).trim().toLowerCase() : targetUser.scope;
    const normalized = assertValidRoleScope(nextRole, nextScope);

    if (!TENANT_ADMIN_CREATABLE_ROLES.has(normalized.role)) {
        res.status(403);
        throw new Error('This role cannot be managed by a tenant administrator');
    }
    if (
        normalized.role !== targetUser.role &&
        (SEPARATE_TENANT_ACCOUNT_ROLES.has(normalized.role) || SEPARATE_TENANT_ACCOUNT_ROLES.has(targetUser.role))
    ) {
        res.status(400);
        throw new Error('School super admin and finance director must remain separate accounts. Create a new account instead of changing this role.');
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
        const name = String(req.body.name || '').trim();
        if (!name) { res.status(400); throw new Error('Name is required'); }
        targetUser.name = name;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'email')) {
        const email = String(req.body.email || '').trim().toLowerCase();
        if (!email) { res.status(400); throw new Error('Email is required'); }
        const emailExists = await User.findOne({ tenantId: req.tenantId, email, _id: { $ne: targetUser._id } });
        if (emailExists) { res.status(400); throw new Error('Email already registered in this institution'); }
        targetUser.email = email;
    }

    if (normalized.role !== targetUser.role || normalized.scope !== targetUser.scope) {
        targetUser.role = normalized.role;
        targetUser.scope = normalized.scope;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'branchId')) {
        if (normalized.scope === 'branch') {
            const branch = await Branch.findOne({ _id: req.body.branchId, tenantId: req.tenantId });
            if (!branch) { res.status(400); throw new Error('Branch not found in this institution'); }
            targetUser.branchId = req.body.branchId;
        } else {
            targetUser.branchId = null;
        }
    }

    await targetUser.save();

    await logActivity({
        req,
        action: 'USER_UPDATED',
        entityType: 'User',
        entityId: targetUser._id.toString(),
        before,
        after: serializeUser(targetUser)
    });

    res.json(serializeUser(targetUser));
});

const updateUserStatus = asyncHandler(async (req, res) => {
    const targetUser = await ensureTenantUser(req, req.params.userId);

    if (typeof req.body.isActive !== 'boolean') {
        res.status(400);
        throw new Error('isActive boolean is required');
    }

    await assertNotLastActiveSuperAdmin(req, targetUser, req.body.isActive);

    const before = { isActive: targetUser.isActive };
    targetUser.isActive = req.body.isActive;
    await targetUser.save();

    await logActivity({
        req,
        action: targetUser.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        entityType: 'User',
        entityId: targetUser._id.toString(),
        before,
        after: { isActive: targetUser.isActive }
    });

    res.json({
        message: `User ${targetUser.isActive ? 'activated' : 'deactivated'} successfully`,
        user: serializeUser(targetUser)
    });
});

const resetUserPassword = asyncHandler(async (req, res) => {
    const targetUser = await ensureTenantUser(req, req.params.userId);
    const generated = !req.body.password;
    const nextPassword = generated ? generateTemporaryPassword() : String(req.body.password);

    if (nextPassword.length < 8) {
        res.status(400);
        throw new Error('Password must be at least 8 characters');
    }

    targetUser.passwordHash = nextPassword;
    targetUser.mustChangePassword = true;
    await targetUser.save();

    await logActivity({
        req,
        action: 'USER_PASSWORD_RESET',
        entityType: 'User',
        entityId: targetUser._id.toString(),
        after: { mustChangePassword: true }
    });

    res.json({
        message: 'Password reset successfully',
        temporaryPassword: generated ? nextPassword : undefined
    });
});

const getPermissionCatalog = asyncHandler(async (req, res) => {
    res.json(PERMISSION_CATALOG.filter((permission) => !permission.key.startsWith('platform.')));
});

const getUserPermissions = asyncHandler(async (req, res) => {
    const targetUser = await ensureTenantUser(req, req.params.userId);
    const permissionParts = getUserPermissionParts(targetUser);
    res.json({
        user: serializeUser(targetUser),
        catalog: getPermissionCatalogForRole(targetUser.role),
        ...permissionParts
    });
});

const updateUserPermissions = asyncHandler(async (req, res) => {
    const targetUser = await ensureTenantUser(req, req.params.userId);

    // 1. Require allow and deny to be arrays; malformed payloads must return clean 400 responses.
    if (!req.body || !Array.isArray(req.body.allow) || !Array.isArray(req.body.deny)) {
        const error = new Error('allow and deny must be arrays');
        error.statusCode = 400;
        throw error;
    }

    // 2. Validate every requested permission against getPermissionCatalogForRole(targetUser.role) before sanitizing.
    // Reject unknown and cross-role permissions with 400. Do not silently remove them.
    const assignableCatalog = getPermissionCatalogForRole(targetUser.role);
    const assignableKeys = new Set(assignableCatalog.map((permission) => permission.key));

    for (const key of [...req.body.allow, ...req.body.deny]) {
        if (typeof key !== 'string') {
            const error = new Error('Permissions must be strings');
            error.statusCode = 400;
            throw error;
        }
        if (!assignableKeys.has(key)) {
            const error = new Error(`Permission ${key} is not assignable to role ${targetUser.role}`);
            error.statusCode = 400;
            throw error;
        }
    }

    // 3. Reject permissions appearing in both allow and deny.
    const allowSet = new Set(req.body.allow);
    for (const key of req.body.deny) {
        if (allowSet.has(key)) {
            const error = new Error(`Permission ${key} cannot appear in both allow and deny`);
            error.statusCode = 400;
            throw error;
        }
    }

    const before = getUserPermissionParts(targetUser);
    const allow = sanitizeAssignablePermissionsForRole(targetUser.role, req.body.allow);
    const deny = sanitizeAssignablePermissionsForRole(targetUser.role, req.body.deny);

    if (
        targetUser._id.toString() === req.user._id.toString() &&
        deny.includes('tenant.users.permissions.update')
    ) {
        const error = new Error('You cannot remove your own permission-management access');
        error.statusCode = 400;
        throw error;
    }

    targetUser.permissions = { allow, deny };
    targetUser.permissionProfile = req.body.permissionProfile || targetUser.permissionProfile || `default_${targetUser.role}`;
    targetUser.lastPermissionUpdateAt = new Date();
    targetUser.lastPermissionUpdateBy = req.user._id;

    const simulated = getUserPermissionParts(targetUser);
    if (
        targetUser.role === 'super_admin' &&
        targetUser.isActive &&
        !simulated.effective.includes('tenant.users.permissions.update')
    ) {
        const activeSuperAdmins = await User.countDocuments({
            tenantId: req.tenantId,
            role: 'super_admin',
            isActive: true
        });
        if (activeSuperAdmins <= 1) {
            const error = new Error('Cannot remove permission-management access from the last active super admin');
            error.statusCode = 400;
            throw error;
        }
    }

    await targetUser.save();

    const after = getUserPermissionParts(targetUser);
    await logActivity({
        req,
        action: 'USER_PERMISSION_UPDATED',
        entityType: 'User',
        entityId: targetUser._id.toString(),
        before,
        after
    });

    res.json({ user: serializeUser(targetUser), ...after });
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

const updateAcademicYear = asyncHandler(async (req, res) => {
    const { name, startDate, endDate } = req.body;
    if (!name || !startDate || !endDate) {
        res.status(400);
        throw new Error('Name, Start Date, and End Date are required');
    }
    const year = await AcademicYear.findOne({ _id: req.params.yearId, tenantId: req.tenantId });
    if (!year) {
        res.status(404);
        throw new Error('Academic year not found');
    }

    const before = { name: year.name, startDate: year.startDate, endDate: year.endDate };
    year.name = name;
    year.startDate = startDate;
    year.endDate = endDate;
    await year.save();

    await logActivity({
        req,
        action: 'ACADEMIC_YEAR_UPDATED',
        entityType: 'AcademicYear',
        entityId: year._id.toString(),
        before,
        after: { name: year.name, startDate: year.startDate, endDate: year.endDate }
    });

    res.json(year);
});

const deleteAcademicYear = asyncHandler(async (req, res) => {
    const yearId = req.params.yearId;
    const year = await AcademicYear.findOne({ _id: yearId, tenantId: req.tenantId });
    if (!year) {
        res.status(404);
        throw new Error('Academic year not found');
    }

    if (year.isCurrent) {
        res.status(400);
        throw new Error('Cannot delete the current active academic year');
    }

    const [
        hasEnrollments,
        hasExams,
        hasInvoices,
        hasFeeStructures,
        hasAttendance,
        hasAssignments,
        hasTimetable
    ] = await Promise.all([
        Enrollment.exists({ tenantId: req.tenantId, academicYearId: yearId }),
        Exam.exists({ tenantId: req.tenantId, academicYearId: yearId }),
        Invoice.exists({ tenantId: req.tenantId, academicYearId: yearId }),
        FeeStructure.exists({ tenantId: req.tenantId, academicYearId: yearId }),
        AttendanceSession.exists({ academicYearId: yearId }),
        TeacherAssignment.exists({ tenantId: req.tenantId, academicYearId: yearId }),
        TimetableSlot.exists({ tenantId: req.tenantId, academicYearId: yearId })
    ]);

    if (
        hasEnrollments ||
        hasExams ||
        hasInvoices ||
        hasFeeStructures ||
        hasAttendance ||
        hasAssignments ||
        hasTimetable
    ) {
        res.status(400);
        throw new Error('This academic year has records and cannot be deleted.');
    }

    await year.deleteOne();

    await logActivity({
        req,
        action: 'ACADEMIC_YEAR_DELETED',
        entityType: 'AcademicYear',
        entityId: yearId,
        before: { name: year.name, startDate: year.startDate, endDate: year.endDate }
    });

    res.json({ message: 'Academic year deleted successfully' });
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

    // 5. Real student counts per branch
    const branchStats = await Student.aggregate([
        { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
        { $group: { _id: '$branchId', count: { $sum: 1 } } }
    ]);

    const branchDistribution = branchStats.map(bs => ({
        branchId: bs._id ? bs._id.toString() : 'unassigned',
        count: bs.count
    }));

    // 6. Monthly trend for the last 6 months (Tenant-wide)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setHours(0, 0, 0, 0);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

    const invoiceMonthly = await Invoice.aggregate([
        { 
            $match: { 
                tenantId: new mongoose.Types.ObjectId(tenantId),
                ...(branchId ? { branchId: new mongoose.Types.ObjectId(branchId) } : {}),
                status: { $ne: 'Void' },
                createdAt: { $gte: sixMonthsAgo }
            } 
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                invoiced: { $sum: '$totalAmount' }
            }
        }
    ]);

    const paymentMonthly = await Payment.aggregate([
        { 
            $match: { 
                tenantId: new mongoose.Types.ObjectId(tenantId),
                ...(branchId ? { branchId: new mongoose.Types.ObjectId(branchId) } : {}),
                status: 'ACTIVE',
                createdAt: { $gte: sixMonthsAgo }
            } 
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                collected: { $sum: '$amount' }
            }
        }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        const mVal = d.getMonth() + 1;
        const yVal = d.getFullYear();

        const inv = invoiceMonthly.find(item => item._id && item._id.year === yVal && item._id.month === mVal);
        const pay = paymentMonthly.find(item => item._id && item._id.year === yVal && item._id.month === mVal);

        trendData.push({
            month: monthNames[d.getMonth()],
            Projected: inv ? inv.invoiced : 0,
            Collected: pay ? pay.collected : 0
        });
    }

    res.json({
        studentCount,
        activeEnrollments,
        revenue: revenueStats[0] || { totalRevenue: 0, projectedRevenue: 0 },
        performance: performanceStats[0] || { avgMarks: 0, totalResults: 0 },
        branchDistribution,
        trendData
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
        status: { $in: ['Current', 'Active', 'active'] }
    });
    if (currentEnrollments.length === 0) {
        res.status(400);
        throw new Error('Student has no current enrollment in the source branch');
    }

    const linkedUser = await User.findOne({ tenantId: req.tenantId, studentId, role: 'student' });
    const originalUserBranchId = linkedUser ? linkedUser.branchId : null;

    let newEnroll;
    let studentUpdated = false;
    let enrollmentsUpdated = false;
    let userUpdated = false;

    try {
        await Enrollment.updateMany(
            { _id: { $in: currentEnrollments.map((enrollment) => enrollment._id) }, tenantId: req.tenantId },
            { $set: { status: 'Transferred' } }
        );
        enrollmentsUpdated = true;

        student.branchId = toBranchId;
        await student.save();
        studentUpdated = true;

        newEnroll = await Enrollment.create({
            tenantId: req.tenantId,
            branchId: toBranchId,
            studentId,
            classId,
            academicYearId,
            status: 'Current'
        });

        if (linkedUser) {
            await User.updateOne(
                { _id: linkedUser._id, tenantId: req.tenantId, role: 'student', studentId },
                { branchId: toBranchId }
            );
            userUpdated = true;
        }
    } catch (error) {
        if (userUpdated && linkedUser) {
            await User.updateOne(
                { _id: linkedUser._id, tenantId: req.tenantId, role: 'student', studentId },
                { branchId: originalUserBranchId }
            ).catch(() => {});
        }
        if (newEnroll) {
            await Enrollment.deleteOne({ _id: newEnroll._id }).catch(() => {});
        }
        if (studentUpdated) {
            student.branchId = fromBranchId;
            await student.save().catch(() => {});
        }
        if (enrollmentsUpdated) {
            for (const originalEnrollment of currentEnrollments) {
                await Enrollment.updateOne(
                    { _id: originalEnrollment._id, tenantId: req.tenantId },
                    { status: originalEnrollment.status }
                ).catch(() => {});
            }
        }
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

const getTenantAuditLogs = asyncHandler(async (req, res) => {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
    const query = { tenantId: req.tenantId };

    if (req.query.action) query.action = req.query.action;
    if (req.query.actor) {
        query.$or = [
            { actorName: { $regex: req.query.actor, $options: 'i' } },
            { actorEmail: { $regex: req.query.actor, $options: 'i' } }
        ];
    }
    if (req.query.entityType) query.entityType = req.query.entityType;
    if (req.query.entityId) query.entityId = String(req.query.entityId);
    if (req.query.from || req.query.to) {
        query.createdAt = {};
        if (req.query.from) query.createdAt.$gte = new Date(req.query.from);
        if (req.query.to) query.createdAt.$lte = new Date(req.query.to);
    }

    const [logs, total] = await Promise.all([
        AuditLog.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('actorUserId', 'name email role'),
        AuditLog.countDocuments(query)
    ]);

    const inferActivityType = (action = '') => {
        const upper = String(action).toUpperCase();
        if (upper.includes('ERROR') || upper.includes('FAILED') || upper.includes('SUSPEND') || upper.includes('DEACTIVATED')) return 'danger';
        if (upper.includes('UPDATE') || upper.includes('CHANGED') || upper.includes('SET') || upper.includes('RESET') || upper.includes('ASSIGN')) return 'update';
        if (upper.includes('WARN')) return 'warning';
        return 'info';
    };

    const transformedLogs = logs.map((log) => ({
        id: log._id,
        action: log.action,
        user: log.actorUserId?.name || log.actorName || log.actorRole || 'System',
        actor: log.actorUserId?.name || log.actorName || log.actorRole || 'System',
        actorEmail: log.actorUserId?.email || log.actorEmail || '',
        target: log.entityId ? `${log.entityType} (${log.entityId})` : (log.entityType || 'Unknown'),
        date: new Date(log.createdAt).toLocaleString(),
        timestamp: log.createdAt,
        type: inferActivityType(log.action),
        actorRole: log.actorRole,
        entityType: log.entityType,
        entityId: log.entityId,
        reason: log.reason,
        before: log.before,
        after: log.after
    }));

    res.json({ logs: transformedLogs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

module.exports = {
    login,
    getBranding, updateBranding,
    getBranches, createBranch, updateBranch, toggleBranchStatus, assignBranchAdmin,
    createUser, getUsers, getUserById, updateUser, updateUserStatus, resetUserPassword,
    getPermissionCatalog, getUserPermissions, updateUserPermissions,
    createAcademicYear, setCurrentYear, updateAcademicYear, deleteAcademicYear,
    getOverviewReport,
    promoteStudents, transferStudentBranch, getBranchClasses,
    getTenantAuditLogs
};
