import React, { useCallback, useState, useEffect } from 'react';
import { 
  Users as UsersIcon, 
  UserPlus, 
  Search, 
  Filter, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Activity, 
  ChevronDown, 
  X, 
  Loader2,
  Lock,
  MoreVertical,
  CheckCircle2
} from 'lucide-react';
import tenantService from '../../services/tenantService';
import { useAuth } from '../../context/AuthContext';

const UsersManagement = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filters, setFilters] = useState({ branchId: '', role: '' });
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: '',
        scope: '',
        branchId: '',
        students: []
    });
    const [studentSearch, setStudentSearch] = useState('');
    const [studentOptions, setStudentOptions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeDropdownUserId, setActiveDropdownUserId] = useState(null);
    const [editModal, setEditModal] = useState({ open: false, user: null, name: '', email: '', role: '', scope: '', branchId: '' });
    const [passwordResetModal, setPasswordResetModal] = useState({ open: false, user: null, tempPassword: '' });
    const [permissionModal, setPermissionModal] = useState({
        open: false,
        user: null,
        catalog: [],
        allow: [],
        deny: [],
        defaults: [],
        effective: []
    });
    const [permissionSubmitting, setPermissionSubmitting] = useState(false);

    const toggleDropdown = (userId) => {
        setActiveDropdownUserId(activeDropdownUserId === userId ? null : userId);
    };

    const fetchData = useCallback(async () => {
        try {
            const [usersRes, branchesRes] = await Promise.all([
                tenantService.getUsers(filters),
                tenantService.getBranches()
            ]);
            setUsers(usersRes.data);
            setBranches(branchesRes.data);
        } catch (error) {
            console.error('Failed to load users/branches:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await tenantService.createUser(formData);
            await fetchData();
            setIsModalOpen(false);
            setFormData({ name: '', email: '', password: '', role: '', scope: '', branchId: '', students: [] });
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to create user');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            await tenantService.updateUserStatus(id, !currentStatus);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update user status');
        }
    };

    const handleEditUserSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await tenantService.updateUser(editModal.user._id, {
                name: editModal.name,
                email: editModal.email,
                role: editModal.role,
                scope: editModal.scope,
                branchId: editModal.branchId
            });
            await fetchData();
            setEditModal({ open: false, user: null, name: '', email: '', role: '', scope: '', branchId: '' });
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update user');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePasswordReset = async (user) => {
        if (!window.confirm(`Are you sure you want to reset the password for ${user.name}?`)) return;
        try {
            const res = await tenantService.resetUserPassword(user._id);
            setPasswordResetModal({
                open: true,
                user,
                tempPassword: res.data.temporaryPassword
            });
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to reset password');
        }
    };

    const handleCopyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Password copied to clipboard!');
    };

    const handleOpenPermissions = async (user) => {
        try {
            const res = await tenantService.getUserPermissions(user._id);
            const { catalog, allow, deny, defaults, effective } = res.data;
            setPermissionModal({
                open: true,
                user,
                catalog: catalog || [],
                allow: allow || [],
                deny: deny || [],
                defaults: defaults || [],
                effective: effective || []
            });
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to load user permissions');
        }
    };

    const handlePermissionChange = (key, state) => {
        setPermissionModal((current) => {
            let nextAllow = [...current.allow];
            let nextDeny = [...current.deny];

            nextAllow = nextAllow.filter((k) => k !== key);
            nextDeny = nextDeny.filter((k) => k !== key);

            if (state === 'allow') {
                nextAllow.push(key);
            } else if (state === 'deny') {
                nextDeny.push(key);
            }

            return {
                ...current,
                allow: nextAllow,
                deny: nextDeny
            };
        });
    };

    const handleSavePermissions = async (e) => {
        e.preventDefault();
        setPermissionSubmitting(true);
        try {
            await tenantService.updateUserPermissions(permissionModal.user._id, {
                allow: permissionModal.allow,
                deny: permissionModal.deny
            });
            alert('Permissions updated successfully');
            setPermissionModal((current) => ({ ...current, open: false }));
            await fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update user permissions');
        } finally {
            setPermissionSubmitting(false);
        }
    };

    const roles = [
        { value: 'finance_director', label: 'Finance Director', scope: 'tenant' },
        { value: 'parent', label: 'Parent', scope: 'tenant' },
        { value: 'branch_admin', label: 'Branch Admin', scope: 'branch' },
        { value: 'registrar', label: 'Registrar', scope: 'branch' },
        { value: 'cashier', label: 'Cashier', scope: 'branch' },
        { value: 'teacher', label: 'Teacher', scope: 'branch' }
    ];

    const searchStudents = async () => {
        if (!studentSearch.trim()) return;
        const response = await tenantService.searchStudents(studentSearch.trim());
        setStudentOptions(response.data || []);
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const toggleStudent = (studentId) => {
        setFormData((current) => ({
            ...current,
            students: current.students.includes(studentId)
                ? current.students.filter((id) => id !== studentId)
                : [...current.students, studentId]
        }));
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                     <h1 className="text-xl font-black text-slate-900 tracking-tight mb-1">Personnel <span className="text-[var(--primary)]">Resources</span></h1>
                     <p className="text-slate-500 text-xs font-bold">Manage administrative and academic user provision across institutional scopes.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="h-10 px-5 bg-[var(--primary)] text-white rounded-lg font-black tracking-widest text-[10px] uppercase flex items-center gap-2 shadow hover:bg-[var(--primary-dark)] transition-all active:scale-95"
                >
                    <UserPlus size={14} />
                    PROVISION USER
                </button>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="md:col-span-2 relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--primary)] transition-colors" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search users by name, email or role..."
                      className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/10 transition-all outline-none text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    <select 
                      className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-8 font-semibold text-slate-900 focus:bg-white outline-none appearance-none text-sm transition-all"
                      value={filters.branchId}
                      onChange={(e) => setFilters({...filters, branchId: e.target.value})}
                    >
                        <option value="">All Branches</option>
                        {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-350 pointer-events-none" size={14} />
                </div>
                <div className="relative">
                    <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    <select 
                      className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-8 font-semibold text-slate-900 focus:bg-white outline-none appearance-none text-sm transition-all"
                      value={filters.role}
                      onChange={(e) => setFilters({...filters, role: e.target.value})}
                    >
                        <option value="">Any Role</option>
                        {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-350 pointer-events-none" size={14} />
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead className="bg-slate-50/50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-wider text-slate-400">User Identity</th>
                                <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-wider text-slate-400">Security & Scope</th>
                                <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-wider text-slate-400">Assignment</th>
                                <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-wider text-slate-400">Status</th>
                                <th className="px-4 py-3 text-right text-[9px] font-black uppercase tracking-wider text-slate-400">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-4 py-10 text-center">
                                        <Loader2 className="animate-spin text-[var(--primary)] mx-auto w-8 h-8" />
                                    </td>
                                </tr>
                            ) : users.filter(user => {
                                const term = searchTerm.toLowerCase();
                                return (
                                    user.name.toLowerCase().includes(term) ||
                                    user.email.toLowerCase().includes(term) ||
                                    user.role.toLowerCase().includes(term)
                                );
                            }).length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-4 py-10 text-center font-semibold text-slate-400 text-sm">
                                        No institution users found matching criteria.
                                    </td>
                                </tr>
                            ) : (
                                users.filter(user => {
                                    const term = searchTerm.toLowerCase();
                                    return (
                                        user.name.toLowerCase().includes(term) ||
                                        user.email.toLowerCase().includes(term) ||
                                        user.role.toLowerCase().includes(term)
                                    );
                                }).map((user) => (
                                    <tr key={user._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-xs text-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-white transition-all">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                                                    <p className="text-xs font-bold text-slate-400">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="space-y-1">
                                                <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black tracking-wide uppercase">
                                                    {user.role.replace('_', ' ')}
                                                </span>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1 mt-0.5">
                                                    <Activity size={10} className="text-[var(--primary)]" />
                                                    {user.scope} SCOPED
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                             <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                                <MapPin size={12} className="text-slate-350" />
                                                {user.branchId ? branches.find(b => b._id === user.branchId)?.name : <span className="text-slate-400 italic text-[11px]">Entire Institution</span>}
                                             </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wide border ${user.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                <div className={`w-1 h-1 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                {user.isActive ? 'OPERATIONAL' : 'SUSPENDED'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-350 relative">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button 
                                                    onClick={() => toggleStatus(user._id, user.isActive)}
                                                    className={`h-7 px-3 rounded-lg font-black text-[9px] tracking-wider uppercase transition-all ${user.isActive ? 'bg-rose-50 text-rose-500 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100'}`}
                                                >
                                                    {user.isActive ? 'Suspend' : 'Reinstate'}
                                                </button>
                                                <div className="relative">
                                                    <button 
                                                        onClick={() => toggleDropdown(user._id)}
                                                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                                                    >
                                                        <MoreVertical size={16} />
                                                    </button>
                                                    {activeDropdownUserId === user._id && (
                                                        <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-left animate-in fade-in slide-in-from-top-1 duration-150">
                                                            <button
                                                                onClick={() => {
                                                                    setActiveDropdownUserId(null);
                                                                    setEditModal({
                                                                        open: true,
                                                                        user,
                                                                        name: user.name,
                                                                        email: user.email,
                                                                        role: user.role,
                                                                        scope: user.scope,
                                                                        branchId: user.branchId || ''
                                                                    });
                                                                }}
                                                                className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors block text-left"
                                                            >
                                                                Edit Details
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setActiveDropdownUserId(null);
                                                                    handleOpenPermissions(user);
                                                                }}
                                                                className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-55 transition-colors block text-left"
                                                            >
                                                                Manage Permissions
                                                            </button>
                                                            {user._id !== currentUser?._id && (
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveDropdownUserId(null);
                                                                        handlePasswordReset(user);
                                                                    }}
                                                                    className="w-full px-4 py-2 text-xs font-semibold text-slate-750 hover:bg-slate-50 transition-colors block text-left"
                                                                >
                                                                    Reset Password
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-full animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Provision Personnel</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Resource Assignment Unit</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                                <X size={18} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateUser} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Full Legal Name</label>
                                <input 
                                    required
                                    type="text" 
                                    placeholder="Jonathan Edwards"
                                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 font-semibold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/10 transition-all text-sm"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Institutional Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        required
                                        type="email" 
                                        placeholder="j.edwards@institution.com"
                                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 font-semibold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/10 transition-all text-sm"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Access Credentials</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        required
                                        type="password" 
                                        placeholder="Temporary Security Key"
                                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 font-semibold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/10 transition-all text-sm"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Security Clearance (Role)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {roles.map(r => (
                                        <button 
                                            key={r.value}
                                            type="button"
                                            onClick={() => {
                                                setFormData({...formData, role: r.value, scope: r.scope, branchId: r.scope === 'tenant' ? '' : formData.branchId});
                                            }}
                                            className={`h-9 px-3 rounded-lg border font-bold text-[9px] tracking-tight uppercase transition-all ${formData.role === r.value ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-350'}`}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {formData.scope === 'branch' && (
                                <div className="space-y-1.5 animate-in slide-in-from-top-4 duration-300">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Assign to Branch</label>
                                    <div className="relative">
                                        <select 
                                            required
                                            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/10 transition-all outline-none appearance-none text-sm"
                                            value={formData.branchId}
                                            onChange={(e) => setFormData({...formData, branchId: e.target.value})}
                                        >
                                            <option value="">Select Target Campus</option>
                                            {branches.map(b => (
                                                <option key={b._id} value={b._id}>{b.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-350 pointer-events-none" size={14} />
                                    </div>
                                </div>
                            )}

                            {formData.role === 'parent' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Link Students</label>
                                    <div className="flex gap-2">
                                        <input
                                            className="flex-1 h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm"
                                            placeholder="Search student name or admission number"
                                            value={studentSearch}
                                            onChange={(event) => setStudentSearch(event.target.value)}
                                        />
                                        <button type="button" onClick={searchStudents} className="h-10 px-4 rounded-lg bg-slate-900 text-white text-xs font-bold">Search</button>
                                    </div>
                                    <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200">
                                        {studentOptions.map((student) => (
                                            <label key={student._id} className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 text-xs font-semibold">
                                                <input type="checkbox" checked={formData.students.includes(student._id)} onChange={() => toggleStudent(student._id)} />
                                                {student.firstName} {student.lastName} ({student.admissionNumber})
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                 <div className="flex gap-3">
                                    <ShieldCheck className="text-blue-500 shrink-0" size={16} />
                                    <div>
                                        <p className="text-[10px] font-black text-slate-900 mb-0.5 uppercase tracking-wide">Access Protocol</p>
                                        <p className="text-[9px] leading-relaxed font-semibold text-slate-450 uppercase">User will be restricted to the specified branch scope unless granted higher authority.</p>
                                    </div>
                                 </div>
                            </div>
                        </form>

                        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
                             <button 
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 font-black text-[10px] tracking-widest uppercase text-slate-400 hover:text-slate-650 transition-colors"
                             >
                                Discard
                             </button>
                             <button 
                                onClick={handleCreateUser}
                                disabled={submitting || !formData.role || (formData.scope === 'branch' && !formData.branchId) || (formData.role === 'parent' && formData.students.length === 0)}
                                className="h-10 px-6 bg-[var(--primary)] text-white rounded-lg font-black tracking-widest text-[10px] uppercase flex items-center gap-2 shadow hover:bg-[var(--primary-dark)] transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                             >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'PROVISION IDENTITY'}
                             </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Reset Modal */}
            {passwordResetModal.open && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setPasswordResetModal({ open: false, user: null, tempPassword: '' })} />
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 p-6">
                        <div className="flex items-center gap-3 text-emerald-600 mb-4">
                            <ShieldCheck size={28} />
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Password Reset Complete</h3>
                        </div>
                        <p className="text-sm font-semibold text-slate-600 mb-4">
                            A new temporary security key has been generated for <strong className="text-slate-800">{passwordResetModal.user?.name}</strong>.
                        </p>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between mb-6">
                            <span className="font-mono text-base font-bold text-slate-800 select-all tracking-wider">
                                {passwordResetModal.tempPassword}
                            </span>
                            <button
                                onClick={() => handleCopyToClipboard(passwordResetModal.tempPassword)}
                                className="px-3.5 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white text-[10px] font-black tracking-widest uppercase rounded-lg transition-all"
                            >
                                Copy
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 font-semibold mb-6">
                            * The user will be prompted to change this password upon their next sign-in.
                        </p>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setPasswordResetModal({ open: false, user: null, tempPassword: '' })}
                                className="h-10 px-6 bg-slate-900 text-white rounded-lg font-black tracking-widest text-[10px] uppercase shadow hover:bg-slate-800 transition-all active:scale-95"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editModal.open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setEditModal({ open: false, user: null, name: '', email: '', role: '', scope: '', branchId: '' })} />
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-full animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Edit Personnel Details</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Modify Account Credentials & Assignment</p>
                            </div>
                            <button onClick={() => setEditModal({ open: false, user: null, name: '', email: '', role: '', scope: '', branchId: '' })} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                                <X size={18} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleEditUserSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Full Legal Name</label>
                                <input 
                                    required
                                    type="text" 
                                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 font-semibold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/10 transition-all text-sm"
                                    value={editModal.name}
                                    onChange={(e) => setEditModal({...editModal, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Institutional Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        required
                                        type="email" 
                                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 font-semibold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/10 transition-all text-sm"
                                        value={editModal.email}
                                        onChange={(e) => setEditModal({...editModal, email: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Security Clearance (Role)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {roles.map(r => (
                                        <button 
                                            key={r.value}
                                            type="button"
                                            onClick={() => {
                                                setEditModal({...editModal, role: r.value, scope: r.scope, branchId: r.scope === 'tenant' ? '' : editModal.branchId});
                                            }}
                                            className={`h-9 px-3 rounded-lg border font-bold text-[9px] tracking-tight uppercase transition-all ${editModal.role === r.value ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-350'}`}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {editModal.scope === 'branch' && (
                                <div className="space-y-1.5 animate-in slide-in-from-top-4 duration-300">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Assign to Branch</label>
                                    <div className="relative">
                                        <select 
                                            required
                                            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/10 transition-all outline-none appearance-none text-sm"
                                            value={editModal.branchId}
                                            onChange={(e) => setEditModal({...editModal, branchId: e.target.value})}
                                        >
                                            <option value="">Select Target Campus</option>
                                            {branches.map(b => (
                                                <option key={b._id} value={b._id}>{b.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-350 pointer-events-none" size={14} />
                                    </div>
                                </div>
                            )}
                        </form>

                        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
                             <button 
                                onClick={() => setEditModal({ open: false, user: null, name: '', email: '', role: '', scope: '', branchId: '' })}
                                className="px-5 font-black text-[10px] tracking-widest uppercase text-slate-400 hover:text-slate-650 transition-colors"
                             >
                                Discard
                             </button>
                             <button 
                                onClick={handleEditUserSubmit}
                                disabled={submitting || !editModal.role || (editModal.scope === 'branch' && !editModal.branchId)}
                                className="h-10 px-6 bg-[var(--primary)] text-white rounded-lg font-black tracking-widest text-[10px] uppercase flex items-center gap-2 shadow hover:bg-[var(--primary-dark)] transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                             >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SAVE CHANGES'}
                             </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Permission Settings Modal */}
            {permissionModal.open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setPermissionModal(curr => ({ ...curr, open: false }))} />
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Manage User Permissions</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    Override access privileges for {permissionModal.user?.name} ({permissionModal.user?.role.replace('_', ' ')})
                                </p>
                            </div>
                            <button onClick={() => setPermissionModal(curr => ({ ...curr, open: false }))} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                                <X size={18} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSavePermissions} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            <div className="space-y-3">
                                {permissionModal.catalog.length === 0 ? (
                                    <p className="text-sm font-semibold text-slate-400 text-center py-6">
                                        No customizable permissions available for this user role.
                                    </p>
                                ) : (
                                    permissionModal.catalog.map((perm) => {
                                        const isDefault = !permissionModal.allow.includes(perm.key) && !permissionModal.deny.includes(perm.key);
                                        const isAllowed = permissionModal.allow.includes(perm.key);
                                        const isDenied = permissionModal.deny.includes(perm.key);
                                        const defaultsToAllow = permissionModal.defaults.includes(perm.key);

                                        return (
                                            <div key={perm.key} className="p-4 bg-slate-55 rounded-xl border border-slate-200 hover:border-slate-350 transition-all">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="text-xs font-black text-slate-900 uppercase tracking-wider">{perm.label}</p>
                                                            <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[8px] font-bold font-mono">
                                                                {perm.key}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{perm.group} Group</p>
                                                        <p className="text-[11px] text-slate-500 font-medium mt-1.5 leading-relaxed">{perm.description}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {/* Default */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePermissionChange(perm.key, 'default')}
                                                            className={`h-8 px-3.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                                                                isDefault 
                                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-350 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            Default ({defaultsToAllow ? 'Allow' : 'Deny'})
                                                        </button>
                                                        {/* Allow */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePermissionChange(perm.key, 'allow')}
                                                            className={`h-8 px-3.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                                                                isAllowed 
                                                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                                                                    : 'bg-white text-emerald-600 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                                                            }`}
                                                        >
                                                            Allow
                                                        </button>
                                                        {/* Deny */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePermissionChange(perm.key, 'deny')}
                                                            className={`h-8 px-3.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                                                                isDenied 
                                                                    ? 'bg-rose-600 text-white border-rose-650 shadow-sm' 
                                                                    : 'bg-white text-rose-650 border-slate-200 hover:border-rose-300 hover:bg-rose-50/30'
                                                            }`}
                                                        >
                                                            Deny
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </form>

                        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                             <button 
                                type="button"
                                onClick={() => setPermissionModal(curr => ({ ...curr, open: false }))}
                                className="px-5 font-black text-[10px] tracking-widest uppercase text-slate-400 hover:text-slate-650 transition-colors"
                             >
                                Discard
                             </button>
                             <button 
                                onClick={handleSavePermissions}
                                disabled={permissionSubmitting}
                                className="h-10 px-6 bg-[var(--primary)] text-white rounded-lg font-black tracking-widest text-[10px] uppercase flex items-center gap-2 shadow hover:bg-[var(--primary-dark)] transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                             >
                                {permissionSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SAVE PERMISSIONS'}
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersManagement;


