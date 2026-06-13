import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { useAuth } from '../context/AuthContext';

const TenantFinanceLayout = () => {
    const { user, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (loading) return null;

    if (!user) {
        return <Navigate to="/tenant/login" replace />;
    }

    if (user.role !== 'finance_director' && user.role !== 'super_admin') {
        return <div className="p-10 text-center text-red-500 font-bold">Unauthorized Access</div>;
    }

    return (
        <div className="dashboard-shell">
            {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            <Sidebar
                className={`fixed inset-y-0 left-0 z-40 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
                onNavigate={() => setSidebarOpen(false)}
            />

            <div className="dashboard-main">
                <Topbar title="Finance Dashboard" onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
                <main className="dashboard-page">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default TenantFinanceLayout;
