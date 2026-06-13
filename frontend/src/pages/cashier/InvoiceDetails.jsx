import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoiceById } from '../../services/api/cashier.api';
import { Card, Button, Spinner, Badge } from '../../components/ui';

const InvoiceDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInv = async () => {
            try {
                const res = await getInvoiceById(id);
                setInvoice(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchInv();
    }, [id]);

    if (loading) return <Spinner />;
    if (!invoice) return <div>Invoice not found.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Invoice Details</h1>
                <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card className="p-6">
                        <div className="flex justify-between items-start mb-6 pb-6 border-b">
                            <div>
                                <h2 className="text-xl font-bold">{invoice.academicYearId?.name} Invoice</h2>
                                <p className="text-slate-500 text-sm">#{invoice._id}</p>
                            </div>
                            <div className="text-right">
                                <Badge variant={invoice.status === 'PAID' ? 'success' : invoice.status === 'PARTIALLY_PAID' ? 'warning' : 'danger'} size="lg">
                                    {invoice.status}
                                </Badge>
                                <p className="text-xs text-slate-400 mt-2">Created: {new Date(invoice.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Student Info */}
                        <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                            <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Student</h3>
                            <div className="flex justify-between">
                                <div>
                                    <p className="font-bold text-lg">{invoice.studentId?.firstName} {invoice.studentId?.lastName}</p>
                                    <p className="text-sm">{invoice.studentId?.admissionNumber}</p>
                                </div>
                                <div className="text-right">
                                     <p className="text-sm">{invoice.studentId?.guardianInfo?.name}</p>
                                     <p className="text-xs text-slate-500">{invoice.studentId?.guardianInfo?.phone}</p>
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <table className="w-full text-sm mb-6">
                            <thead className="bg-slate-100 text-slate-600">
                                <tr>
                                    <th className="text-left p-3">Description</th>
                                    <th className="text-right p-3">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items.map((item, idx) => (
                                    <tr key={idx} className="border-b last:border-0">
                                        <td className="p-3">{item.name}</td>
                                        <td className="p-3 text-right font-medium">${item.amount.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="font-bold border-b pb-2 mb-4">Payment Summary</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-slate-600">
                                <span>Total Amount</span>
                                <span className="font-bold text-slate-800">${invoice.totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                                <span>Paid Amount</span>
                                <span className="font-bold">-${invoice.paidAmount.toFixed(2)}</span>
                            </div>
                            <div className="border-t pt-2 mt-2 flex justify-between items-center">
                                <span className="font-bold">Balance Due</span>
                                <span className={`text-xl font-bold ${invoice.balance > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                    ${invoice.balance.toFixed(2)}
                                </span>
                            </div>
                        </div>

                         {invoice.balance > 0 && invoice.status !== 'VOID' && (
                            <div className="mt-6">
                                <Button className="w-full" onClick={() => navigate(`/cashier/payments/new?invoiceId=${invoice._id}`)}>
                                    Record Payment
                                </Button>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetails;
