/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import {
    LayoutDashboard,
    FileText,
    CalendarCheck,
    LogOut,
    User,
    Menu,
    X,
    Shield,
    Bell,
    CreditCard
} from 'lucide-react';
import api from '../services/api';

const ParentLayout = () => {
    const { user, logout } = useAuth();
    const { branding } = useBranding();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const navigate = useNavigate();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/parent' },
        { icon: FileText, label: 'Grades & Ranks', path: '/parent/grades' },
        { icon: CalendarCheck, label: 'Attendance', path: '/parent/attendance' },
        { icon: CreditCard, label: 'Fees & Invoices', path: '/parent/invoices' }
    ];

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/parent/notifications');
            if (res.data?.success) {
                setNotifications(res.data.data);
            }
        } catch (err) {
            console.error('Failed to load notifications', err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Poll for notifications every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const markAsRead = async (id) => {
        try {
            await api.put(`/parent/notifications/${id}/read`);
            fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

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
                            {branding?.logoUrl ? (
                                <img src={branding.logoUrl} alt="School Logo" className="h-10 w-10 rounded-xl bg-white object-contain p-1" />
                            ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-white">
                                    <Shield size={18} />
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="truncate text-base font-bold text-white">Parent Portal</p>
                                <p className="text-xs text-slate-400">{branding?.name || 'School'}</p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                        <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Navigation</p>
                        {menuItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/parent'}
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
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    <div className="border-t border-[var(--sidebar-border)] p-3">
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

            <div className="dashboard-main">
                <header className="dashboard-topbar flex items-center justify-between px-4 md:px-6">
                    <button className="p-2 lg:hidden text-slate-600" onClick={() => setSidebarOpen(true)}>
                        <Menu size={20} />
                    </button>

                    <div className="flex items-center gap-4 ml-auto relative">
                        {/* Notifications Bell */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-full relative"
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-100 bg-white shadow-xl z-50 overflow-hidden">
                                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                        <h4 className="font-bold text-slate-900 text-sm">Notifications</h4>
                                        <button className="text-xs font-bold text-[var(--primary)]" onClick={fetchNotifications}>Refresh</button>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                        {notifications.length === 0 ? (
                                            <p className="p-4 text-center text-xs text-slate-400 font-bold">No notifications</p>
                                        ) : (
                                            notifications.map(noti => (
                                                <div 
                                                    key={noti._id} 
                                                    onClick={() => markAsRead(noti._id)}
                                                    className={`p-4 border-b border-slate-50 cursor-pointer transition ${
                                                        !noti.isRead ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className="font-black text-xs text-slate-800">{noti.title}</p>
                                                        {!noti.isRead && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                                                    </div>
                                                    <p className="text-xs text-slate-500 leading-normal mb-1">{noti.message}</p>
                                                    <span className="text-[10px] font-bold text-slate-400">
                                                        {new Date(noti.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="h-8 w-px bg-slate-200" />
                        
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary)] text-white font-bold text-sm">
                                {user?.name?.charAt(0)}
                            </div>
                            <div className="hidden sm:block text-left">
                                <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">{user?.role}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="dashboard-page custom-scrollbar">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default ParentLayout;
