const express = require('express');
const router = express.Router();
const {
    createFeeStructure, getFeeStructures, getFeeStructureById, updateFeeStructure, deleteFeeStructure,
    getFinancePolicies, updateFinancePolicies, triggerBulkInvoices,
    getInvoices, getInvoiceById,
    getPayments, getPaymentsSummary, getOutstandingBalances,
    getReceiptBranding,
    getRevenueReport
} = require('../controllers/financeController');
const { protect, authorize, requireScope, tenantGuard } = require('../middleware/auth');
const { financeRateLimiter } = require('../middleware/rateLimiter');

// All routes require authentication, correct scope and tenant context
router.use(financeRateLimiter);
router.use(protect);
router.use(authorize('super_admin', 'finance_director'));
router.use(requireScope('tenant'));
router.use(tenantGuard);

// A) Fee Structure Management
router.post('/fee-structures', createFeeStructure);
router.get('/fee-structures', getFeeStructures);
router.get('/fee-structures/:id', getFeeStructureById);
router.put('/fee-structures/:id', updateFeeStructure);
router.delete('/fee-structures/:id', deleteFeeStructure);

// B) Invoice Governance & Policies
router.get('/policies', getFinancePolicies);
router.put('/policies', updateFinancePolicies);
router.post('/invoices/generate', triggerBulkInvoices);

// C) Invoice Review
router.get('/invoices', getInvoices);
router.get('/invoices/:id', getInvoiceById);

// D) Payment Oversight
router.get('/payments', getPayments);
router.get('/payments/summary', getPaymentsSummary);
router.get('/outstanding', getOutstandingBalances);

// E) Receipts & Branding
router.get('/branches/:branchId/receipt-branding', getReceiptBranding);

// F) Reports
router.get('/reports/revenue', getRevenueReport);

module.exports = router;
