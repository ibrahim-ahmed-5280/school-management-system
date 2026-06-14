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
const { requirePermission } = require('../middleware/permissions');
const { financeRateLimiter } = require('../middleware/rateLimiter');

// All routes require authentication, correct scope and tenant context
router.use(financeRateLimiter);
router.use(protect);
router.use(authorize('finance_director'));
router.use(requireScope('tenant'));
router.use(tenantGuard);

// A) Fee Structure Management
router.post('/fee-structures', requirePermission('finance.feeStructures.create'), createFeeStructure);
router.get('/fee-structures', requirePermission('finance.feeStructures.view'), getFeeStructures);
router.get('/fee-structures/:id', requirePermission('finance.feeStructures.view'), getFeeStructureById);
router.put('/fee-structures/:id', requirePermission('finance.feeStructures.update'), updateFeeStructure);
router.delete('/fee-structures/:id', requirePermission('finance.feeStructures.delete'), deleteFeeStructure);

// B) Invoice Governance & Policies
router.get('/policies', requirePermission('finance.policies.view'), getFinancePolicies);
router.put('/policies', requirePermission('finance.policies.update'), updateFinancePolicies);
router.post('/invoices/generate', requirePermission('finance.invoices.generate'), triggerBulkInvoices);

// C) Invoice Review
router.get('/invoices', requirePermission('finance.invoices.view'), getInvoices);
router.get('/invoices/:id', requirePermission('finance.invoices.detail'), getInvoiceById);

// D) Payment Oversight
router.get('/payments', requirePermission('finance.payments.view'), getPayments);
router.get('/payments/summary', requirePermission('finance.payments.summary'), getPaymentsSummary);
router.get('/outstanding', requirePermission('finance.outstanding.view'), getOutstandingBalances);

// E) Receipts & Branding
router.get('/branches/:branchId/receipt-branding', requirePermission('finance.receiptBranding.view'), getReceiptBranding);

// F) Reports
router.get('/reports/revenue', requirePermission('finance.reports.view'), getRevenueReport);

module.exports = router;
