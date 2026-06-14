# How To Run The System

This guide explains how to run the school management platform locally for development, testing, and customer demos.

## 1. System Requirements

- Node.js and npm
- MongoDB running locally or a MongoDB Atlas connection string
- Two terminal windows: one for the backend and one for the frontend
- A copied backend environment file at `backend/.env`
- A copied frontend environment file at `frontend/.env`

## 2. Project Structure

```text
school_management/
  backend/      Express API, MongoDB models, controllers, routes, seeds
  frontend/     React/Vite web application
  README.md     Short project overview
```

## 3. Environment Setup

### Backend

Copy the backend example file:

```powershell
Copy-Item backend\.env.example backend\.env
```

The backend `.env` should contain values like:

```env
PORT=5035
MONGO_URI=mongodb://localhost:27017/school_management
JWT_SECRET=replace-with-a-long-random-secret
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Important:

- Use a strong `JWT_SECRET`.
- Do not commit `backend/.env`.
- `backend/.env` is intentionally ignored by `.gitignore`.

### Frontend

Copy the frontend example file:

```powershell
Copy-Item frontend\.env.example frontend\.env
```

The frontend `.env` should contain:

```env
VITE_API_ORIGIN=http://localhost:5035
VITE_API_URL=http://localhost:5035/api
```

## 4. Install Dependencies

Install backend dependencies:

```powershell
cd backend
npm install
```

Install frontend dependencies:

```powershell
cd ..\frontend
npm install
```

## 5. Start MongoDB

If you use local MongoDB, make sure the MongoDB service is running.

Typical local connection:

```text
mongodb://localhost:27017/school_management
```

If you use MongoDB Atlas, set `MONGO_URI` in `backend/.env` to the Atlas connection string.

## 6. Create A Platform Owner

The platform owner manages tenants, plans, settings, monitoring, and platform-level access.

From the backend folder:

PowerShell:

```powershell
cd backend
$env:PLATFORM_OWNER_EMAIL="owner@example.com"
$env:PLATFORM_OWNER_PASSWORD="Use-A-Strong-Password-123!"
$env:PLATFORM_OWNER_NAME="Platform Owner"
node create-platform-owner.js
```

Command Prompt:

```cmd
cd backend
set "PLATFORM_OWNER_EMAIL=owner@example.com"
set "PLATFORM_OWNER_PASSWORD=Use-A-Strong-Password-123!"
set "PLATFORM_OWNER_NAME=Platform Owner"
node create-platform-owner.js
```

Password requirement:

- At least 12 characters.

The script does not print the password.

## 7. Start The Backend

From the backend folder:

```powershell
cd backend
npm run dev
```

The API should run on:

```text
http://localhost:5035
```

If you want to run without nodemon:

```powershell
npm start
```

## 8. Start The Frontend

Open another terminal:

```powershell
cd frontend
npm run dev
```

The frontend should run on:

```text
http://localhost:5173
```

Open that URL in the browser.

## 9. Normal Login Flow

### Platform owner

1. Go to `/platform/login`.
2. Log in with the platform owner email and password.
3. Manage tenants, plans, settings, audit logs, and monitoring.

### Tenant users

1. Go to `/login`.
2. Log in with a tenant, branch, teacher, cashier, registrar, student, or parent account.
3. The system redirects users based on role and scope.

## 10. Optional Demo Seed Data

There are seed scripts in the backend.

Important:

- Use seed scripts only on a local/demo database.
- Do not run seed scripts on production data.
- `seed.js` deletes existing tenants, branches, and users before creating demo records.

Example:

```powershell
cd backend
$env:SEED_PASSWORD="Use-A-Strong-Seed-Password-123!"
node seed-all.js
```

or:

```powershell
cd backend
$env:SEED_PASSWORD="Use-A-Strong-Seed-Password-123!"
node seed.js
```

## 11. Recommended Customer Demo Setup

Before showing the system to customers, prepare this sample data:

- One platform owner
- One approved tenant or school
- One or two branches
- Current and previous academic years
- Class categories and classes
- Subjects and class-subject assignments
- Staff users: super admin, branch admin, registrar, teacher, finance director, cashier
- Several students
- At least one parent account linked to a student
- Attendance sessions and records
- Exams and entered results
- Fee structures, invoices, payments, and outstanding balances

Recommended demo flow:

1. Landing page and school registration
2. Platform owner approves/manages tenant
3. Tenant admin configures branches, users, academic years, and branding
4. Registrar admits a student
5. Branch admin manages classes, staff, exams, and assignments
6. Teacher enters results and attendance
7. Finance generates invoices and checks reports
8. Cashier records a payment and prints receipt
9. Student views attendance, schedule, rank, and results
10. Parent views child grades, attendance, and invoices
11. Platform owner reviews monitoring and audit logs

## 12. Verification Commands

Run backend tests:

```powershell
cd backend
npm test
```

Run frontend lint:

```powershell
cd frontend
npm run lint
```

Run frontend production build:

```powershell
cd frontend
npm run build
```

Optional backend syntax check:

```powershell
cd backend
$failed = @()
Get-ChildItem -Path . -Recurse -Filter *.js |
  Where-Object { $_.FullName -notmatch '\\node_modules\\' } |
  ForEach-Object {
    node --check $_.FullName 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { $failed += $_.FullName }
  }
if ($failed.Count -gt 0) { $failed; exit 1 } else { "All backend JavaScript syntax checks passed." }
```

## 13. Common Problems

### Frontend cannot reach backend

Check:

- Backend is running on `http://localhost:5035`
- Frontend `.env` has `VITE_API_URL=http://localhost:5035/api`
- Backend `.env` has `CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`

### Login fails

Check:

- User exists
- Password is correct
- Tenant is approved and active
- User role and scope are valid
- Branch-scoped user belongs to an active branch

### Platform owner creation fails

Check:

- `PLATFORM_OWNER_EMAIL` is set
- `PLATFORM_OWNER_PASSWORD` is set and at least 12 characters
- MongoDB is running
- `MONGO_URI` is correct

### Promotion does not show old results

Use old academic-year filters in reports/results pages. The system keeps historical enrollments and records. Promotion creates a new enrollment for the new year and marks the old enrollment as `Promoted`.

## 14. Production Checklist

Before real production use:

- Use HTTPS.
- Use a strong `JWT_SECRET`.
- Use production MongoDB with backups.
- Configure email/SMS/WhatsApp providers if needed.
- Configure payment gateway if needed.
- Configure server monitoring and log rotation.
- Create database backup and restore procedures.
- Run end-to-end tests for admission, promotion, results, attendance, invoices, and payment reversal.
- Confirm mobile/tablet layout for all important roles.

## 15. Finance Director Account

The finance director is a separate account from the school super admin.

1. Sign in as the school super admin.
2. Open `School Admin > Users`.
3. Select `Create Finance Director`.
4. Enter the finance director's name, email, and temporary password.
5. The finance director signs in at:

```text
http://localhost:5173/finance/login
```

Do not reuse or convert the school super-admin account. The school super admin cannot open finance routes, and the finance director cannot open the school-admin dashboard.
