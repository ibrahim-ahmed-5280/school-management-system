const mongoose = require('mongoose');

const gradingPolicySchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, unique: true },
    rules: [{
        min: { type: Number, required: true },
        max: { type: Number, required: true },
        grade: { type: String, required: true }
    }],
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GradingPolicy', gradingPolicySchema);
