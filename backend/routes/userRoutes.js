const express = require('express');
const router = express.Router();
const { addStaff, getStaff } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/staff', authorize('super_admin', 'branch_admin'), addStaff);
router.get('/staff', authorize('super_admin', 'branch_admin'), getStaff);

module.exports = router;
