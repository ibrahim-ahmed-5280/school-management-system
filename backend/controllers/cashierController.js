const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const Branch = require('../models/Branch');
const { logAction } = require('../services/auditLogService');
const mongoose = require('mongoose');
const { recordInvoicePayment, reverseInvoicePayment } = require('../services/paymentService');

// @desc    Search Invoices
// @route   GET /api/cashier/invoices/search
// @access  Private (Cashier)
exports.searchInvoices = async (req, res) => {
    try {
        const { invoiceId, admissionNumber, studentId } = req.query;

        // Base Query: Tenant & Branch Isolation
        const query = {
            tenantId: req.user.tenantId,
            branchId: req.user.branchId
        };
        
        let found = false;

        if (invoiceId) {
            query._id = invoiceId;
            found = true;
        } else if (studentId) {
            query.studentId = studentId;
            found = true;
        } else if (admissionNumber) {
            // First find student by admission number
            const student = await Student.findOne({
                tenantId: req.user.tenantId,
                branchId: req.user.branchId,
                admissionNumber: admissionNumber
            });
            
            if (student) {
                query.studentId = student._id;
                found = true;
            } else {
                // If student not found by admission number, return empty immediately
                return res.json({ success: true, data: [] });
            }
        }

        if (!found) {
            return res.status(400).json({ success: false, message: 'Please provide invoiceId, studentId, or admissionNumber.' });
        }

        const invoices = await Invoice.find(query)
            .populate('studentId', 'firstName lastName admissionNumber classId')
            .populate('academicYearId', 'name')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: invoices });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Invoice Details
// @route   GET /api/cashier/invoices/:id
// @access  Private (Cashier)
exports.getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findOne({
            _id: req.params.id,
            tenantId: req.user.tenantId,
            branchId: req.user.branchId
        })
        .populate('studentId', 'firstName lastName admissionNumber guardianInfo')
        .populate('academicYearId', 'name');

        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Invoice not found.' });
        }

        res.json({ success: true, data: invoice });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Record Payment
// @route   POST /api/cashier/payments
// @access  Private (Cashier)
exports.createPayment = async (req, res) => {
    try {
        const { invoiceId, amount, method, reference } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation error', 
                errors: [{ field: 'amount', message: 'Amount must be greater than 0.' }] 
            });
        }

        const { payment, invoice } = await recordInvoicePayment({
            tenantId: req.user.tenantId,
            branchId: req.user.branchId,
            invoiceId,
            amount,
            method,
            reference,
            recordedBy: req.user._id
        });

        // 5. Audit Logs
        try {
            await logAction({
                tenantId: req.user.tenantId,
                branchId: req.user.branchId,
                actorUserId: req.user._id,
                actorRole: req.user.role || 'cashier',
                action: 'PAYMENT_CREATED',
                entityType: 'Payment',
                entityId: payment._id,
                after: payment.toObject(), // safe to object
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });

             await logAction({
                tenantId: req.user.tenantId,
                branchId: req.user.branchId,
                actorUserId: req.user._id,
                actorRole: req.user.role || 'cashier',
                action: 'INVOICE_UPDATED',
                entityType: 'Invoice',
                entityId: invoice._id,
                after: { paidAmount: invoice.paidAmount, balance: invoice.balance, status: invoice.status },
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
        } catch (auditErr) { console.error("Audit log error", auditErr); }

        res.status(201).json({
            success: true,
            data: {
                payment,
                invoice // Return updated invoice for UI
            }
        });

    } catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
};

// @desc    Get Receipt Data
// @route   GET /api/cashier/receipts/:paymentId
// @access  Private (Cashier)
exports.getReceipt = async (req, res) => {
    try {
        const payment = await Payment.findOne({
            _id: req.params.paymentId,
            tenantId: req.user.tenantId,
            branchId: req.user.branchId
        }).populate('invoiceId')
          .populate('recordedBy', 'firstName lastName');

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found.' });
        }

        const invoice = payment.invoiceId;
        
        // Fetch Student Info
        const student = await Student.findById(invoice.studentId).select('firstName lastName admissionNumber');

        // Fetch Branch Branding
        const branch = await Branch.findById(req.user.branchId).select('name logoUrl address contactInfo receiptFooter');

        const receiptPayload = {
            receiptNo: payment._id, // Simple ID for now
            dateTime: payment.createdAt,
            branch: {
                name: branch.name,
                logoUrl: branch.logoUrl,
                address: branch.address,
                contactInfo: branch.contactInfo,
                receiptFooter: branch.receiptFooter
            },
            student: {
                admissionNumber: student?.admissionNumber || 'N/A',
                name: student ? `${student.firstName} ${student.lastName}` : 'Unknown'
            },
            invoice: {
                invoiceId: invoice._id,
                totalAmount: invoice.totalAmount,
                paidAmount: invoice.paidAmount,
                balance: invoice.balance,
                status: invoice.status,
                items: invoice.items
            },
            payment: {
                amount: payment.amount,
                method: payment.method,
                reference: payment.reference,
                createdAt: payment.createdAt,
                recordedBy: payment.recordedBy ? `${payment.recordedBy.firstName} ${payment.recordedBy.lastName}` : 'System'
            }
        };

        res.json({ success: true, data: receiptPayload });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    List Payments
// @route   GET /api/cashier/payments
// @access  Private (Cashier)
exports.getPayments = async (req, res) => {
    try {
        const { from, to, method, invoiceId } = req.query;

        const query = {
            tenantId: req.user.tenantId,
            branchId: req.user.branchId
        };

        if (invoiceId) query.invoiceId = invoiceId;
        if (method) query.method = method;
        
        if (from || to) {
            query.createdAt = {};
            if (from) query.createdAt.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                query.createdAt.$lte = toDate;
            }
        }

        const payments = await Payment.find(query)
            .sort({ createdAt: -1 })
            .limit(100)
            .populate('invoiceId', 'balance totalAmount')
            .populate('recordedBy', 'firstName lastName');

        res.json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Reverse Payment
// @route   POST /api/cashier/payments/:id/reverse
// @access  Private (Cashier)
exports.reversePayment = async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason) return res.status(400).json({ success: false, message: 'Reason is required for reversal.' });

        const { payment, reversal } = await reverseInvoicePayment({
            tenantId: req.user.tenantId,
            branchId: req.user.branchId,
            paymentId: req.params.id,
            reason,
            recordedBy: req.user._id
        });

        // 5. Audit
        await logAction({
             tenantId: req.user.tenantId,
             branchId: req.user.branchId,
             actorUserId: req.user._id,
             actorRole: req.user.role || 'cashier',
             action: 'PAYMENT_REVERSED',
             entityType: 'Payment',
             entityId: payment._id,
             after: { reversalId: reversal._id, reason },
             ip: req.ip,
             userAgent: req.get('User-Agent')
        });

        res.json({ success: true, message: 'Reversal successful', data: reversal });

    } catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
};
