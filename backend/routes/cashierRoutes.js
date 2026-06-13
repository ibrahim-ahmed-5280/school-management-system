const express = require('express');
const router = express.Router();
const {
    searchInvoices,
    getInvoiceById,
    createPayment,
    getReceipt,
    getPayments,
    reversePayment
} = require('../controllers/cashierController');

const { protect, authorize, requireScope, tenantGuard, branchGuard } = require('../middleware/auth');

// Global Cashier Middleware Stack
// 1. Authenticated
// 2. Role = CASHIER
// 3. Scope = BRANCH
// 4. Tenant Valid
// 5. Branch Valid
router.use(protect);
router.use(authorize('cashier')); 
router.use(requireScope('branch'));
router.use(tenantGuard);
router.use(branchGuard);

// --- Invoices ---
router.get('/invoices/search', searchInvoices);
router.get('/invoices/:id', getInvoiceById);

// --- Payments ---
router.get('/payments', getPayments);
router.post('/payments', createPayment);
router.post('/payments/:id/reverse', reversePayment);

// --- Receipts ---
router.get('/receipts/:paymentId', getReceipt);

module.exports = router;
