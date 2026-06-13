const express = require('express');
const router = express.Router();
const { createExam, submitResult, getExams, getResultsByExam } = require('../controllers/examController');
const { protect, authorize, requireScope, tenantGuard, branchGuard } = require('../middleware/auth');

router.use(protect);
router.use(requireScope('branch'));
router.use(tenantGuard);
router.use(branchGuard);

router.post('/', authorize('branch_admin'), createExam);
router.get('/', authorize('branch_admin'), getExams);
router.post('/:examId/results', authorize('branch_admin'), submitResult);
router.get('/:examId/results', authorize('branch_admin'), getResultsByExam);

module.exports = router;
