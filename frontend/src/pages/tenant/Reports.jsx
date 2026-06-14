import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  MapPin, 
  Calendar, 
  Download, 
  Filter, 
  TrendingUp, 
  ArrowRight, 
  Loader2,
  PieChart as PieChartIcon,
  Users,
  Building2,
  DollarSign,
  CheckCircle2
} from 'lucide-react';
import tenantService from '../../services/tenantService';

const ReportCard = ({ title, value, subValue, icon, accent = 'primary', delay = '' }) => (
    <div className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${delay}`}>
        <div className="flex justify-between items-start mb-4">
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow"
                style={{ background: accent === 'secondary' ? 'var(--secondary)' : 'var(--primary)' }}
            >
                {React.cloneElement(icon, { size: 18 })}
            </div>
            <span className="text-[9px] font-black tracking-wider text-slate-400 uppercase">Live Index</span>
        </div>
        <div className="space-y-0.5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{title}</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 leading-tight uppercase tracking-tight">{subValue}</p>
        </div>
    </div>
);

const Reports = () => {
    const [branches, setBranches] = useState([]);
    const [years, setYears] = useState([]);
    const [filters, setFilters] = useState({ branchId: '', academicYearId: '' });
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadInitial = async () => {
            try {
                const [bRes, yRes] = await Promise.all([
                    tenantService.getBranches(),
                    tenantService.getAcademicYears()
                ]);
                setBranches(bRes.data);
                setYears(yRes.data);
                const current = yRes.data.find(y => y.isCurrent);
                if (current) setFilters(f => ({ ...f, academicYearId: current._id }));
            } catch (err) {
                console.error(err);
            }
        };
        loadInitial();
    }, []);

    useEffect(() => {
        const fetchReport = async () => {
            setLoading(true);
            try {
                const res = await tenantService.getOverviewReport(filters.branchId, filters.academicYearId);
                setReport(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [filters]);

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight mb-1">
                        Institutional <span style={{ color: 'var(--primary)' }}>Intelligence</span>
                    </h1>
                    <p className="text-slate-500 text-xs font-bold">Consolidated performance and financial analytics engine.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        className="h-10 px-5 rounded-lg font-black text-[10px] tracking-widest uppercase text-white flex items-center gap-2 shadow-sm transition-all hover:opacity-90 active:scale-95"
                        style={{ background: 'var(--primary)' }}
                    >
                        <Download size={14} />
                        EXPORT DATA
                    </button>
                </div>
            </div>

            {/* Global Filters — clean white card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
                <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white border"
                    style={{ background: 'var(--primary)', borderColor: 'var(--primary)' }}
                >
                    <Filter size={14} />
                    <span className="text-[9px] font-black uppercase tracking-wider">Global Filters</span>
                </div>

                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <select
                            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 font-bold text-slate-700 outline-none focus:border-[var(--primary)] transition-all appearance-none text-xs"
                            value={filters.branchId}
                            onChange={(e) => setFilters({ ...filters, branchId: e.target.value })}
                        >
                            <option value="">Aggregate – All Branches</option>
                            {branches.map(b => (
                                <option key={b._id} value={b._id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <select
                            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 font-bold text-slate-700 outline-none focus:border-[var(--primary)] transition-all appearance-none text-xs"
                            value={filters.academicYearId}
                            onChange={(e) => setFilters({ ...filters, academicYearId: e.target.value })}
                        >
                            <option value="">Select Timeline</option>
                            {years.map(y => (
                                <option key={y._id} value={y._id}>{y.name} {y.isCurrent ? '(Current)' : ''}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin shadow" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Filtering Institution Data...</p>
                </div>
            ) : report && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <ReportCard
                            title="Student Body"
                            value={report.studentCount}
                            subValue="Unique Identities Registered"
                            icon={<Users />}
                            accent="primary"
                            delay="delay-75"
                        />
                        <ReportCard
                            title="Enrollment Depth"
                            value={report.activeEnrollments}
                            subValue="Active Seats for Period"
                            icon={<BarChart3 />}
                            accent="secondary"
                            delay="delay-150"
                        />
                        <ReportCard
                            title="Revenue Liquid"
                            value={`$${report.revenue.totalRevenue.toLocaleString()}`}
                            subValue="Total Liquid Collections"
                            icon={<DollarSign />}
                            accent="primary"
                            delay="delay-200"
                        />
                        <ReportCard
                            title="Projected Yield"
                            value={`$${report.revenue.projectedRevenue.toLocaleString()}`}
                            subValue="Institutional Revenue Pipeline"
                            icon={<TrendingUp />}
                            accent="secondary"
                            delay="delay-300"
                        />
                    </div>

                    {/* Detail Panels */}
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Academic Performance */}
                        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Academic Performance Index</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Cross-Branch Evaluative Statistics</p>
                                </div>
                                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                    <PieChartIcon className="text-slate-400" size={18} />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <p className="text-2xl font-black text-slate-900">{report.performance.avgMarks.toFixed(1)}%</p>
                                        <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: 'var(--primary)' }}>Network Average Grade</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-slate-900">{report.performance.totalResults}</p>
                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Evaluated Units</p>
                                    </div>
                                </div>


                            </div>
                        </div>

                        {/* Financial Health – brand colors, no gradient */}
                        <div
                            className="rounded-xl p-6 text-white flex flex-col justify-between overflow-hidden relative"
                            style={{ background: 'var(--primary)' }}
                        >
                            <div className="relative z-10">
                                <h3 className="text-lg font-black mb-0.5">Financial Health</h3>
                                <p className="text-[10px] font-bold opacity-70 uppercase tracking-wider">Collection Ratio Analysis</p>

                                <div className="mt-6 space-y-0.5">
                                    <p className="text-3xl font-black tracking-tighter text-white">
                                        {((report.revenue.totalRevenue / (report.revenue.projectedRevenue || 1)) * 100).toFixed(1)}%
                                    </p>
                                    <p className="text-[9px] font-black opacity-60 uppercase tracking-widest pt-1">Realized Revenue Ratio</p>
                                </div>

                                <div className="mt-6 pt-6 border-t border-white/20 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold opacity-70">Liquid Assets</span>
                                        <span className="font-bold text-sm">$ {report.revenue.totalRevenue.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold opacity-70">Uncollected</span>
                                        <span className="font-bold text-sm opacity-90">$ {(report.revenue.projectedRevenue - report.revenue.totalRevenue).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                className="h-10 w-full bg-white rounded-lg font-black text-[10px] tracking-widest uppercase mt-6 hover:opacity-90 transition-all flex items-center justify-center gap-2 active:scale-95 shadow"
                                style={{ color: 'var(--primary)' }}
                            >
                                DETAILED FINANCE REPORT
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
