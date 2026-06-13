import http from './http';

export const unifiedLogin = async (identifier, password, tenantDomain = '') => {
    const isEmail = String(identifier).includes('@');
    const payload = {
        password,
        [isEmail ? 'email' : 'username']: identifier,
        ...(tenantDomain ? { tenantDomain } : {})
    };
    const response = await http.post('/auth/login', payload);
    return response.data;
};

export const tenantLogin = async (email, password) => {
    const response = await http.post('/auth/login', { 
        email, 
        password,
        requiredRoles: ['super_admin', 'finance_director']
    });
    return response.data;
};

export const registerTenant = async (payload) => {
    const response = await http.post('/auth/register-tenant', payload);
    return response.data;
};

export const getMe = async () => {
    const response = await http.get('/auth/me');
    return response.data;
};

export const platformLogin = async (email, password) => {
    const response = await http.post('/platform/auth/login', { email, password });
    return response.data;
};

export const getBranding = async () => {
    const response = await http.get('/tenant/settings/branding');
    return response.data;
};
