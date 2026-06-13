const express = require('express');
const router = express.Router();
const {
    createLeaveRequest,
    getLeaveRequests,
    reviewLeaveRequest,
    generatePayroll,
    getPayrollHistory,
    payPayroll
} = require('../controllers/hrController');
const { protect, authorize, requireScope, tenantGuard, branchGuard } = require('../middleware/auth');

// Protect all routes
router.use(protect);
router.use(tenantGuard);

// Leaves management
router.post('/leaves', authorize('teacher', 'cashier', 'registrar', 'branch_admin'), createLeaveRequest);
router.get('/leaves', authorize('teacher', 'cashier', 'registrar', 'branch_admin', 'super_admin'), getLeaveRequests);
router.put('/leaves/:id/review', authorize('branch_admin', 'super_admin'), reviewLeaveRequest);

// Payroll management
router.post('/payroll/generate', authorize('branch_admin', 'super_admin'), generatePayroll);
router.get('/payroll', authorize('teacher', 'cashier', 'registrar', 'branch_admin', 'super_admin'), getPayrollHistory);
router.put('/payroll/:id/pay', authorize('branch_admin', 'super_admin'), payPayroll);

module.exports = router;
