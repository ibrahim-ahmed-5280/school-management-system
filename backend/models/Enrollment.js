const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    status: { type: String, enum: ['Current', 'Active', 'active', 'Promoted', 'Transferred', 'Withdrawn'], default: 'Current' },
    createdAt: { type: Date, default: Date.now }
});

// A student should typically have only one active/current enrollment per academic year
// This index helps enforce isolation and lookups
enrollmentSchema.index({ tenantId: 1, branchId: 1, studentId: 1, academicYearId: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
