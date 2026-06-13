import React, { useCallback, useState, useEffect } from 'react';
import { getRevenueReport } from '../../services/api/finance.api';
import { getBranches, getAcademicYears } from '../../services/api/tenant.api';
import { Card, Select, Button } from '../../components/ui';
import { PieChart, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Reports = () => {
    const [reportData, setReportData] = useState([]);
    const [branches, setBranches] = useState([]);
    const [years, setYears] = useState([]);
    const [filters, setFilters] = useState({ branchId: '', academicYearId: '', groupBy: 'branch' });
    const [, setLoading] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [b, y] = await Promise.all([getBranches(), getAcademicYears()]);
            setBranches(b.map(i => ({ label: i.name, value: i._id })));
            setYears(y.map(i => ({ label: i.name, value: i._id })));
        } catch (e) {
            console.error(e);
        }
    };

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getRevenueReport(filters);
            // Expecting array of objects { _id: 'Key', totalRevenue: 1000, outstanding: 500 }
            setReportData(Array.isArray(data) ? data : data.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                     <h2 className="text-2xl font-bold text-slate-800">Financial Intelligence</h2>
                     <p className="text-slate-500">Analyze revenue streams and collection performance</p>
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                    <Download size={18} /> Export Data
                </Button>
            </div>

            <Card className="!p-4 bg-slate-50 border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select 
                        label="Primary View (Group By)"
                        options={[
                            { label: 'By Branch', value: 'branch' },
                            { label: 'By Class/Grade', value: 'class' },
                            { label: 'By Academic Year', value: 'year' },
                        ]}
                        value={filters.groupBy}
                        onChange={e => setFilters({...filters, groupBy: e.target.value})}
                    />
                    <Select 
                        label="Filter Branch"
                        options={branches}
                        value={filters.branchId}
                        onChange={e => setFilters({...filters, branchId: e.target.value})}
                    />
                    <Select 
                        label="Filter Year"
                        options={years}
                        value={filters.academicYearId}
                        onChange={e => setFilters({...filters, academicYearId: e.target.value})}
                    />
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Chart Section */}
                 <div className="bg-white p-6 rounded-xl border shadow-sm h-96">
                     <h3 className="font-bold text-slate-700 mb-4">Revenue Visualization</h3>
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="_id" tick={{fontSize: 12}} interval={0} angle={-30} textAnchor="end" height={60}/>
                            <YAxis />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Legend />
                            <Bar dataKey="totalRevenue" name="Collected" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="outstanding" name="Outstanding" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                     </ResponsiveContainer>
                 </div>

                 {/* Tabular Data */}
                 <div className="bg-white p-6 rounded-xl border shadow-sm h-96 overflow-y-auto">
                    <h3 className="font-bold text-slate-700 mb-4">Detailed Breakdown</h3>
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 sticky top-0">
                            <tr>
                                <th className="text-left py-2 px-3 text-slate-500 font-bold uppercase text-xs">Category</th>
                                <th className="text-right py-2 px-3 text-slate-500 font-bold uppercase text-xs">Collected</th>
                                <th className="text-right py-2 px-3 text-slate-500 font-bold uppercase text-xs">Pending</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {reportData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                    <td className="py-3 px-3 font-medium text-slate-800">{row._id || 'Unknown'}</td>
                                    <td className="py-3 px-3 text-right font-bold text-emerald-600">${(row.totalRevenue || 0).toLocaleString()}</td>
                                    <td className="py-3 px-3 text-right font-bold text-rose-500">${(row.outstanding || 0).toLocaleString()}</td>
                                </tr>
                            ))}
                            {reportData.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="py-8 text-center text-slate-400">No data available for selected period</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    );
};

export default Reports;


