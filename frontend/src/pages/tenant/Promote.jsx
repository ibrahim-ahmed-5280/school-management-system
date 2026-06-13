import React, { useState, useEffect } from 'react';
import { 
  ArrowUpCircle, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle
} from 'lucide-react';
import tenantService from '../../services/tenantService';

const Promote = () => {
    const [years, setYears] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [stats, setStats] = useState(null);

    const [promoteData, setPromoteData] = useState({
        fromAcademicYearId: '',
        toAcademicYearId: '',
        rules: {
            classMap: [
                { fromClassId: '', toClassId: '' }
            ]
        }
    });

    useEffect(() => {
        const load = async () => {
            try {
                const [yearsRes, branchesRes] = await Promise.all([
                    tenantService.getAcademicYears(),
                    tenantService.getBranches()
                ]);
                setYears(yearsRes.data);
                setBranches(branchesRes.data || []);
                if (branchesRes.data?.length) setSelectedBranchId(branchesRes.data[0]._id);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    useEffect(() => {
        if (!selectedBranchId) {
            setClasses([]);
            return;
        }

        tenantService.getBranchClasses(selectedBranchId)
            .then((res) => setClasses(res.data || []))
            .catch(() => setClasses([]));
    }, [selectedBranchId]);

    const handlePromote = async (e) => {
        e.preventDefault();
        const activeMaps = promoteData.rules.classMap.filter((mapping) => mapping.fromClassId && mapping.toClassId);
        if (activeMaps.length === 0) {
            alert('Please add at least one valid class mapping');
            return;
        }
        setSubmitting(true);
        try {
            const response = await tenantService.promoteStudents({
                ...promoteData,
                rules: { classMap: activeMaps }
            });
            setStats(response.data);
            setSuccess(true);
        } catch (err) {
            alert(err.response?.data?.message || 'Promotion failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="w-full space-y-8 pb-20">
            <div>
                 <h1 className="text-xl font-black text-slate-900 tracking-tight mb-1">Academic <span className="text-[var(--primary)]">Promotion Tool</span></h1>
                 <p className="text-slate-500 text-xs font-bold">Safely transition student cohorts to the next academic tier while preserving results history.</p>
            </div>

            {success ? (
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl text-center space-y-4 animate-in zoom-in-95 duration-500 max-w-md mx-auto">
                    <div className="w-14 h-14 bg-emerald-500 text-white rounded-xl flex items-center justify-center mx-auto shadow">
                        <CheckCircle2 size={28} />
                    </div>
                    <div className="space-y-1">
                         <h2 className="text-lg font-black text-slate-900">Promotion Successful</h2>
                         <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                            {stats
                                ? `${stats.promoted || 0} promoted, ${stats.skippedExisting || 0} already enrolled, ${stats.failed || 0} failed.`
                                : 'New enrollments initialized for target classes.'}
                         </p>
                    </div>
                    <button 
                        onClick={() => { setSuccess(false); setStats(null); }}
                        className="h-10 px-6 bg-[var(--primary)] text-white rounded-lg font-black text-[10px] tracking-widest uppercase hover:bg-[var(--primary-dark)] transition-all"
                    >
                        PERFORM ANOTHER OPERATION
                    </button>
                </div>
            ) : (
                <form onSubmit={handlePromote} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                        {/* Timeline Selection */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Source Timeline</label>
                                <select 
                                    required
                                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[var(--primary)]/10 focus:bg-white transition-all text-sm"
                                    value={promoteData.fromAcademicYearId}
                                    onChange={(e) => setPromoteData({...promoteData, fromAcademicYearId: e.target.value})}
                                >
                                    <option value="">Select Origin Year</option>
                                    {years.map(y => <option key={y._id} value={y._id}>{y.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Destination Timeline</label>
                                <select 
                                    required
                                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[var(--primary)]/10 focus:bg-white transition-all text-sm"
                                    value={promoteData.toAcademicYearId}
                                    onChange={(e) => setPromoteData({...promoteData, toAcademicYearId: e.target.value})}
                                >
                                    <option value="">Select Target Year</option>
                                    {years.map(y => <option key={y._id} value={y._id}>{y.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Branch</label>
                            <select
                                required
                                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[var(--primary)]/10 focus:bg-white transition-all text-sm"
                                value={selectedBranchId}
                                onChange={(e) => {
                                    setSelectedBranchId(e.target.value);
                                    setPromoteData((current) => ({
                                        ...current,
                                        rules: { classMap: [{ fromClassId: '', toClassId: '' }] }
                                    }));
                                }}
                            >
                                <option value="">Select branch</option>
                                {branches.map((branch) => (
                                    <option key={branch._id} value={branch._id}>{branch.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Rules Section (Draft UI) */}
                        <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ArrowUpCircle className="text-[var(--primary)]" size={18} />
                                    <h4 className="text-sm font-black text-slate-900 tracking-tight">Class Transition Rules</h4>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPromoteData((current) => ({
                                        ...current,
                                        rules: {
                                            classMap: [...current.rules.classMap, { fromClassId: '', toClassId: '' }]
                                        }
                                    }))}
                                    className="text-[10px] font-black uppercase tracking-wider text-[var(--primary)]"
                                >
                                    + Add Mapping
                                </button>
                            </div>
                            
                            <div className="space-y-3">
                                {promoteData.rules.classMap.map((map, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row items-center gap-4 p-1 bg-white rounded-xl border border-slate-200 shadow-sm relative group">
                                         <div className="flex-1 w-full p-2">
                                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1.5 ml-1">Source Class</p>
                                            <select
                                                required
                                                className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs font-semibold font-mono outline-none focus:ring-2 focus:ring-[var(--primary)]/10 focus:bg-white transition-all"
                                                value={map.fromClassId}
                                                onChange={(e) => {
                                                    const newMap = [...promoteData.rules.classMap];
                                                    newMap[idx].fromClassId = e.target.value;
                                                    setPromoteData({...promoteData, rules: { classMap: newMap }});
                                                }}
                                            >
                                                <option value="">Select source class</option>
                                                {classes.map((classItem) => (
                                                    <option key={classItem._id} value={classItem._id}>{classItem.name}</option>
                                                ))}
                                            </select>
                                         </div>
                                         <ArrowRight className="text-slate-300 shrink-0 hidden sm:block" size={14} />
                                         <div className="flex-1 w-full p-2">
                                            <p className="text-[8px] font-black text-[var(--primary)] uppercase mb-1.5 ml-1">Target Class</p>
                                            <select
                                                required
                                                className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs font-semibold font-mono outline-none focus:ring-2 focus:ring-[var(--primary)]/10 focus:bg-white transition-all"
                                                value={map.toClassId}
                                                onChange={(e) => {
                                                    const newMap = [...promoteData.rules.classMap];
                                                    newMap[idx].toClassId = e.target.value;
                                                    setPromoteData({...promoteData, rules: { classMap: newMap }});
                                                }}
                                            >
                                                <option value="">Select target class</option>
                                                {classes.map((classItem) => (
                                                    <option key={classItem._id} value={classItem._id}>{classItem.name}</option>
                                                ))}
                                            </select>
                                         </div>
                                         {promoteData.rules.classMap.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newMap = promoteData.rules.classMap.filter((_, mapIndex) => mapIndex !== idx);
                                                    setPromoteData({...promoteData, rules: { classMap: newMap }});
                                                }}
                                                className="text-[10px] font-black uppercase tracking-wider text-rose-500 px-3"
                                            >
                                                Remove
                                            </button>
                                         )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Warnings */}
                        <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex gap-3 text-rose-800">
                             <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                             <div>
                                <p className="text-xs font-black mb-0.5">Read Carefully: Historical Data Integrity</p>
                                <p className="text-[9px] leading-relaxed font-semibold uppercase tracking-wider opacity-85">This action creates new enrollment records for all matching students. Existing enrollments will be marked as 'Promoted'. This process is permanent and affects institutional analytics.</p>
                             </div>
                        </div>

                        {/* Action */}
                        <div className="pt-2 flex justify-end">
                             <button 
                                type="submit"
                                disabled={submitting}
                                className="h-10 px-6 bg-[var(--primary)] text-white rounded-lg font-black tracking-widest text-[10px] uppercase flex items-center gap-2 shadow hover:bg-[var(--primary-dark)] transition-all active:scale-95 disabled:opacity-50"
                             >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                    <>
                                        EXECUTE NETWORK PROMOTION
                                        <ArrowUpCircle size={14} />
                                    </>
                                )}
                             </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
};

export default Promote;


