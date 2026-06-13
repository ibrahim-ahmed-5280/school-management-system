/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { getBranding } from '../services/api/auth.api';
import { API_ORIGIN } from '../services/api';
import tenantService from '../services/tenantService';
import { useAuth } from './AuthContext';

const BrandingContext = createContext();

const DEFAULT_BRANDING = {
    tenantName: '',
    name: '',
    primaryColor: '#2563eb',
    secondaryColor: '#22c55e',
    logoUrl: ''
};

const isSameBranding = (a = {}, b = {}) =>
    a.tenantName === b.tenantName &&
    a.name === b.name &&
    a.primaryColor === b.primaryColor &&
    a.secondaryColor === b.secondaryColor &&
    a.logoUrl === b.logoUrl;

const normalizeLogoUrl = (logoUrl) => {
    if (!logoUrl) return '';
    if (logoUrl.startsWith('http')) return logoUrl;
    return `${API_ORIGIN}${logoUrl}`;
};

const normalizeBranding = (raw = {}, previous = DEFAULT_BRANDING) => {
    const has = (key) => Object.prototype.hasOwnProperty.call(raw, key);
    const tenantName = (has('tenantName') ? raw.tenantName : (has('name') ? raw.name : previous.tenantName)) || '';
    const primaryColor = (has('primaryColor') ? raw.primaryColor : previous.primaryColor) || DEFAULT_BRANDING.primaryColor;
    const secondaryColor = (has('secondaryColor') ? raw.secondaryColor : previous.secondaryColor) || DEFAULT_BRANDING.secondaryColor;
    const logoRaw = has('logoUrl') ? raw.logoUrl : previous.logoUrl;

    return {
        tenantName,
        name: (has('name') ? raw.name : previous.name) || tenantName || '',
        primaryColor,
        secondaryColor,
        logoUrl: normalizeLogoUrl(logoRaw || '')
    };
};

export const BrandingProvider = ({ children }) => {
    const { user } = useAuth();
    const [branding, setBranding] = useState(DEFAULT_BRANDING);

    const applyBranding = useCallback((data) => {
        const root = document.documentElement;
        if (data.primaryColor) {
            root.style.setProperty('--primary', data.primaryColor);
            root.style.setProperty('--primary-dark', data.secondaryColor || data.primaryColor);
        }
        if (data.secondaryColor) {
            root.style.setProperty('--secondary', data.secondaryColor);
        }
    }, []);

    const applyBrandingState = useCallback((raw = {}) => {
        setBranding((previous) => {
            const normalized = normalizeBranding(raw, previous);
            applyBranding(normalized);
            return isSameBranding(previous, normalized) ? previous : normalized;
        });
    }, [applyBranding]);

    const loadBranding = useCallback(async () => {
        try {
            if (user?.branding) {
                applyBrandingState(user.branding);
            }

            const data = await getBranding();
            const brandingData = data?.data || data;
            if (brandingData) {
                applyBrandingState(brandingData);
            }
        } catch (error) {
            console.error('Failed to load branding:', error);
        }
    }, [applyBrandingState, user]);

    useEffect(() => {
        if (!user) return;
        if (
            user.role === 'super_admin' ||
            user.role === 'finance_director' ||
            user.role === 'branch_admin' ||
            user.role === 'registrar' ||
            user.role === 'cashier' ||
            user.role === 'teacher' ||
            user.role === 'student'
        ) {
            loadBranding();
        }
    }, [user, loadBranding]);

    const updateBranding = useCallback(async (payload) => {
        const res = await tenantService.updateBranding(payload);
        const updated = res?.data?.tenant || res?.data || payload;
        applyBrandingState(updated);
        return res?.data || res;
    }, [applyBrandingState]);

    return (
        <BrandingContext.Provider value={{ branding, loadBranding, updateBranding }}>
            {children}
        </BrandingContext.Provider>
    );
};

export const useBranding = () => useContext(BrandingContext);
