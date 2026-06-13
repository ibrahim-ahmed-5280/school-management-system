const express = require('express');
const router = express.Router();
const {
    getClasses,
    getCurrentAcademicYear,
    getStudents,
    getClassCategories,
    getSections,
    getSubjects,
    getClassSubjects
} = require('../controllers/branchAdminController');

const { protect, authorize, requireScope, tenantGuard, branchGuard } = require('../middleware/auth');

// Middleware for Branch Access (Shared Resources)
// Allows 'branch_admin' OR 'registrar' OR 'teacher'
router.use(protect);
router.use(authorize('branch_admin', 'registrar', 'teacher'));
router.use(requireScope('branch'));
router.use(tenantGuard);
router.use(branchGuard);

// Shared Resources
router.get('/classes', getClasses);
router.get('/class-categories', getClassCategories);
router.get('/sections', getSections);
router.get('/subjects', getSubjects);
router.get('/class-subjects', getClassSubjects);
router.get('/academic-years/current', getCurrentAcademicYear);
router.get('/students', getStudents);

module.exports = router;
