const express = require('express');
const router = express.Router();
const { admitStudent, getStudents, getStudentDetails } = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('super_admin', 'branch_admin', 'registrar'), admitStudent);
router.get('/', authorize('super_admin', 'branch_admin', 'registrar', 'teacher'), getStudents);
router.get('/class/:classId', authorize('super_admin', 'branch_admin', 'registrar', 'teacher'), require('../controllers/studentController').getStudentsByClass);
router.get('/:id', authorize('super_admin', 'branch_admin', 'registrar', 'teacher', 'student', 'parent'), getStudentDetails);

module.exports = router;
