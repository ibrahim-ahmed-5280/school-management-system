# User Permission Management Update Plan

This document is an approval plan before implementation. It explains how to upgrade the system from fixed role-only access into a more realistic permission-based school platform.

The goal is to let administrators manage what each user can see and what each user can do, while keeping platform, tenant, branch, staff, student, and parent data separated safely.

## 1. Main Design Decision

The system should use both:

- Role: the user's main job title or account type.
- Permissions: the exact actions and screens the user may access.

Example:

```text
Role: teacher
Permissions:
  attendance.view
  attendance.create
  results.enter
  results.view
Denied:
  exams.manage
  grading.manage
```

This gives realistic control:

- A normal teacher can take attendance and enter results.
- A senior teacher can also manage exam templates.
- A cashier can receive payments.
- A senior cashier can reverse payments.
- A branch admin can manage classes but may not see payroll.

## 2. Account Layers

The system has four access layers.

### Platform layer

Used by:

- `platform_owner`

Purpose:

- Manage the SaaS platform itself.
- Manage schools/tenants.
- Manage plans.
- Monitor platform health.
- View platform audit logs.

Important rule:

- Platform owner should not behave like a school super admin.
- Platform owner should not open full school student/result/payment records unless a future support-impersonation feature is deliberately added and audited.

### Tenant layer

Used by:

- `super_admin`
- `finance_director`
- `parent`

Purpose:

- Manage one school/institution.
- School super admin controls branches, users, academic years, school branding, reports, promotions, and transfers.
- Finance director controls school finance.
- Parent sees linked children only.

### Branch layer

Used by:

- `branch_admin`
- `registrar`
- `cashier`
- `teacher`
- `student`

Purpose:

- Manage or access data for one branch.
- Branch admin controls branch setup and branch operations.
- Staff users perform their assigned jobs.
- Student sees own data only.

### Public layer

Used by:

- Visitors
- New school applicants

Purpose:

- Landing page.
- School registration.
- Login pages.

## 3. Implementation Order

The update should be implemented in this order:

1. Platform owner permissions and platform access boundary.
2. School super admin permission management.
3. Branch admin permission management.
4. Finance director permissions.
5. Registrar permissions.
6. Cashier permissions.
7. Teacher permissions.
8. Student and parent read-only boundaries.
9. Audit, testing, and customer-demo polish.

This order is important because school and branch permissions depend on the platform and tenant boundaries being clear first.

## 4. Phase 1 - Platform Owner

### Current platform owner access

The platform owner currently sees:

- Dashboard
- Tenants
- Plans
- Audit Logs
- Monitoring
- Settings

### Target platform owner access

Platform owner should see:

- Platform dashboard
- Tenant list
- Tenant detail summary
- Tenant approval/status controls
- Plan management
- Platform settings
- Platform SMTP settings
- Platform health and monitoring
- Platform audit logs

Platform owner should not see by default:

- Full student records inside a school
- Full result records inside a school
- Full attendance records inside a school
- Full payment transaction details inside a school
- Staff payroll inside a school

### Platform permissions

Add platform permission keys:

```text
platform.dashboard.view
platform.tenants.view
platform.tenants.create
platform.tenants.approve
platform.tenants.activate
platform.tenants.deactivate
platform.tenants.plan.update
platform.plans.view
platform.plans.create
platform.plans.update
platform.plans.delete
platform.audit.view
platform.monitoring.view
platform.settings.view
platform.settings.update
platform.smtp.test
```

### Platform UI updates

Update platform sidebar to show menu items only when the platform owner has permission:

- Dashboard requires `platform.dashboard.view`
- Tenants requires `platform.tenants.view`
- Plans requires `platform.plans.view`
- Audit Logs requires `platform.audit.view`
- Monitoring requires `platform.monitoring.view`
- Settings requires `platform.settings.view`

### Platform backend updates

Add permission checks to platform routes:

- `GET /api/platform/dashboard`
- `GET /api/platform/tenants`
- `POST /api/platform/tenants`
- `PATCH /api/platform/tenants/:id/status`
- `PUT /api/platform/tenants/:id/plan`
- `GET /api/platform/plans`
- `POST /api/platform/plans`
- `PUT /api/platform/plans/:id`
- `DELETE /api/platform/plans/:id`
- `GET /api/platform/audit-logs`
- `GET /api/platform/health`
- `GET /api/platform/settings`
- `PUT /api/platform/settings`
- `POST /api/platform/settings/test-email`

### Platform owner management decision

For the first implementation, there should still be one powerful platform owner type.

Later optional feature:

- Add platform staff roles such as support agent, billing admin, and platform auditor.

## 5. Phase 2 - Permission Data Model

### User model update

Add fields to `backend/models/User.js`:

```js
permissions: {
  allow: [String],
  deny: [String]
},
permissionProfile: String,
lastPermissionUpdateAt: Date,
lastPermissionUpdateBy: ObjectId
```

Purpose:

- `allow`: permissions added specially for this user.
- `deny`: permissions removed specially from this user.
- `permissionProfile`: optional named profile such as `default_teacher`, `senior_teacher`, `read_only_cashier`.
- `lastPermissionUpdateAt`: audit support.
- `lastPermissionUpdateBy`: who changed permissions.

### Effective permissions

Effective permissions should be calculated as:

```text
default role permissions
+ user allow permissions
- user deny permissions
= effective permissions
```

Example:

```text
teacher default:
  attendance.view
  attendance.create
  results.enter
  results.view

teacher deny:
  results.enter

effective:
  attendance.view
  attendance.create
  results.view
```

### Backend permission files

Create:

```text
backend/utils/permissions.js
backend/middleware/permissions.js
```

`permissions.js` should contain:

- All permission keys.
- Default role permission map.
- Helper to calculate effective permissions.

`permissions.js` should not hard-code UI labels only. It should be backend-authoritative.

`permissions middleware` should contain:

```js
requirePermission('students.read')
requireAnyPermission(['payments.create', 'payments.manage'])
requireAllPermissions(['users.manage', 'permissions.manage'])
```

### API response update

Login response should include:

```js
permissions: [...]
```

Frontend can use this to hide or show menus.

Important:

- Frontend hiding is only for user experience.
- Backend permission middleware is the real security.

## 6. Phase 3 - School Super Admin

### Current school super admin access

School super admin currently sees:

- Dashboard
- Branding
- Branches
- Users
- Academic Years
- Reports
- Promotion
- Transfer

School super admin and finance director are now separate accounts. The school super admin does not access finance routes.

### Target school super admin access

School super admin should see:

- Dashboard
- Branding
- Branches
- Users
- User permissions
- Academic years
- Reports
- Promotion
- Transfer

School super admin should not normally see:

- Finance dashboard or finance transactions
- Platform plans
- Platform settings
- Platform monitoring
- Platform audit logs

### School super admin permissions

Add tenant permission keys:

```text
tenant.dashboard.view
tenant.branding.view
tenant.branding.update
tenant.branches.view
tenant.branches.create
tenant.branches.update
tenant.branches.activate
tenant.branches.deactivate
tenant.users.view
tenant.users.create
tenant.users.update
tenant.users.activate
tenant.users.deactivate
tenant.users.permissions.view
tenant.users.permissions.update
tenant.academicYears.view
tenant.academicYears.create
tenant.academicYears.setCurrent
tenant.reports.view
tenant.promotions.run
tenant.transfers.run
tenant.audit.view
```

### Tenant users page updates

Update `Tenant > Users` to include:

- View user list.
- Create user.
- Edit user profile.
- Suspend/reactivate user.
- Reset user password.
- Open permissions modal.
- View effective permissions.
- Search/filter users by role, branch, status.

### Missing backend routes to add

The frontend currently references some user actions that are not complete on the backend.

Add:

```text
GET    /api/tenant/users/:userId
PUT    /api/tenant/users/:userId
PATCH  /api/tenant/users/:userId/status
PATCH  /api/tenant/users/:userId/password
GET    /api/tenant/users/:userId/permissions
PUT    /api/tenant/users/:userId/permissions
GET    /api/tenant/permissions/catalog
```

### School admin permission management rules

School super admin can manage:

- Finance director
- Branch admin
- Registrar
- Cashier
- Teacher
- Parent

School super admin cannot manage:

- Platform owner permissions.
- Other tenant data.

School super admin should be prevented from:

- Removing their own final `tenant.users.permissions.update` permission if they are the only super admin.
- Suspending the last active super admin.
- Creating platform owners.

### Tenant audit requirement

Every permission change must create an audit log:

```text
USER_PERMISSION_UPDATED
USER_ACTIVATED
USER_DEACTIVATED
USER_PASSWORD_RESET
USER_ROLE_UPDATED
```

Audit details should include:

- Actor user
- Target user
- Old permissions
- New permissions
- Timestamp
- Tenant
- Branch if applicable

## 7. Phase 4 - Branch Admin

### Current branch admin access

Branch admin currently sees:

- Dashboard
- Branch profile
- Classes
- Timetable
- Staff management
- Leaves manager
- Payroll dashboard
- Students
- Promotions
- Teacher assignments
- Exams
- Results
- Student results
- Reports

### Design issue

Branch admin currently sees payroll by default. In a real school system, payroll is sensitive and should be separately controlled.

### Target branch admin access

Branch admin default should see:

- Branch dashboard
- Branch profile
- Classes
- Subjects
- Sections
- Timetable
- Staff management
- Students
- Teacher assignments
- Exams
- Results
- Reports

Optional permissions:

- Leaves manager
- Payroll dashboard
- Branch promotions
- Result export
- Staff salary fields

### Branch permissions

Add:

```text
branch.dashboard.view
branch.profile.view
branch.profile.update
branch.classes.view
branch.classes.create
branch.classes.update
branch.subjects.manage
branch.sections.manage
branch.timetable.view
branch.timetable.manage
branch.staff.view
branch.staff.create
branch.staff.update
branch.staff.activate
branch.staff.deactivate
branch.students.view
branch.students.detail
branch.promotions.run
branch.assignments.view
branch.assignments.manage
branch.exams.view
branch.exams.create
branch.exams.update
branch.exams.delete
branch.results.view
branch.results.export
branch.reports.view
hr.leaves.view
hr.leaves.review
payroll.view
payroll.generate
payroll.pay
```

### Branch admin UI updates

Update branch sidebar so menu items are permission-aware:

- Payroll only shows with `payroll.view`.
- Leaves Manager only shows with `hr.leaves.review`.
- Promotions only shows with `branch.promotions.run`.
- Teacher Assignments only shows with `branch.assignments.view`.
- Reports only shows with `branch.reports.view`.

### Branch staff permissions

Branch admin should only manage users inside their branch.

Branch admin can manage:

- Teacher
- Cashier
- Registrar

Branch admin cannot manage:

- Super admin
- Finance director
- Platform owner
- Staff from another branch

## 8. Phase 5 - Finance Director

### Current finance director access

Finance director sees:

- Finance dashboard
- Policies
- Fee structures
- Invoices
- Payments
- Reports
- Outstanding
- Receipt branding

### Target finance director permissions

Add:

```text
finance.dashboard.view
finance.policies.view
finance.policies.update
finance.feeStructures.view
finance.feeStructures.create
finance.feeStructures.update
finance.feeStructures.delete
finance.invoices.view
finance.invoices.generate
finance.invoices.detail
finance.payments.view
finance.payments.summary
finance.reports.view
finance.outstanding.view
finance.receiptBranding.view
finance.receiptBranding.update
finance.paymentReversals.approve
```

### Finance design rules

Recommended:

- Finance director can view all branches in the school.
- Finance director can generate invoices.
- Finance director can approve payment reversals.
- Finance director can edit finance policies.
- Finance director can manage fee structures.

Boundary:

- School super admin creates and manages the separate finance director account.
- School super admin does not receive finance permissions.
- Finance director does not receive school-admin permissions.

## 9. Phase 6 - Registrar

### Current registrar access

Registrar sees:

- Dashboard
- New Admission
- Students Directory
- Re-Enrollment
- Transfers

### Target registrar permissions

Add:

```text
registrar.dashboard.view
students.view
students.detail
students.create
students.update
students.password.reset
enrollments.create
transfers.branch.create
```

### Registrar design rules

Registrar default can:

- Admit students.
- Search students in their branch.
- View student details.
- Re-enroll students.
- Transfer students if allowed.

Optional:

- Some schools may allow registrar to update student profile.
- Some schools may deny registrar transfers and reserve transfer for school admin.

## 10. Phase 7 - Cashier

### Current cashier access

Cashier sees:

- Dashboard
- Invoice lookup
- Record payment
- Payment history
- Receipt

### Target cashier permissions

Add:

```text
cashier.dashboard.view
cashier.invoices.search
cashier.invoices.detail
cashier.payments.view
cashier.payments.create
cashier.payments.reverse
cashier.receipts.view
cashier.receipts.print
```

### Cashier design rules

Default cashier should:

- Search invoices.
- View invoice detail.
- Record payment.
- Print receipt.
- View own or branch payment history.

Payment reversal should not be default.

Recommended options:

- `cashier.payments.reverse` only for senior cashier.
- Or create reversal request and require finance director approval.

## 11. Phase 8 - Teacher

### Current teacher access

Teacher sees:

- Dashboard
- My Schedule
- Open Attendance
- Leaves Request
- Templates
- Categories
- Exams List
- Enter Results
- Results Viewer
- Grading Policy

### Design issue

Templates, categories, and grading policy may be too powerful for a normal teacher.

### Target teacher permissions

Add:

```text
teacher.dashboard.view
teacher.schedule.view
teacher.attendance.view
teacher.attendance.open
teacher.attendance.submit
teacher.leaves.create
teacher.examTemplates.view
teacher.examTemplates.manage
teacher.examCategories.view
teacher.examCategories.manage
teacher.exams.view
teacher.results.enter
teacher.results.update
teacher.results.view
teacher.results.export
teacher.gradingPolicy.view
teacher.gradingPolicy.manage
```

### Teacher default

Normal teacher default:

- Dashboard
- Schedule
- Attendance
- Leaves Request
- Exams List
- Enter Results
- Results Viewer
- Grading Policy view only

Senior teacher or exam coordinator:

- Manage templates
- Manage categories
- Manage grading policy
- Export results

### Teacher data boundary

Teacher must only access:

- Assigned classes
- Assigned subjects
- Assigned academic year context
- Students enrolled in assigned classes

This is already partly implemented with teacher assignment guards and should be kept.

## 12. Phase 9 - Student

### Current student access

Student sees:

- Dashboard
- My Results
- My Rank
- My Schedule
- Attendance
- Profile

### Target student permissions

Student permissions should remain mostly fixed and read-only:

```text
student.dashboard.view
student.results.view
student.rank.view
student.schedule.view
student.attendance.view
student.profile.view
student.password.change
```

### Student design rules

Student can only see:

- Own profile
- Own attendance
- Own schedule
- Own results
- Own rank

Student cannot:

- See other students
- Change academic records
- Change invoices/payments

## 13. Phase 10 - Parent

### Current parent access

Parent sees:

- Dashboard
- Grades and ranks
- Attendance
- Fees and invoices
- Notifications

### Target parent permissions

Parent permissions should remain mostly fixed and read-only:

```text
parent.dashboard.view
parent.students.view
parent.grades.view
parent.attendance.view
parent.invoices.view
parent.notifications.view
parent.notifications.markRead
```

### Parent design rules

Parent can only see:

- Students linked to the parent account.
- Grades for linked students.
- Attendance for linked students.
- Invoices for linked students.
- Parent notifications.

Parent cannot:

- See unrelated students.
- Edit academic records.
- Record payments.
- View staff data.

## 14. Permission Catalog

Create a permission catalog grouped by module.

Example structure:

```js
{
  key: 'students.create',
  label: 'Admit students',
  group: 'Students',
  description: 'Allows creating student admission records.',
  allowedRoles: ['super_admin', 'branch_admin', 'registrar']
}
```

The frontend should use this catalog to render permission checkboxes.

## 15. Frontend Permission Helper

Create:

```text
frontend/src/utils/permissions.js
frontend/src/components/auth/Can.jsx
```

Example usage:

```jsx
<Can permission="students.create">
  <button>New Admission</button>
</Can>
```

Also add:

```js
hasPermission(user, 'students.create')
hasAnyPermission(user, ['students.create', 'students.update'])
hasAllPermissions(user, ['users.manage', 'permissions.manage'])
```

## 16. Sidebar Updates

All sidebars should become permission-aware:

```text
PlatformLayout
TenantLayout
BranchSidebar
Sidebar finance layout
RegistrarLayout
CashierLayout
TeacherSidebar
StudentLayout
ParentLayout
```

Student and parent can stay mostly fixed but should still use permission helpers for consistency.

## 17. Backend Route Updates

Every route should have:

1. Authentication check.
2. Role/scope check where needed.
3. Tenant/branch guard where needed.
4. Permission check.
5. Business rule validation.

Example:

```js
router.post(
  '/students',
  authorize('super_admin', 'branch_admin', 'registrar'),
  requirePermission('students.create'),
  admitStudent
);
```

Important:

- Do not rely on frontend hiding alone.
- Backend must reject forbidden actions.

## 18. Default Permission Profiles

Create default profiles:

### Platform owner default

All `platform.*` permissions.

### School super admin default

All `tenant.*`, most `branch.*`, and permission management. No `finance.*` permissions.

### Finance director default

All `finance.*` permissions except optional deletion or reversal approval depending on school policy.

### Branch admin default

Branch setup and operations, but payroll should be optional.

### Registrar default

Admission, student search/detail/update, enrollment, optional transfers.

### Cashier default

Invoice lookup, payment collection, receipt printing. Payment reversal denied by default.

### Teacher default

Schedule, attendance, exams view, result entry, results view. Template/category/grading management optional.

### Student default

Own portal read permissions.

### Parent default

Linked-student read permissions.

## 19. Database Migration

Add a migration or script:

```text
backend/scripts/backfill-user-permissions.js
```

Purpose:

- Find existing users.
- Assign default permission profiles.
- Set empty allow/deny arrays.
- Preserve all current access behavior as much as possible.

Migration should be safe to run more than once.

## 20. Audit Logging

Add audit logs for:

```text
PERMISSION_PROFILE_ASSIGNED
USER_PERMISSION_UPDATED
USER_PERMISSION_DENIED
USER_PERMISSION_ALLOWED
USER_STATUS_CHANGED
USER_PASSWORD_RESET
```

Audit log should store:

- Actor
- Target user
- Role
- Scope
- Tenant
- Branch
- Before permissions
- After permissions

## 21. Testing Plan

### Backend tests

Add tests for:

- Effective permission calculation.
- Deny overrides allow.
- Role defaults apply.
- User without permission receives `403`.
- User with permission succeeds.
- Branch user cannot access another branch.
- Parent cannot access unlinked student.
- Student cannot access another student.
- Teacher cannot access unassigned class/subject.
- Platform owner cannot call tenant school-operation routes.

### Frontend tests/manual checks

Manual checks:

- Login as each role.
- Confirm sidebar shows only allowed screens.
- Directly visit forbidden URL.
- Confirm backend blocks forbidden action.
- Change permission as super admin.
- Refresh page and confirm menu updates.
- Confirm audit log is written.

## 22. Customer Demo Benefits

After this update, you can tell customers:

- The system supports role-based access.
- The system supports user-specific permissions.
- Admin can hide or show modules per user.
- Sensitive areas like payroll and payment reversal are controlled.
- Teachers only see assigned classes.
- Parents only see linked children.
- Students only see their own portal.
- Platform owner manages schools but does not interfere with private school operations.

## 23. Implementation Checklist

### Backend

- Add permission constants.
- Add default role permission profiles.
- Add effective permission helper.
- Add permission middleware.
- Update login response with permissions.
- Add permission fields to user model.
- Add tenant user detail/update/status/password routes.
- Add tenant user permissions routes.
- Add permission checks to platform routes.
- Add permission checks to tenant routes.
- Add permission checks to branch routes.
- Add permission checks to finance routes.
- Add permission checks to registrar routes.
- Add permission checks to cashier routes.
- Add permission checks to teacher routes.
- Keep student and parent data boundaries strict.
- Add audit logs for permission changes.
- Add migration/backfill script.
- Add backend tests.

### Frontend

- Add permission helper.
- Add `Can` component.
- Store permissions in auth context.
- Update platform sidebar.
- Update tenant sidebar.
- Update branch sidebar.
- Update finance sidebar.
- Update registrar sidebar.
- Update cashier sidebar.
- Update teacher sidebar.
- Update tenant users page.
- Add permission management modal.
- Add user edit/status/password screens or modal actions.
- Add clear disabled/forbidden states.
- Add friendly `403 Unauthorized` page.

### Documentation

- Update system review.
- Update how-to-run if migration script is needed.
- Add customer demo explanation for permissions.

## 24. Approval Questions

Before implementation, decide:

1. Should school super admin and finance director remain separate accounts?
2. Should branch admin see payroll by default, or only if granted `payroll.view`?
3. Should cashier be allowed to reverse payments directly, or should reversal require finance director approval?
4. Should normal teachers manage templates/categories/grading policy, or only senior teachers?
5. Should school super admin see tenant audit logs, or should audit logs remain platform-only?
6. Should permissions be edited using checkboxes per user first, or should we also add reusable permission profiles immediately?

## 25. Recommended Answers

Recommended for a real customer-ready system:

1. Yes. School super admin and finance director remain separate accounts and dashboards.
2. Branch admin should not see payroll by default.
3. Cashier should not reverse payments by default; reversal should require approval or special permission.
4. Normal teachers should not manage templates/categories/grading policy.
5. School super admin should see tenant audit logs for their own school only.
6. Start with per-user checkboxes and default role permissions; add reusable profiles after the first version works.

## 26. First Implementation Milestone

The first milestone should include:

- Permission fields on users.
- Permission helper and middleware.
- Effective permissions returned at login.
- Tenant user status/edit/password routes fixed.
- Tenant user permission modal.
- Permission-aware sidebars.
- Backend checks for the most sensitive routes:
  - user management
  - payroll
  - payment reversal
  - promotion
  - transfer
  - result entry
  - tenant/platform settings

This milestone will make the system feel much closer to a real permission-controlled school platform without rewriting the whole system at once.

## 27. Implementation Status

Updated after the first implementation pass.

### Completed

- Phase 1 platform owner permission boundary:
  - Platform permissions were added.
  - Platform login now returns effective permissions.
  - Platform sidebar is permission-aware.
  - Platform backend routes now check platform permissions.

- Phase 2 permission data model:
  - User model now supports custom `permissions.allow` and `permissions.deny`.
  - Default role permission catalog was added.
  - Effective permissions are calculated from role defaults plus allow minus deny.
  - Protected backend requests now receive `req.permissions`.

- Phase 3 school super admin permission management:
  - Tenant user detail/update/status/password routes were added.
  - Tenant user permission catalog/read/update routes were added.
  - Tenant user permission changes are audited.
  - Tenant users page now has a Permissions modal.
  - Tenant sidebar is permission-aware.

- Phase 4 branch admin permission gates:
  - Branch sidebar is permission-aware.
  - Branch backend routes now check branch permissions.
  - Payroll is hidden and blocked unless `payroll.view` or related payroll permissions are granted.

- Phase 5 finance director permission gates:
  - Finance sidebar is permission-aware.
  - Finance backend routes now check finance permissions.

- Phase 6 registrar permission gates:
  - Registrar sidebar is permission-aware.
  - Registrar backend routes now check student, enrollment, and transfer permissions.

- Phase 7 cashier permission gates:
  - Cashier sidebar is permission-aware.
  - Cashier backend routes now check invoice, payment, receipt, and payment reversal permissions.
  - Payment reversal is not part of default cashier permissions.

- Phase 8 teacher permission gates:
  - Teacher sidebar is permission-aware.
  - Teacher backend routes now check schedule, attendance, exam, result, export, and grading permissions.
  - Normal teacher defaults do not include template/category/grading-management permissions.

- Phase 9 and 10 student/parent menu consistency:
  - Student and parent sidebars now use the same permission helper.
  - Student portal APIs now enforce student-specific permissions.
  - Parent portal APIs now enforce parent-specific permissions.

- Permission hardening milestone:
  - Added the authenticated `GET /api/auth/me` endpoint.
  - Active sessions refresh permissions on startup, window focus, and every two minutes.
  - Direct protected frontend URLs now use a centralized permission-route map.
  - Added a friendly `403 Access Denied` page.
  - School user-management action buttons now respect create, status, and permission-management permissions.
  - Dashboard and legacy staff routes now enforce permissions.
  - All 79 protected frontend paths were checked against the centralized permission-route map.

- Finance director separation milestone:
  - Finance director and school super admin are now strictly separate account roles.
  - School super admins no longer receive finance permissions or see the finance dashboard link.
  - Finance backend routes accept only `finance_director`.
  - Cross-role custom permissions are ignored.
  - Sensitive tenant roles cannot be converted between school super admin and finance director; a separate account must be created.
  - School super admin creates the finance director from `School Admin > Users > Create Finance Director`.
  - Finance directors sign in from `/finance/login` and use only the finance dashboard.

### Verified

- Backend JavaScript syntax check passed.
- All 9 backend security tests passed.
- Frontend ESLint passed.
- Frontend production build passed.
- Git diff whitespace check passed.

### Remaining Enhancements

- Add reusable named permission profiles in the UI.
- Add a migration script if production/demo databases need explicit stored profile names for old users.
- Add browser end-to-end checks when the local browser automation is available.
- Add deeper route tests with authenticated sample users and a test database.
