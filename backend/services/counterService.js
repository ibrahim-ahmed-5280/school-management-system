const Counter = require('../models/Counter');

/**
 * Generates an incremental student code like STD-001, STD-002...
 */
exports.getNextStudentCode = async (tenantId, branchId) => {
    const counter = await Counter.findOneAndUpdate(
        { tenantId, branchId, key: 'studentCode' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    const paddedSeq = counter.seq.toString().padStart(3, '0');
    return `STD-${paddedSeq}`;
};
