import React, { useState } from 'react';
import {
    LayoutDashboard,
    Palette,
    MapPin,
    Users,
    Calendar,
    BarChart3,
    ArrowUpCircle,
    ArrowRightLeft,
    History,
    LogOut,
    Menu,
    X,
    User as UserIcon
} from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';

const TenantLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const { branding } = useBranding();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/tenant' },
        { icon: Palette, label: 'Branding', path: '/tenant/branding' },
        { icon: MapPin, label: 'Branches', path: '/tenant/branches' },
        { icon: Users, label: 'Users', path: '/tenant/users' },
        { icon: Calendar, label: 'Academic Years', path: '/tenant/academic-years' },
        { icon: BarChart3, label: 'Reports', path: '/tenant/reports' },
        { icon: ArrowUpCircle, label: 'Promotion', path: '/tenant/enrollments/promote' },
        { icon: ArrowRightLeft, label: 'Transfer', path: '/tenant/enrollments/transfer' },
        { icon: History, label: 'Audit Logs', path: '/tenant/audit-logs' }
    ];

    const handleLogout = () => {
        logout();
        navigate('/tenant/login');
    };

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
                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[var(--primary)] text-sm font-extrabold text-white">
                                {branding.logoUrl ? (
                                    <img src={branding.logoUrl} alt="logo" className="h-full w-full object-contain bg-white p-1" />
                                ) : (
                                    branding.tenantName?.charAt(0) || 'E'
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-base font-bold text-white">{branding.tenantName || 'Tenant Admin'}</p>
                                <p className="text-xs text-slate-400">Super Admin</p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                        <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Menu</p>
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                                        isActive
                                            ? 'bg-[var(--primary)] text-white'
                                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    <item.icon size={18} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="border-t border-[var(--sidebar-border)] p-3">
                        <div className="mb-3 rounded-lg bg-slate-700/30 px-3 py-2">
                            <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
                            <p className="text-xs uppercase tracking-wide text-slate-300">{user?.scope || 'Tenant'} scope</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-200 hover:bg-rose-600/20 hover:text-rose-300"
                        >
                            <LogOut size={18} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            <main className="dashboard-main">
                <header className="dashboard-topbar flex items-center justify-between px-4 md:px-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen((prev) => !prev)}
                            className="rounded-lg border border-[var(--border)] bg-white p-2 text-slate-600 lg:hidden"
                        >
                            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                        <h2 className="text-lg font-bold text-slate-800">
                            {menuItems.find((i) => i.path === location.pathname)?.label || 'System Control'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">

                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                            <p className="text-xs uppercase tracking-wide text-slate-500">{user?.role?.replace('_', ' ')}</p>
                        </div>

                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-slate-100 text-slate-600">
                            <UserIcon size={18} />
                        </div>
                    </div>
                </header>

                <div className="dashboard-page">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default TenantLayout;
