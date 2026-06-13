import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Activity,
  Package, 
  Loader2,
  CheckCircle2,
  X,
  ExternalLink
} from 'lucide-react';
import tenantService from '../../services/tenantService';

const Branches = () => {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
        logoUrl: '',
        receiptFooter: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredBranches = branches.filter((branch) => {
        const matchesSearch = `${branch.name} ${branch.code}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' ? branch.isActive : !branch.isActive);
        return matchesSearch && matchesStatus;
    });

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            const response = await tenantService.getBranches();
            setBranches(response.data);
        } catch (error) {
            console.error('Failed to load branches:', error);
            const msg = error.response?.data?.message || 'Connection interrupted while loading campuses';
            alert(`Error: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBranch = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await tenantService.createBranch(formData);
            await fetchBranches();
            setIsModalOpen(false);
            setFormData({ name: '', code: '', address: '', phone: '', email: '', logoUrl: '', receiptFooter: '' });
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to create branch');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            await tenantService.updateBranchStatus(id, !currentStatus);
            fetchBranches();
        } catch {
            alert('Failed to update branch status');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                     <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Campus <span className="text-[var(--primary)]">Network</span></h1>
                     <p className="text-slate-500 text-xs font-bold">Manage operational branches and physical institution locations.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="h-10 px-5 bg-[var(--primary)] text-white rounded-lg font-black tracking-widest text-[10px] flex items-center gap-2 shadow-md hover:bg-[var(--primary-dark)] transition-all active:scale-95"
                >
                    <Plus size={16} />
                    PROVISION NEW BRANCH
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-3 shadow-sm">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--primary)] transition-colors" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search by campus name or code..."
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      className="w-full h-10 bg-slate-55/40 border border-slate-200 rounded-lg pl-10 pr-4 font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/10 transition-all outline-none text-sm placeholder:text-slate-400"
                    />
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <button
                    onClick={() => setStatusFilter((current) => current === 'all' ? 'active' : current === 'active' ? 'inactive' : 'all')}
                    className="h-10 px-4 rounded-lg border border-slate-200 font-black text-[10px] tracking-widest uppercase text-slate-400 hover:text-slate-600 transition-colors"
                >
                    Status: {statusFilter}
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full h-64 flex items-center justify-center">
                        <Loader2 className="animate-spin text-[var(--primary)]" size={48} />
                    </div>
                ) : (
                    filteredBranches.map((branch) => (
                        <div key={branch._id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-[var(--primary)] group-hover:text-white transition-all overflow-hidden shadow-inner">
                                    {branch.logoUrl ? (
                                        <img src={branch.logoUrl} alt="branch logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <Building2 size={20} />
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                     <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${branch.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                         {branch.isActive ? 'Active' : 'Deactivated'}
                                     </span>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                <h3 className="text-lg font-black text-slate-900 group-hover:text-[var(--primary)] transition-colors">{branch.name}</h3>
                                <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold uppercase tracking-tight">
                                    <Package size={12} className="text-slate-300" />
                                    Branch Code: <span className="text-slate-900 font-black">{branch.code}</span>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                                    <MapPin size={14} className="text-slate-300 shrink-0" />
                                    <span className="truncate">{branch.address || 'Address not set'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                                    <Phone size={14} className="text-slate-300 shrink-0" />
                                    <span>{branch.phone || 'No phone'}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                 <button 
                                    onClick={() => toggleStatus(branch._id, branch.isActive)}
                                    className={`text-[9px] font-black uppercase tracking-widest transition-colors ${branch.isActive ? 'text-rose-500 hover:text-rose-600' : 'text-emerald-500 hover:text-emerald-600'}`}
                                 >
                                    {branch.isActive ? 'Deactivate' : 'Activate'}
                                 </button>
                            </div>

                            {/* Decorative Spark */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)] opacity-[0.02] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                        </div>
                    ))
                )}
            </div>

            {/* Create Branch Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-full animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Provision New Campus</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Institutional Expansion Unit</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateBranch} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            <div className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Branch Identity Name</label>
                                        <input 
                                            required
                                            type="text" 
                                            placeholder="Oxford Highlands Campus"
                                            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 font-semibold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/10 transition-all text-sm"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">System Identifier Code</label>
                                        <input 
                                            required
                                            type="text" 
                                            placeholder="OXF-001"
                                            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 font-semibold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/10 transition-all uppercase text-sm"
                                            value={formData.code}
                                            onChange={(e) => setFormData({...formData, code: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Physical Address</label>
                                    <input 
                                        type="text" 
                                        placeholder="45 Educational Ave, Sector 4"
                                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 font-semibold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/10 transition-all text-sm"
                                        value={formData.address}
                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Contact Phone</label>
                                        <input 
                                            type="text" 
                                            placeholder="+1 234 567"
                                            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 font-semibold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/10 transition-all text-sm"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        />
                                     </div>
                                     <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Official Email</label>
                                        <input 
                                            type="email" 
                                            placeholder="oxf1@school.com"
                                            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 font-semibold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/10 transition-all text-sm"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        />
                                     </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Receipt Customization Footer</label>
                                    <textarea 
                                        placeholder="Thank you for choosing Oxford Highlands Education."
                                        className="w-full h-24 bg-white border border-slate-200 rounded-lg p-3 font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[var(--primary)]/10 transition-all resize-none text-sm"
                                        value={formData.receiptFooter}
                                        onChange={(e) => setFormData({...formData, receiptFooter: e.target.value})}
                                    />
                                </div>
                            </div>
                        </form>

                        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
                             <button 
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 font-black text-[10px] tracking-widest uppercase text-slate-400 hover:text-slate-600 transition-colors"
                             >
                                Cancel
                             </button>
                             <button 
                                onClick={handleCreateBranch}
                                disabled={submitting}
                                className="h-10 px-6 bg-[var(--primary)] text-white rounded-lg font-black tracking-widest text-[10px] uppercase flex items-center gap-2 shadow hover:bg-[var(--primary-dark)] transition-all disabled:opacity-50"
                             >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'INITIALIZE CAMPUS'}
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Branches;


