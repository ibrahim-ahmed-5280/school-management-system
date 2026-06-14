import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Settings,
    CreditCard,
    FileText,
    History,
    PieChart,
    AlertCircle,
    Image as ImageIcon
} from 'lucide-react';
import { useBranding } from '../../context/BrandingContext';
import { useAuth } from '../../context/AuthContext';
import { filterMenuByPermission } from '../../utils/permissions';

const Sidebar = ({ className = '', onNavigate }) => {
    const { branding } = useBranding();
    const { user } = useAuth();

    const menuItems = filterMenuByPermission(user, [
        { name: 'Finance Dashboard', path: '/finance', icon: LayoutDashboard, permission: 'finance.dashboard.view' },
        { name: 'Policies', path: '/finance/policies', icon: Settings, permission: 'finance.policies.view' },
        { name: 'Fee Structures', path: '/finance/fee-structures', icon: CreditCard, permission: 'finance.feeStructures.view' },
        { name: 'Invoices', path: '/finance/invoices', icon: FileText, permission: 'finance.invoices.view' },
        { name: 'Payments', path: '/finance/payments', icon: History, permission: 'finance.payments.view' },
        { name: 'Reports', path: '/finance/reports', icon: PieChart, permission: 'finance.reports.view' },
        { name: 'Outstanding', path: '/finance/outstanding', icon: AlertCircle, permission: 'finance.outstanding.view' },
        { name: 'Receipt Branding', path: '/finance/receipt-branding', icon: ImageIcon, permission: 'finance.receiptBranding.view' }
    ]);

    return (
        <aside className={`w-64 bg-[var(--sidebar-bg)] text-slate-200 border-r border-[var(--sidebar-border)] ${className}`}>
            <div className="flex h-full flex-col">
                <div className="border-b border-[var(--sidebar-border)] px-5 py-5">
                    <div className="flex items-center gap-3">
                        {branding.logoUrl ? (
                            <img src={branding.logoUrl} alt="Logo" className="h-10 w-10 rounded-xl bg-white object-contain p-1" />
                        ) : (
                            <div className="h-10 w-10 rounded-xl bg-[var(--primary)]" />
                        )}
                        <div className="min-w-0">
                            <p className="truncate text-base font-bold text-white">{branding.name || 'Tenant Finance'}</p>
                            <p className="text-xs text-slate-400">Finance</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                    <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Menu</p>
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/finance'}
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
            </div>
        </aside>
    );
};

export default Sidebar;
