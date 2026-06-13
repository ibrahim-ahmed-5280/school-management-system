const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    admissionNumber: { type: String, required: true },
    studentCode: { type: String, required: true }, // Incremental ID like STD-001
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    DOB: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    guardianInfo: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        email: { type: String },
        relationship: { type: String }
    },
    status: { type: String, enum: ['Active', 'Inactive', 'Transferred', 'Graduated'], default: 'Active' },
    createdAt: { type: Date, default: Date.now }
});

// Enforce uniqueness
studentSchema.index({ tenantId: 1, admissionNumber: 1 }, { unique: true });
studentSchema.index({ tenantId: 1, branchId: 1, studentCode: 1 }, { unique: true });
studentSchema.index({ tenantId: 1, branchId: 1 });

module.exports = mongoose.model('Student', studentSchema);
