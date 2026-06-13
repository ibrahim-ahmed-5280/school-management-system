const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const timetableController = require('../controllers/timetableController');
const { protect, authorize, requireScope, tenantGuard, branchGuard, teacherAssignmentGuard } = require('../middleware/auth');

// Apply common middleware to all teacher routes
router.use(protect);
router.use(authorize('teacher'));
router.use(requireScope('branch'));
router.use(tenantGuard);
router.use(branchGuard);

// --- Exams ---
router.get('/exam-categories', teacherController.getExamCategories);
router.get('/exam-templates', teacherController.getExamTemplates);
router.get('/exams', teacherController.getExams);
router.get('/exams/:examId/students', teacherAssignmentGuard, teacherController.getExamStudents); // Changed from /:examId/entry to match prompt requirement slightly better, or alias it. Prompt asked for /:examId/students
router.get('/exams/:examId', teacherAssignmentGuard, teacherController.getExam);

// --- Results ---
router.post('/exam-results', teacherAssignmentGuard, teacherController.enterResult);
router.post('/exam-results/bulk', teacherAssignmentGuard, teacherController.batchEnterResults);
router.post('/exam-results/batch', teacherAssignmentGuard, teacherController.batchEnterResults);
router.put('/exam-results/:resultId', teacherController.updateResult);
router.get('/exam-results', teacherController.getResults);
router.get('/exam-results/summary', teacherAssignmentGuard, teacherController.getResultsSummary);
router.get('/results/class', teacherAssignmentGuard, teacherController.getClassResults);

// --- Attendance ---
router.post('/attendance/open', timetableController.openAttendanceForScheduledClass);
router.post('/attendance/sessions', teacherAssignmentGuard, teacherController.createAttendanceSession);
router.get('/attendance/sessions', teacherController.getAttendanceSessions);
router.post('/attendance/sessions/:sessionId/records', teacherController.submitAttendanceRecords);
router.post('/attendance/sessions/:sessionId/close', timetableController.closeAttendanceSession);

// --- Timetable ---
router.get('/timetable/today', timetableController.getTeacherTimetableToday);
router.get('/timetable/week', timetableController.getTeacherTimetableWeek);

// --- Assignments ---
router.get('/assignments', teacherController.getTeacherAssignments);

// --- Exports ---
router.get('/exports/results', teacherAssignmentGuard, teacherController.exportResults);

// --- Policy ---
router.get('/grading-policy', teacherController.getGradingPolicy);

// --- Students ---
router.get('/students', teacherController.getStudents);

module.exports = router;
