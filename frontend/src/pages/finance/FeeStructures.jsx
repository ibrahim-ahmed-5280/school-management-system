import React, { useState, useEffect } from 'react';
import { fetchFeeStructures, createFeeStructure, deleteFeeStructure } from '../../services/api/finance.api';
import { getBranches, getAcademicYears, getClasses } from '../../services/api/tenant.api';
import { Card, Button, Input, Select, Badge } from '../../components/ui';
import { Trash2, Plus, CreditCard, X } from 'lucide-react';

const unwrapList = (response) => {
    const payload = response?.data?.data ?? response?.data ?? response;
    return Array.isArray(payload) ? payload : [];
};

const billingFrequencyOptions = [
    { label: 'Annual payment', value: 'YEARLY' },
    { label: 'Monthly payments', value: 'MONTHLY' },
    { label: 'Every two months', value: 'EVERY_TWO_MONTHS' },
    { label: 'Quarterly payments', value: 'QUARTERLY' },
    { label: 'Term payments', value: 'TERM' },
    { label: 'Custom schedule', value: 'CUSTOM' }
];

const frequencyLabel = (value) => billingFrequencyOptions.find(option => option.value === value)?.label || 'Annual payment';

const FeeStructures = () => {
    const [structures, setStructures] = useState([]);
    const [branches, setBranches] = useState([]);
    const [years, setYears] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form State
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        branchId: '',
        classId: '',
        academicYearId: '',
        billingFrequency: 'YEARLY',
        billingPeriods: [],
        feeItems: []
    });
    const [newItem, setNewItem] = useState({ name: '', amount: '' });
    const [newPeriod, setNewPeriod] = useState({ label: '', amount: '' });

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [fs, b, y] = await Promise.all([
                fetchFeeStructures(),
                getBranches(),
                getAcademicYears()
            ]);
            setStructures(unwrapList(fs));
            setBranches(unwrapList(b).map(i => ({ label: i.name, value: i._id })));
            setYears(unwrapList(y).map(i => ({ label: i.name, value: i._id })));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!formData.branchId) {
            setClasses([]);
            return;
        }

        const loadClasses = async () => {
            try {
                const response = await getClasses({ branchId: formData.branchId });
                setClasses(unwrapList(response).map(item => ({ label: item.name, value: item._id })));
            } catch (error) {
                console.error(error);
                setClasses([]);
            }
        };

        loadClasses();
    }, [formData.branchId]);

    const handleAddItem = () => {
        if (!newItem.name || !newItem.amount) return;
        setFormData(prev => ({
            ...prev,
            feeItems: [...prev.feeItems, { name: newItem.name, amount: parseFloat(newItem.amount) }]
        }));
        setNewItem({ name: '', amount: '' });
    };

    const handleRemoveItem = (idx) => {
        setFormData(prev => ({
            ...prev,
            feeItems: prev.feeItems.filter((_, i) => i !== idx)
        }));
    };

    const handleAddPeriod = () => {
        if (!newPeriod.label || newPeriod.amount === '' || Number(newPeriod.amount) < 0) return;
        setFormData(prev => ({
            ...prev,
            billingPeriods: [...prev.billingPeriods, { label: newPeriod.label, amount: Number(newPeriod.amount) }]
        }));
        setNewPeriod({ label: '', amount: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.branchId || !formData.classId || !formData.academicYearId || !formData.name || formData.feeItems.length === 0) return;
        if (formData.billingFrequency === 'CUSTOM' && formData.billingPeriods.length === 0) return;
        
        try {
            await createFeeStructure(formData);
            const updated = await fetchFeeStructures();
            setStructures(unwrapList(updated));
            setIsCreating(false);
            setFormData({ name: '', branchId: '', classId: '', academicYearId: '', billingFrequency: 'YEARLY', billingPeriods: [], feeItems: [] });
        } catch (e) {
            console.error(e);
            alert('Failed to create fee structure');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await deleteFeeStructure(id);
            setStructures(prev => prev.filter(s => s._id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    if (isCreating) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">New Fee Structure</h2>
                    <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                </div>
                <Card>
                    <div className="space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Select 
                                label="Branch" 
                                options={branches} 
                                value={formData.branchId}
                                onChange={e => setFormData({...formData, branchId: e.target.value, classId: ''})}
                                required
                            />
                            <Select
                                label="Class"
                                options={classes}
                                value={formData.classId}
                                onChange={e => setFormData({...formData, classId: e.target.value})}
                                disabled={!formData.branchId || classes.length === 0}
                                required
                            />
                            <Select 
                                label="Academic Year" 
                                options={years} 
                                value={formData.academicYearId}
                                onChange={e => setFormData({...formData, academicYearId: e.target.value})}
                                required
                            />
                         </div>
                         <Input 
                            label="Structure Name (e.g., Grade 10 Standard)" 
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                         />

                         <Select
                            label="Student Payment Schedule"
                            options={billingFrequencyOptions}
                            value={formData.billingFrequency}
                            onChange={e => setFormData({
                                ...formData,
                                billingFrequency: e.target.value,
                                billingPeriods: e.target.value === 'CUSTOM' ? formData.billingPeriods : []
                            })}
                         />
                         
                         <div className="border-t pt-4">
                            <label className="text-sm font-medium text-slate-700 mb-2 block">Fee Breakdown</label>
                            <div className="flex gap-2 mb-4">
                                <Input 
                                    placeholder="Item Name (e.g., Tuition)" 
                                    value={newItem.name} 
                                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                                    className="flex-1"
                                />
                                <Input 
                                    type="number" 
                                    placeholder="Amount" 
                                    value={newItem.amount} 
                                    onChange={e => setNewItem({...newItem, amount: e.target.value})}
                                    className="w-32"
                                />
                                <Button onClick={handleAddItem} className="px-4"><Plus size={20} /></Button>
                            </div>

                            <div className="space-y-2 bg-slate-50 p-4 rounded-lg">
                                {formData.feeItems.length === 0 && <p className="text-slate-400 text-sm italic">No items added yet</p>}
                                {formData.feeItems.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-slate-100 shadow-sm">
                                        <span className="font-medium text-slate-700">{item.name}</span>
                                        <div className="flex items-center gap-4">
                                            <span className="font-bold text-slate-900">${item.amount}</span>
                                            <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600"><X size={16}/></button>
                                        </div>
                                    </div>
                                ))}
                                {formData.feeItems.length > 0 && (
                                    <div className="flex justify-between items-center pt-2 border-t mt-2">
                                        <span className="font-bold text-slate-500">Total</span>
                                        <span className="font-black text-xl text-[var(--primary)]">
                                            ${formData.feeItems.reduce((acc, curr) => acc + curr.amount, 0)}
                                        </span>
                                    </div>
                                )}
                            </div>
                         </div>

                         {formData.billingFrequency === 'CUSTOM' && (
                            <div className="border-t pt-4">
                                <label className="text-sm font-medium text-slate-700 mb-2 block">Custom Billing Periods</label>
                                <div className="flex gap-2 mb-4">
                                    <Input
                                        placeholder="Period label"
                                        value={newPeriod.label}
                                        onChange={e => setNewPeriod({ ...newPeriod, label: e.target.value })}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        min="0"
                                        placeholder="Amount"
                                        value={newPeriod.amount}
                                        onChange={e => setNewPeriod({ ...newPeriod, amount: e.target.value })}
                                        className="w-32"
                                    />
                                    <Button type="button" onClick={handleAddPeriod} className="px-4"><Plus size={20} /></Button>
                                </div>
                                <div className="space-y-2 bg-slate-50 p-4 rounded-lg">
                                    {formData.billingPeriods.length === 0 && <p className="text-slate-400 text-sm italic">Add the periods students will be billed for.</p>}
                                    {formData.billingPeriods.map((period, idx) => (
                                        <div key={`${period.label}-${idx}`} className="flex justify-between items-center bg-white p-2 rounded border border-slate-100">
                                            <span className="font-medium text-slate-700">{period.label}</span>
                                            <div className="flex items-center gap-4">
                                                <span className="font-bold text-slate-900">${period.amount}</span>
                                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, billingPeriods: prev.billingPeriods.filter((_, index) => index !== idx) }))} className="text-red-400 hover:text-red-600" aria-label={`Remove ${period.label}`}>
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {formData.billingPeriods.length > 0 && (
                                        <div className="flex justify-between items-center pt-2 border-t">
                                            <span className="font-bold text-slate-500">Scheduled Total</span>
                                            <span className="font-black text-slate-900">${formData.billingPeriods.reduce((sum, period) => sum + Number(period.amount || 0), 0)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                         )}

                         <div className="flex justify-end pt-4">
                             <Button onClick={handleSubmit} disabled={!formData.name || !formData.branchId || !formData.classId || !formData.academicYearId || formData.feeItems.length === 0 || (formData.billingFrequency === 'CUSTOM' && formData.billingPeriods.length === 0)}>
                                 Create Structure
                             </Button>
                         </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Fee Structures</h2>
                    <p className="text-slate-500">Manage tuition rules and breakdown templates</p>
                </div>
                <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
                    <Plus size={18} /> Create New
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {structures.map(structure => (
                    <Card key={structure._id} className="relative group hover:shadow-md transition-shadow">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleDelete(structure._id)} className="p-2 text-slate-400 hover:text-red-500">
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-lg bg-[var(--primary)] bg-opacity-10 text-[var(--primary)]">
                                <CreditCard size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">{structure.name || 'Standard Fee Structure'}</h3>
                                <div className="flex gap-2 text-xs mt-1">
                                    <Badge variant="default">{structure.branchId?.name || branches.find(b => b.value === structure.branchId)?.label || 'Unknown Branch'}</Badge>
                                    <Badge variant="secondary">{structure.classId?.name || 'Unknown Class'}</Badge>
                                    <Badge variant="secondary">{structure.academicYearId?.name || years.find(y => y.value === structure.academicYearId)?.label || 'Year'}</Badge>
                                    <Badge variant="secondary">{frequencyLabel(structure.billingFrequency)}</Badge>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 border-t pt-4">
                            {structure.feeItems.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-slate-600">{item.name}</span>
                                    <span className="font-medium text-slate-900">${item.amount}</span>
                                </div>
                            ))}
                            {structure.feeItems.length > 3 && (
                                <p className="text-xs text-center text-slate-400 mt-2">+{structure.feeItems.length - 3} more items</p>
                            )}
                        </div>
                        <div className="mt-4 pt-3 border-t flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-500">Total Value</span>
                            <span className="text-xl font-black text-[var(--primary)]">
                                ${structure.feeItems.reduce((acc, curr) => acc + curr.amount, 0)}
                            </span>
                        </div>
                    </Card>
                ))}
            </div>
            {!loading && structures.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-400">No fee structures found. Create one to get started.</p>
                </div>
            )}
        </div>
    );
};

export default FeeStructures;


