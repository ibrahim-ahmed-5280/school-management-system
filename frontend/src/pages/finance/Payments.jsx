import React, { useCallback, useState, useEffect } from 'react';
import { getPayments } from '../../services/api/finance.api';
import { getBranches } from '../../services/api/tenant.api';
import { Card, Select, Badge, Button, Input } from '../../components/ui';
import { History, Search } from 'lucide-react';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [branches, setBranches] = useState([]);
    const [filters, setFilters] = useState({ branchId: '', method: '', from: '', to: '' });

    useEffect(() => {
        fetchLookups();
    }, []);

    const fetchLookups = async () => {
        try {
            const b = await getBranches();
            setBranches(b.map(i => ({ label: i.name, value: i._id })));
        } catch (e) {
            console.error(e);
        }
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getPayments(filters);
            setPayments(data.data || data || []);
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
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                    <History size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Transaction History</h2>
                    <p className="text-slate-500">Read-only ledger of all received payments</p>
                </div>
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
                        label="Method"
                        options={[
                            {label: 'Cash', value: 'Cash'},
                            {label: 'Card', value: 'Card'},
                            {label: 'Bank Transfer', value: 'Bank Transfer'},
                            {label: 'Online', value: 'Online'}
                        ]}
                        value={filters.method}
                        onChange={e => setFilters({...filters, method: e.target.value})}
                    />
                    <Input 
                        type="date" 
                        label="From Date"
                        value={filters.from}
                        onChange={e => setFilters({...filters, from: e.target.value})}
                    />
                    <Input 
                        type="date" 
                        label="To Date"
                        value={filters.to}
                        onChange={e => setFilters({...filters, to: e.target.value})}
                    />
                </div>
            </Card>

            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b text-slate-500 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Receipt ID</th>
                            <th className="px-6 py-4">Invoice Ref</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Method</th>
                            <th className="px-6 py-4">Reference</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {loading ? (
                             <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading ledger...</td></tr>
                        ) : payments.length === 0 ? (
                             <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-400">No payment records found</td></tr>
                        ) : (
                            payments.map((pay) => (
                                <tr key={pay._id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-mono text-slate-500">RCP-{pay._id.slice(-6)}</td>
                                    <td className="px-6 py-4 font-bold text-slate-700">
                                        INV-{typeof pay.invoiceId === 'object' && pay.invoiceId ? pay.invoiceId._id?.slice(-6) : typeof pay.invoiceId === 'string' ? pay.invoiceId.slice(-6) : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">{new Date(pay.date || pay.createdAt).toLocaleDateString()} {new Date(pay.date || pay.createdAt).toLocaleTimeString()}</td>
                                    <td className="px-6 py-4"><Badge>{pay.method}</Badge></td>
                                    <td className="px-6 py-4 text-slate-500">{pay.reference || '-'}</td>
                                    <td className="px-6 py-4 text-right font-bold text-emerald-600">+${pay.amount.toLocaleString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Payments;
