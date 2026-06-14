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
const { requireAnyPermission, requirePermission } = require('../middleware/permissions');

// Protect all routes
router.use(protect);
router.use(tenantGuard);

// Leaves management
router.post('/leaves', authorize('teacher', 'cashier', 'registrar', 'branch_admin'), requireAnyPermission(['hr.leaves.create', 'teacher.leaves.create']), createLeaveRequest);
router.get('/leaves', authorize('teacher', 'cashier', 'registrar', 'branch_admin', 'super_admin'), requireAnyPermission(['hr.leaves.view', 'hr.leaves.review']), getLeaveRequests);
router.put('/leaves/:id/review', authorize('branch_admin', 'super_admin'), requirePermission('hr.leaves.review'), reviewLeaveRequest);

// Payroll management
router.post('/payroll/generate', authorize('branch_admin', 'super_admin'), requirePermission('payroll.generate'), generatePayroll);
router.get('/payroll', authorize('teacher', 'cashier', 'registrar', 'branch_admin', 'super_admin'), requireAnyPermission(['payroll.self.view', 'payroll.view']), getPayrollHistory);
router.put('/payroll/:id/pay', authorize('branch_admin', 'super_admin'), requirePermission('payroll.pay'), payPayroll);

module.exports = router;
