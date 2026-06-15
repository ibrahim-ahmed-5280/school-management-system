import React, { useCallback, useState, useEffect } from 'react';
import { getInvoices } from '../../services/api/finance.api';
import { getBranches, getAcademicYears } from '../../services/api/tenant.api';
import { Card, Select, Badge, Button } from '../../components/ui';
import { Search, Eye, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [branches, setBranches] = useState([]);
    const [years, setYears] = useState([]);
    const [filters, setFilters] = useState({ branchId: '', academicYearId: '', status: '', studentId: '' });
    
    const navigate = useNavigate();

    useEffect(() => {
        fetchLookups();
    }, []);

    const fetchLookups = async () => {
        try {
            const [b, y] = await Promise.all([getBranches(), getAcademicYears()]);
            setBranches(b.map(i => ({ label: i.name, value: i._id })));
            setYears(y.map(i => ({ label: i.name, value: i._id })));
        } catch (e) {
            console.error(e);
        }
    };

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getInvoices(filters);
            setInvoices(Array.isArray(data) ? data : (data.data || []));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                     <h2 className="text-2xl font-bold text-slate-800">Invoice Management</h2>
                     <p className="text-slate-500">Track and manage student billing records</p>
                </div>
                <Button onClick={() => navigate('/finance/invoices/generate')} className="flex items-center gap-2">
                    <Plus size={18} />
                    Generate Invoice
                </Button>
            </div>

            <Card className="!p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Select 
                        label="Branch"
                        options={branches}
                        value={filters.branchId}
                        onChange={e => setFilters({...filters, branchId: e.target.value})}
                    />
                    <Select 
                        label="Academic Year"
                        options={years}
                        value={filters.academicYearId}
                        onChange={e => setFilters({...filters, academicYearId: e.target.value})}
                    />
                    <Select 
                        label="Status"
                        options={[
                            {label: 'PAID', value: 'PAID'},
                            {label: 'UNPAID', value: 'UNPAID'},
                            {label: 'PARTIALLY_PAID', value: 'PARTIALLY_PAID'},
                            {label: 'VOID', value: 'VOID'},
                        ]}
                        value={filters.status}
                        onChange={e => setFilters({...filters, status: e.target.value})}
                    />
                    <div className="pt-6">
                         <div className="relative">
                            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                            <input 
                                placeholder="Student ID..." 
                                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none"
                                value={filters.studentId}
                                onChange={e => setFilters({...filters, studentId: e.target.value})} 
                            />
                         </div>
                    </div>
                </div>
            </Card>

            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left font-medium">
                    <thead className="bg-slate-50 border-b text-slate-500 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Invoice #</th>
                            <th className="px-6 py-4">Student</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Billing Period</th>
                            <th className="px-6 py-4 text-right">Total</th>
                            <th className="px-6 py-4 text-right">Paid</th>
                            <th className="px-6 py-4 text-right">Balance</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan="9" className="px-6 py-8 text-center text-slate-500">Loading invoices...</td></tr>
                        ) : invoices.length === 0 ? (
                            <tr><td colSpan="9" className="px-6 py-8 text-center text-slate-400">No invoices found matching criteria</td></tr>
                        ) : (
                            invoices.map(inv => (
                                <tr key={inv._id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 text-slate-600 font-mono text-sm">INV-{inv._id.slice(-6)}</td>
                                    <td className="px-6 py-4 text-slate-900 font-bold">
                                        {inv.studentId && typeof inv.studentId === 'object' ? `${inv.studentId.firstName} ${inv.studentId.lastName}` : (inv.studentName || 'N/A')}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}</td>
                                    <td className="px-6 py-4 text-slate-600 text-sm">{inv.billingPeriodLabel || 'Annual'}</td>
                                    <td className="px-6 py-4 text-right text-slate-900">${inv.totalAmount?.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right text-emerald-600">${inv.paidAmount?.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right text-rose-500 font-bold">${(inv.totalAmount - inv.paidAmount)?.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center">
                                        <Badge variant={inv.status === 'PAID' ? 'success' : inv.status === 'PARTIALLY_PAID' ? 'warning' : 'danger'}>
                                            {inv.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" onClick={() => navigate(`/finance/invoices/${inv._id}`)}>
                                            <Eye size={18} />
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Invoices;
