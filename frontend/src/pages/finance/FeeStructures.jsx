import React, { useState, useEffect } from 'react';
import { fetchFeeStructures, createFeeStructure, deleteFeeStructure } from '../../services/api/finance.api';
import { getBranches, getAcademicYears } from '../../services/api/tenant.api';
import { Card, Button, Input, Select, Badge } from '../../components/ui';
import { Trash2, Plus, CreditCard, X } from 'lucide-react';

const FeeStructures = () => {
    const [structures, setStructures] = useState([]);
    const [branches, setBranches] = useState([]);
    const [years, setYears] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form State
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        branchId: '',
        academicYearId: '',
        feeItems: []
    });
    const [newItem, setNewItem] = useState({ name: '', amount: '' });

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
            setStructures(Array.isArray(fs) ? fs : (fs.data || []));
            setBranches(b.map(i => ({ label: i.name, value: i._id })));
            setYears(y.map(i => ({ label: i.name, value: i._id })));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.branchId || !formData.name || formData.feeItems.length === 0) return;
        
        try {
            await createFeeStructure(formData);
            const updated = await fetchFeeStructures();
            setStructures(updated || []);
            setIsCreating(false);
            setFormData({ name: '', branchId: '', academicYearId: '', feeItems: [] });
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
                         <div className="grid grid-cols-2 gap-4">
                            <Select 
                                label="Branch" 
                                options={branches} 
                                value={formData.branchId}
                                onChange={e => setFormData({...formData, branchId: e.target.value})}
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

                         <div className="flex justify-end pt-4">
                             <Button onClick={handleSubmit} disabled={!formData.name || formData.feeItems.length === 0}>
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
                                <h3 className="font-bold text-slate-800 text-lg">{structure.name}</h3>
                                <div className="flex gap-2 text-xs mt-1">
                                    <Badge variant="default">{branches.find(b => b.value === structure.branchId)?.label || 'Unknown Branch'}</Badge>
                                    <Badge variant="secondary">{years.find(y => y.value === structure.academicYearId)?.label || 'Year'}</Badge>
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


