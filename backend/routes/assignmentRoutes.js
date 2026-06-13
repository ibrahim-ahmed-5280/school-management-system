const express = require('express');
const router = express.Router();
const { assignTeacher, getMyAssignments, getAllAssignments } = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('super_admin', 'branch_admin'), assignTeacher);
router.get('/', authorize('super_admin', 'branch_admin'), getAllAssignments);
router.get('/my', getMyAssignments);

module.exports = router;
