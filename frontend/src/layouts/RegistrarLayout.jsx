import React, { useState } from 'react';
import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { LayoutDashboard, UserPlus, Users, ArrowRightLeft, LogOut, Menu, X, User } from 'lucide-react';
import { filterMenuByPermission } from '../utils/permissions';

const RegistrarLayout = () => {
    const { user, loading, logout } = useAuth();
    const { branding } = useBranding();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (loading) return <div>Loading...</div>;

    if (!user || user.role !== 'registrar' || user.scope !== 'branch') {
        return <Navigate to="/registrar/login" replace />;
    }

    const menu = filterMenuByPermission(user, [
        { path: '/registrar', name: 'Dashboard', icon: LayoutDashboard, permission: 'registrar.dashboard.view' },
        { path: '/registrar/admissions', name: 'New Admission', icon: UserPlus, permission: 'students.create' },
        { path: '/registrar/students', name: 'Students Directory', icon: Users, permission: 'students.view' },
        { path: '/registrar/enrollments/new', name: 'Re-Enrollment', icon: Users, permission: 'enrollments.create' },
        { path: '/registrar/transfers', name: 'Transfers', icon: ArrowRightLeft, permission: 'transfers.branch.create' }
    ]);

    return (
        <div className="dashboard-shell">
            {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] text-slate-200 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex h-full flex-col">
                    <div className="border-b border-[var(--sidebar-border)] px-5 py-5">
                        <div className="flex items-center gap-3">
                            {branding.logoUrl ? (
                                <img src={branding.logoUrl} alt="Logo" className="h-10 w-10 rounded-xl bg-white object-contain p-1" />
                            ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-sm font-extrabold text-white">RG</div>
                            )}
                            <div className="min-w-0">
                                <p className="truncate text-base font-bold text-white">{branding.tenantName || 'School App'}</p>
                                <p className="text-xs text-slate-400">Registrar</p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                        <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Menu</p>
                        {menu.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/registrar'}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                                        isActive
                                            ? 'bg-[var(--primary)] text-white'
                                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                    }`
                                }
                            >
                                <item.icon size={18} />
                                <span>{item.name}</span>
                            </NavLink>
                        ))}
                    </nav>

                    <div className="border-t border-[var(--sidebar-border)] p-3">
                        <button
                            onClick={logout}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-200 hover:bg-rose-600/20 hover:text-rose-300"
                        >
                            <LogOut size={18} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            <div className="dashboard-main">
                <header className="dashboard-topbar flex items-center justify-between px-4 md:px-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen((prev) => !prev)}
                            className="rounded-lg border border-[var(--border)] bg-white p-2 text-slate-600 lg:hidden"
                        >
                            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                        <h2 className="text-lg font-bold text-slate-800">Registrar Dashboard</h2>
                    </div>

                    <div className="flex items-center gap-3">

                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                            <p className="text-xs uppercase tracking-wide text-slate-500">{user?.role?.replace('_', ' ')}</p>
                        </div>

                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-slate-100 text-slate-600">
                            <User size={18} />
                        </div>
                    </div>
                </header>

                <main className="dashboard-page">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default RegistrarLayout;
