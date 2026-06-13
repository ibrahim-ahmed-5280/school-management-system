import React, { useCallback, useState, useEffect } from 'react';
import { getOutstanding } from '../../services/api/finance.api';
import { getBranches, getAcademicYears } from '../../services/api/tenant.api';
import { Card, Select, Badge } from '../../components/ui';
import { AlertCircle, TrendingDown } from 'lucide-react';

const Outstanding = () => {
    const [data, setData] = useState({ totalOutstanding: 0, count: 0, debtors: [] });
    const [branches, setBranches] = useState([]);
    const [years, setYears] = useState([]);
    const [filters, setFilters] = useState({ branchId: '', academicYearId: '' });
    const [, setLoading] = useState(false);

    useEffect(() => {
        loadLookups();
    }, []);

    const loadLookups = async () => {
        try {
            const [b, y] = await Promise.all([getBranches(), getAcademicYears()]);
            setBranches(b.map(i => ({ label: i.name, value: i._id })));
            setYears(y.map(i => ({ label: i.name, value: i._id })));
        } catch (e) { console.error(e); }
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getOutstanding(filters);
             // Expecting structure: { totalOutstanding: 999, count: 10, debtors: [{ studentName, balance, branchName }] }
            setData(res.data || res || { totalOutstanding: 0, count: 0, debtors: [] });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                    <AlertCircle size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Outstanding Balances</h2>
                    <p className="text-slate-500">Monitor unpaid dues and collection risks</p>
                </div>
            </div>

            <Card className="!p-4 bg-white shadow-sm border">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <Select 
                        label="Filter by Branch"
                        options={branches}
                        value={filters.branchId}
                        onChange={e => setFilters({...filters, branchId: e.target.value})}
                    />
                    <Select 
                        label="Filter by Year"
                        options={years}
                        value={filters.academicYearId}
                        onChange={e => setFilters({...filters, academicYearId: e.target.value})}
                    />
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-rose-50 border-rose-100">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-white rounded-full text-rose-500 shadow-sm">
                            <TrendingDown size={32} />
                        </div>
                        <div>
                            <p className="text-slate-500 font-bold text-sm uppercase">Total Receivables</p>
                            <p className="text-4xl font-black text-slate-900">${(data.totalOutstanding || 0).toLocaleString()}</p>
                            <p className="text-sm font-medium text-rose-600 mt-1">{data.count || 0} Unpaid Invoices</p>
                        </div>
                    </div>
                </Card>
                
                <Card className="bg-blue-50 border-blue-100">
                    <div className="p-2">
                        <h3 className="font-bold text-slate-700 text-lg mb-2">Collection Target</h3>
                        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full w-[0%]" style={{width: '65%'}}></div>
                        </div>
                         <p className="text-xs text-slate-500 mt-2 text-right">65% Collected (Mock)</p>
                         <p className="text-sm text-slate-600 mt-4">Automated reminders are active for {data.count || 0} students.</p>
                    </div>
                </Card>
            </div>

            <Card title="Top Debtors Watchlist">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3 text-left">Student</th>
                                <th className="px-4 py-3 text-left">Branch</th>
                                <th className="px-4 py-3 text-right">Balance Due</th>
                                <th className="px-4 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {data.debtors?.slice(0, 10).map((d, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-bold text-slate-800">{d.studentName}</td>
                                    <td className="px-4 py-3 text-slate-500">{d.branchName || '-'}</td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">${(d.balance || 0).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-center">
                                        <Badge variant="danger">Overdue</Badge>
                                    </td>
                                </tr>
                            ))}
                            {(!data.debtors || data.debtors.length === 0) && (
                                <tr>
                                    <td colSpan="4" className="px-4 py-8 text-center text-slate-400">No major debtors found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default Outstanding;
