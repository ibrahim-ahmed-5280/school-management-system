import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const RegisterTenant = lazy(() => import('./pages/RegisterTenant'));
const PlatformLogin = lazy(() => import('./pages/platform/Login'));
const PlatformDashboard = lazy(() => import('./pages/platform/Dashboard'));
const PlatformTenants = lazy(() => import('./pages/platform/Tenants'));
const PlatformNewTenant = lazy(() => import('./pages/platform/NewTenant'));
const PlatformTenantDetails = lazy(() => import('./pages/platform/TenantDetails'));
const PlatformPlans = lazy(() => import('./pages/platform/Plans'));
const PlatformAuditLogs = lazy(() => import('./pages/platform/AuditLogs'));
const PlatformMonitoring = lazy(() => import('./pages/platform/Monitoring'));
const PlatformSettings = lazy(() => import('./pages/platform/Settings'));
const TenantDashboard = lazy(() => import('./pages/tenant/Dashboard'));
const TenantBranding = lazy(() => import('./pages/tenant/Branding'));
const TenantBranches = lazy(() => import('./pages/tenant/Branches'));
const TenantUsers = lazy(() => import('./pages/tenant/Users'));
const TenantAcademicYears = lazy(() => import('./pages/tenant/AcademicYears'));
const TenantReports = lazy(() => import('./pages/tenant/Reports'));
const TenantPromote = lazy(() => import('./pages/tenant/Promote'));
const TenantTransfer = lazy(() => import('./pages/tenant/Transfer'));
const TenantAuditLogs = lazy(() => import('./pages/tenant/AuditLogs'));
const FinanceDashboard = lazy(() => import('./pages/finance/FinanceDashboard'));
const FinancePolicies = lazy(() => import('./pages/finance/Policies'));
const FeeStructures = lazy(() => import('./pages/finance/FeeStructures'));
const Invoices = lazy(() => import('./pages/finance/Invoices'));
const InvoiceDetails = lazy(() => import('./pages/finance/InvoiceDetails'));
const InvoiceGenerate = lazy(() => import('./pages/finance/InvoiceGenerate'));
const Payments = lazy(() => import('./pages/finance/Payments'));
const Reports = lazy(() => import('./pages/finance/Reports'));
const Outstanding = lazy(() => import('./pages/finance/Outstanding'));
const ReceiptBranding = lazy(() => import('./pages/finance/ReceiptBranding'));
const BranchDashboard = lazy(() => import('./pages/branch/Dashboard'));
const BranchProfile = lazy(() => import('./pages/branch/Profile'));
const BranchClasses = lazy(() => import('./pages/branch/Classes'));
const BranchStaff = lazy(() => import('./pages/branch/Staff'));
const BranchStudents = lazy(() => import('./pages/branch/Students'));
const BranchPromotions = lazy(() => import('./pages/branch/Promotions'));
const BranchExams = lazy(() => import('./pages/branch/Exams'));
const BranchResults = lazy(() => import('./pages/branch/Results'));
const BranchStudentResults = lazy(() => import('./pages/branch/StudentResults'));
const BranchReports = lazy(() => import('./pages/branch/Reports'));
const BranchTeacherAssignments = lazy(() => import('./pages/branch/TeacherAssignments'));
const BranchTimetableBuilder = lazy(() => import('./pages/branch/TimetableBuilder'));
import BranchLayout from './layouts/BranchLayout';
const RegistrarDashboard = lazy(() => import('./pages/registrar/Dashboard'));
const RegistrarAdmissions = lazy(() => import('./pages/registrar/Admissions'));
const RegistrarStudents = lazy(() => import('./pages/registrar/Students'));
const RegistrarStudentDetails = lazy(() => import('./pages/registrar/StudentDetails'));
const RegistrarNewEnrollment = lazy(() => import('./pages/registrar/NewEnrollment'));
const RegistrarTransfers = lazy(() => import('./pages/registrar/Transfers'));
import RegistrarLayout from './layouts/RegistrarLayout';
import CashierLayout from './layouts/CashierLayout';
const CashierDashboard = lazy(() => import('./pages/cashier/Dashboard'));
const CashierInvoices = lazy(() => import('./pages/cashier/Invoices'));
const CashierInvoiceDetails = lazy(() => import('./pages/cashier/InvoiceDetails'));
const CashierNewPayment = lazy(() => import('./pages/cashier/NewPayment'));
const CashierReceipt = lazy(() => import('./pages/cashier/Receipt'));
const CashierPayments = lazy(() => import('./pages/cashier/Payments'));
const TeacherDashboard = lazy(() => import('./pages/teacher/Dashboard'));
const TeacherExams = lazy(() => import('./pages/teacher/Exams'));
const TeacherExamDetails = lazy(() => import('./pages/teacher/ExamDetails'));
const TeacherResultEntry = lazy(() => import('./pages/teacher/ResultsEntry'));
const TeacherResults = lazy(() => import('./pages/teacher/Results'));
const TeacherTemplates = lazy(() => import('./pages/teacher/Templates'));
const TeacherCategories = lazy(() => import('./pages/teacher/Categories'));
const TeacherReports = lazy(() => import('./pages/teacher/Reports'));
const TeacherExports = lazy(() => import('./pages/teacher/Exports'));
const TeacherGradingPolicy = lazy(() => import('./pages/teacher/GradingPolicy'));
const TeacherSchedule = lazy(() => import('./pages/teacher/Schedule'));
const TeacherAttendanceSession = lazy(() => import('./pages/teacher/AttendanceSession'));
import TeacherLayout from './layouts/TeacherLayout';
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const StudentResults = lazy(() => import('./pages/student/Results'));
const StudentRank = lazy(() => import('./pages/student/Rank'));
const StudentAttendance = lazy(() => import('./pages/student/Attendance'));
const StudentSchedule = lazy(() => import('./pages/student/Schedule'));
const StudentProfile = lazy(() => import('./pages/student/Profile'));
const StudentChangePassword = lazy(() => import('./pages/student/ChangePassword'));
import StudentLayout from './layouts/StudentLayout';
import ParentLayout from './layouts/ParentLayout';
const ParentDashboard = lazy(() => import('./pages/parent/ParentDashboard'));
const ParentStudentGrades = lazy(() => import('./pages/parent/ParentStudentGrades'));
const ParentStudentAttendance = lazy(() => import('./pages/parent/ParentStudentAttendance'));
const ParentInvoices = lazy(() => import('./pages/parent/ParentInvoices'));
const LeavesRequest = lazy(() => import('./pages/hr/LeavesRequest'));
const StaffLeavesManager = lazy(() => import('./pages/hr/StaffLeavesManager'));
const PayrollDashboard = lazy(() => import('./pages/hr/PayrollDashboard'));

// Layouts & Guards
import PlatformLayout from './layouts/PlatformLayout';
import TenantLayout from './layouts/TenantLayout';
import TenantFinanceLayout from './layouts/TenantFinanceLayout';
import { BrandingProvider } from './context/BrandingContext';
import { PlatformGuard, PublicGuard, TenantGuard, FinanceGuard } from './utils/authGuard';
import { ProtectedRoute as RoleScopeGuard } from './utils/guards';

// Tenant Scoped Layout Wrapper
const TenantWrapper = () => (
  <BrandingProvider>
    <TenantLayout>
      <Outlet />
    </TenantLayout>
  </BrandingProvider>
);

// Platform Scoped Layout Wrapper
const PlatformWrapper = () => (
  <PlatformLayout>
    <Outlet />
  </PlatformLayout>
);

const RouteLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<RouteLoader />}>
          <Routes>
          {/* Main App Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterTenant />} />
          <Route path="/tenant/register" element={<RegisterTenant />} />
          <Route 
            path="/dashboard/*" 
            element={<Navigate to="/login" replace />} 
          />

          {/* Tenant Super Admin Routes */}
          <Route path="/tenant">
            <Route path="login" element={<Navigate to="/login" replace />} />
            
            <Route element={<TenantGuard />}>
              <Route element={<TenantWrapper />}>
                <Route index element={<TenantDashboard />} />
                <Route path="branding" element={<TenantBranding />} />
                <Route path="branches" element={<TenantBranches />} />
                <Route path="users" element={<TenantUsers />} />
                <Route path="academic-years" element={<TenantAcademicYears />} />
                <Route path="reports" element={<TenantReports />} />
                <Route path="enrollments/promote" element={<TenantPromote />} />
                <Route path="enrollments/transfer" element={<TenantTransfer />} />
                <Route path="audit-logs" element={<TenantAuditLogs />} />
              </Route>
            </Route>
          </Route>

          {/* Finance Director Routes */}
          <Route path="/finance">
            <Route path="login" element={<Navigate to="/login" replace />} />
            <Route path="register" element={<Navigate to="/login" replace />} />
            <Route element={<FinanceGuard />}>
               <Route element={<BrandingProvider><TenantFinanceLayout /></BrandingProvider>}>
                <Route index element={<FinanceDashboard />} />
                <Route path="policies" element={<FinancePolicies />} />
                <Route path="fee-structures" element={<FeeStructures />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="invoices/:invoiceId" element={<InvoiceDetails />} />
                <Route path="invoices/generate" element={<InvoiceGenerate />} />
                <Route path="payments" element={<Payments />} />
                <Route path="reports" element={<Reports />} />
                <Route path="outstanding" element={<Outstanding />} />
                <Route path="receipt-branding" element={<ReceiptBranding />} />
              </Route>
            </Route>
          </Route>

          {/* Branch Admin Routes */}
          <Route path="/branch">
            <Route path="login" element={<Navigate to="/login" replace />} />
            <Route path="register" element={<Navigate to="/login" replace />} />
            <Route
              element={(
                <RoleScopeGuard role="BRANCH_ADMIN" scope="branch" redirectTo="/login">
                  <BrandingProvider><BranchLayout /></BrandingProvider>
                </RoleScopeGuard>
              )}
            >
              <Route index element={<BranchDashboard />} />
              <Route path="profile" element={<BranchProfile />} />
              <Route path="classes" element={<BranchClasses />} />
              <Route path="staff" element={<BranchStaff />} />
              <Route path="students" element={<BranchStudents />} />
              <Route path="promotions" element={<BranchPromotions />} />
              <Route path="exams" element={<BranchExams />} />
              <Route path="results" element={<BranchResults />} />
              <Route path="results/student" element={<BranchStudentResults />} />
              <Route path="assignments" element={<BranchTeacherAssignments />} />
              <Route path="timetable" element={<BranchTimetableBuilder />} />
              <Route path="timetable/class/:classId" element={<BranchTimetableBuilder />} />
              <Route path="reports" element={<BranchReports />} />
              
              {/* HR Modules */}
              <Route path="hr/leaves" element={<StaffLeavesManager />} />
              <Route path="hr/payroll" element={<PayrollDashboard />} />
            </Route>
          </Route>

          {/* Registrar Routes */}
          <Route path="/registrar/login" element={<Navigate to="/login" replace />} />
          <Route path="/registrar/register" element={<Navigate to="/login" replace />} />
          <Route
            element={(
              <RoleScopeGuard role="REGISTRAR" scope="branch" redirectTo="/login">
                <BrandingProvider><RegistrarLayout /></BrandingProvider>
              </RoleScopeGuard>
            )}
          >
            <Route path="/registrar">
              <Route index element={<RegistrarDashboard />} />
              <Route path="admissions" element={<RegistrarAdmissions />} />
              <Route path="students" element={<RegistrarStudents />} />
              <Route path="students/:studentId" element={<RegistrarStudentDetails />} />
              <Route path="enrollments/new" element={<RegistrarNewEnrollment />} />
              <Route path="transfers" element={<RegistrarTransfers />} />
            </Route>
          </Route>

          {/* Cashier Routes */}
          <Route path="/cashier/login" element={<Navigate to="/login" replace />} />
          <Route path="/cashier/register" element={<Navigate to="/login" replace />} />
          <Route
            element={(
              <RoleScopeGuard role="CASHIER" scope="branch" redirectTo="/login">
                <BrandingProvider><CashierLayout /></BrandingProvider>
              </RoleScopeGuard>
            )}
          >
            <Route path="/cashier">
              <Route index element={<CashierDashboard />} />
              <Route path="invoices" element={<CashierInvoices />} />
              <Route path="invoices/:id" element={<CashierInvoiceDetails />} />
              <Route path="payments/new" element={<CashierNewPayment />} />
              <Route path="payments" element={<CashierPayments />} />
              <Route path="receipts/:paymentId" element={<CashierReceipt />} />
            </Route>
          </Route>

          {/* Teacher Routes */}
          <Route path="/teacher/login" element={<Navigate to="/login" replace />} />
          <Route path="/teacher/register" element={<Navigate to="/login" replace />} />
          <Route
            path="/teacher"
            element={(
              <RoleScopeGuard role="TEACHER" scope="branch" redirectTo="/login">
                <BrandingProvider><TeacherLayout /></BrandingProvider>
              </RoleScopeGuard>
            )}
          >
              <Route index element={<TeacherDashboard />} />
              <Route path="templates" element={<TeacherTemplates />} />
              <Route path="categories" element={<TeacherCategories />} />
              <Route path="exams" element={<TeacherExams />} />
              <Route path="exams/:examId" element={<TeacherExamDetails />} />
              <Route path="results-entry" element={<TeacherResultEntry />} />
              <Route path="results-entry/:examId" element={<TeacherResultEntry />} />
              <Route path="results" element={<TeacherResults />} />
              <Route path="reports" element={<TeacherReports />} />
              <Route path="exports" element={<TeacherExports />} />
              <Route path="grading-policy" element={<TeacherGradingPolicy />} />
              <Route path="schedule" element={<TeacherSchedule />} />
              <Route path="attendance" element={<TeacherSchedule focusAttendance />} />
              <Route path="attendance/:sessionId" element={<TeacherAttendanceSession />} />
              
              {/* Leaves Requests */}
              <Route path="leaves" element={<LeavesRequest />} />
          </Route>

          {/* Student Routes */}
          <Route path="/student/login" element={<Navigate to="/login" replace />} />
          <Route path="/student/register" element={<Navigate to="/login" replace />} />
          <Route
            path="/student"
            element={(
              <RoleScopeGuard role="STUDENT" scope="branch" redirectTo="/login">
                <BrandingProvider><StudentLayout /></BrandingProvider>
              </RoleScopeGuard>
            )}
          >
              <Route index element={<StudentDashboard />} />
              <Route path="results" element={<StudentResults />} />
              <Route path="rank" element={<StudentRank />} />
              <Route path="schedule" element={<StudentSchedule />} />
              <Route path="attendance" element={<StudentAttendance />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route path="change-password" element={<StudentChangePassword />} />
          </Route>

          {/* Parent Routes */}
          <Route
            path="/parent"
            element={(
              <RoleScopeGuard role="PARENT" scope="tenant" redirectTo="/login">
                <BrandingProvider><ParentLayout /></BrandingProvider>
              </RoleScopeGuard>
            )}
          >
              <Route index element={<ParentDashboard />} />
              <Route path="grades" element={<ParentStudentGrades />} />
              <Route path="attendance" element={<ParentStudentAttendance />} />
              <Route path="invoices" element={<ParentInvoices />} />
          </Route>

          {/* Platform Owner Routes */}
          <Route path="/platform">
            {/* Public Platform Routes */}
            <Route element={<PublicGuard />}>
              <Route path="login" element={<PlatformLogin />} />
              <Route path="register" element={<Navigate to="/platform/login" replace />} />
            </Route>

            {/* Protected Platform Routes */}
            <Route element={<PlatformGuard />}>
              <Route element={<PlatformWrapper />}>
                <Route index element={<PlatformDashboard />} />
                <Route path="tenants" element={<PlatformTenants />} />
                <Route path="tenants/new" element={<PlatformNewTenant />} />
                <Route path="tenants/:tenantId" element={<PlatformTenantDetails />} />
                <Route path="plans" element={<PlatformPlans />} />
                <Route path="audit" element={<PlatformAuditLogs />} />
                <Route path="monitoring" element={<PlatformMonitoring />} />
                <Route path="settings" element={<PlatformSettings />} />
              </Route>
            </Route>
          </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;
