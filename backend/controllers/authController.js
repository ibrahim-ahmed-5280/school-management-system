const User = require('../models/User');
const Tenant = require('../models/Tenant');
const Branch = require('../models/Branch');
const jwt = require('jsonwebtoken');
const { normalizeRole } = require('../utils/rolePolicy');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const findTenantByDomain = async (tenantDomain) => {
    if (!tenantDomain) return null;
    return Tenant.findOne({ domain: String(tenantDomain).trim().toLowerCase() });
};

// @desc    Register a new Tenant and its Super Admin
// @route   POST /api/auth/register-tenant
// @access  Public
const registerTenant = async (req, res) => {
    const { schoolName, domain, adminName, email, password } = req.body;
    let tenant;
    let branch;
    let user;

    try {
        if (!schoolName || !domain || !adminName || !email || !password) {
            return res.status(400).json({ message: 'All registration fields are required' });
        }
        if (String(password).length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }

        const normalizedDomain = String(domain).trim().toLowerCase();
        const normalizedEmail = String(email).trim().toLowerCase();

        // 1. Check if tenant domain exists
        const tenantExists = await Tenant.findOne({ domain: normalizedDomain });
        if (tenantExists) return res.status(400).json({ message: 'Domain already registered' });

        // 2. Create Tenant
        tenant = await Tenant.create({
            name: schoolName,
            domain: normalizedDomain,
            plan: 'basic',
            isApproved: false
        });

        // 3. Create Default Branch
        branch = await Branch.create({
            tenantId: tenant._id,
            name: 'Main Branch',
            code: 'MAIN',
            isActive: true
        });

        // 4. Create Super Admin User
        user = await User.create({
            tenantId: tenant._id,
            branchId: branch._id, // Set default branch for initial admin
            name: adminName,
            email: normalizedEmail,
            passwordHash: password, // Will be hashed by pre-save hook
            role: 'super_admin',
            scope: 'tenant',
            isActive: true
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            tenantId: tenant._id,
            pending: true,
            message: 'Registration successful. Your account is pending platform approval.'
        });
    } catch (error) {
        await Promise.allSettled([
            user ? User.deleteOne({ _id: user._id }) : Promise.resolve(),
            branch ? Branch.deleteOne({ _id: branch._id }) : Promise.resolve(),
            tenant ? Tenant.deleteOne({ _id: tenant._id }) : Promise.resolve()
        ]);

        if (error?.code === 11000) {
            return res.status(409).json({ message: 'Domain or administrator account already exists' });
        }
        res.status(500).json({ message: 'Registration could not be completed. Please try again.' });
    }
};

// @desc    Authenticate User
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    const { email, username, password, requiredRoles, tenantDomain } = req.body;

    try {
        if (!password) return res.status(400).json({ message: 'Password is required' });

        const query = {};
        if (email) query.email = String(email).trim().toLowerCase();
        else if (username) query.username = String(username).trim().toUpperCase();
        else return res.status(400).json({ message: 'Email or Username is required' });

        if (requiredRoles && Array.isArray(requiredRoles)) {
            query.role = { $in: requiredRoles.map(normalizeRole) };
        }

        if (tenantDomain) {
            const tenant = await findTenantByDomain(tenantDomain);
            if (!tenant) return res.status(401).json({ message: 'Invalid credentials or institution domain' });
            query.tenantId = tenant._id;
        }

        const candidates = await User.find(query);
        const matches = [];
        for (const candidate of candidates) {
            if (await candidate.comparePassword(password)) matches.push(candidate);
        }

        if (matches.length > 1) {
            return res.status(409).json({
                message: 'Multiple accounts match these credentials. Enter your institution domain and try again.',
                code: 'TENANT_DOMAIN_REQUIRED'
            });
        }

        const user = matches[0];

        if (user) {
            if (!user.isActive) return res.status(403).json({ message: 'Account is inactive' });

            const tenant = user.tenantId ? await Tenant.findById(user.tenantId) : null;
            if (user.role !== 'platform_owner' && !tenant) {
                return res.status(403).json({ message: 'Account institution is unavailable' });
            }
            if (tenant && (!tenant.isActive || tenant.isApproved === false)) {
                return res.status(403).json({
                    message: tenant.isApproved === false
                        ? 'Your institution is pending platform approval.'
                        : 'Your institution is currently inactive.',
                    code: tenant.isApproved === false ? 'TENANT_PENDING_APPROVAL' : 'TENANT_INACTIVE'
                });
            }

            return res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                role: user.role,
                scope: user.scope,
                tenantId: user.tenantId,
                branchId: user.branchId,
                students: user.students || [],
                branding: tenant ? {
                    tenantName: tenant.name,
                    primaryColor: tenant.primaryColor,
                    secondaryColor: tenant.secondaryColor,
                    logoUrl: tenant.logoUrl
                } : null,
                token: generateToken(user._id)
            });
        }

        return res.status(401).json({ message: 'Invalid email or password' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerTenant, login };
