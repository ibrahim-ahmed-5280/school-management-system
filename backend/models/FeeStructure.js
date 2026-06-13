const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    feeItems: [{
        name: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 }
    }],
    totalAmount: { type: Number, required: true, min: 0 },
    createdAt: { type: Date, default: Date.now }
});

// Unique fee structure per tenant, branch, class, and academic year
feeStructureSchema.index({ tenantId: 1, branchId: 1, classId: 1, academicYearId: 1 }, { unique: true });

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
