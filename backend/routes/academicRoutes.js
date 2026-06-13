const express = require('express');
const router = express.Router();
const { createAcademicYear, createClass, getAcademicYears, getClasses } = require('../controllers/academicController');
const { promoteStudents, transferStudent } = require('../controllers/promotionController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/years', authorize('super_admin', 'branch_admin'), createAcademicYear);
router.get('/years', getAcademicYears);
router.post('/classes', authorize('super_admin', 'branch_admin'), createClass);
router.get('/classes', getClasses);
router.post('/promote', authorize('super_admin', 'branch_admin'), promoteStudents);
router.post('/transfer', authorize('super_admin', 'branch_admin'), transferStudent);

module.exports = router;
