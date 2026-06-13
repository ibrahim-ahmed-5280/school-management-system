import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TeacherSidebar from '../components/layout/TeacherSidebar';
import TeacherTopbar from '../components/layout/TeacherTopbar';

const TeacherLayout = () => {
    const { user, loading } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (loading) return <div className="h-screen flex items-center justify-center font-semibold text-[var(--primary)]">Loading...</div>;

    if (!user || user.role !== 'teacher' || user.scope !== 'branch') {
        return <Navigate to="/teacher/login" state={{ from: location }} replace />;
    }

    return (
        <div className="dashboard-shell">
            {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            <TeacherSidebar
                className={`fixed inset-y-0 left-0 z-40 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
                onNavigate={() => setSidebarOpen(false)}
            />

            <div className="dashboard-main">
                <TeacherTopbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

                <main className="dashboard-page">
                    <div className="mx-auto max-w-[1600px]">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default TeacherLayout;
