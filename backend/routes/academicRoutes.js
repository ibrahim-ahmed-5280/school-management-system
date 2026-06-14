const express = require('express');
const router = express.Router();
const { createAcademicYear, createClass, getAcademicYears, getClasses } = require('../controllers/academicController');
const { promoteStudents, transferStudent } = require('../controllers/promotionController');
const { protect, authorize, tenantGuard, branchGuard } = require('../middleware/auth');
const { requireAnyPermission, requirePermission } = require('../middleware/permissions');

router.use(protect);
router.use(tenantGuard);

router.post('/years', authorize('super_admin'), requirePermission('tenant.academicYears.create'), createAcademicYear);
router.get('/years', authorize('super_admin'), requirePermission('tenant.academicYears.view'), getAcademicYears);
router.post('/classes', authorize('super_admin', 'branch_admin'), requirePermission('branch.classes.create'), branchGuard, createClass);
router.get('/classes', requirePermission('branch.classes.view'), branchGuard, getClasses);
router.post('/promote', authorize('super_admin', 'branch_admin'), requireAnyPermission(['tenant.promotions.run', 'branch.promotions.run']), branchGuard, promoteStudents);
router.post('/transfer', authorize('super_admin', 'branch_admin'), requirePermission('tenant.transfers.run'), branchGuard, transferStudent);

module.exports = router;
