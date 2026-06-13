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
    transferStudentBranch
} = require('../controllers/registrarController');

const { protect, authorize, requireScope, tenantGuard, branchGuard } = require('../middleware/auth');

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
router.post('/students', createStudentAdmission);
router.get('/students', getStudents);
router.get('/students/:id', getStudentById);
router.put('/students/:id', updateStudent);
router.put('/students/:id/reset-password', resetStudentPassword);
router.post('/enrollments', createEnrollment);
router.post('/transfers/branch', transferStudentBranch);

module.exports = router;
