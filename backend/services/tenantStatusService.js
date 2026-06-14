const VALID_STATUSES = Object.freeze(['pending', 'active', 'rejected', 'suspended']);

const VALID_TRANSITIONS = Object.freeze({
    pending: ['active', 'rejected'],
    active: ['suspended'],
    rejected: [],
    suspended: ['active']
});

const resolveTenantStatus = (tenant = {}) => {
    if (VALID_STATUSES.includes(tenant.status)) {
        if (tenant.status === 'pending' && tenant.isApproved === true) {
            return tenant.isActive ? 'active' : 'suspended';
        }
        return tenant.status;
    }
    if (tenant.isApproved === false) return 'pending';
    return tenant.isActive ? 'active' : 'suspended';
};

const assertTenantTransition = (tenant, nextStatus) => {
    const currentStatus = resolveTenantStatus(tenant);
    const normalizedNext = String(nextStatus || '').trim().toLowerCase();

    if (!VALID_STATUSES.includes(normalizedNext)) {
        const error = new Error(`Invalid tenant status: ${nextStatus}`);
        error.statusCode = 400;
        throw error;
    }
    if (!VALID_TRANSITIONS[currentStatus].includes(normalizedNext)) {
        const error = new Error(`Tenant cannot transition from ${currentStatus} to ${normalizedNext}`);
        error.statusCode = 409;
        throw error;
    }
    return { currentStatus, nextStatus: normalizedNext };
};

const applyTenantStatus = (tenant, nextStatus, { reason = '', changedBy = null } = {}) => {
    const transition = assertTenantTransition(tenant, nextStatus);
    tenant.status = transition.nextStatus;
    tenant.statusHistory = tenant.statusHistory || [];
    tenant.statusHistory.push({
        status: transition.nextStatus,
        reason: String(reason || '').trim() || undefined,
        changedBy: changedBy || undefined,
        changedAt: new Date()
    });
    return transition;
};

module.exports = {
    VALID_STATUSES,
    VALID_TRANSITIONS,
    applyTenantStatus,
    assertTenantTransition,
    resolveTenantStatus
};
