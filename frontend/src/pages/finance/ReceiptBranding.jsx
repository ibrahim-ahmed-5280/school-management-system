import React, { useCallback, useState, useEffect } from 'react';
import { getReceiptBranding } from '../../services/api/finance.api';
import { getBranches } from '../../services/api/tenant.api';
import { Card, Select } from '../../components/ui';
import { Image as ImageIcon } from 'lucide-react';

const ReceiptBranding = () => {
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [branding, setBranding] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadBranches = async () => {
            try {
                const b = await getBranches();
                setBranches(b.map(i => ({ label: i.name, value: i._id })));
                if (b.length > 0) setSelectedBranch(b[0]._id);
            } catch (e) {
                console.error(e);
            }
        };
        loadBranches();
    }, []);

    const fetchBranding = useCallback(async () => {
        if (!selectedBranch) return;
        setLoading(true);
        try {
            const data = await getReceiptBranding(selectedBranch);
            setBranding(data.data || data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [selectedBranch]);

    useEffect(() => {
        fetchBranding();
    }, [fetchBranding]);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-[var(--primary)] bg-opacity-10 rounded-xl text-[var(--primary)]">
                    <ImageIcon size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Receipt Branding</h2>
                    <p className="text-slate-500">Preview how receipts look for each branch</p>
                </div>
            </div>

            <Card>
                <div className="mb-6">
                    <Select 
                        label="Select Branch to Preview"
                        options={branches}
                        value={selectedBranch}
                        onChange={e => setSelectedBranch(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="h-64 flex items-center justify-center text-slate-400">Loading Preview...</div>
                ) : branding ? (
                    <div className="border-2 border-slate-200 border-dashed rounded-xl p-8 bg-slate-50">
                        <h3 className="text-center text-xs uppercase text-slate-300 font-bold mb-4 tracking-widest">Receipt Preview Canvas</h3>
                        
                        <div className="max-w-sm mx-auto bg-white shadow-xl p-6 text-sm font-mono relative">
                            {/* Receipt Content */}
                            <div className="text-center border-b pb-4 mb-4">
                                {branding.logoUrl ? (
                                    <img src={branding.logoUrl} alt="Logo" className="h-16 mx-auto mb-2 object-contain" />
                                ) : (
                                    <div className="h-16 w-16 bg-slate-200 mx-auto mb-2 rounded flex items-center justify-center text-xs text-slate-400">No Logo</div>
                                )}
                                <h4 className="font-bold text-lg">{branding.name || 'Branch Name'}</h4>
                                <p className="text-xs text-slate-500">{branding.address || 'Branch Address Line'}</p>
                                <p className="text-xs text-slate-500">{branding.phone || 'Phone Number'}</p>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between"><span>Receipt #:</span> <span>RCP-00001</span></div>
                                <div className="flex justify-between"><span>Date:</span> <span>{new Date().toLocaleDateString()}</span></div>
                                <div className="flex justify-between"><span>Student:</span> <span>John Doe</span></div>
                            </div>

                            <table className="w-full mb-4 border-t border-b border-dashed">
                                <thead>
                                    <tr className="text-left"><th className="py-2">Item</th><th className="text-right">Amt</th></tr>
                                </thead>
                                <tbody>
                                    <tr><td className="py-1">Tuition Fee</td><td className="text-right">500.00</td></tr>
                                    <tr><td className="py-1">Books</td><td className="text-right">150.00</td></tr>
                                </tbody>
                            </table>

                            <div className="flex justify-between font-bold text-lg mb-6">
                                <span>Total Paid</span>
                                <span>$650.00</span>
                            </div>

                            <div className="text-center text-xs text-slate-400 mt-8 pt-4 border-t">
                                <p>{branding.receiptFooter || 'Thank you for your business!'}</p>
                            </div>

                            {/* Tear Effect */}
                            <div className="absolute -bottom-2 left-0 w-full h-4 bg-slate-50" style={{clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)'}}></div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-400">Select a branch to view</div>
                )}
            </Card>
        </div>
    );
};

export default ReceiptBranding;


