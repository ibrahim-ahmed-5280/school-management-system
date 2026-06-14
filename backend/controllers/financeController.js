const asyncHandler = require('express-async-handler');
const FeeStructure = require('../models/FeeStructure');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const FinancePolicy = require('../models/FinancePolicy');
const Branch = require('../models/Branch');
const Class = require('../models/Class');
const AcademicYear = require('../models/AcademicYear');
const Student = require('../models/Student');
const Enrollment = require('../models/Enrollment');
const { logActivity } = require('../utils/logger');
const { generateBulkInvoices, getRevenueReport } = require('../services/financeService');
const mongoose = require('mongoose');

const validateFinanceContext = async ({ tenantId, branchId, classId, academicYearId, studentId }) => {
    if (branchId) {
        const b = await Branch.findOne({ _id: branchId, tenantId });
        if (!b) {
            const error = new Error('Access denied for this finance resource.');
            error.status = 403;
            throw error;
        }
    }
    if (classId) {
        const c = await Class.findOne({ _id: classId, tenantId });
        if (!c) {
            const error = new Error('Access denied for this finance resource.');
            error.status = 403;
            throw error;
        }
    }
    if (academicYearId) {
        const y = await AcademicYear.findOne({ _id: academicYearId, tenantId });
        if (!y) {
            const error = new Error('Access denied for this finance resource.');
            error.status = 403;
            throw error;
        }
    }
    if (studentId) {
        const s = await Student.findOne({ _id: studentId, tenantId });
        if (!s) {
            const error = new Error('Access denied for this finance resource.');
            error.status = 403;
            throw error;
        }
    }

    const checks = [];
    if (branchId) checks.push(Branch.exists({ _id: branchId, tenantId, isActive: true }));
    if (classId) checks.push(Class.exists({ _id: classId, tenantId, ...(branchId ? { branchId } : {}) }));
    if (academicYearId) checks.push(AcademicYear.exists({ _id: academicYearId, tenantId }));
    if (studentId) checks.push(Student.exists({ _id: studentId, tenantId, ...(branchId ? { branchId } : {}) }));
    const results = await Promise.all(checks);
    if (results.some((result) => !result)) {
        const error = new Error('One or more finance context values are invalid for this institution');
        error.status = 400;
        throw error;
    }
};

// ==========================================
// A) Fee Structure Management
// ==========================================

const createFeeStructure = asyncHandler(async (req, res) => {
    const { branchId, classId, academicYearId, feeItems } = req.body;

    if (!branchId || !classId || !academicYearId || !feeItems) {
        res.status(400);
        throw new Error('Please provide all required fields (branchId, classId, academicYearId, feeItems)');
    }
    if (!Array.isArray(feeItems) || feeItems.length === 0 || feeItems.some((item) => !item.name || Number(item.amount) < 0)) {
        res.status(400);
        throw new Error('feeItems must contain valid names and non-negative amounts');
    }
    await validateFinanceContext({ tenantId: req.tenantId, branchId, classId, academicYearId });

    const totalAmount = feeItems.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);

    try {
        const feeStructure = await FeeStructure.create({
            tenantId: req.tenantId,
            branchId,
            classId,
            academicYearId,
            feeItems,
            totalAmount
        });

        await logActivity({
            req,
            action: 'FEE_STRUCTURE_CREATED',
            entityType: 'FeeStructure',
            entityId: feeStructure._id.toString(),
            after: feeStructure
        });

        res.status(201).json({ success: true, data: feeStructure });
    } catch (error) {
        if (error.code === 11000) {
            res.status(400);
            throw new Error('A fee structure already exists for this branch, class, and academic year');
        }
        res.status(400);
        throw new Error(error.message);
    }
});

const getFeeStructures = asyncHandler(async (req, res) => {
    const { branchId, classId, academicYearId } = req.query;
    const query = { tenantId: req.tenantId };
    if (branchId) query.branchId = branchId;
    if (classId) query.classId = classId;
    if (academicYearId) query.academicYearId = academicYearId;

    const structures = await FeeStructure.find(query)
        .populate('branchId', 'name')
        .populate('classId', 'name')
        .populate('academicYearId', 'name');
    
    res.json({ success: true, data: structures });
});

const getFeeStructureById = asyncHandler(async (req, res) => {
    const structure = await FeeStructure.findOne({ _id: req.params.id, tenantId: req.tenantId })
        .populate('branchId', 'name')
        .populate('classId', 'name')
        .populate('academicYearId', 'name');

    if (!structure) {
        res.status(403);
        throw new Error('Access denied for this finance resource.');
    }
    res.json({ success: true, data: structure });
});

const updateFeeStructure = asyncHandler(async (req, res) => {
    const structure = await FeeStructure.findOne({ _id: req.params.id, tenantId: req.tenantId });

    if (!structure) {
        res.status(403);
        throw new Error('Access denied for this finance resource.');
    }

    const { feeItems } = req.body;
    const before = JSON.parse(JSON.stringify(structure));
    
    if (feeItems) {
        structure.feeItems = feeItems;
        structure.totalAmount = feeItems.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
    }

    await structure.save();

    await logActivity({
        req,
        action: 'FEE_STRUCTURE_UPDATED',
        entityType: 'FeeStructure',
        entityId: structure._id.toString(),
        before,
        after: structure
    });

    res.json({ success: true, data: structure });
});

const deleteFeeStructure = asyncHandler(async (req, res) => {
    const structure = await FeeStructure.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!structure) {
        res.status(403);
        throw new Error('Access denied for this finance resource.');
    }

    await structure.deleteOne();

    await logActivity({
        req,
        action: 'FEE_STRUCTURE_DELETED',
        entityType: 'FeeStructure',
        entityId: req.params.id
    });

    res.json({ success: true, message: 'Fee structure removed' });
});

// ==========================================
// B) Invoice Governance & Policies
// ==========================================

const getFinancePolicies = asyncHandler(async (req, res) => {
    let policy = await FinancePolicy.findOne({ tenantId: req.tenantId });
    if (!policy) {
        policy = await FinancePolicy.create({ tenantId: req.tenantId });
    }
    res.json({ success: true, data: policy });
});

const updateFinancePolicies = asyncHandler(async (req, res) => {
    const { autoInvoiceMode, isEnabled } = req.body;
    let policy = await FinancePolicy.findOne({ tenantId: req.tenantId });

    if (!policy) {
        policy = new FinancePolicy({ tenantId: req.tenantId });
    }

    const before = JSON.parse(JSON.stringify(policy));
    if (autoInvoiceMode) policy.autoInvoiceMode = autoInvoiceMode;
    if (isEnabled !== undefined) policy.isEnabled = isEnabled;

    await policy.save();

    await logActivity({
        req,
        action: 'FINANCE_POLICY_UPDATED',
        entityType: 'FinancePolicy',
        entityId: policy._id.toString(),
        before,
        after: policy
    });

    res.json({ success: true, data: policy });
});

const triggerBulkInvoices = asyncHandler(async (req, res) => {
    const { branchId, academicYearId, classId, studentId, dueDate } = req.body;

    if (!academicYearId) {
        res.status(400);
        throw new Error('academicYearId is required for invoice generation');
    }

    // Check target: must have classId or studentId. If both are missing, fail.
    if (!classId && !studentId) {
        res.status(400);
        throw new Error('Invalid invoice generation target.');
    }

    // Validate dueDate if provided
    if (dueDate && isNaN(Date.parse(dueDate))) {
        res.status(400);
        throw new Error('Invalid due date format.');
    }

    try {
        await validateFinanceContext({ tenantId: req.tenantId, branchId, classId, academicYearId, studentId });
    } catch (error) {
        if (error.status === 403) {
            throw error; // keep 403 Access denied
        }
        res.status(400);
        throw new Error('Invalid invoice generation target.');
    }

    const result = await generateBulkInvoices({
        tenantId: req.tenantId,
        branchId,
        academicYearId,
        classId,
        studentId,
        dueDate
    });

    await logActivity({
        req,
        action: 'INVOICES_GENERATED_BULK',
        entityType: 'Invoice',
        details: { ...req.body, ...result }
    });

    res.json({ success: true, ...result });
});

// ==========================================
// C) Invoice Review
// ==========================================

const getInvoices = asyncHandler(async (req, res) => {
    const { branchId, academicYearId, status, studentId } = req.query;
    const query = { tenantId: req.tenantId };
    if (branchId) query.branchId = branchId;
    if (academicYearId) query.academicYearId = academicYearId;
    if (status) query.status = status;
    if (studentId) query.studentId = studentId;

    const invoices = await Invoice.find(query)
        .populate('studentId', 'firstName lastName admissionNumber')
        .populate('branchId', 'name')
        .populate('academicYearId', 'name')
        .sort({ createdAt: -1 });

    res.json({ success: true, data: invoices });
});

const getInvoiceById = asyncHandler(async (req, res) => {
    const invoice = await Invoice.findOne({ _id: req.params.id, tenantId: req.tenantId })
        .populate('studentId', 'firstName lastName admissionNumber guardianInfo')
        .populate('branchId', 'name address phone email logoUrl receiptFooter')
        .populate('academicYearId', 'name');

    if (!invoice) {
        res.status(403);
        throw new Error('Access denied for this finance resource.');
    }

    // Fetch payments for this invoice under the same tenant
    const payments = await Payment.find({ invoiceId: invoice._id, tenantId: req.tenantId })
        .populate('recordedBy', 'name')
        .sort({ createdAt: -1 });

    const formattedPayments = payments.map(p => ({
        amount: p.amount,
        method: p.method,
        reference: p.reference,
        status: p.status,
        recordedBy: p.recordedBy ? p.recordedBy.name : 'System',
        date: p.createdAt
    }));

    const invoiceObj = invoice.toObject();
    invoiceObj.payments = formattedPayments;

    res.json({ success: true, data: invoiceObj });
});

// ==========================================
// D) Payment Oversight
// ==========================================

const getPayments = asyncHandler(async (req, res) => {
    const { branchId, from, to, method } = req.query;
    const query = { tenantId: req.tenantId };
    if (branchId) query.branchId = branchId;
    if (method) query.method = method;
    if (from || to) {
        query.createdAt = {};
        if (from) query.createdAt.$gte = new Date(from);
        if (to) query.createdAt.$lte = new Date(to);
    }

    const payments = await Payment.find(query)
        .populate({
            path: 'invoiceId',
            populate: { path: 'studentId', select: 'firstName lastName admissionNumber' }
        })
        .populate('recordedBy', 'name')
        .sort({ createdAt: -1 });

    res.json({ success: true, data: payments });
});

const getPaymentsSummary = asyncHandler(async (req, res) => {
    const { branchId, academicYearId, from, to } = req.query;
    const match = { tenantId: new mongoose.Types.ObjectId(req.tenantId) };
    if (branchId) match.branchId = new mongoose.Types.ObjectId(branchId);
    if (academicYearId) match.academicYearId = new mongoose.Types.ObjectId(academicYearId);
    if (from || to) {
        match.createdAt = {};
        if (from) match.createdAt.$gte = new Date(from);
        if (to) match.createdAt.$lte = new Date(to);
    }

    const summary = await Payment.aggregate([
        { $match: match },
        { 
            $group: { 
                _id: '$method', 
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            } 
        }
    ]);

    const branchTotals = await Payment.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$branchId',
                total: { $sum: '$amount' }
            }
        }
    ]);

    res.json({ success: true, data: { byMethod: summary, byBranch: branchTotals } });
});

const getOutstandingBalances = asyncHandler(async (req, res) => {
    const { branchId, academicYearId } = req.query;
    const match = { tenantId: new mongoose.Types.ObjectId(req.tenantId), status: { $ne: 'PAID' } };
    if (branchId) match.branchId = new mongoose.Types.ObjectId(branchId);
    if (academicYearId) match.academicYearId = new mongoose.Types.ObjectId(academicYearId);

    const outstanding = await Invoice.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                totalOutstanding: { $sum: '$balance' },
                count: { $sum: 1 }
            }
        }
    ]);

    const findQuery = { tenantId: req.tenantId, status: { $ne: 'PAID' } };
    if (branchId) findQuery.branchId = branchId;
    if (academicYearId) findQuery.academicYearId = academicYearId;

    const debtors = await Invoice.find(findQuery)
        .sort({ balance: -1 })
        .limit(10)
        .populate('studentId', 'firstName lastName admissionNumber')
        .populate('branchId', 'name')
        .populate('academicYearId', 'name');

    const formattedDebtors = [];
    for (const d of debtors) {
        let className = '-';
        if (d.studentId) {
            const enrollment = await Enrollment.findOne({
                tenantId: req.tenantId,
                studentId: d.studentId._id,
                academicYearId: d.academicYearId._id
            }).populate('classId', 'name');
            if (enrollment && enrollment.classId) {
                className = enrollment.classId.name;
            }
        }
        formattedDebtors.push({
            studentName: d.studentId ? `${d.studentId.firstName} ${d.studentId.lastName}` : 'Unknown Student',
            admissionNumber: d.studentId ? d.studentId.admissionNumber : '-',
            branchName: d.branchId ? d.branchId.name : '-',
            className,
            balance: d.balance,
            oldestDueDate: d.dueDate || d.createdAt,
            count: 1
        });
    }

    res.json({ 
        success: true, 
        data: { 
            totalOutstanding: outstanding[0]?.totalOutstanding || 0, 
            count: outstanding[0]?.count || 0,
            debtors: formattedDebtors
        } 
    });
});

// ==========================================
// E) Receipts & Branding
// ==========================================

const getReceiptBranding = asyncHandler(async (req, res) => {
    const branch = await Branch.findOne({ _id: req.params.branchId, tenantId: req.tenantId });
    if (!branch) {
        res.status(403);
        throw new Error('Access denied for this finance resource.');
    }

    res.json({
        success: true,
        data: {
            branchId: branch._id,
            name: branch.name,
            branchName: branch.name,
            address: branch.address || '',
            phone: branch.phone || '',
            logoUrl: branch.logoUrl || '',
            receiptFooter: branch.receiptFooter || ''
        }
    });
});

// ==========================================
// F) Reports
// ==========================================

const getRevenueReportController = asyncHandler(async (req, res) => {
    const { branchId, academicYearId, groupBy } = req.query;
    const report = await getRevenueReport({
        tenantId: req.tenantId,
        branchId,
        academicYearId,
        groupBy
    });

    res.json({ success: true, data: report });
});

module.exports = {
    createFeeStructure, getFeeStructures, getFeeStructureById, updateFeeStructure, deleteFeeStructure,
    getFinancePolicies, updateFinancePolicies, triggerBulkInvoices,
    getInvoices, getInvoiceById,
    getPayments, getPaymentsSummary, getOutstandingBalances,
    getReceiptBranding,
    getRevenueReport: getRevenueReportController
};
