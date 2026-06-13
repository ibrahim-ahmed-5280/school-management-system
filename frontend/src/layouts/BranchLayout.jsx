import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, User, X } from 'lucide-react';
import BranchSidebar from '../components/layout/BranchSidebar';

const BranchLayout = () => {
    const { user, loading, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

    if (!user || user.role !== 'branch_admin' || user.scope !== 'branch') {
        return <Navigate to="/branch/login" replace />;
    }

    return (
        <div className="dashboard-shell">
            {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            <BranchSidebar
                className={`fixed inset-y-0 left-0 z-40 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
                onNavigate={() => setSidebarOpen(false)}
            />

            <div className="dashboard-main">
                <header className="dashboard-topbar flex items-center justify-between px-4 md:px-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen((prev) => !prev)}
                            className="rounded-lg border border-[var(--border)] bg-white p-2 text-slate-600 lg:hidden"
                        >
                            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                        <h2 className="text-lg font-bold text-slate-800">Branch Dashboard</h2>
                    </div>

                    <div className="flex items-center gap-3">

                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                            <p className="text-xs uppercase tracking-wide text-slate-500">{user.role.replace('_', ' ')}</p>
                        </div>

                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-slate-100 text-slate-600">
                            <User size={18} />
                        </div>

                        <button
                            onClick={logout}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </header>

                <main className="dashboard-page">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default BranchLayout;
