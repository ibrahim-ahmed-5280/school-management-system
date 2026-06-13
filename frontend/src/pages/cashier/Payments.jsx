import React, { useCallback, useEffect, useState } from 'react';
import { getPayments } from '../../services/api/cashier.api';
import { Card, Table, Spinner, Button, Input } from '../../components/ui';
import { useNavigate } from 'react-router-dom';
import { Receipt as ReceiptIcon } from 'lucide-react';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        from: '',
        to: '',
        method: ''
    });
    const navigate = useNavigate();

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getPayments(filters);
            setPayments(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const handleFilter = (e) => {
        e.preventDefault();
        fetchPayments();
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Payment History</h1>

            <Card className="p-4">
                <form onSubmit={handleFilter} className="flex flex-wrap gap-4 items-end">
                    <Input 
                        label="From Date" 
                        type="date" 
                        value={filters.from} 
                        onChange={e => setFilters({...filters, from: e.target.value})} 
                    />
                    <Input 
                        label="To Date" 
                        type="date" 
                        value={filters.to} 
                        onChange={e => setFilters({...filters, to: e.target.value})} 
                    />
                    <div className="form-group w-40">
                        <label className="block text-sm font-medium mb-1">Method</label>
                        <select 
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2"
                            value={filters.method}
                            onChange={e => setFilters({...filters, method: e.target.value})}
                        >
                            <option value="">All</option>
                            <option value="CASH">Cash</option>
                            <option value="CARD">Card</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                        </select>
                    </div>
                     <Button type="submit">Filtered Search</Button>
                </form>
            </Card>

            {loading ? <Spinner /> : (
                <Card className="p-0 overflow-hidden">
                    <Table headers={['Date/Time', 'Amount', 'Method', 'Ref', 'Invoice ID', 'Recorded By', 'Action']}>
                        {payments.map(p => (
                            <tr key={p._id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 text-sm">{new Date(p.createdAt).toLocaleString()}</td>
                                <td className="px-6 py-4 font-bold text-slate-800">${p.amount.toFixed(2)}</td>
                                <td className="px-6 py-4 text-xs font-medium uppercase">{p.method}</td>
                                <td className="px-6 py-4 text-xs font-mono">{p.reference || '-'}</td>
                                <td className="px-6 py-4 text-xs font-mono text-blue-600 cursor-pointer" onClick={()=>navigate(`/cashier/invoices/${p.invoiceId._id}`)}>
                                    #{p.invoiceId._id?.slice(-8)}
                                </td>
                                <td className="px-6 py-4 text-sm">{p.recordedBy ? `${p.recordedBy.firstName} ${p.recordedBy.lastName}` : 'System'}</td>
                                <td className="px-6 py-4">
                                     <Button size="sm" variant="ghost" onClick={() => navigate(`/cashier/receipts/${p._id}`)}>
                                        <ReceiptIcon size={16} />
                                     </Button>
                                </td>
                            </tr>
                        ))}
                        {payments.length === 0 && (
                            <tr><td colSpan="7" className="text-center py-8 text-slate-500">No history found.</td></tr>
                        )}
                    </Table>
                </Card>
            )}
        </div>
    );
};

export default Payments;
