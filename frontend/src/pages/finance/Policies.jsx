import React, { useState, useEffect } from 'react';
import { getFinancePolicies, updateFinancePolicies } from '../../services/api/finance.api';
import { Card, Button } from '../../components/ui';
import { Save, ShieldCheck } from 'lucide-react';

const Policies = () => {
    const [policy, setPolicy] = useState({ autoInvoiceMode: 'MANUAL', isEnabled: true });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const fetchPolicy = async () => {
            try {
                const data = await getFinancePolicies();
                setPolicy(data.data || data || { autoInvoiceMode: 'MANUAL', isEnabled: true });
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchPolicy();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await updateFinancePolicies(policy);
            setMessage({ type: 'success', text: 'Policies updated successfully!' });
        } catch {
            setMessage({ type: 'error', text: 'Failed to update policies.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading Governance Policies...</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-[var(--primary)] bg-opacity-10 rounded-xl text-[var(--primary)]">
                     <ShieldCheck size={32} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Finance Policies</h2>
                    <p className="text-slate-500">Configure global invoicing and collection rules</p>
                </div>
            </div>

            <Card title="Automated Rules Engine">
                <div className="space-y-8">
                    <div className="flex items-center justify-between p-5 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                            <p className="font-bold text-slate-900 text-lg">Auto-Invoice Mode</p>
                            <p className="text-sm text-slate-500 mt-1 max-w-md">Automatically generate reusable invoices for all active enrollments at the start of each billing cycle.</p>
                        </div>
                        <select 
                            className="bg-slate-100 border-none rounded-lg px-4 py-2 font-medium text-slate-700 focus:ring-2 focus:ring-[var(--primary)] outline-none"
                            value={policy.autoInvoiceMode}
                            onChange={(e) => setPolicy({...policy, autoInvoiceMode: e.target.value})}
                        >
                            <option value="MANUAL">Manual Only</option>
                            <option value="ON_YEAR_START">On Year Start</option>
                            <option value="ON_ENROLLMENT">On Enrollment</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                            <p className="font-bold text-slate-900 text-lg">Module Status</p>
                            <p className="text-sm text-slate-500 mt-1">Master switch for finance operations. Disabling stops all new transactions.</p>
                        </div>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={policy.isEnabled}
                                onChange={(e) => setPolicy({...policy, isEnabled: e.target.checked})}
                            />
                            <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                        </label>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-xl text-sm font-bold flex items-center justify-center ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6">
                            <Save size={18} />
                            {saving ? 'Applying Changes...' : 'Save Configuration'}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Policies;


