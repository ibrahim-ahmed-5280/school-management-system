import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Layers,
    CreditCard,
    History,
    Activity,
    Settings,
    LogOut,
    Menu,
    X,
    GraduationCap,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { filterMenuByPermission } from '../utils/permissions';

const NAVY = '#1b2a4a';
const BLUE = '#4477f5';

const menuItems = [
    { name: 'Dashboard',   icon: LayoutDashboard, path: '/platform', permission: 'platform.dashboard.view' },
    { name: 'Tenants',     icon: Users,           path: '/platform/tenants', permission: 'platform.tenants.view' },
    { name: 'Plans',       icon: Layers,          path: '/platform/plans', permission: 'platform.plans.view' },
    { name: 'Billing',     icon: CreditCard,      path: '/platform/billing', permission: 'platform.billing.view' },
    { name: 'Audit Logs',  icon: History,         path: '/platform/audit', permission: 'platform.audit.view' },
    { name: 'Monitoring',  icon: Activity,        path: '/platform/monitoring', permission: 'platform.monitoring.view' },
    { name: 'Settings',    icon: Settings,        path: '/platform/settings', permission: 'platform.settings.view' },
];

const PlatformSidebar = ({ locationPath, onClose, user, onLogout }) => {
    const visibleMenuItems = filterMenuByPermission(user, menuItems);

    return (
    <div className="flex h-full flex-col" style={{ background: NAVY }}>
        <div className="px-5 py-5 border-b border-white/10">
            <Link to="/platform" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: BLUE }}>
                    <GraduationCap size={18} className="text-white" />
                </div>
                <div className="min-w-0">
                    <p className="font-extrabold text-white text-[0.95rem] tracking-tight leading-none">MadrasaHub</p>
                    <p className="text-[11px] font-semibold text-white/40 mt-0.5">Platform Console</p>
                </div>
            </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
            <p className="px-3 pb-2.5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/30">Navigation</p>
            {visibleMenuItems.map((item) => {
                const isActive = locationPath === item.path ||
                    (item.path !== '/platform' && locationPath.startsWith(item.path));
                return (
                    <Link
                        key={item.name}
                        to={item.path}
                        onClick={onClose}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 group"
                        style={isActive ? { background: BLUE, color: '#fff' } : { color: 'rgba(255,255,255,0.55)' }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}}
                    >
                        <item.icon size={17} className="flex-shrink-0" />
                        <span>{item.name}</span>
                        {isActive && <ChevronRight size={14} className="ml-auto opacity-70" />}
                    </Link>
                );
            })}
        </nav>

        <div className="border-t border-white/10 p-3 space-y-1">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-sm font-bold" style={{ background: BLUE }}>
                    {(user?.fullName || user?.name || 'P')[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-white truncate">{user?.fullName || user?.name || 'Platform Owner'}</p>
                    <p className="text-[10px] text-white/40 font-semibold">Owner</p>
                </div>
            </div>
            <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/50 hover:bg-rose-500/15 hover:text-rose-300 transition-all">
                <LogOut size={16} />
                <span>Sign Out</span>
            </button>
        </div>
    </div>
    );
};

const PlatformLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/platform/login');
    };

    const currentPage = filterMenuByPermission(user, menuItems).find(item =>
        location.pathname === item.path ||
        (item.path !== '/platform' && location.pathname.startsWith(item.path))
    );

    return (
        <div className="dashboard-shell">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <PlatformSidebar
                    locationPath={location.pathname}
                    onClose={() => setSidebarOpen(false)}
                    user={user}
                    onLogout={handleLogout}
                />
            </aside>

            {/* Main */}
            <main className="dashboard-main">
                {/* Topbar */}
                <header className="dashboard-topbar flex items-center justify-between px-4 md:px-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(prev => !prev)}
                            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 lg:hidden hover:bg-slate-50 transition"
                        >
                            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                        <div>
                            <h1 className="text-[1rem] font-extrabold text-slate-800">
                                {currentPage?.name || 'Platform Admin'}
                            </h1>
                            <p className="text-[11px] font-semibold text-slate-400 hidden sm:block">MadrasaHub Owner Console</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-bold text-slate-800">{user?.fullName || user?.name || 'Platform Owner'}</p>
                            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Platform Owner</p>
                        </div>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white text-sm font-bold flex-shrink-0"
                            style={{ background: NAVY }}>
                            {(user?.fullName || user?.name || 'P')[0].toUpperCase()}
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

export default PlatformLayout;
