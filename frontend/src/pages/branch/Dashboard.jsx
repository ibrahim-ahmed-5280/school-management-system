import React, { useEffect, useState } from 'react';
import { getBranchOverview, getCurrentAcademicYear } from '../../services/api/branch.api';
import { Card, Spinner } from '../../components/ui';
import { Users, BookOpen, DollarSign, TrendingUp, Calendar, BarChart2 } from 'lucide-react';
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

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [academicYear, setAcademicYear] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const yearData = await getCurrentAcademicYear();
                setAcademicYear(yearData.data);
                
                const reportData = await getBranchOverview(yearData.data?._id);
                setStats(reportData.data);
            } catch (error) {
                console.error("Dashboard Load Error", error);
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, []);

    if (loading) return <div className="h-96 flex items-center justify-center"><Spinner size="lg" /></div>;

    // Derived analytics data
    const totalInvoiced = stats?.finance?.totalInvoiced || 0;
    const totalCollected = stats?.finance?.totalCollected || 0;
    const collectionPercentage = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

    const financeTrendData = stats?.financeTrend || [];

    // Student enrollment vs active tracking data
    const studentMetricsData = [
        { name: 'Active Students', count: stats?.students?.totalActive || 0 },
        { name: 'Current Enrollments', count: stats?.students?.enrolledCurrentYear || 0 }
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">Branch Console</h1>
                    <p className="text-xs text-slate-500 font-medium">Real-time indicators & statistics for your branch.</p>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2 max-w-max">
                    <Calendar size={15} className="text-slate-400" />
                    <span className="text-xs text-slate-500 font-bold">Academic Year:</span>
                    <span className="text-xs font-black text-[var(--primary)]">{academicYear?.name || '...'}</span>
                </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <StatsCard 
                    title="Active Students" 
                    value={stats?.students?.totalActive || 0}
                    icon={Users}
                    color="text-blue-600"
                    bg="bg-blue-50/75"
                 />
                 <StatsCard 
                    title="Current Enrollments" 
                    value={stats?.students?.enrolledCurrentYear || 0}
                    icon={BookOpen}
                    color="text-emerald-600"
                    bg="bg-emerald-50/75"
                 />
                 <StatsCard 
                    title="Total Invoiced" 
                    value={`$${totalInvoiced.toLocaleString()}`}
                    icon={DollarSign}
                    color="text-indigo-600"
                    bg="bg-indigo-50/75"
                 />
                 <StatsCard 
                    title="Total Collected" 
                    value={`$${totalCollected.toLocaleString()} (${collectionPercentage}%)`}
                    icon={TrendingUp}
                    color="text-purple-600"
                    bg="bg-purple-50/75"
                 />
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Financial Trends Chart */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
                    <div className="mb-4">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                            <BarChart2 size={16} className="text-indigo-500" />
                            Fee Collection Trends
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium">Monthly collection rates comparison.</p>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={financeTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#556ee6" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#556ee6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#34c38f" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#34c38f" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                                <Area type="monotone" dataKey="Invoiced" stroke="#556ee6" strokeWidth={2} fillOpacity={1} fill="url(#colorInvoiced)" />
                                <Area type="monotone" dataKey="Collected" stroke="#34c38f" strokeWidth={2} fillOpacity={1} fill="url(#colorCollected)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right: Students Statistics */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
                    <div className="mb-4">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                            <Users size={16} className="text-emerald-500" />
                            Enrollment Metrics
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium">Comparison of registrations.</p>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={studentMetricsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                <Bar dataKey="count" fill="#34c38f" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Quick Actions Footer Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <h3 className="font-bold text-slate-800 text-sm mb-2">Shortcuts & Operations</h3>
                    <p className="text-slate-500 text-xs leading-relaxed mb-4">You have full authority to modify student catalogs, assign courses to teachers, and process school invoicing from the sidebar navigation console.</p>
                    <div className="flex gap-2">
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">Timetables</span>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">Promotion Pipelines</span>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">Exams Console</span>
                    </div>
                 </div>
                 <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <h3 className="font-bold text-slate-800 text-sm mb-2">Branch Configuration</h3>
                    <p className="text-slate-500 text-xs leading-relaxed mb-4">Ensure academic parameters are properly initialized before student rosters are registered. Set grades policies to compute correct averages.</p>
                    <div className="flex gap-2">
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded">System Checked</span>
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded">Online Status</span>
                    </div>
                 </div>
            </div>
        </div>
    );
};

const StatsCard = ({ title, value, icon, color, bg }) => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
        <div>
            <p className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">{title}</p>
            <h3 className="text-xl font-bold text-slate-800">{value}</h3>
        </div>
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${bg} ${color}`}>
            {React.createElement(icon, { size: 20 })}
        </div>
    </div>
);

export default Dashboard;
