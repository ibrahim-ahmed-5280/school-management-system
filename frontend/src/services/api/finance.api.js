import http from './http';

export const fetchFeeStructures = (params) => http.get('/tenant/finance/fee-structures', { params });
export const createFeeStructure = (data) => http.post('/tenant/finance/fee-structures', data);
export const getFeeStructure = (id) => http.get(`/tenant/finance/fee-structures/${id}`);
export const updateFeeStructure = (id, data) => http.put(`/tenant/finance/fee-structures/${id}`, data);
export const deleteFeeStructure = (id) => http.delete(`/tenant/finance/fee-structures/${id}`);

export const getFinancePolicies = () => http.get('/tenant/finance/policies');
export const updateFinancePolicies = (data) => http.put('/tenant/finance/policies', data);

export const getInvoices = (params) => http.get('/tenant/finance/invoices', { params });
export const getInvoice = (id) => http.get(`/tenant/finance/invoices/${id}`);
export const generateInvoices = (data) => http.post('/tenant/finance/invoices/generate', data);

export const getPayments = (params) => http.get('/tenant/finance/payments', { params });
export const getPaymentsSummary = (params) => http.get('/tenant/finance/payments/summary', { params });
export const getOutstanding = (params) => http.get('/tenant/finance/outstanding', { params });

export const getReceiptBranding = (branchId) => http.get(`/tenant/finance/branches/${branchId}/receipt-branding`);
export const getRevenueReport = (params) => http.get('/tenant/finance/reports/revenue', { params });
