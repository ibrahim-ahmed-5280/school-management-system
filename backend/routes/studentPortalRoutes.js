const express = require('express');
const router = express.Router();
const studentPortalController = require('../controllers/studentPortalController');
const timetableController = require('../controllers/timetableController');
const { protect, authorize, requireScope, tenantGuard, branchGuard } = require('../middleware/auth');

// Apply middleware
router.use(protect);
router.use(authorize('student'));
router.use(requireScope('branch'));
router.use(tenantGuard);
router.use(branchGuard);

router.get('/profile', studentPortalController.getProfile);
router.get('/academic-years', studentPortalController.getAcademicYears);
router.get('/subjects', studentPortalController.getSubjects);
router.get('/results', studentPortalController.getResults);
router.get('/rank', studentPortalController.getRank);
router.get('/exams', studentPortalController.getExams);
router.get('/attendance', studentPortalController.getAttendance);
router.get('/timetable/today', timetableController.getStudentTimetableToday);
router.get('/timetable/week', timetableController.getStudentTimetableWeek);
router.post('/auth/change-password', studentPortalController.changePassword);

module.exports = router;
