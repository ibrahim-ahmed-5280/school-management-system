import React, { useEffect, useState } from 'react';
import { Bell, Building2, Menu, Search, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAuthorizedBranches } from '../../services/api/teacher.api';
import { getStoredTeacherBranchId, setStoredTeacherBranchId } from '../../utils/storage';

const TeacherTopbar = ({ onToggleSidebar }) => {
    const { user } = useAuth();
    const [branches, setBranches] = useState([]);
    const [activeBranchId, setActiveBranchId] = useState(() => getStoredTeacherBranchId() || user?.branchId || '');

    useEffect(() => {
        const loadBranches = async () => {
            try {
                const response = await getAuthorizedBranches();
                const list = response?.data || response || [];
                setBranches(Array.isArray(list) ? list : []);
            } catch (error) {
                console.error('Failed to load authorized teacher branches', error);
            }
        };
        loadBranches();
    }, []);

    const changeBranch = (branchId) => {
        setStoredTeacherBranchId(branchId);
        setActiveBranchId(branchId);
        window.location.reload();
    };

    return (
        <header className="dashboard-topbar flex items-center justify-between gap-3 px-4 md:px-6">
            <div className="flex items-center gap-3">
                <button
                    onClick={onToggleSidebar}
                    className="rounded-lg border border-[var(--border)] bg-white p-2 text-slate-600 lg:hidden"
                >
                    <Menu size={18} />
                </button>

                <div className="hidden items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 md:flex">
                    <Search size={16} className="text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-48 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    />
                </div>

                <h1 className="text-lg font-bold text-slate-800">Teacher Dashboard</h1>
            </div>

            <div className="flex items-center gap-3">
                {branches.length > 1 && (
                    <label className="hidden items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 md:flex">
                        <Building2 size={15} className="text-slate-400" />
                        <select
                            value={activeBranchId}
                            onChange={(event) => changeBranch(event.target.value)}
                            className="max-w-40 bg-transparent text-xs font-semibold text-slate-700 outline-none"
                            aria-label="Active teaching branch"
                        >
                            {branches.map((branch) => <option key={branch._id} value={branch._id}>{branch.name}</option>)}
                        </select>
                    </label>
                )}
                <button className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
                    <Bell size={18} />
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />
                </button>

                <div className="hidden text-right sm:block">
                    <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{user?.role?.replace('_', ' ')}</p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-slate-100 text-slate-600">
                    {user?.name?.charAt(0) || <User size={17} />}
                </div>
            </div>
        </header>
    );
};

export default TeacherTopbar;
