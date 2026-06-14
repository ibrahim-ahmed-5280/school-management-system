import React, { useState, useEffect } from 'react';
import { getPaymentsSummary, getOutstanding } from '../../services/api/finance.api';
import { getBranches, getAcademicYears } from '../../services/api/tenant.api';
import { Card, Select, Badge } from '../../components/ui/index';
import { Wallet, Users, AlertTriangle, TrendingUp } from 'lucide-react';

const FinanceDashboard = () => {
    const [summary, setSummary] = useState(null);
    const [outstanding, setOutstanding] = useState(null);
    const [branches, setBranches] = useState([]);
    const [years, setYears] = useState([]);
    const [filters, setFilters] = useState({ branchId: '', academicYearId: '' });
    const [, setLoading] = useState(true);

    useEffect(() => {
        const fetchLookups = async () => {
            try {
                const [bData, yData] = await Promise.all([getBranches(), getAcademicYears()]);
                setBranches(bData.map(b => ({ label: b.name, value: b._id })));
                setYears(yData.map(y => ({ label: y.name, value: y._id })));
            } catch (err) {
                console.error(err);
            }
        };
        fetchLookups();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [sData, oData] = await Promise.all([
                    getPaymentsSummary(filters),
                    getOutstanding(filters)
                ]);
                setSummary(sData.data);
                setOutstanding(oData.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filters]);

    const totalCollected = summary?.byMethod?.reduce((acc, curr) => acc + curr.total, 0) || 0;

    const stats = [
        { label: 'Total Collected', value: `$${totalCollected.toLocaleString()}`, icon: Wallet, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Total Outstanding', value: `$${(outstanding?.totalOutstanding || 0).toLocaleString()}`, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Unpaid Invoices', value: outstanding?.count || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' }
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Financial Overview</h2>
                    <p className="text-slate-500">Track collections and outstanding balances across the institution</p>
                </div>
                
                <div className="flex gap-2">
                    <Select 
                        options={branches} 
                        value={filters.branchId}
                        onChange={(e) => setFilters({...filters, branchId: e.target.value})}
                        className="w-48"
                        placeholder="All Branches"
                    />
                    <Select 
                        options={years} 
                        value={filters.academicYearId}
                        onChange={(e) => setFilters({...filters, academicYearId: e.target.value})}
                        className="w-40"
                        placeholder="All Years"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <Card key={stat.label} className="hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card title="Collections by Method">
                    <div className="space-y-4">
                        {summary?.byMethod?.map((item) => (
                            <div key={item._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                <span className="font-medium text-slate-700">{item._id}</span>
                                <div className="text-right">
                                    <p className="font-bold text-slate-900">${item.total.toLocaleString()}</p>
                                    <p className="text-xs text-slate-500">{item.count} payments</p>
                                </div>
                            </div>
                        ))}
                        {(!summary?.byMethod || summary?.byMethod.length === 0) && (
                            <p className="text-center text-slate-400 py-4">No payment data found</p>
                        )}
                    </div>
                </Card>

                <Card title="Collections by Branch">
                   <div className="space-y-4">
                        {summary?.byBranch?.map((item) => {
                            const branchName = branches.find(b => b.value === item._id)?.label || 'Unknown Branch';
                            return (
                                <div key={item._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                    <span className="font-medium text-slate-700">{branchName}</span>
                                    <p className="font-bold text-slate-900">${item.total.toLocaleString()}</p>
                                </div>
                            );
                        })}
                        {(!summary?.byBranch || summary?.byBranch.length === 0) && (
                            <p className="text-center text-slate-400 py-4">No branch data found</p>
                        )}
                   </div>
                </Card>
            </div>
        </div>
    );
};

export default FinanceDashboard;
