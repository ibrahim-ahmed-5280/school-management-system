# System Review And Feature Guide

This document explains what the school management system does, how the system works, which features are available, what has been improved, and what still needs future work.

For a detailed description of every user role, its responsibilities, access boundaries, and a complete start-to-finish operating scenario, see `SYSTEM_USERS_AND_END_TO_END_SCENARIO.md`.

## 1. System Summary

The system is a multi-tenant school management platform. One platform can host many schools. Each school is a tenant. Each tenant can have branches, users, students, classes, academic years, finance records, attendance, exams, results, and reports.

The main goal is to manage the full school operation from platform onboarding to daily academic and finance workflows.

## 2. Main User Roles

### Platform owner

The platform owner manages the whole SaaS platform.

Main responsibilities:

- Approve and manage schools/tenants
- Manage subscription plans
- View platform dashboard
- Manage platform settings
- View platform audit logs
- Monitor system health and usage

### Tenant super admin

The tenant super admin manages one school/institution.

Main responsibilities:

- Manage school branding
- Manage branches
- Manage school users
- Manage academic years
- Promote students between academic years
- Transfer students between branches
- View tenant reports

The tenant super admin creates the finance director account from `School Admin > Users`, but cannot open finance routes or use the finance dashboard.

### Branch admin

The branch admin manages one branch/campus.

Main responsibilities:

- Manage branch profile
- Manage classes, sections, subjects, class categories, and curriculum setup
- Manage branch staff
- Manage teacher assignments
- Manage exams and result review
- Manage student directory
- Run branch-level promotions
- Manage timetable
- View branch dashboard and reports

### Registrar

The registrar handles student lifecycle operations.

Main responsibilities:

- Admit students
- Search and view student records
- View student details
- Create enrollments
- Transfer students between branches
- Work with class/year filters

### Teacher

Teachers manage academic delivery for assigned classes and subjects.

Main responsibilities:

- View teacher dashboard
- View assigned classes and subjects
- Create or view exams where allowed
- Enter student results
- View result summaries
- Export academic data
- View schedule
- Open and submit attendance sessions
- Request leaves

### Finance director

The finance director manages school-level finance setup and oversight.

The finance director is a separate tenant-scoped account with a dedicated login and dashboard. It cannot use the school super-admin dashboard.

Main responsibilities:

- Manage fee structures
- Manage finance policies
- Generate invoices
- Review invoices
- View payment summaries
- View outstanding balances
- View revenue reports
- Preview receipt branding

### Cashier

The cashier handles payment collection.

Main responsibilities:

- Search invoices
- Record payments
- View payment history
- View and print receipts

### Student

Students access their own school information.

Main responsibilities:

- View student dashboard
- View results
- View class rank
- View attendance
- View schedule
- View profile
- Change password

### Parent

Parents access linked student information.

Main responsibilities:

- View child dashboard
- View grades/results
- View attendance
- View invoices
- Receive/view parent notifications where configured

### HR and payroll users

The system includes HR-related modules.

Main responsibilities:

- Submit leave requests
- Manage staff leave requests
- Generate payroll
- Mark payroll as paid

This area exists but should be considered less mature than the core academic and finance flows.

## 3. Architecture Overview

### Backend

Technology:

- Node.js
- Express
- MongoDB
- Mongoose
- JWT authentication

Backend responsibilities:

- Authentication
- Authorization
- Tenant and branch isolation
- Database models
- API routes
- Business rules
- Audit logging
- Finance calculations
- Promotion and transfer safety

### Frontend

Technology:

- React
- Vite
- Tailwind CSS
- React Router
- Axios
- Recharts

Frontend responsibilities:

- Role-based dashboards
- Forms and tables
- Navigation
- API integration
- Reporting screens
- Customer-facing landing page

## 4. Authentication And Security

The system uses JWT authentication.

Important security behavior:

- Users have both a `role` and a `scope`.
- Platform users use platform scope.
- Tenant users use tenant scope.
- Branch users use branch scope.
- Branch-scoped users must belong to an active branch.
- Tenant users must belong to an active and approved tenant.
- Public privileged self-registration has been removed.
- Staff, student, and parent accounts are provisioned by administrators.
- Public tenant registration creates a pending institution that needs platform approval.
- Login checks inactive accounts and pending/inactive tenants.

Supported account boundaries:

- Platform owner cannot be created by tenant or branch admins.
- Tenant admin can create allowed tenant and branch users only.
- Branch admin can create/manage lower branch roles only.
- Parent users must be linked to one or more tenant-owned students.

## 5. Tenant And Branch Isolation

The system separates data by:

- `tenantId`
- `branchId`
- `role`
- `scope`
- `academicYearId`

This prevents one school or branch from reading or changing another school's records when routes are used correctly.

Examples:

- Branch admins see branch data only.
- Teachers see assigned class/subject data.
- Parents see only linked students.
- Students see only their own portal data.
- Finance records are tenant and branch scoped.

## 6. Platform Features

### Tenant management

Platform owner can:

- View tenants
- Create tenants
- Approve pending tenants
- Activate or deactivate tenants
- View tenant details
- Manage tenant status and subscription plan

### Plan management

Platform owner can:

- Create subscription plans
- Edit plans
- Delete plans where allowed
- Control branch/user/student limits through plan data

### Platform settings

Platform owner can:

- Manage platform name
- Manage official website
- Manage colors
- Upload or preview logo
- Configure SMTP settings
- Test SMTP settings

### Platform dashboard

Shows platform-level summary information such as tenants, students, usage, and system indicators.

### Monitoring

Monitoring screens show system-level information useful for platform operation, such as request and resource indicators.

### Audit logs

Platform audit logs help track platform-level actions.

## 7. Tenant Features

### Branding

Tenant admins can manage school branding:

- Logo
- Primary color
- Secondary color
- School identity shown in tenant and branch areas

### Branch management

Tenant admins can:

- Create branches
- Update branches
- Activate/deactivate branches
- Assign branch admins
- View branch list
- Search/filter branch data

When a public school registration is approved by the platform owner, the system creates a Main Branch if the school does not already have a branch. Tenant admins can edit that Main Branch from the branch management screen.

### User management

Tenant admins can create and manage:

- Finance directors
- Branch admins
- Registrars
- Cashiers
- Teachers
- Parents

Parent creation includes student linking.

The system prevents tenant admins from creating platform owners.

### Academic years

Tenant admins can:

- Create academic years
- Set the current academic year
- Use years in reports, promotions, invoices, results, and attendance

### Promotion

Promotion moves students from one academic year to another by creating new enrollment records.

Important behavior:

- Previous-year enrollment is marked `Promoted`.
- New-year enrollment is created as `Current`.
- Attendance, results, invoices, and payment records from the old year remain in the database.
- Promotion has compensation behavior to avoid broken enrollment state if a failure happens.
- Historical reports/results include promoted enrollments when an old academic year is selected.

### Transfer

Tenant admins can transfer students between branches.

Important behavior:

- Source and target branches are validated.
- Target class is validated.
- Student branch is updated.
- Previous enrollment is marked transferred.
- New branch enrollment is created.
- Compensation logic restores the source state if the transfer fails midway.

### Tenant reports

Tenant reports summarize:

- Student counts
- Enrollment counts
- Finance totals
- Performance data
- Branch and academic-year filters

Historical academic-year reports include promoted students.

Tenant actions are still written to the audit log for accountability, but the audit log screen is platform-owner only. School admins do not have a tenant audit-log module in the UI or API.

## 8. Branch Admin Features

### Branch profile

Branch admin can view and update branch information:

- Address
- Phone
- Email
- Receipt footer

### Class management

Branch admin can manage:

- Class categories
- Classes
- Grade levels
- Sections
- Subjects
- Class-subject assignments

### Staff management

Branch admin can create and manage:

- Teachers
- Cashiers
- Registrars

Branch admins cannot create platform owners, super admins, or finance directors.

### Teacher assignments

Branch admin can assign teachers to:

- Academic year
- Class
- Section
- Subject

This controls what teachers can access.

### Student directory

Branch admin can:

- View students in branch
- Filter students by class/year/status/search
- Open student result views

### Exams

Branch admin can:

- Create exams
- Assign exams to classes and subjects
- Set exam status
- View exam details
- Prevent deleting exams with existing results

### Results

Branch admin can:

- View class results
- View individual student results
- View summaries and ranks
- Export class results as CSV

Historical result views remain available after promotion.

### Timetable

Branch admin can:

- Create timetable slots
- Select academic year, class, section, subject, teacher, day, and time
- View timetable by class
- Generate attendance sessions from timetable context

### Branch reports

Branch reports show academic and operational summaries for the branch.

## 9. Registrar Features

### Admissions

Registrar can admit new students.

Admission creates:

- Student record
- Enrollment record

Required fields include:

- Admission number
- Student name
- Class
- Academic year

### Student records

Registrar can:

- Search students
- Filter by class and academic year
- View details
- Review enrollment information

Historical academic-year filters can include promoted students.

### Enrollment operations

Registrar can:

- Create enrollments
- Transfer students between branches

Transfers validate:

- Student
- Source branch
- Target branch
- Target class
- Academic year

## 10. Teacher Features

### Dashboard

Teacher dashboard shows relevant teaching information, such as classes, schedule, exams, and activities.

### Assigned classes and subjects

Teachers access only classes and subjects assigned to them.

### Exams and results

Teachers can:

- View exams
- Open exam details
- Enter results for assigned classes/subjects
- Save batch result entries
- View result reports
- Export result data

Teacher result reports can show old academic-year data after promotion.

### Attendance

Teachers can:

- Open attendance sessions
- Mark students present, absent, late, or excused
- Submit attendance records
- Close sessions where allowed

Attendance records are tied to sessions, and sessions are tied to academic years.

### Schedule

Teachers can view timetable/schedule data related to their assignments.

### Leave requests

Teachers and staff can submit leave requests through HR screens.

## 11. Student Portal Features

### Dashboard

Student dashboard summarizes student academic and school information.

### Results

Students can view:

- Subjects
- Exam categories
- Marks
- Totals
- Percentages
- Pass/fail status

Students can select historical academic years where supported.

### Rank

Students can view class rank calculated from results for the selected academic year.

### Attendance

Students can view attendance records.

Attendance status values are normalized:

- PRESENT
- ABSENT
- LATE
- EXCUSED

### Schedule

Students can view class schedule/timetable.

### Profile

Students can view personal and enrollment information.

### Change password

Students can change their password. Temporary or first-login passwords should be replaced by the student.

## 12. Parent Portal Features

Parents can see only linked students.

### Parent dashboard

Shows children linked to the parent account and key summary information.

### Grades/results

Parents can view child grades and academic progress.

### Attendance

Parents can view child attendance records.

### Invoices

Parents can view child invoice information.

## 13. Finance Features

### Fee structures

Finance director can create and manage fee structures by:

- Branch
- Class
- Academic year
- Fee items

### Finance policies

Finance director can manage finance policy settings.

### Invoice generation

Invoices can be generated by:

- Academic year
- Branch
- Class
- Student

Invoices are tied to academic years and students.

### Invoice review

Finance director can:

- View invoices
- Filter by branch, academic year, status, and student
- Open invoice details

### Payment summary

Finance dashboard shows collection summaries and outstanding balances.

### Outstanding balances

Finance can review students or invoices with unpaid balances.

### Revenue reports

Finance reports show revenue and outstanding trends, with branch/year filters.

### Receipt branding

Finance can preview receipt branding for branches.

## 14. Cashier Features

### Invoice lookup

Cashier can search invoices by:

- Admission number
- Invoice ID
- Student ID where supported

### Record payment

Cashier can record a payment against an invoice.

Payment handling includes:

- Positive amount validation
- Balance checks
- Invoice paid amount update
- Invoice balance update
- Invoice status update

### Payment history

Cashier can view recorded payments.

### Receipt

Cashier can view and print receipts.

### Payment reversal safety

Payment reversal logic supports:

- Marking original payment as reversed
- Creating reversal records
- Restoring invoice values if reversal record creation fails
- Preventing duplicate reversal records

## 15. HR And Payroll Features

### Leave request

Staff can submit leave requests.

### Leave management

Managers can review staff leave requests.

### Payroll

Payroll screens support:

- Viewing payroll by month/year
- Generating payroll
- Marking payroll as paid

This module exists, but it should be polished further before being presented as a final production HR/payroll product.

## 16. Notifications

The backend includes notification service structure. Notifications can support parent/student/staff communication, but real provider integration should be configured and tested before production use.

Potential future channels:

- Email
- SMS
- WhatsApp
- In-app notifications

## 17. Audit And Accountability

The system logs important actions for accountability.

Examples:

- User creation
- Branch changes
- Branding changes
- Academic year changes
- Promotions
- Transfers
- Payments
- Platform settings changes

Audit logs are available to platform owners. Tenant-level actions are still recorded, but school admins do not view the audit-log module.

## 18. Promotion Data Safety

Promotion is designed to preserve old academic-year data.

Old data remains because:

- Attendance sessions have `academicYearId`
- Attendance records link to attendance sessions
- Exams have `academicYearId`
- Results link to exams
- Invoices have `academicYearId`
- Payments link to invoices

Promotion changes enrollment state only:

- Old enrollment becomes `Promoted`
- New enrollment becomes `Current`

The system now also keeps historical reports/results visible when old academic years are selected.

## 19. What Is Ready For Customer Demo

The system is suitable for a working MVP/customer demo if prepared with clean data.

Recommended demo modules:

- Landing page
- Platform owner dashboard
- Tenant approval and tenant management
- Tenant admin dashboard
- Branch management
- User management
- Academic year setup
- Admissions
- Class and subject setup
- Teacher assignment
- Exam creation
- Result entry
- Attendance
- Finance setup
- Invoice generation
- Payment recording
- Student portal
- Parent portal
- Platform audit logs
- Promotion flow

## 20. What Still Needs Improvement

### Production readiness

Before using with real customers in production:

- Set up HTTPS
- Set up server/domain deployment
- Set up MongoDB backups
- Add restore procedure
- Add server monitoring
- Add log rotation
- Use strong secrets
- Review environment variables

### Integrations

Still recommended:

- Live payment gateway
- Real SMTP provider
- SMS or WhatsApp provider
- File storage provider for uploads if needed

### Testing

More tests should be added for:

- Admission
- Promotion
- Transfer
- Attendance
- Result entry
- Invoice generation
- Payment recording
- Payment reversal
- Parent/student access
- Tenant/branch isolation

### UI polish

Recommended customer polish:

- Better report cards
- PDF invoices
- PDF receipts
- PDF transcripts
- Better mobile testing
- More dashboard charts
- More empty states
- More success/error toasts instead of browser alerts in a few remaining screens

### HR/payroll maturity

HR and payroll exist but need more validation, reporting, and payroll policy detail before being sold as a complete HR product.

## 21. Best Customer Demo Story

Use this story when presenting:

1. Platform owner creates or approves a school.
2. Tenant admin logs in and configures school branding.
3. Tenant admin creates branches and users.
4. Branch admin creates classes, subjects, and teacher assignments.
5. Registrar admits students.
6. Teacher opens schedule and records attendance.
7. Teacher enters exam results.
8. Student logs in and sees results, attendance, and rank.
9. Parent logs in and sees child grades, attendance, and invoices.
10. Finance director creates fee structure and generates invoices.
11. Cashier records payment and prints receipt.
12. Admin runs promotion to the next academic year.
13. Admin opens old-year results to show that historical data is preserved.
14. Platform owner reviews audit logs and monitoring.

## 22. Current System Position

The system is now best described as:

```text
Working multi-tenant school management MVP, ready for structured customer demos and continued production hardening.
```

It should not yet be described as fully production-ready SaaS until deployment, backups, integrations, and expanded testing are completed.
