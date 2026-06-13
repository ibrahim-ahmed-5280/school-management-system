const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    name: { type: String, required: true },
    code: String,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

subjectSchema.index({ tenantId: 1, branchId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
