import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  CheckCircle2, 
  Clock, 
  MoreVertical, 
  Loader2, 
  X,
  AlertCircle
} from 'lucide-react';
import tenantService from '../../services/tenantService';

const AcademicYears = () => {
    const [years, setYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        startDate: '',
        endDate: '',
        isCurrent: false
    });
    const [activeDropdownYearId, setActiveDropdownYearId] = useState(null);
    const [editModal, setEditModal] = useState({ open: false, year: null, name: '', startDate: '', endDate: '' });

    useEffect(() => {
        fetchYears();
    }, []);

    const fetchYears = async () => {
        try {
            const response = await tenantService.getAcademicYears();
            setYears(response.data);
        } catch (error) {
            console.error('Failed to load academic years:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await tenantService.createAcademicYear(formData);
            await fetchYears();
            setIsModalOpen(false);
            setFormData({ name: '', startDate: '', endDate: '', isCurrent: false });
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to create academic year');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSetCurrent = async (id) => {
        try {
            await tenantService.setCurrentYear(id);
            fetchYears();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update current year');
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await tenantService.updateAcademicYear(editModal.year._id, {
                name: editModal.name,
                startDate: editModal.startDate,
                endDate: editModal.endDate
            });
            await fetchYears();
            setEditModal({ open: false, year: null, name: '', startDate: '', endDate: '' });
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update academic year');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (year) => {
        if (!window.confirm(`Are you sure you want to delete the academic year "${year.name}"?`)) return;
        try {
            const res = await tenantService.deleteAcademicYear(year._id);
            alert(res.data.message || 'Academic year deleted successfully');
            fetchYears();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete academic year');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                     <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Academic Timeline</h1>
                     <p className="text-slate-400 font-medium text-xs">Configure institutional sessions and the primary operational cycle.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="h-10 px-4 bg-[var(--primary)] text-white rounded-lg font-semibold tracking-wider text-xs flex items-center gap-2 hover:bg-[var(--primary-dark)] transition-all active:scale-95 shadow-sm"
                >
                    <Plus size={16} />
                    INITIALIZE SESSION
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full h-64 flex items-center justify-center">
                        <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
                    </div>
                ) : (
                    years.map((year) => (
                        <div key={year._id} className={`bg-white rounded-xl border p-5 shadow-sm transition-all group relative overflow-hidden ${year.isCurrent ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/5' : 'border-slate-200 hover:border-slate-350'}`}>
                            {year.isCurrent && (
                                <div className="absolute top-0 right-0 py-1.5 px-4 bg-[var(--primary)] text-white text-[9px] font-semibold uppercase tracking-wider rounded-bl-xl">
                                    CURRENT SESSION
                                </div>
                            )}

                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center gap-4">
                                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${year.isCurrent ? 'bg-[var(--primary)] text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-105'}`}>
                                         <Calendar size={18} />
                                     </div>
                                     <div>
                                         <h3 className="text-lg font-bold text-slate-800 tracking-tight">{year.name}</h3>
                                         <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Academic Term</p>
                                     </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                        <Clock size={14} className="text-slate-400" />
                                        <div className="flex-1">
                                            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Duration Range</p>
                                            <p className="text-xs font-semibold text-slate-700">
                                                {new Date(year.startDate).toLocaleDateString()} &rarr; {new Date(year.endDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                     {year.isCurrent ? (
                                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                                              <CheckCircle2 size={12} />
                                              System Primary
                                          </div>
                                     ) : (
                                          <button 
                                              onClick={() => handleSetCurrent(year._id)}
                                              className="text-[10px] font-bold text-slate-400 hover:text-[var(--primary)] transition-all uppercase tracking-wider flex items-center gap-1"
                                          >
                                              <CheckCircle2 size={12} />
                                              Activate Session
                                          </button>
                                     )}
                                     <div className="relative">
                                         <button 
                                             onClick={() => setActiveDropdownYearId(activeDropdownYearId === year._id ? null : year._id)}
                                             className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                                         >
                                             <MoreVertical size={16} />
                                         </button>
                                         {activeDropdownYearId === year._id && (
                                             <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-left animate-in fade-in slide-in-from-top-1 duration-150">
                                                 <button
                                                     onClick={() => {
                                                         setActiveDropdownYearId(null);
                                                         setEditModal({
                                                             open: true,
                                                             year,
                                                             name: year.name,
                                                             startDate: year.startDate ? new Date(year.startDate).toISOString().split('T')[0] : '',
                                                             endDate: year.endDate ? new Date(year.endDate).toISOString().split('T')[0] : ''
                                                         });
                                                     }}
                                                     className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors block text-left"
                                                 >
                                                     Edit Details
                                                 </button>
                                                 {!year.isCurrent && (
                                                     <button
                                                         onClick={() => {
                                                             setActiveDropdownYearId(null);
                                                             handleDelete(year);
                                                         }}
                                                         className="w-full px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors block text-left"
                                                     >
                                                         Delete
                                                     </button>
                                                 )}
                                             </div>
                                         )}
                                     </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-slate-205 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-805">Initialize Academic Session</h3>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Calendar Configuration Hub</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-lg transition-all shadow-sm">
                                <X size={16} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreate} className="p-5 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Session Display Name</label>
                                <input 
                                    required
                                    type="text" 
                                    placeholder="2023-2024 Academic Year"
                                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Date</label>
                                    <input 
                                        required
                                        type="date" 
                                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">End Date</label>
                                    <input 
                                        required
                                        type="date" 
                                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                                <div className="flex gap-3">
                                    <Clock className="text-[var(--primary)] mt-0.5" size={16} />
                                    <div>
                                        <p className="text-xs font-semibold text-slate-800">Immediate Activation</p>
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Set as system primary current year</p>
                                    </div>
                                </div>
                                <div 
                                    onClick={() => setFormData({...formData, isCurrent: !formData.isCurrent})}
                                    className={`w-11 h-6 rounded-full cursor-pointer p-0.5 transition-all duration-300 ${formData.isCurrent ? 'bg-[var(--primary)]' : 'bg-slate-200'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm ${formData.isCurrent ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                            </div>

                            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 flex gap-3 text-rose-800">
                                <AlertCircle className="shrink-0 mt-0.5" size={16} />
                                <p className="text-[10px] leading-relaxed font-semibold uppercase tracking-wider">Activating a new session will set all previously active years to historical status. This affects global reports and current enrollments.</p>
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                 <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 font-semibold text-xs tracking-wider uppercase text-slate-400 hover:text-slate-650 transition-colors"
                                 >
                                    Discard
                                 </button>
                                 <button 
                                    type="submit"
                                    disabled={submitting}
                                    className="h-10 px-4 bg-[var(--primary)] text-white rounded-lg font-semibold tracking-wider text-xs flex items-center gap-2 hover:bg-[var(--primary-dark)] transition-all disabled:opacity-50"
                                 >
                                    {submitting ? <Loader2 className="animate-spin" size={14} /> : 'CONFIRM TIMELINE'}
                                 </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editModal.open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditModal({ open: false, year: null, name: '', startDate: '', endDate: '' })} />
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-slate-205 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-805">Edit Academic Session</h3>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Calendar Configuration Hub</p>
                            </div>
                            <button onClick={() => setEditModal({ open: false, year: null, name: '', startDate: '', endDate: '' })} className="p-1.5 hover:bg-slate-200 rounded-lg transition-all shadow-sm">
                                <X size={16} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Session Display Name</label>
                                <input 
                                    required
                                    type="text" 
                                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm text-slate-905 outline-none focus:bg-white focus:border-blue-500 transition-all"
                                    value={editModal.name}
                                    onChange={(e) => setEditModal({...editModal, name: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Date</label>
                                    <input 
                                        required
                                        type="date" 
                                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm text-slate-905 outline-none focus:bg-white focus:border-blue-500 transition-all"
                                        value={editModal.startDate}
                                        onChange={(e) => setEditModal({...editModal, startDate: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">End Date</label>
                                    <input 
                                        required
                                        type="date" 
                                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm text-slate-905 outline-none focus:bg-white focus:border-blue-500 transition-all"
                                        value={editModal.endDate}
                                        onChange={(e) => setEditModal({...editModal, endDate: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                 <button 
                                    type="button" 
                                    onClick={() => setEditModal({ open: false, year: null, name: '', startDate: '', endDate: '' })}
                                    className="px-4 font-semibold text-xs tracking-wider uppercase text-slate-400 hover:text-slate-650 transition-colors"
                                 >
                                    Discard
                                 </button>
                                 <button 
                                    type="submit"
                                    disabled={submitting}
                                    className="h-10 px-4 bg-[var(--primary)] text-white rounded-lg font-semibold tracking-wider text-xs flex items-center gap-2 hover:bg-[var(--primary-dark)] transition-all disabled:opacity-50"
                                 >
                                    {submitting ? <Loader2 className="animate-spin" size={14} /> : 'SAVE CHANGES'}
                                 </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcademicYears;


