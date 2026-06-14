import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Building,
    BookOpen,
    Users,
    GraduationCap,
    ArrowUpCircle,
    FileText,
    PieChart,
    Activity,
    CalendarDays,
    CalendarCheck,
    DollarSign
} from 'lucide-react';
import { useBranding } from '../../context/BrandingContext';
import { useAuth } from '../../context/AuthContext';
import { filterMenuByPermission } from '../../utils/permissions';

const BranchSidebar = ({ className = '', onNavigate }) => {
    const { branding } = useBranding();
    const { user } = useAuth();

    const menuItems = filterMenuByPermission(user, [
        { name: 'Dashboard', path: '/branch', icon: LayoutDashboard, permission: 'branch.dashboard.view' },
        { name: 'Branch Profile', path: '/branch/profile', icon: Building, permission: 'branch.profile.view' },
        { name: 'Classes', path: '/branch/classes', icon: BookOpen, permission: 'branch.classes.view' },
        { name: 'Timetable', path: '/branch/timetable', icon: CalendarDays, permission: 'branch.timetable.view' },
        { name: 'Staff Management', path: '/branch/staff', icon: Users, permission: 'branch.staff.view' },
        { name: 'Leaves Manager', path: '/branch/hr/leaves', icon: CalendarCheck, permission: 'hr.leaves.review' },
        { name: 'Payroll Dashboard', path: '/branch/hr/payroll', icon: DollarSign, permission: 'payroll.view' },
        { name: 'Students', path: '/branch/students', icon: GraduationCap, permission: 'branch.students.view' },
        { name: 'Promotions', path: '/branch/promotions', icon: ArrowUpCircle, permission: 'branch.promotions.run' },
        { name: 'Teacher Assignments', path: '/branch/assignments', icon: BookOpen, permission: 'branch.assignments.view' },
        { name: 'Exams', path: '/branch/exams', icon: FileText, permission: 'branch.exams.view' },
        { name: 'Results', path: '/branch/results', icon: Activity, permission: 'branch.results.view' },
        { name: 'Student Results', path: '/branch/results/student', icon: Activity, permission: 'branch.results.view' },
        { name: 'Reports', path: '/branch/reports', icon: PieChart, permission: 'branch.reports.view' }
    ]);

    return (
        <aside className={`w-64 bg-[var(--sidebar-bg)] text-slate-200 border-r border-[var(--sidebar-border)] ${className}`}>
            <div className="flex h-full flex-col">
                <div className="border-b border-[var(--sidebar-border)] px-5 py-5">
                    <div className="flex items-center gap-3">
                        {branding.logoUrl ? (
                            <img src={branding.logoUrl} alt="Logo" className="h-10 w-10 rounded-xl bg-white object-contain p-1" />
                        ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-sm font-extrabold text-white">BR</div>
                        )}
                        <div className="min-w-0">
                            <p className="truncate text-base font-bold text-white">{branding.name || 'School App'}</p>
                            <p className="text-xs text-slate-400">Branch Admin</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                    <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Menu</p>
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/branch'}
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
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="border-t border-[var(--sidebar-border)] px-4 py-3 text-xs text-slate-400">Branch Console</div>
            </div>
        </aside>
    );
};

export default BranchSidebar;
