import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle, 
  School, 
  GraduationCap, 
  DollarSign, 
  Activity,
  TrendingUp,
  BarChart2,
  PieChart as PieIcon
} from 'lucide-react';
import platformService from '../../services/platformService';
import { 
    ResponsiveContainer, 
    AreaChart,
    Area,
    PieChart, 
    Pie, 
    Cell,
    Tooltip, 
    Legend,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await platformService.getDashboardStats();
        setStats(response.data);
        setError('');
      } catch (error) {
        console.error('Error fetching stats:', error);
        setError(error.response?.data?.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const totalTenants = stats?.totalTenants || 0;
  const activeTenants = stats?.activeTenants || 0;
  const inactiveTenants = Math.max(0, totalTenants - activeTenants);
  const subscriptionRevenueTracked = Boolean(stats?.subscriptionRevenueTracked);
  const subscriptionRevenue = stats?.subscriptionRevenue || 0;
  const subscriptionRevenueTrend = stats?.subscriptionRevenueTrend || [];

  const statCards = [
    { name: 'Total Tenants', value: totalTenants, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', hint: 'Registered schools' },
    { name: 'Active Tenants', value: activeTenants, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', hint: 'Currently active' },
    { name: 'Total Branches', value: stats?.totalBranches || 0, icon: School, color: 'text-indigo-600', bg: 'bg-indigo-50', hint: 'Across all networks' },
    { name: 'Total Students', value: (stats?.totalStudents || 0).toLocaleString(), icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50', hint: 'Registered rosters' },
    { name: 'Subscription Revenue', value: subscriptionRevenueTracked ? `$${subscriptionRevenue.toLocaleString()}` : 'Not tracked', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50', hint: subscriptionRevenueTracked ? 'Platform subscriptions' : 'Billing ledger pending' },
    { name: 'System Health', value: stats?.healthStatus || 'Unknown', icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50', hint: `${stats?.metrics?.avgResponseTime || 'N/A'} avg response` },
  ];

  // Tenant Status Distribution Data
  const tenantDistributionData = [
    { name: 'Active', value: activeTenants },
    { name: 'Inactive', value: inactiveTenants }
  ];

  const PIE_COLORS = ['#34c38f', '#f46a6a'];

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Platform Owner Console</h1>
        <p className="text-xs text-slate-500 font-medium">Global system health metrics, plans, and tenant registrations.</p>
        {error && (
          <p className="text-xs font-bold text-rose-600 mt-2">{error}</p>
        )}
      </div>

      {/* Grid of Compact Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <div key={card.name} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
            <div className="min-w-0">
              <h3 className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate">{card.name}</h3>
              <p className="text-lg font-black text-slate-900 leading-tight">{card.value}</p>
              <span className="text-[10px] text-slate-400 font-medium">{card.hint}</span>
            </div>
            <div className={`${card.bg} ${card.color} p-2 rounded-lg flex-shrink-0`}>
              <card.icon size={18} />
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Platform subscription revenue */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
            <div className="mb-4">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <BarChart2 size={16} className="text-indigo-500" />
                    Platform Subscription Revenue
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Recorded tenant subscription transactions.</p>
            </div>
            {subscriptionRevenueTrend.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={subscriptionRevenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="_id" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="total" name="Revenue" stroke="#2563eb" fill="#dbeafe" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-center px-6">
                  <div>
                      <DollarSign size={24} className="mx-auto text-slate-400 mb-3" />
                      <p className="text-sm font-bold text-slate-600">No subscription transactions recorded yet</p>
                      <p className="text-xs text-slate-400 mt-1">Recorded platform payments will appear here.</p>
                  </div>
              </div>
            )}
        </div>

        {/* Right: Tenant Status Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
            <div className="mb-4">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <PieIcon size={16} className="text-emerald-500" />
                    Tenant Activation Status
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Proportion of active vs inactive schools.</p>
            </div>
            <div className="h-56 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={tenantDistributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {tenantDistributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Onboarding */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 text-sm">Recently Onboarded Tenants</h3>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{(stats?.recentTenants || []).length} records</span>
          </div>
          <div className="space-y-3">
            {(stats?.recentTenants || []).map((tenant) => (
              <div key={tenant.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs flex-shrink-0">
                  {tenant.name?.charAt(0)?.toUpperCase() || 'T'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 text-xs truncate">{tenant.name}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold">{tenant.plan} Plan • {tenant.branchCount} Branches</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] font-black text-emerald-600">{tenant.status}</p>
                  <p className="text-[9px] font-bold text-slate-400">{tenant.createdAgo}</p>
                </div>
              </div>
            ))}
            {(!stats?.recentTenants || stats.recentTenants.length === 0) && (
              <p className="text-xs text-slate-400 font-bold p-4 text-center">No tenant onboarding records found yet.</p>
            )}
          </div>
        </div>

        {/* System Activity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 text-sm">System Activity Logs</h3>
            <TrendingUp className="text-slate-400" size={16} />
          </div>
          <div className="space-y-4 max-h-[290px] overflow-y-auto pr-1">
            {(stats?.recentActivity || []).map((activity) => (
              <div key={activity.id} className="flex gap-3 text-xs leading-normal">
                <div className="mt-0.5 flex-shrink-0">
                  <Activity size={14} className={
                    activity.type === 'danger'
                      ? 'text-rose-500'
                      : activity.type === 'warning'
                        ? 'text-amber-500'
                        : activity.type === 'update'
                          ? 'text-blue-500'
                          : 'text-emerald-500'
                  } />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 text-xs">{activity.action}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">{activity.actor} • {activity.target}</p>
                  <p className="text-[9px] font-bold text-slate-400">{activity.time}</p>
                </div>
              </div>
            ))}
            {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
              <p className="text-xs text-slate-400 font-bold p-4 text-center">No recent audit activity available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
