import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getInvoiceById, createPayment } from '../../services/api/cashier.api';
import { Card, Button, Input, Select, Spinner, Toast } from '../../components/ui';

const NewPayment = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const invoiceId = searchParams.get('invoiceId');
    
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        amount: '',
        method: 'CASH',
        reference: ''
    });
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (!invoiceId) {
            setLoading(false);
            return;
        }
        const load = async () => {
            try {
                const res = await getInvoiceById(invoiceId);
                setInvoice(res.data);
                // Pre-fill amount with balance or 0
                setForm(prev => ({ ...prev, amount: res.data.balance }));
            } catch (err) {
                console.error(err);
                setToast({ type: 'error', message: 'Failed to load invoice.' });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [invoiceId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setToast(null);

        // Basic frontend validation
        if (Number(form.amount) <= 0) {
             setToast({ type: 'error', message: 'Amount must be greater than 0.' });
             setSubmitting(false);
             return;
        }
        if (invoice && Number(form.amount) > invoice.balance) {
             setToast({ type: 'error', message: 'Amount cannot exceed balance.' });
             setSubmitting(false);
             return;
        }

        try {
            const payload = {
                invoiceId: invoice?._id || invoiceId,
                amount: Number(form.amount),
                method: form.method,
                reference: form.reference
            };
            const res = await createPayment(payload);
            setToast({ type: 'success', message: 'Payment recorded successfully!' });
            
            // Redirect to receipt
            setTimeout(() => {
                navigate(`/cashier/receipts/${res.data.payment._id}`);
            }, 1000);

        } catch (err) {
            const msg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Payment failed';
            setToast({ type: 'error', message: msg });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Spinner />;

    if (!invoiceId && !invoice) {
        return (
            <div className="text-center p-8">
                <p className="mb-4">No invoice selected.</p>
                <Button onClick={() => navigate('/cashier/invoices')}>Find Invoice</Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Record Payment</h1>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {invoice && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex justify-between items-center">
                    <div>
                        <p className="text-sm text-blue-800">Paying for Invoice #{invoice._id.slice(-6)}</p>
                        <p className="font-bold text-blue-900">{invoice.studentId?.firstName} {invoice.studentId?.lastName}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-blue-800">Current Balance</p>
                        <p className="text-xl font-bold text-blue-900">${invoice.balance.toFixed(2)}</p>
                    </div>
                </div>
            )}

            <Card className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input 
                            label="Amount ($)" 
                            type="number" 
                            step="0.01"
                            value={form.amount} 
                            onChange={e => setForm({...form, amount: e.target.value})} 
                            required 
                            min="0.01"
                            max={invoice?.balance}
                        />
                        <div className="form-group">
                            <label className="block text-sm font-medium mb-1">Payment Method</label>
                            <select 
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={form.method}
                                onChange={e => setForm({...form, method: e.target.value})}
                            >
                                <option value="CASH">Cash</option>
                                <option value="CARD">Card / POS</option>
                                <option value="BANK_TRANSFER">Bank Transfer</option>
                                <option value="MOBILE_MONEY">Mobile Money</option>
                                <option value="CHECK">Check</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                    </div>
                    
                    <Input 
                        label="Reference / Receipt No. (Optional)" 
                        value={form.reference} 
                        onChange={e => setForm({...form, reference: e.target.value})} 
                        placeholder="e.g. POS-12345 or Check-999"
                    />

                    <div className="pt-4 flex gap-4">
                        <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="flex-1">Cancel</Button>
                        <Button type="submit" className="flex-1" disabled={submitting}>
                            {submitting ? <Spinner size="sm" color="white" /> : `Confirm Payment ($${form.amount || 0})`}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default NewPayment;
