import api from './api';

const tenantService = {
  // Auth
  login: (data) => api.post('/tenant/auth/login', data),

  // Branding
  getBranding: () => api.get('/tenant/settings/branding'),
  updateBranding: (data) => api.put('/tenant/settings/branding', data),

  // Branches
  getBranches: () => api.get('/tenant/branches'),
  getBranchClasses: (branchId) => api.get(`/tenant/branches/${branchId}/classes`),
  createBranch: (data) => api.post('/tenant/branches', data),
  getBranch: (id) => api.get(`/tenant/branches/${id}`),
  updateBranch: (id, data) => api.put(`/tenant/branches/${id}`, data),
  updateBranchStatus: (id, isActive) => api.patch(`/tenant/branches/${id}/status`, { isActive }),
  assignBranchAdmin: (branchId, userId) => api.post(`/tenant/branches/${branchId}/assign-branch-admin`, { userId }),

  // Users
  getUsers: (filters = {}) => {
      const params = new URLSearchParams(filters).toString();
      return api.get(`/tenant/users?${params}`);
  },
  createUser: (data) => api.post('/tenant/users', data),
  getUser: (id) => api.get(`/tenant/users/${id}`),
  updateUser: (id, data) => api.put(`/tenant/users/${id}`, data),
  updateUserStatus: (id, isActive) => api.patch(`/tenant/users/${id}/status`, { isActive }),

  // Academic Years
  getAcademicYears: () => api.get('/tenant/academic-years'),
  createAcademicYear: (data) => api.post('/tenant/academic-years', data),
  updateAcademicYear: (id, data) => api.put(`/tenant/academic-years/${id}`, data),
  setCurrentYear: (id) => api.patch(`/tenant/academic-years/${id}/set-current`),

  // Reports
  getOverviewReport: (branchId = '', academicYearId = '') => 
    api.get(`/tenant/reports/overview?branchId=${branchId}&academicYearId=${academicYearId}`),

  // Enrollment Operations
  promoteStudents: (data) => api.post('/tenant/enrollments/promote', data),
  transferBranch: (data) => api.post('/tenant/enrollments/transfer-branch', data),
  searchStudents: (q) => api.get('/students', { params: { q } }),

  // Audit Logs
  getAuditLogs: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/tenant/audit-logs?${params}`);
  }
};

export default tenantService;
