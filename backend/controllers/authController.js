const User = require('../models/User');
const Tenant = require('../models/Tenant');
const jwt = require('jsonwebtoken');
const { normalizeRole } = require('../utils/rolePolicy');
const { getEffectivePermissions } = require('../utils/permissions');
const Plan = require('../models/Plan');
const PlatformSetting = require('../models/PlatformSetting');
const { limitsFromPlan } = require('../services/planLimitService');
const { resolveTenantStatus } = require('../services/tenantStatusService');
const { logActivity } = require('../utils/logger');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const findTenantByDomain = async (tenantDomain) => {
    if (!tenantDomain) return null;
    return Tenant.findOne({ domain: String(tenantDomain).trim().toLowerCase() });
};

const buildSessionPayload = (user, tenant = null) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
    scope: user.scope,
    tenantId: user.tenantId,
    branchId: user.branchId,
    authorizedBranchIds: user.authorizedBranchIds || [],
    students: user.students || [],
    mustChangePassword: Boolean(user.mustChangePassword),
    permissions: getEffectivePermissions(user),
    billing: tenant ? {
        billingCycle: tenant.subscription?.billingCycle || 'monthly',
        subscriptionStatus: tenant.subscription?.status || 'pending',
        currentPeriodEnd: tenant.subscription?.currentPeriodEnd || null,
        nextBillingDate: tenant.subscription?.nextBillingDate || null,
        gracePeriodEndsAt: tenant.subscription?.gracePeriodEndsAt || null
    } : null,
    branding: tenant ? {
        tenantName: tenant.name,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        logoUrl: tenant.logoUrl
    } : null
});

// @desc    Register a new Tenant and its Super Admin
// @route   POST /api/auth/register-tenant
// @access  Public
const registerTenant = async (req, res) => {
    const { schoolName, domain, adminName, email, password } = req.body;
    let tenant;
    let user;

    try {
        if (!schoolName || !domain || !adminName || !email || !password) {
            return res.status(400).json({ message: 'All registration fields are required' });
        }
        if (String(password).length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }

        const settings = await PlatformSetting.findOne().lean();
        if (settings?.isRegistrationEnabled === false) {
            return res.status(403).json({
                message: 'School registration is currently disabled. Please contact platform support.',
                code: 'REGISTRATION_DISABLED'
            });
        }

        const normalizedDomain = String(domain).trim().toLowerCase();
        const normalizedEmail = String(email).trim().toLowerCase();
        const requestedPlan = String(req.body.plan || settings?.defaultPlan || 'basic').trim().toLowerCase();
        const plan = await Plan.findOne({ slug: requestedPlan, isActive: true }).lean();
        if (!plan) return res.status(400).json({ message: 'Selected subscription plan is not active or available' });

        // 1. Check if tenant domain exists
        const tenantExists = await Tenant.findOne({ domain: normalizedDomain });
        if (tenantExists) return res.status(400).json({ message: 'Domain already registered' });

        // 2. Create Tenant
        tenant = await Tenant.create({
            name: schoolName,
            domain: normalizedDomain,
            plan: plan.slug,
            status: 'pending',
            isActive: false,
            isApproved: false,
            subscriptionLimits: limitsFromPlan(plan),
            billingContactEmail: normalizedEmail,
            subscription: {
                billingCycle: ['monthly', 'yearly'].includes(req.body.billingCycle)
                    ? req.body.billingCycle
                    : (['monthly', 'yearly'].includes(plan.billingCycle) ? plan.billingCycle : 'monthly'),
                status: 'pending'
            },
            statusHistory: [{ status: 'pending', reason: 'Public school registration submitted' }]
        });

        // 3. Create Super Admin User. The Main Branch is created when the platform approves the tenant.
        user = await User.create({
            tenantId: tenant._id,
            name: adminName,
            email: normalizedEmail,
            passwordHash: password, // Will be hashed by pre-save hook
            role: 'super_admin',
            scope: 'tenant',
            permissionProfile: 'default_super_admin',
            isActive: true
        });

        await logActivity({
            action: 'TENANT_REGISTRATION_SUBMITTED',
            entityType: 'Tenant',
            entityId: tenant._id.toString(),
            scope: 'platform',
            userId: user._id,
            role: user.role,
            user: user.name,
            actorEmail: user.email,
            after: { name: tenant.name, domain: tenant.domain, plan: tenant.plan, status: tenant.status },
            req
        });

        // Send email asynchronously
        const { sendPlatformEmail } = require('../utils/emailHelper');
        sendPlatformEmail('registration_pending', tenant, user).catch(err => console.error(`[SMTP Email Helper] Pending registration email failed: ${err.message}`));

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            tenantId: tenant._id,
            pending: true,
            message: 'Registration submitted. Your school is pending platform approval.'
        });
    } catch (error) {
        await Promise.allSettled([
            user ? User.deleteOne({ _id: user._id }) : Promise.resolve(),
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
            if (tenant && resolveTenantStatus(tenant) !== 'active') {
                const status = resolveTenantStatus(tenant);
                const statusMessages = {
                    pending: 'Your school registration is pending platform approval.',
                    rejected: 'Your school registration was rejected. Contact platform support.',
                    suspended: 'Your school account is suspended. Contact platform support.'
                };
                return res.status(403).json({
                    message: statusMessages[status] || 'Your school account is suspended. Contact platform support.',
                    code: `TENANT_${status.toUpperCase()}`
                });
            }

            return res.json({
                ...buildSessionPayload(user, tenant),
                token: generateToken(user._id)
            });
        }

        return res.status(401).json({ message: 'Invalid email or password.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Refresh the authenticated user's session and effective permissions
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const tenant = req.user.tenantId
            ? await Tenant.findById(req.user.tenantId).select('name primaryColor secondaryColor logoUrl')
            : null;

        return res.json(buildSessionPayload(req.user, tenant));
    } catch (error) {
        return res.status(500).json({ message: 'Could not refresh the authenticated session' });
    }
};

module.exports = { registerTenant, login, getMe };
