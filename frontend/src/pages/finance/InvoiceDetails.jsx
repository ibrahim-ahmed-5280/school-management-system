import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoice } from '../../services/api/finance.api';
import { Card, Button, Badge } from '../../components/ui';
import { ArrowLeft, Printer } from 'lucide-react';

const InvoiceDetails = () => {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await getInvoice(invoiceId);
                setInvoice(data.data || data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [invoiceId]);

    if (loading) return <div className="p-8 text-center">Loading Invoice Details...</div>;
    if (!invoice) return <div className="p-8 text-center text-red-500">Invoice not found</div>;

    const studentName = invoice.studentId ? `${invoice.studentId.firstName} ${invoice.studentId.lastName}` : 'N/A';
    const studentRef = invoice.studentId ? `ID: ${invoice.studentId.admissionNumber}` : 'N/A';

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-2 mb-4">
                <ArrowLeft size={18} /> Back to Invoices
            </Button>

            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Invoice #{invoice._id.slice(-6)}</h1>
                    <p className="text-slate-500 mt-1">Issued on {new Date(invoice.createdAt).toLocaleDateString()}</p>
                    <p className="text-slate-600 mt-1 font-medium">{invoice.billingPeriodLabel || 'Annual'} billing period</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex items-center gap-2" onClick={() => window.print()}>
                        <Printer size={18} /> Print / Save PDF
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <div className="border-b pb-4 mb-4 flex justify-between items-center">
                        <span className="font-bold text-slate-700">Bill To</span>
                         <Badge variant={invoice.status === 'PAID' ? 'success' : invoice.status === 'PARTIALLY_PAID' ? 'warning' : 'danger'}>
                            {invoice.status}
                        </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-8 mb-6">
                        <div>
                            <p className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">Student</p>
                            <p className="font-bold text-lg text-slate-900">{studentName}</p>
                            <p className="text-slate-600">{studentRef}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">Due Date</p>
                             <p className="font-bold text-lg text-slate-900">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg overflow-hidden border">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left font-bold text-slate-600">Description</th>
                                    <th className="px-4 py-3 text-right font-bold text-slate-600">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {invoice.items?.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-3 text-slate-700 font-medium">{item.name}</td>
                                        <td className="px-4 py-3 text-right text-slate-900 font-bold">${item.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t font-bold">
                                <tr>
                                    <td className="px-4 py-3 text-slate-500 text-right">Total</td>
                                    <td className="px-4 py-3 text-right text-lg text-slate-900">${invoice.totalAmount.toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-slate-500 text-right">Paid to Date</td>
                                    <td className="px-4 py-3 text-right text-emerald-600">-${invoice.paidAmount.toLocaleString()}</td>
                                </tr>
                                <tr className="bg-white border-t-2 border-slate-200">
                                    <td className="px-4 py-4 text-slate-800 text-right text-lg">Balance Due</td>
                                    <td className="px-4 py-4 text-right text-2xl text-[var(--primary)]">${(invoice.totalAmount - invoice.paidAmount).toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card title="Payment History">
                         <div className="space-y-4">
                            {(!invoice.payments || invoice.payments.length === 0) && (
                                <p className="text-center text-slate-400 text-sm py-4">No payments recorded</p>
                            )}
                            {invoice.payments?.map((pay, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm border-b last:border-0 pb-2 last:pb-0">
                                    <div>
                                        <p className="font-bold text-slate-700">{new Date(pay.date).toLocaleDateString()}</p>
                                        <p className="text-xs text-slate-500">{pay.method} ({pay.recordedBy})</p>
                                    </div>
                                    <span className="font-bold text-emerald-600">+${pay.amount.toLocaleString()}</span>
                                </div>
                            ))}
                         </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetails;
