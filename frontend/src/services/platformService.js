import api from './api';
import axios from 'axios';
import { API_BASE_URL } from './api';

// Public API — no auth token needed
const publicApi = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' } });

const platformService = {
  getDashboardStats: () => api.get('/platform/dashboard'),
  
  getTenants: () => api.get('/platform/tenants'),
  createTenant: (data) => api.post('/platform/tenants', data),
  getTenantDetails: (id) => api.get(`/platform/tenants/${id}`),
  updateTenantStatus: (id, status) => api.patch(`/platform/tenants/${id}/status`, { status }),
  updateTenantPlan: (id, planId) => api.put(`/platform/tenants/${id}/plan`, { planId }),
  
  getPlans: () => api.get('/platform/plans'),
  createPlan: (data) => api.post('/platform/plans', data),
  updatePlan: (id, data) => api.put(`/platform/plans/${id}`, data),
  deletePlan: (id) => api.delete(`/platform/plans/${id}`),
  
  getAuditLogs: () => api.get('/platform/audit-logs'),
  
  getSystemHealth: () => api.get('/platform/health'),
  
  getSettings: () => api.get('/platform/settings'),
  updateSettings: (data) => api.put('/platform/settings', data),
  testEmail: (data) => api.post('/platform/settings/test-email', data),

  // ── Public endpoints (no auth required, for landing page) ──
  getPublicStats: () => publicApi.get('/public/stats'),
  getPublicPlans: () => publicApi.get('/public/plans'),
};

export default platformService;

