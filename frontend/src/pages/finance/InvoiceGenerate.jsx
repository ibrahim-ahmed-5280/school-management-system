import React, { useState, useEffect } from 'react';
import { generateInvoices, fetchFeeStructures } from '../../services/api/finance.api';
import { getBranches, getAcademicYears, getClasses } from '../../services/api/tenant.api';
import { Card, Button, Input, Select } from '../../components/ui';
import { ArrowLeft, User, Users, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
            setBranches(b.map(i => ({ label: i.name, value: i._id })));
            setYears(y.map(i => ({ label: i.name, value: i._id })));
            setStructures(Array.isArray(fs) ? fs : (fs.data || []));
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
                setClasses(data.map(c => ({ label: c.name, value: c._id })));
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
                feeStructureId: formData.feeStructureId
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
            alert('Generation Failed: ' + (e.message || 'Unknown Error'));
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
        (!formData.academicYearId || s.academicYearId === formData.academicYearId || (s.academicYearId && s.academicYearId._id === formData.academicYearId))
    );
    const structureOptions = filteredStructures.map(s => ({ 
        label: `${s.name} ($${(s.feeItems || []).reduce((a,c)=>a+(c.amount||0),0)})`, 
        value: s._id 
    }));

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
                        onChange={e => setFormData({...formData, feeStructureId: e.target.value})}
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
                        <Button type="submit" className="w-full py-3 text-lg" disabled={loading}>
                            {loading ? 'Processing...' : 'Generate Invoices'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default InvoiceGenerate;
