import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export const RoleGuard = ({ allowedRoles = [] }) => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
        return <Navigate to="/tenant/login" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <div className="p-10 text-center text-red-500 font-bold text-2xl">403 - Forbidden Access</div>;
    }

    return <Outlet />;
};
