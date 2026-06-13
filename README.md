# School Management Platform

A multi-tenant school management platform with tenant, branch, finance, registrar, teacher, student, parent, cashier, HR, and platform-owner workflows.

## Stack

- Backend: Node.js, Express, MongoDB/Mongoose, JWT
- Frontend: React, Vite, Tailwind CSS

## Local Setup

1. Copy `backend/.env.example` to `backend/.env`.
2. Copy `frontend/.env.example` to `frontend/.env`.
3. Install dependencies in `backend` and `frontend` with `npm install`.
4. Start MongoDB.
5. Run `npm run dev` in both directories.

## Verification

```powershell
cd backend
npm test

cd ..\frontend
npm run lint
npm run build
```

Public tenant registration creates a pending institution. Platform owners approve institutions; administrators provision all staff, student, and parent accounts.
