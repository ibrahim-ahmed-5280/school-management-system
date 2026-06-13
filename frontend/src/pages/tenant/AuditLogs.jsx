import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  User, 
  ChevronRight, 
  Loader2,
  X,
  Code
} from 'lucide-react';
import tenantService from '../../services/tenantService';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ branchId: '', action: '', from: '', to: '' });
    const [selectedLog, setSelectedLog] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const bRes = await tenantService.getBranches();
                setBranches(bRes.data);
            } catch (err) {
                console.error(err);
            }
        };
        load();
    }, []);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const res = await tenantService.getAuditLogs(filters);
                setLogs(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [filters]);

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                     <h1 className="text-xl font-black text-slate-900 tracking-tight mb-1">Institutional <span className="text-[var(--primary)]">Audit Trail</span></h1>
                     <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Real-time investigative logs for sensitive operations.</p>
                </div>
                <div className="bg-rose-50 px-4 py-1.5 rounded-xl border border-rose-100 flex items-center gap-2 text-rose-600">
                    <ShieldCheck size={16} />
                    <span className="text-[9px] font-black uppercase tracking-wider">Tamper-Proof Records</span>
                </div>
            </div>

            {/* Advanced Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative group">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--primary)] transition-colors" size={14} />
                    <select 
                      className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 font-semibold text-slate-900 focus:bg-white outline-none appearance-none transition-all text-xs"
                      value={filters.branchId}
                      onChange={(e) => setFilters({...filters, branchId: e.target.value})}
                    >
                        <option value="">All Branches</option>
                        {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                </div>
                <div className="relative group md:col-span-1">
                    <AlertCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--primary)] transition-colors" size={14} />
                    <input 
                      type="text" 
                      placeholder="Filter by action (e.g. USER_CREATED)"
                      className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 font-semibold text-slate-900 focus:bg-white outline-none transition-all text-xs"
                      value={filters.action}
                      onChange={(e) => setFilters({...filters, action: e.target.value})}
                    />
                </div>
                <div className="relative group">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="date" 
                      className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 font-semibold text-slate-900 focus:bg-white outline-none transition-all text-xs"
                      value={filters.from}
                      onChange={(e) => setFilters({...filters, from: e.target.value})}
                    />
                </div>
                <div className="relative group">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="date" 
                      className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 font-semibold text-slate-900 focus:bg-white outline-none transition-all text-xs"
                      value={filters.to}
                      onChange={(e) => setFilters({...filters, to: e.target.value})}
                    />
                </div>
            </div>

            {/* Logs Timeline */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                     <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Sequence Log History</p>
                     <p className="text-[9px] font-black uppercase text-[var(--primary)] tracking-wider">Showing {logs.length} events</p>
                </div>

                <div className="divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-10 text-center"><Loader2 className="animate-spin text-[var(--primary)] mx-auto w-8 h-8" /></div>
                    ) : logs.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 font-semibold text-sm">No audit entries found for chosen filters.</div>
                    ) : (
                        logs.map(log => (
                            <div key={log._id} className="p-5 flex items-start gap-5 hover:bg-slate-50/50 transition-all group">
                                <div className="flex flex-col items-center">
                                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow group-hover:bg-[var(--primary)] transition-colors">
                                        <ShieldCheck size={16} />
                                    </div>
                                    <div className="w-0.5 h-10 bg-slate-100 group-hover:bg-[var(--primary)]/20 transition-colors mt-2" />
                                </div>
                                
                                <div className="flex-1 space-y-3">
                                     <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-900 rounded text-[9px] font-black tracking-wide uppercase">{log.action}</span>
                                                <span className="text-[9px] font-bold text-slate-300">•</span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1">
                                                    <User size={10} className="text-[var(--primary)]" />
                                                    {log.actorRole?.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <h4 className="text-base font-black text-slate-900 tracking-tight">Entity {log.entityType} Update</h4>
                                        </div>
                                        <div className="text-right">
                                             <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-0.5">
                                                <Clock size={10} />
                                                {new Date(log.createdAt).toLocaleString()}
                                             </div>
                                             <p className="text-[8px] font-black text-slate-300 tracking-tighter uppercase">{log.ip}</p>
                                        </div>
                                     </div>

                                     <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white transition-all flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                             <div className="w-8 h-8 rounded-lg bg-white border border-slate-150 flex items-center justify-center text-slate-400 shadow-sm">
                                                 <Code size={14} />
                                             </div>
                                             <div>
                                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">Target Identity</p>
                                                 <p className="text-xs font-black text-slate-900 font-mono tracking-tight">{log.entityId}</p>
                                             </div>
                                          </div>
                                          <button 
                                            onClick={() => setSelectedLog(log)}
                                            className="h-8 px-4 bg-white border border-slate-250 rounded-lg font-black text-[9px] tracking-widest uppercase text-slate-600 hover:bg-slate-900 hover:text-white transition-all flex items-center gap-1.5 group/btn active:scale-95 shadow-sm"
                                          >
                                              Inspect Snapshot
                                              <ChevronRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                          </button>
                                     </div>
                                 </div>
                             </div>
                         ))
                     )}
                 </div>
             </div>

            {/* Inspect Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedLog(null)} />
                    <div className="bg-[#1e293b] w-full max-w-3xl rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border border-white/5">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <div>
                                <h3 className="text-lg font-black text-white tracking-tight italic">Structural Differential</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Snapshot State ID: {selectedLog._id}</p>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-white">
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 grid md:grid-cols-2 gap-6 custom-scrollbar">
                            <div className="space-y-3">
                                <p className="text-[9px] font-black uppercase text-rose-400 tracking-wider ml-1">Original State (Before)</p>
                                <div className="bg-slate-900 rounded-xl p-4 border border-white/5 font-mono text-[11px] text-rose-300/80 overflow-x-auto whitespace-pre h-[300px]">
                                    {JSON.stringify(selectedLog.before, null, 2) || "// No prior state recorded"}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <p className="text-[9px] font-black uppercase text-emerald-400 tracking-wider ml-1">Mutated State (After)</p>
                                <div className="bg-slate-900 rounded-xl p-4 border border-white/5 font-mono text-[11px] text-emerald-300/80 overflow-x-auto whitespace-pre h-[300px]">
                                    {JSON.stringify(selectedLog.after, null, 2) || "// Operation deleted/terminated state"}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-white/5 bg-white/5 text-slate-400 text-[9px] font-black uppercase tracking-wider flex items-center gap-2">
                            <ShieldCheck size={14} className="text-emerald-500" />
                            Security Integrity Checked. Action performed by UID: {selectedLog.actorUserId}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogs;


