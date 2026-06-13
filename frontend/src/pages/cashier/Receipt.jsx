import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReceipt } from '../../services/api/cashier.api';
import { Spinner, Button } from '../../components/ui';
import { Printer, ArrowLeft } from 'lucide-react';

const Receipt = () => {
    const { paymentId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const printRef = useRef();

    useEffect(() => {
        const load = async () => {
            try {
                const res = await getReceipt(paymentId);
                setData(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [paymentId]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <Spinner />;
    if (!data) return <div>Receipt not found.</div>;

    const { branch, student, invoice, payment, dateTime, receiptNo } = data;

    return (
        <div className="max-w-3xl mx-auto space-y-6 print:m-0 print:w-full">
            {/* Action Bar (Hidden when printing) */}
            <div className="flex justify-between items-center print:hidden">
                <Button variant="ghost" onClick={() => navigate(`/cashier/invoices/${invoice.invoiceId}`)}>
                    <ArrowLeft size={18} className="mr-2" /> Back to Invoice
                </Button>
                <div className="flex gap-2">
                    <Button onClick={() => navigate('/cashier/payments/new')}>New Payment</Button>
                    <Button onClick={handlePrint} variant="outline">
                        <Printer size={18} className="mr-2" /> Print Receipt
                    </Button>
                </div>
            </div>

            {/* Receipt Container */}
            <div ref={printRef} className="bg-white p-8 shadow-xl print:shadow-none border print:border-none w-full max-w-lg mx-auto text-sm">
                
                {/* Header */}
                <div className="text-center mb-6 border-b pb-4">
                    {branch.logoUrl && (
                        <img src={branch.logoUrl} alt="Logo" className="h-12 mx-auto mb-2 object-contain" />
                    )}
                    <h2 className="text-xl font-bold uppercase tracking-wide">{branch.name}</h2>
                    <p className="text-slate-500 text-xs mt-1">{branch.address}</p>
                    <p className="text-slate-500 text-xs">{branch.contactInfo}</p>
                </div>

                {/* Meta */}
                <div className="flex justify-between mb-6 text-xs text-slate-600">
                    <div>
                        <p><span className="font-bold">Date:</span> {new Date(dateTime).toLocaleString()}</p>
                        <p><span className="font-bold">Receipt #:</span> {receiptNo ? receiptNo.slice(-8).toUpperCase() : 'N/A'}</p>
                        <p><span className="font-bold">Ref:</span> {payment.reference || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                        <p><span className="font-bold">Received From:</span></p>
                        <p className="uppercase font-medium">{student.name}</p>
                        <p>({student.admissionNumber})</p>
                    </div>
                </div>

                {/* Payment Detail */}
                <div className="mb-6 border border-slate-200 rounded p-4 bg-slate-50">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">AMOUNT PAID</span>
                        <span className="font-bold text-xl">${Number(payment.amount).toFixed(2)}</span>
                    </div>
                    <div className="text-right text-xs text-slate-500 mt-1 uppercase">Method: {payment.method}</div>
                </div>

                {/* Account Status */}
                <div className="mb-6">
                    <h3 className="font-bold border-b pb-1 mb-2 text-xs uppercase">Account Status (Inv #{invoice.invoiceId.slice(-6)})</h3>
                    <div className="grid grid-cols-2 gap-y-1 text-slate-600">
                        <span>Total Invoice:</span>
                        <span className="text-right">${Number(invoice.totalAmount).toFixed(2)}</span>
                        
                        <span>Total Paid:</span>
                        <span className="text-right font-medium text-green-700">${Number(invoice.paidAmount).toFixed(2)}</span>
                        
                        <span className="font-bold text-slate-800">Balance Due:</span>
                        <span className="text-right font-bold text-slate-800">${Number(invoice.balance).toFixed(2)}</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-slate-400 mt-8 pt-4 border-t border-dashed">
                    <p>{branch.receiptFooter || 'Thank you for your payment.'}</p>
                    <p className="mt-1 font-mono text-[10px]">Recorded By: {payment.recordedBy}</p>
                </div>
            </div>
        </div>
    );
};

export default Receipt;
