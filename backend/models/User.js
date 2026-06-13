const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { getExpectedScope, normalizeRole, normalizeScope } = require('../utils/rolePolicy');

const userSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: function() { return this.role !== 'platform_owner'; } },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: function() { return this.scope === 'branch'; } },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }, // Nullable for non-students
    name: { type: String, required: true },
    email: { 
        type: String, 
        trim: true,
        lowercase: true,
        required: function() { return this.role !== 'student'; } // Email optional for students
    },
    username: { type: String, trim: true, uppercase: true }, // Used as login identifier for students (studentCode)
    passwordHash: { type: String, required: true, minlength: 8 },
    role: { 
        type: String, 
        enum: ['super_admin', 'finance_director', 'branch_admin', 'teacher', 'cashier', 'registrar', 'platform_owner', 'student', 'parent'], 
        required: true 
    },
    scope: { type: String, enum: ['tenant', 'branch', 'platform'], required: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    employmentInfo: {
        basicSalary: { type: Number, default: 0 },
        allowance: { type: Number, default: 0 },
        deductions: { type: Number, default: 0 }
    },
    mustChangePassword: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

userSchema.pre('validate', function() {
    this.role = normalizeRole(this.role);
    this.scope = normalizeScope(this.scope);

    const expectedScope = getExpectedScope(this.role);
    if (!expectedScope) {
        this.invalidate('role', 'Unsupported user role');
        return;
    }
    if (this.scope !== expectedScope) {
        this.invalidate('scope', `Role ${this.role} requires ${expectedScope} scope`);
    }
    if (expectedScope === 'branch' && !this.branchId) {
        this.invalidate('branchId', `Role ${this.role} requires a branch`);
    }
    if (this.role === 'platform_owner' && (this.tenantId || this.branchId)) {
        this.invalidate('tenantId', 'Platform owners cannot belong to a tenant or branch');
    }
});

// Enforce uniqueness
userSchema.index({ tenantId: 1, email: 1 }, { 
    unique: true, 
    partialFilterExpression: { email: { $type: 'string' } } 
});
userSchema.index({ tenantId: 1, username: 1 }, { 
    unique: true, 
    partialFilterExpression: { username: { $type: 'string' } } 
});

// Password hashing middleware
userSchema.pre('save', async function() {
    if (!this.isModified('passwordHash')) return;
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
