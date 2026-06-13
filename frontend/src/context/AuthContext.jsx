/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext } from 'react';
import {
    unifiedLogin as apiUnifiedLogin,
    platformLogin as apiPlatformLogin,
    registerTenant as apiRegisterTenant
} from '../services/api/auth.api';
import { branchLogin as apiBranchLogin } from '../services/api/branchAuth.api';
import { apiStudentLogin } from '../services/api/student.api';
import { clearStoredUser, getStoredUser, setStoredUser } from '../utils/storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => getStoredUser());
    const loading = false;

    const login = async (identifier, password, tenantDomain = '') => {
        const data = await apiUnifiedLogin(identifier, password, tenantDomain);
        setUser(data);
        setStoredUser(data);
        return data;
    };

    const branchLogin = async (email, password) => {
        const data = await apiBranchLogin(email, password);
        setUser(data);
        setStoredUser(data);
        return data;
    };

    const registrarLogin = async (email, password) => {
        const data = await apiBranchLogin(email, password);
        if (data.role !== 'registrar') {
            throw { response: { data: { message: 'Access Denied: Registrars only.' } } };
        }
        setUser(data);
        setStoredUser(data);
        return data;
    };

    const cashierLogin = async (email, password) => {
        const data = await apiBranchLogin(email, password); // Use shared branch login
        if (data.role !== 'cashier') {
            throw { response: { data: { message: 'Access Denied: Cashiers only.' } } };
        }
        setUser(data);
        setStoredUser(data);
        return data;
    };

    const teacherLogin = async (email, password) => {
        const data = await apiBranchLogin(email, password);
        if (data.role !== 'teacher') {
            throw { response: { data: { message: 'Access Denied: Teachers only.' } } };
        }
        setUser(data);
        setStoredUser(data);
        return data;
    };

    const studentLogin = async (studentCode, password) => {
        const data = await apiStudentLogin(studentCode, password);
        if (data.role !== 'student') {
            throw { response: { data: { message: 'Access Denied: Students only.' } } };
        }
        setUser(data);
        setStoredUser(data);
        return data;
    };

    const platformLogin = async (email, password) => {
        const data = await apiPlatformLogin(email, password);
        setUser(data);
        setStoredUser(data);
        return data;
    };

    const registerTenant = async (payload) => {
        const data = await apiRegisterTenant(payload);
        // If pending approval, do NOT create a session — just return the data
        if (!data.pending) {
            setUser(data);
            setStoredUser(data);
        }
        return data;
    };


    const logout = () => {
        const role = String(user?.role || '').toLowerCase();
        setUser(null);
        clearStoredUser();
        
        if (role === 'platform_owner') {
            window.location.href = '/platform/login';
        } else if (role === 'super_admin') {
            window.location.href = '/tenant/login';
        } else if (role === 'finance_director') {
            window.location.href = '/finance/login';
        } else if (role === 'registrar') {
            window.location.href = '/registrar/login';
        } else if (role === 'cashier') {
            window.location.href = '/cashier/login';
        } else if (role === 'teacher') {
            window.location.href = '/teacher/login';
        } else if (role === 'student') {
            window.location.href = '/student/login';
        } else {
            window.location.href = '/branch/login';
        }
    };

    return (
        <AuthContext.Provider value={{ 
            token: user?.token || '',
            user, 
            loading, 
            login, 
            tenantLogin: login, 
            registerTenant,
            branchLogin, 
            platformLogin,
            registrarLogin, 
            cashierLogin, 
            teacherLogin, 
            studentLogin, 
            logout 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
