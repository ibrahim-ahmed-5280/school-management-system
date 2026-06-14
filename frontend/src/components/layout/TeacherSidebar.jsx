import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';
import {
    LayoutDashboard,
    BookOpen,
    PenTool,
    BarChart3,
    LogOut,
    GraduationCap,
    CalendarCheck,
    CalendarDays,
    Settings,
    FileSpreadsheet,
    User
} from 'lucide-react';
import { filterMenuByPermission } from '../../utils/permissions';

const TeacherSidebar = ({ className = '', onNavigate }) => {
    const { logout, user } = useAuth();
    const { branding } = useBranding();
    const navigate = useNavigate();

    const menuItems = filterMenuByPermission(user, [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/teacher', permission: 'teacher.dashboard.view' },
        { label: 'My Schedule', icon: CalendarDays, path: '/teacher/schedule', permission: 'teacher.schedule.view' },
        { label: 'Open Attendance', icon: CalendarCheck, path: '/teacher/attendance', permission: 'teacher.attendance.view' },
        { label: 'Leaves Request', icon: CalendarCheck, path: '/teacher/leaves', anyPermission: ['teacher.leaves.create', 'hr.leaves.create'] },
        { label: 'Templates', icon: FileSpreadsheet, path: '/teacher/templates', permission: 'teacher.examTemplates.view' },
        { label: 'Categories', icon: Settings, path: '/teacher/categories', permission: 'teacher.examCategories.view' },
        { label: 'Exams List', icon: BookOpen, path: '/teacher/exams', permission: 'teacher.exams.view' },
        { label: 'Enter Results', icon: PenTool, path: '/teacher/results-entry', permission: 'teacher.results.enter' },
        { label: 'Results Viewer', icon: BarChart3, path: '/teacher/results', permission: 'teacher.results.view' },
        { label: 'Grading Policy', icon: FileSpreadsheet, path: '/teacher/grading-policy', permission: 'teacher.gradingPolicy.view' },
        { label: 'My Profile', icon: User, path: '/teacher/profile' }
    ]);

    const handleLogout = () => {
        logout();
        navigate('/teacher/login');
    };

    return (
        <aside className={`w-64 bg-[var(--sidebar-bg)] text-slate-200 border-r border-[var(--sidebar-border)] ${className}`}>
            <div className="flex h-full flex-col">
                <div className="border-b border-[var(--sidebar-border)] px-5 py-5">
                    <div className="flex items-center gap-3">
                        {branding?.logoUrl ? (
                            <img src={branding.logoUrl} alt="Logo" className="h-10 w-10 rounded-xl bg-white object-contain p-1" />
                        ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-white">
                                <GraduationCap size={18} />
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="truncate text-base font-bold text-white">{branding?.tenantName || 'School'}</p>
                            <p className="text-xs text-slate-400">Teacher Portal</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                    <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Menu</p>
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/teacher'}
                            onClick={onNavigate}
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
    );
};

export default TeacherSidebar;
