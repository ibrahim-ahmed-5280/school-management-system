const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    items: [{
        name: { type: String, required: true },
        amount: { type: Number, required: true }
    }],
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    balance: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'VOID'], 
        default: 'UNPAID' 
    },
    dueDate: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

// Avoid duplicate invoices for same student in same year/branch
invoiceSchema.index({ tenantId: 1, branchId: 1, studentId: 1, academicYearId: 1 }, { unique: true });
invoiceSchema.index({ tenantId: 1, branchId: 1, status: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
