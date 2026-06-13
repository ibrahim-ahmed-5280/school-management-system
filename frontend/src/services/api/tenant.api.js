import http from './http';

export const getBranches = () => http.get('/tenant/branches');
export const getAcademicYears = () => http.get('/tenant/academic-years');
export const getClasses = (params) => http.get('/academic/classes', { params }); // Check if this is correct base
export const getTenantBranding = () => http.get('/tenant/settings/branding').then((res) => res.data?.data || res.data);
