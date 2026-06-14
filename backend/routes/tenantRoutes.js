const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const {
    login,
    getBranding, updateBranding,
    getBranches, createBranch, updateBranch, toggleBranchStatus, assignBranchAdmin, getBranchClasses,
    createUser, getUsers,
    createAcademicYear, setCurrentYear,
    getOverviewReport,
    promoteStudents, transferStudentBranch,
    getTenantAuditLogs,
    getPermissionCatalog, getUserPermissions, updateUserPermissions
} = require('../controllers/tenantController');
const { protect, authorize, requireScope, tenantGuard } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { authRateLimiter } = require('../middleware/rateLimiter');

// Public tenant auth
router.post('/auth/login', authRateLimiter, login);

// All routes here require auth
router.use(protect);

// Public tenant auth (Login is public and does not need protect)
// router.post('/auth/login', login); // Already defined above

// Public lookup for any logged in tenant user (for branding)
router.get('/settings/branding', getBranding);
router.get('/branches', getBranches);
router.get('/branches/:branchId/classes', getBranchClasses);

// Public lookup for any logged in tenant user (within scope) - restricted to Super Admin / Finance Director
router.get('/academic-years', authorize('super_admin', 'finance_director'), asyncHandler(async (req, res) => {
    if (!req.tenantId) return res.status(403).json({ message: 'Tenant context missing' });
    const AcademicYear = require('../models/AcademicYear');
    const years = await AcademicYear.find({ tenantId: req.tenantId });
    res.json(years);
}));

// Strictly Super Admin area starts here
router.use(authorize('super_admin'));
router.use(requireScope('tenant'));
router.use(tenantGuard);

const upload = require('../middleware/uploadMiddleware');

// A) Branding
router.put('/settings/branding', upload.single('logo'), updateBranding);

// B) Branch Management
router.post('/branches', createBranch);
router.put('/branches/:branchId', updateBranch);
router.patch('/branches/:branchId/status', toggleBranchStatus);
router.post('/branches/:branchId/assign-branch-admin', assignBranchAdmin);

// C) User Management
router.get('/users', getUsers);
router.post('/users', createUser);

router.get('/permissions/catalog', requirePermission('tenant.users.permissions.view'), getPermissionCatalog);
router.get('/users/:userId/permissions', requirePermission('tenant.users.permissions.view'), getUserPermissions);
router.put('/users/:userId/permissions', requirePermission('tenant.users.permissions.update'), updateUserPermissions);

// D) Academic Year
router.post('/academic-years', createAcademicYear);
router.patch('/academic-years/:yearId/set-current', setCurrentYear);

// E) Reporting
router.get('/reports/overview', getOverviewReport);

// F) Promotion & Transfer
router.post('/enrollments/promote', promoteStudents);
router.post('/enrollments/transfer-branch', transferStudentBranch);

// G) Audit Logs
router.get('/audit', getTenantAuditLogs);
router.get('/audit-logs', getTenantAuditLogs);

module.exports = router;
