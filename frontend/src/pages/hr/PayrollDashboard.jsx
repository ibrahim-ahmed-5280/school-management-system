import React, { useCallback, useState, useEffect } from 'react';
import { DollarSign, CheckCircle2, RefreshCw, AlertTriangle, CalendarDays } from 'lucide-react';
import api from '../../services/api';

const PayrollDashboard = () => {
    const [month, setMonth] = useState(new Date().getMonth() + 1); // 1-12
    const [year, setYear] = useState(new Date().getFullYear());
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [processingId, setProcessingId] = useState(null);

    const fetchPayroll = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/hr/payroll?month=${month}&year=${year}`);
            if (res.data?.success) {
                setPayrolls(res.data.data);
            }
        } catch (err) {
            console.error('Failed to load payroll list', err);
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        fetchPayroll();
    }, [fetchPayroll]);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await api.post('/hr/payroll/generate', { month, year });
            alert(res.data?.message || 'Payroll generated successfully');
            fetchPayroll();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to generate payroll');
        } finally {
            setGenerating(false);
        }
    };

    const handlePay = async (id) => {
        setProcessingId(id);
        try {
            await api.put(`/hr/payroll/${id}/pay`);
            fetchPayroll();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to process payment');
        } finally {
            setProcessingId(null);
        }
    };

    const totalPaid = payrolls.filter(p => p.status === 'Paid').reduce((acc, curr) => acc + curr.netSalary, 0);
    const totalPending = payrolls.filter(p => p.status === 'Draft').reduce((acc, curr) => acc + curr.netSalary, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                        Payroll & Salaries
                    </h1>
                    <p className="text-slate-400 font-medium text-xs">Process monthly teacher/staff salaries and view payout history.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <select 
                        value={month} 
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className="h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm text-slate-800 outline-none shadow-sm focus:border-blue-500"
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {new Date(0, i).toLocaleString(undefined, { month: 'long' })}
                            </option>
                        ))}
                    </select>

                    <select 
                        value={year} 
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm text-slate-800 outline-none shadow-sm focus:border-blue-500"
                    >
                        {[year - 1, year, year + 1].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    <button 
                        onClick={handleGenerate}
                        disabled={generating}
                        className="h-10 px-4 bg-slate-900 text-white rounded-lg font-semibold tracking-wider text-xs flex items-center gap-1.5 hover:bg-slate-800 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
                        {generating ? 'GENERATING...' : 'GENERATE'}
                    </button>
                </div>
            </div>

            {/* Financial Summary Banners */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                        <DollarSign size={18} />
                    </div>
                    <div>
                        <span className="text-[10px] font-semibold tracking-wider text-slate-450 uppercase block">Total Payroll</span>
                        <p className="text-lg font-bold text-slate-800">${(totalPaid + totalPending).toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 size={18} />
                    </div>
                    <div>
                        <span className="text-[10px] font-semibold tracking-wider text-slate-455 uppercase block">Disbursed (Paid)</span>
                        <p className="text-lg font-bold text-emerald-600">${totalPaid.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                        <AlertTriangle size={18} />
                    </div>
                    <div>
                        <span className="text-[10px] font-semibold tracking-wider text-slate-455 uppercase block">Pending Payouts</span>
                        <p className="text-lg font-bold text-rose-500">${totalPending.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Payroll History Table */}
            {loading ? (
                <div className="h-64 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : payrolls.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-6 text-center max-w-md mx-auto shadow-sm">
                    <CalendarDays className="mx-auto text-slate-300 mb-4" size={36} />
                    <h3 className="text-lg font-bold text-slate-800 mb-1">No Payroll Generated</h3>
                    <p className="text-slate-500 text-sm">
                        Click the **Generate** button above to process draft payroll profiles for the selected month/year.
                    </p>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/20">
                                    <th className="p-6">Employee</th>
                                    <th className="p-6">Basic Salary</th>
                                    <th className="p-6">Allowances</th>
                                    <th className="p-6">Deductions</th>
                                    <th className="p-6">Net Payout</th>
                                    <th className="p-6">Status</th>
                                    <th className="p-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payrolls.map(pay => (
                                    <tr key={pay._id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                                        <td className="p-6 font-black text-slate-900">
                                            {pay.userId?.name}
                                            <span className="text-[10px] block text-slate-400 capitalize font-bold">
                                                {pay.userId?.role}
                                            </span>
                                        </td>
                                        <td className="p-6 text-sm text-slate-600 font-bold">${pay.basicSalary}</td>
                                        <td className="p-6 text-sm text-emerald-600 font-bold">+${pay.allowances}</td>
                                        <td className="p-6 text-sm text-rose-500 font-bold">-${pay.deductions}</td>
                                        <td className="p-6 font-black text-slate-800">${pay.netSalary}</td>
                                        <td className="p-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                                                pay.status === 'Paid' 
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                    : 'bg-rose-50 text-rose-600 border-rose-100'
                                            }`}>
                                                {pay.status}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            {pay.status === 'Draft' ? (
                                                <button 
                                                    onClick={() => handlePay(pay._id)}
                                                    disabled={processingId === pay._id}
                                                    className="h-10 px-6 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl transition-all font-black text-[10px] tracking-widest uppercase disabled:opacity-50"
                                                >
                                                    {processingId === pay._id ? 'PROCESSING...' : 'DISBURSE'}
                                                </button>
                                            ) : (
                                                <span className="text-xs font-bold text-slate-400">
                                                    Paid on {new Date(pay.paidAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayrollDashboard;
