import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, Printer, CheckCircle2, AlertCircle, FileText, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const ParentInvoices = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [children, setChildren] = useState([]);
    const [financeData, setFinanceData] = useState({ invoices: [], payments: [] });
    const [loadingChildren, setLoadingChildren] = useState(true);
    const [loadingFinance, setLoadingFinance] = useState(false);

    const activeStudentId = searchParams.get('studentId') || '';

    // Fetch children list first
    useEffect(() => {
        const fetchChildren = async () => {
            try {
                const res = await api.get('/parent/dashboard');
                if (res.data?.success) {
                    setChildren(res.data.data);
                    if (!activeStudentId && res.data.data.length > 0) {
                        setSearchParams({ studentId: res.data.data[0].student._id });
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingChildren(false);
            }
        };
        fetchChildren();
    }, [activeStudentId, setSearchParams]);

    // Fetch invoices and payments when student changes
    useEffect(() => {
        if (!activeStudentId) return;

        const fetchFinance = async () => {
            setLoadingFinance(true);
            try {
                const res = await api.get(`/parent/students/${activeStudentId}/invoices`);
                if (res.data?.success) {
                    setFinanceData(res.data.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingFinance(false);
            }
        };

        fetchFinance();
    }, [activeStudentId]);

    const activeChild = children.find(c => c.student._id === activeStudentId);
    const { invoices, payments } = financeData;

    const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);

    if (loadingChildren) {
        return (
            <div className="h-96 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
                        Fees & <span className="text-[var(--primary)]">Payments</span>
                    </h1>
                    <p className="text-slate-500 font-bold">Review school invoices, payments history, and fee statements.</p>
                </div>

                {/* Child Selector */}
                {children.length > 1 && (
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Student:</span>
                        <select 
                            value={activeStudentId} 
                            onChange={(e) => setSearchParams({ studentId: e.target.value })}
                            className="h-12 bg-white border border-slate-100 rounded-2xl px-4 font-bold text-slate-800 outline-none shadow-sm focus:ring-4 focus:ring-[var(--primary)]/5"
                        >
                            {children.map(c => (
                                <option key={c.student._id} value={c.student._id}>
                                    {c.student.firstName} {c.student.lastName}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Financial view */}
            {!activeStudentId ? (
                <div className="bg-white border border-slate-200 rounded-xl p-6 text-center max-w-md mx-auto shadow-sm">
                    <AlertTriangle className="mx-auto text-amber-500 mb-4" size={36} />
                    <p className="text-slate-500 text-sm font-semibold">No student selected or linked.</p>
                </div>
            ) : loadingFinance ? (
                <div className="h-64 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Financial Summary Banner */}
                    <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        totalOutstanding > 0 
                            ? 'bg-rose-50 border-rose-100 text-rose-900' 
                            : 'bg-emerald-50 border-emerald-100 text-emerald-900'
                    }`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                totalOutstanding > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                                <CreditCard size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold tracking-tight">
                                    {totalOutstanding > 0 ? 'Pending Fee Balance' : 'Account Settled'}
                                </h3>
                                <p className="text-xs font-semibold opacity-75 mt-0.5">
                                    Total Outstanding School Fees for {activeChild?.student?.firstName}
                                </p>
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] font-semibold tracking-wider opacity-65 uppercase block text-right">Outstanding Amount</span>
                            <span className="text-xl font-bold">${totalOutstanding.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Invoices List */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                <h3 className="text-base font-bold text-slate-805 mb-4 flex items-center gap-2">
                                    <FileText size={18} className="text-slate-400" />
                                    Invoices Directory
                                </h3>
                                
                                {invoices.length === 0 ? (
                                    <p className="text-center text-slate-450 text-sm font-semibold py-8">No invoices generated.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {invoices.map(inv => (
                                            <div key={inv._id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-800 text-sm">Invoice #{inv._id.toString().slice(-6).toUpperCase()}</span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${
                                                            inv.status === 'PAID' 
                                                                ? 'bg-emerald-50 text-emerald-600'
                                                                : inv.status === 'PARTIALLY_PAID'
                                                                ? 'bg-amber-50 text-amber-600'
                                                                : 'bg-rose-50 text-rose-600'
                                                        }`}>
                                                            {inv.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 font-medium">
                                                        Created: {new Date(inv.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-6 justify-between sm:justify-start">
                                                    <div className="text-right">
                                                        <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase block">Total / Balance</span>
                                                        <span className="font-semibold text-slate-850">${inv.totalAmount}</span>
                                                        <span className="text-xs font-medium text-slate-400 block">${inv.balance} remaining</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payments Logs */}
                        <div className="space-y-6">
                            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                <h3 className="text-base font-bold text-slate-855 mb-4">Receipt History</h3>
                                
                                {payments.length === 0 ? (
                                    <p className="text-center text-slate-450 text-sm font-semibold py-8">No payments recorded.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {payments.map(pay => (
                                            <div key={pay._id} className="p-3 border-b border-slate-105 last:border-b-0 space-y-1 relative">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-sm text-slate-800">${pay.amount}</span>
                                                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">PAID</span>
                                                </div>
                                                <p className="text-xs text-slate-400 font-medium">
                                                    {new Date(pay.createdAt).toLocaleDateString()} | {pay.method.toUpperCase()}
                                                </p>
                                                <p className="text-[10px] font-semibold text-slate-400 truncate">
                                                    Ref: {pay.reference || 'N/A'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ParentInvoices;
