const AuditLog = require('../models/AuditLog');

/**
 * Logs a sensitive action to the AuditLog collection.
 */
const logActivity = async (args) => {
    try {
        const {
            req,
            action,
            entityType,
            entityId = null,
            before = null,
            after = null,
            tenantId = null,
            branchId = null
        } = args || {};

        if (!action || !entityType) {
            console.warn('[AUDIT] logActivity skipped: missing action/entityType');
            return;
        }

        // Extremely safe extraction of IDs
        const finalTenantId = tenantId || (req && req.tenantId) || (req && req.user && req.user.tenantId) || null;
        const finalBranchId = branchId || (req && req.branchId) || (req && req.user && req.user.branchId) || null;

        if (!finalTenantId) {
            console.warn('[AUDIT] logActivity skipped: no tenant context found');
            return;
        }

        const actorUserId = (req && req.user && req.user._id) || (args.userId) || null;
        const actorRole = (req && req.user && req.user.role) || (args.role) || 'system';

        // SAFETY: If actorUserId is required by schema, we MUST have it. 
        // If it's a system action, we might need a dummy ID or make it optional in schema.
        // For now, let's just log what we have.
        
        await AuditLog.create({
            tenantId: finalTenantId,
            branchId: finalBranchId,
            actorUserId: actorUserId,
            actorRole: actorRole,
            action: action,
            entityType: entityType,
            entityId: entityId,
            before: before,
            after: after,
            ip: req ? (req.ip || req.headers?.['x-forwarded-for'] || req.connection?.remoteAddress) : '127.0.0.1',
            userAgent: req ? req.headers?.['user-agent'] : 'system'
        });
    } catch (error) {
        console.error('[AUDIT] Logging Error:', error.message);
    }
};

module.exports = { logActivity };
