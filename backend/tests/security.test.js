const test = require('node:test');
const assert = require('node:assert/strict');
const {
    assertValidRoleScope,
    BRANCH_ADMIN_CREATABLE_ROLES,
    TENANT_ADMIN_CREATABLE_ROLES
} = require('../utils/rolePolicy');
const { generateTemporaryPassword } = require('../utils/passwords');

test('role policy enforces fixed scopes', () => {
    assert.deepEqual(assertValidRoleScope('teacher', 'branch'), { role: 'teacher', scope: 'branch' });
    assert.throws(() => assertValidRoleScope('teacher', 'tenant'), /requires branch scope/);
    assert.throws(() => assertValidRoleScope('platform_owner', 'tenant'), /requires platform scope/);
});

test('administrators cannot provision platform owners', () => {
    assert.equal(TENANT_ADMIN_CREATABLE_ROLES.has('platform_owner'), false);
    assert.equal(BRANCH_ADMIN_CREATABLE_ROLES.has('platform_owner'), false);
    assert.equal(BRANCH_ADMIN_CREATABLE_ROLES.has('super_admin'), false);
});

test('temporary passwords are strong and non-deterministic', () => {
    const first = generateTemporaryPassword();
    const second = generateTemporaryPassword();
    assert.ok(first.length >= 12);
    assert.notEqual(first, second);
    assert.match(first, /[!]/);
});
