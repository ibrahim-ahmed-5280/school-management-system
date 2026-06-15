import React, { useState, useEffect } from 'react';
import { generateInvoices, fetchFeeStructures } from '../../services/api/finance.api';
import { getBranches, getAcademicYears, getClasses } from '../../services/api/tenant.api';
import { Card, Button, Input, Select } from '../../components/ui';
import { ArrowLeft, User, Users, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const unwrapList = (response) => {
    const payload = response?.data?.data ?? response?.data ?? response;
    return Array.isArray(payload) ? payload : [];
};

const periodConfig = {
    YEARLY: { count: 1, label: 'Annual' },
    MONTHLY: { count: 12, label: 'Month' },
    EVERY_TWO_MONTHS: { count: 6, label: 'Two-month period' },
    QUARTERLY: { count: 4, label: 'Quarter' },
    TERM: { count: 3, label: 'Term' }
};

const getStructurePeriods = (structure) => {
    if (!structure) return [];
    const frequency = structure.billingFrequency || 'YEARLY';
    if (frequency === 'CUSTOM') {
        return (structure.billingPeriods || []).map((period, index) => ({
            label: `${period.label} ($${Number(period.amount || 0).toLocaleString()})`,
            value: period.key || `CUSTOM_${index + 1}`
        }));
    }
    const config = periodConfig[frequency] || periodConfig.YEARLY;
    const totalCents = Math.round(Number(structure.totalAmount || 0) * 100);
    const base = Math.floor(totalCents / config.count);
    const remainder = totalCents - (base * config.count);
    return Array.from({ length: config.count }, (_, index) => {
        const amount = (base + (index < remainder ? 1 : 0)) / 100;
        const label = frequency === 'YEARLY' ? config.label : `${config.label} ${index + 1}`;
        return {
            label: `${label} ($${amount.toLocaleString()})`,
            value: frequency === 'YEARLY' ? 'YEARLY' : `${frequency}_${index + 1}`
        };
    });
};

const InvoiceGenerate = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('class'); // 'class' or 'student'
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    
    // Lookups
    const [branches, setBranches] = useState([]);
    const [years, setYears] = useState([]);
    const [classes, setClasses] = useState([]);
    const [structures, setStructures] = useState([]);

    // Form
    const [formData, setFormData] = useState({
        branchId: '',
        academicYearId: '',
        targetId: '', // classId or studentId
        feeStructureId: '',
        billingPeriodKey: '',
        dueDate: ''
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [b, y, fs] = await Promise.all([
                getBranches(), 
                getAcademicYears(),
                fetchFeeStructures()
            ]);
            setBranches(unwrapList(b).map(i => ({ label: i.name, value: i._id })));
            setYears(unwrapList(y).map(i => ({ label: i.name, value: i._id })));
            setStructures(unwrapList(fs));
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (!formData.branchId || !formData.academicYearId || mode !== 'class') {
            setClasses([]);
            return;
        }

        const fetchClassesList = async () => {
            try {
                const data = await getClasses({
                    branchId: formData.branchId,
                    academicYearId: formData.academicYearId
                });
                setClasses(unwrapList(data).map(c => ({ label: c.name, value: c._id })));
            } catch (e) {
                console.warn('Failed to load branch classes', e);
                setClasses([]);
            }
        };
        fetchClassesList();
    }, [formData.branchId, formData.academicYearId, mode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                branchId: formData.branchId,
                academicYearId: formData.academicYearId,
                dueDate: formData.dueDate,
                feeStructureId: formData.feeStructureId,
                billingPeriodKey: formData.billingPeriodKey
            };
            if (mode === 'class') {
                payload.classId = formData.targetId;
            } else {
                payload.studentId = formData.targetId;
            }

            await generateInvoices(payload);
            setSuccess(true);
        } catch (e) {
            console.error(e);
            alert('Generation Failed: ' + (e.response?.data?.message || e.message || 'Unknown Error'));
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="max-w-md mx-auto mt-20 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-6">
                    <CheckCircle size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Invoices Generated!</h2>
                <p className="text-slate-500 mb-8">The system has successfully processed your request.</p>
                <div className="flex justify-center gap-4">
                    <Button onClick={() => navigate('/finance/invoices')}>View Invoices</Button>
                    <Button variant="outline" onClick={() => { setSuccess(false); setFormData({...formData, targetId: ''}); }}>Generate More</Button>
                </div>
            </div>
        );
    }

    const filteredStructures = (structures || []).filter(s => 
        (!formData.branchId || s.branchId === formData.branchId || (s.branchId && s.branchId._id === formData.branchId)) &&
        (!formData.academicYearId || s.academicYearId === formData.academicYearId || (s.academicYearId && s.academicYearId._id === formData.academicYearId)) &&
        (mode !== 'class' || !formData.targetId || s.classId === formData.targetId || (s.classId && s.classId._id === formData.targetId))
    );
    const structureOptions = filteredStructures.map(s => ({ 
        label: `${s.name || 'Standard Fee Structure'} ($${(s.feeItems || []).reduce((a,c)=>a+(c.amount||0),0)})`,
        value: s._id 
    }));
    const selectedStructure = structures.find(structure => structure._id === formData.feeStructureId);
    const billingPeriodOptions = getStructurePeriods(selectedStructure);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-2 mb-4">
                <ArrowLeft size={18} /> Cancel
            </Button>
            
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Generate Invoices</h2>
                <p className="text-slate-500">Create bulk invoices for classes or individual bills</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <button 
                    type="button"
                    onClick={() => setMode('class')}
                    className={`p-4 border rounded-xl flex items-center justify-center gap-3 transition-all ${mode === 'class' ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                >
                    <Users size={24} />
                    <span className="font-bold">Bulk Class Invoice</span>
                </button>
                <button 
                    type="button"
                    onClick={() => setMode('student')}
                    className={`p-4 border rounded-xl flex items-center justify-center gap-3 transition-all ${mode === 'student' ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                >
                    <User size={24} />
                    <span className="font-bold">Single Student</span>
                </button>
            </div>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-6">
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

                    {mode === 'class' ? (
                        <Select 
                            label="Target Class"
                            options={classes}
                            value={formData.targetId}
                            onChange={e => setFormData({...formData, targetId: e.target.value})}
                            disabled={classes.length === 0}
                            required
                        />
                    ) : (
                        <Input 
                            label="Student ID (Exact Match)"
                            placeholder="Enter system Student ID..."
                            value={formData.targetId}
                            onChange={e => setFormData({...formData, targetId: e.target.value})}
                            required
                        />
                    )}

                    <Select 
                        label="Fee Structure to Apply"
                        options={structureOptions}
                        value={formData.feeStructureId}
                        onChange={e => {
                            const nextStructure = structures.find(structure => structure._id === e.target.value);
                            const periods = getStructurePeriods(nextStructure);
                            setFormData({
                                ...formData,
                                feeStructureId: e.target.value,
                                billingPeriodKey: periods.length === 1 ? periods[0].value : ''
                            });
                        }}
                        required
                    />

                    <Select
                        label="Billing Period"
                        options={billingPeriodOptions}
                        value={formData.billingPeriodKey}
                        onChange={e => setFormData({ ...formData, billingPeriodKey: e.target.value })}
                        disabled={!formData.feeStructureId}
                        required
                    />

                    <Input 
                        type="date"
                        label="Due Date"
                        value={formData.dueDate}
                        onChange={e => setFormData({...formData, dueDate: e.target.value})}
                        required
                    />

                    <div className="pt-4">
                        <Button type="submit" className="w-full py-3 text-lg" disabled={loading || !formData.billingPeriodKey}>
                            {loading ? 'Processing...' : 'Generate Invoices'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default InvoiceGenerate;
