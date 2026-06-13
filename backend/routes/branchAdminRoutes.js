const express = require('express');
const router = express.Router();
const {
    getBranchProfile, updateBranchProfile,
    getClasses, createClass, getClass, updateClass,
    getCurrentAcademicYear,
    createBranchUser, getBranchUsers, updateBranchUser,
    getStudents, getStudent, promoteStudents,
    createExam, getExams, getExamResults, getResultsSummary,
    getBranchOverview,
    createTeacherWithAssignments, updateTeacherAssignments, getTeacherAssignments,
    getClassCategories, createClassCategory,
    getSections, createSection,
    getSubjects, createSubject,
    getExamCategories, createExamCategory,
    updateExamStatus, deleteExam, getStudentResults
} = require('../controllers/branchAdminController');
const timetableController = require('../controllers/timetableController');

const { protect, authorize, requireScope, tenantGuard, branchGuard } = require('../middleware/auth');

// Apply Global Middleware for Branch Admin
// Must be: Authenticated -> Branch Admin Role -> Branch Scope -> Tenant Valid -> Branch Valid
router.use(protect);
router.use(authorize('branch_admin'));
router.use(requireScope('branch'));
router.use(tenantGuard);
router.use(branchGuard);

// --- A) Branch Profile ---
router.get('/profile', getBranchProfile);
router.put('/profile', updateBranchProfile);

// --- B) Class Management ---
router.get('/classes', getClasses);
router.post('/classes', createClass);
router.get('/classes/:classId', getClass);
router.put('/classes/:classId', updateClass);

router.get('/class-categories', getClassCategories);
router.post('/class-categories', createClassCategory);

router.get('/sections', getSections);
router.post('/sections', createSection);

router.get('/subjects', getSubjects);
router.post('/subjects', createSubject);

router.get('/class-subjects', require('../controllers/branchAdminController').getClassSubjects);
router.post('/class-subjects', require('../controllers/branchAdminController').createClassSubject);
router.delete('/class-subjects/:id', require('../controllers/branchAdminController').deleteClassSubject);

router.get('/academic-years/current', getCurrentAcademicYear);

// --- B.1) Timetable Management ---
router.post('/timetable/slots', timetableController.createTimetableSlot);
router.get('/timetable/slots', timetableController.getBranchTimetableSlots);
router.put('/timetable/slots/:slotId', timetableController.updateTimetableSlot);
router.patch('/timetable/slots/:slotId/status', timetableController.updateTimetableSlotStatus);

// --- C) Branch Staff Management ---
router.get('/users', getBranchUsers);
router.post('/users', createBranchUser);
router.put('/users/:userId', updateBranchUser);
// router.patch('/users/:userId/status') // Implemented via PUT for simplicity or separate if needed

// Teacher Specifics
router.post('/users/teachers', createTeacherWithAssignments);
router.put('/users/teachers/:teacherUserId/assignments', updateTeacherAssignments);
router.get('/users/teachers/:teacherUserId/assignments', getTeacherAssignments);
router.get('/assignments/all', require('../controllers/branchAdminController').getAllBranchAssignments);

// --- D) Student Lifecycle ---
router.get('/students', getStudents);
router.get('/students/:studentId', getStudent);
router.post('/enrollments/promote', promoteStudents);

// --- E) Exams Oversight ---
router.get('/exam-categories', getExamCategories);
router.post('/exam-categories', createExamCategory);

router.get('/exams', getExams);
router.post('/exams', createExam);
router.patch('/exams/:id/status', updateExamStatus);
router.delete('/exams/:id', deleteExam);
router.get('/results', getExamResults);
router.get('/results/summary', getResultsSummary);
router.get('/results/class', require('../controllers/branchAdminController').getClassResults);
router.get('/results/student', getStudentResults);

// --- F) Reporting ---
router.get('/reports/overview', getBranchOverview);

module.exports = router;
