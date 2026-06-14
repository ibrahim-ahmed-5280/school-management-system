const express = require('express');
const router = express.Router();
const {
    getCurrentAcademicYear,
    createStudentAdmission,
    getStudents,
    getStudentById,
    updateStudent,
    resetStudentPassword,
    createEnrollment,
    transferStudentBranch,
    getRegistrarStats
} = require('../controllers/registrarController');

const { protect, authorize, requireScope, tenantGuard, branchGuard } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { enforcePlanLimit } = require('../services/planLimitService');

// Global Middleware for Registrar Routes
// 1. Authenticate (JWT)
// 2. Role Check (Registrar)
// 3. Scope Check (Branch)
// 4. Tenant Isolation
// 5. Branch Isolation
router.use(protect);
router.use(authorize('registrar'));
router.use(requireScope('branch'));
router.use(tenantGuard);
router.use(branchGuard);

// Routes
router.get('/academic-years/current', getCurrentAcademicYear);
router.get('/stats', requirePermission('students.view'), getRegistrarStats);
router.post('/students', requirePermission('students.create'), enforcePlanLimit('students'), enforcePlanLimit('users'), createStudentAdmission);
router.get('/students', requirePermission('students.view'), getStudents);
router.get('/students/:id', requirePermission('students.detail'), getStudentById);
router.put('/students/:id', requirePermission('students.update'), updateStudent);
router.put('/students/:id/reset-password', requirePermission('students.password.reset'), resetStudentPassword);
router.post('/enrollments', requirePermission('enrollments.create'), createEnrollment);
router.post('/transfers/branch', requirePermission('transfers.branch.create'), transferStudentBranch);

module.exports = router;
