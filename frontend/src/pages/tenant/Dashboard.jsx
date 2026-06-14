import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  GraduationCap, 
  TrendingUp, 
  ChevronRight, 
  Calendar, 
  MapPin, 
  Clock, 
  ArrowUpRight,
  DollarSign,
  BarChart2,
  PieChart as PieIcon
} from 'lucide-react';
import { 
    ResponsiveContainer, 
    AreaChart, 
    Area, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend 
} from 'recharts';
import tenantService from '../../services/tenantService';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ icon, label, value, subValue, trend, iconColor, iconBg }) => (
    <div className="bg-white p-5 rounded-xl border border-slate-200/85 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex justify-between items-start group min-w-0">
        <div className="space-y-2 min-w-0">
            <p className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase truncate">{label}</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none truncate">{value}</h3>
            {subValue && (
                <div className="flex items-center gap-1.5 pt-0.5 min-w-0">
                    <span className="text-[11px] font-medium text-slate-400 truncate">{subValue}</span>
                    {trend && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-500 shrink-0 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                            <TrendingUp size={9} />
                            {trend}
                        </span>
                    )}
                </div>
            )}
        </div>
        <div className={`w-10 h-10 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform shrink-0 ml-3`}>
            {React.cloneElement(icon, { size: 20, className: "shrink-0" })}
        </div>
    </div>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        branches: 0,
        users: 0,
        students: 0,
        revenue: { totalRevenue: 0, projectedRevenue: 0 },
        branchDistribution: [],
        currentYear: null,
        trendData: []
    });
    const [branchesList, setBranchesList] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [branchesRes, usersRes, reportsRes, yearsRes] = await Promise.all([
                    tenantService.getBranches(),
                    tenantService.getUsers(),
                    tenantService.getOverviewReport(),
                    tenantService.getAcademicYears()
                ]);
                
                setBranchesList(branchesRes.data);
                setStats({
                    branches: branchesRes.data.length,
                    users: usersRes.data.length,
                    students: reportsRes.data.studentCount,
                    revenue: reportsRes.data.revenue,
                    branchDistribution: reportsRes.data.branchDistribution || [],
                    currentYear: yearsRes.data.find(y => y.isCurrent),
                    trendData: reportsRes.data.trendData || []
                });

                // Fetch real audit logs
                try {
                    const logsRes = await tenantService.getAuditLogs({ limit: 5 });
                    setActivities(logsRes.data?.logs || []);
                } catch (err) {
                    console.error('Failed to load audit logs:', err);
                    setActivities([]);
                }
            } catch (error) {
                console.error('Failed to load dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div className="h-96 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    const hasTrendData = stats.trendData && stats.trendData.some(d => d.Collected > 0 || d.Projected > 0);

    // Branch student ratio distribution
    const branchChartData = branchesList.map((branch) => {
        const dist = stats.branchDistribution.find(d => d.branchId === branch._id);
        return {
            name: branch.name.replace(' Branch', '').replace(' Campus', ''),
            students: dist ? dist.count : 0
        };
    });

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
                        System <span className="text-[var(--primary)]">Overview</span>
                    </h1>
                    <div className="flex items-center gap-4 text-slate-500 text-xs font-bold">
                        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-100 shadow-sm">
                             <Calendar size={14} className="text-[var(--primary)]" />
                             {stats.currentYear?.name || 'Academic Year Not Set'}
                         </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-100 shadow-sm">
                             <MapPin size={14} className="text-[var(--primary)]" />
                             {stats.branches} Registered Branches
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/tenant/reports')} className="h-10 px-5 bg-[var(--primary)] text-white rounded-lg font-black text-xs tracking-widest uppercase hover:bg-[var(--primary-dark)] transition-all flex items-center gap-2 shadow-md active:scale-95">
                        Generate Report
                        <ArrowUpRight size={14} />
                    </button>
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    icon={<Building2 />}
                    label="Active Branches"
                    value={stats.branches}
                    subValue="Locations Provisioned"
                    iconColor="text-blue-600"
                    iconBg="bg-blue-50"
                />
                <StatCard 
                    icon={<Users />}
                    label="Operational Staff"
                    value={stats.users}
                    subValue="Total Employees"
                    iconColor="text-indigo-600"
                    iconBg="bg-indigo-50"
                />
                <StatCard 
                    icon={<GraduationCap />}
                    label="Student Body"
                    value={stats.students}
                    subValue="Across all branches"
                    iconColor="text-emerald-600"
                    iconBg="bg-emerald-50"
                />
                <StatCard 
                    icon={<DollarSign />}
                    label="Current Revenue"
                    value={`$${stats.revenue.totalRevenue.toLocaleString()}`}
                    subValue={`Projected: $${stats.revenue.projectedRevenue.toLocaleString()}`}
                    iconColor="text-amber-600"
                    iconBg="bg-amber-50"
                />
            </div>

            {/* Analytics Graphs Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Financial Collections vs Projections */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                                <DollarSign size={16} className="text-indigo-500" />
                                Institutional Cashflow Analysis
                            </h3>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Realized Revenue vs Projected Fee Invoices</p>
                        </div>
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Real-time
                        </span>
                    </div>
                    <div className="h-64">
                        {hasTrendData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                    <Area type="monotone" dataKey="Collected" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Realized Collections" />
                                    <Area type="monotone" dataKey="Projected" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} strokeDasharray="4 4" fill="url(#colorProjected)" name="Projected Yield" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-lg text-slate-400 bg-slate-50/50 p-6 min-h-[200px]">
                                <p className="text-sm font-semibold text-center">Revenue trend will appear when monthly finance data is available.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Operational Status breakdown */}
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
                    <div className="mb-4">
                        <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                            <BarChart2 size={16} className="text-blue-500" />
                            Campus Distribution
                        </h3>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Active Student Headcount Ratio</p>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={branchChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                <Bar dataKey="students" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Headcount" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Secondary Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Branches Preview */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 overflow-hidden relative group">
                    <div className="flex items-center justify-between mb-4">
                         <div>
                            <h3 className="text-sm font-black text-slate-900 mb-0.5">Branch Network Status</h3>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Capacity and operational status per region.</p>
                         </div>
                         <button onClick={() => navigate('/tenant/branches')} className="text-xs font-black text-[var(--primary)] hover:underline flex items-center gap-1">
                             View All <ChevronRight size={14} />
                         </button>
                    </div>
                    
                    <div className="space-y-3.5">
                        {branchesList.slice(0, 3).map((branch, i) => {
                             const dist = stats.branchDistribution.find(d => d.branchId === branch._id);
                             const count = dist ? dist.count : 0;
                             return (
                                 <div key={branch._id || i} className="flex items-center gap-4 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group/item">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover/item:bg-[var(--primary)] group-hover/item:text-white transition-all text-sm">
                                        0{i + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-black text-slate-800 text-xs">{branch.name}</h4>
                                            <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${branch.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400'}`}>
                                                {branch.isActive ? 'OPERATIONAL' : 'INACTIVE'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between mt-1 text-xs font-semibold text-slate-500">
                                            <span>Enrolled Students</span>
                                            <span className="font-bold text-slate-700">{count} student{count === 1 ? '' : 's'}</span>
                                        </div>
                                    </div>
                                 </div>
                             );
                         })}
                    </div>
                </div>

                {/* System Activity */}
                <div className="bg-slate-900 rounded-xl p-5 text-white relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-5 opacity-10 pointer-events-none">
                        <Clock size={80} />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <div>
                            <h3 className="text-sm font-black mb-0.5">Audit Trail Log</h3>
                            <p className="text-[10px] font-bold opacity-50 uppercase tracking-wider">Latest administrative actions.</p>
                        </div>
                        
                        {activities && activities.length > 0 ? (
                            <div className="space-y-4">
                                {activities.slice(0, 3).map((act) => (
                                     <div key={act.id} className="flex gap-3 group cursor-pointer" onClick={() => navigate('/tenant/audit-logs')}>
                                        <div className="flex flex-col items-center shrink-0">
                                            <div className={`w-2 h-2 rounded-full border border-white mt-1 group-hover:scale-125 transition-transform ${
                                                act.type === 'danger' ? 'bg-rose-500' :
                                                act.type === 'warning' ? 'bg-amber-500' :
                                                act.type === 'update' ? 'bg-indigo-500' : 'bg-blue-500'
                                            }`} />
                                            <div className="w-0.5 h-8 bg-blue-500/20 mt-1" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold mb-0.5 group-hover:text-blue-400 transition-colors truncate">{act.action}</p>
                                            <p className="text-[10px] leading-tight opacity-50 truncate">By {act.actor} ({act.actorRole})</p>
                                            <span className="text-[8px] font-black uppercase tracking-widest opacity-30">{new Date(act.timestamp).toLocaleString()}</span>
                                        </div>
                                     </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-44 flex flex-col items-center justify-center border border-dashed border-white/20 rounded-lg text-slate-400 bg-white/5 p-4 text-center">
                                <p className="text-xs font-medium text-slate-300">Recent activity will appear here after staff actions are recorded.</p>
                            </div>
                        )}

                        <button onClick={() => navigate('/tenant/audit-logs')} className="w-full h-10 bg-white/10 hover:bg-white/20 transition-colors rounded-lg flex items-center justify-center gap-2 font-black text-[10px] tracking-widest uppercase">
                            Open Audit Module
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;


