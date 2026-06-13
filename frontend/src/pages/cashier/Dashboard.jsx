import React, { useEffect, useState } from 'react';
import { getPayments } from '../../services/api/cashier.api';
import { Card, Spinner } from '../../components/ui';
import { useNavigate } from 'react-router-dom';
import { Receipt, Clock, Search } from 'lucide-react';

const Dashboard = () => {
    const [recentPayments, setRecentPayments] = useState([]);
    const [todayTotal, setTodayTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [quickSearch, setQuickSearch] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const init = async () => {
            try {
                // Fetch today's payments
                const today = new Date().toISOString().split('T')[0];
                const res = await getPayments({ from: today, to: today });
                
                const payments = res.data || [];
                setRecentPayments(payments.slice(0, 5));
                const total = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
                setTodayTotal(total);

            } catch (err) {
                console.error("Dashboard Load Error", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const handleQuickSearch = (e) => {
        e.preventDefault();
        if(quickSearch.trim()) {
            navigate(`/cashier/invoices?q=${quickSearch}`);
        }
    };

    if (loading) return <Spinner size="lg" />;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Cashier Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Today's Stats */}
                 <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium mb-1">Collected Today</p>
                        <h3 className="text-3xl font-bold text-[var(--primary)]">${todayTotal.toLocaleString()}</h3>
                    </div>
                    <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-[var(--primary)]/10 text-[var(--primary)]">
                        <Clock size={24} />
                    </div>
                 </div>

                 {/* Quick Actions */}
                 <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-center gap-4">
                    <form onSubmit={handleQuickSearch} className="flex gap-2">
                        <input 
                            className="flex-1 px-4 py-2 border rounded-lg"
                            placeholder="Enter Admission # or Invoice ID..."
                            value={quickSearch}
                            onChange={e=>setQuickSearch(e.target.value)}
                        />
                        <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">
                            <Search size={18} />
                        </button>
                    </form>
                    <div className="flex gap-2">
                        <button 
                            className="flex-1 py-2 text-sm font-medium border rounded-lg hover:bg-slate-50 text-slate-600"
                            onClick={() => navigate('/cashier/payments/new')}
                        >
                            + Record Payment
                        </button>
                         <button 
                            className="flex-1 py-2 text-sm font-medium border rounded-lg hover:bg-slate-50 text-slate-600"
                            onClick={() => navigate('/cashier/invoices')}
                        >
                            Lookup Invoice
                        </button>
                    </div>
                 </div>
            </div>

            {/* Recent Payments */}
            <Card className="p-0 overflow-hidden">
                <div className="p-4 border-b bg-slate-50 font-medium text-slate-700">Recent Transactions</div>
                {recentPayments.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No payments recorded today.</div>
                ) : (
                    <div>
                        {recentPayments.map(p => (
                            <div key={p._id} className="p-4 border-b last:border-0 flex justify-between items-center hover:bg-slate-50">
                                <div>
                                    <div className="font-bold flex items-center gap-2">
                                        <span className="text-slate-800">${p.amount}</span>
                                        <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-500">{p.method}</span>
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        Ref: {p.reference || 'N/A'} • {new Date(p.createdAt).toLocaleTimeString()}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => navigate(`/cashier/receipts/${p._id}`)}
                                    className="p-2 text-slate-400 hover:text-[var(--primary)]"
                                    title="View Receipt"
                                >
                                    <Receipt size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Dashboard;


