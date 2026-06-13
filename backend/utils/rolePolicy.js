const ROLE_SCOPE = Object.freeze({
    platform_owner: 'platform',
    super_admin: 'tenant',
    finance_director: 'tenant',
    parent: 'tenant',
    branch_admin: 'branch',
    teacher: 'branch',
    cashier: 'branch',
    registrar: 'branch',
    student: 'branch'
});

const TENANT_ADMIN_CREATABLE_ROLES = new Set([
    'super_admin',
    'finance_director',
    'parent',
    'branch_admin',
    'teacher',
    'cashier',
    'registrar'
]);

const BRANCH_ADMIN_CREATABLE_ROLES = new Set([
    'teacher',
    'cashier',
    'registrar'
]);

const normalizeRole = (value = '') => String(value).trim().toLowerCase();
const normalizeScope = (value = '') => String(value).trim().toLowerCase();

const getExpectedScope = (role) => ROLE_SCOPE[normalizeRole(role)] || null;

const assertValidRoleScope = (role, scope) => {
    const normalizedRole = normalizeRole(role);
    const normalizedScope = normalizeScope(scope);
    const expectedScope = getExpectedScope(normalizedRole);

    if (!expectedScope) {
        throw new Error('Unsupported user role');
    }
    if (normalizedScope !== expectedScope) {
        throw new Error(`Role ${normalizedRole} requires ${expectedScope} scope`);
    }

    return { role: normalizedRole, scope: normalizedScope };
};

module.exports = {
    BRANCH_ADMIN_CREATABLE_ROLES,
    ROLE_SCOPE,
    TENANT_ADMIN_CREATABLE_ROLES,
    assertValidRoleScope,
    getExpectedScope,
    normalizeRole,
    normalizeScope
};
