const express = require('express');
const router = express.Router();
const { getOverviewStats } = require('../controllers/dashboardController');
const { protect, authorize, tenantGuard } = require('../middleware/auth');

router.get('/stats', protect, authorize('super_admin', 'branch_admin'), tenantGuard, getOverviewStats);

module.exports = router;
