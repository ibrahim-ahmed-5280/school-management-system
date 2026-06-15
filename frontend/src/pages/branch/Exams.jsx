import React, { useEffect, useState } from 'react';
import { 
    getExams, 
    createExam, 
    getClasses, 
    getCurrentAcademicYear, 
    getTerms,
    getSubjects,
    getExamCategories,
    getClassSubjects,
    createExamCategory,
    updateExamStatus,
    deleteExam
} from '../../services/api/branch.api';
import { Table, Button, Modal, Input, Spinner, Toast, Badge, Select, Card } from '../../components/ui';
import { Plus, Calendar, Trash2, CheckCircle, Clock, BookOpen, Layers, Target, Settings2, Search } from 'lucide-react';

const Exams = () => {
    const [activeTab, setActiveTab] = useState('exams');
    const [exams, setExams] = useState([]);
    const [categories, setCategories] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [classSubjects, setClassSubjects] = useState([]); // Curriculum data
    const [currentYear, setCurrentYear] = useState(null);
    const [terms, setTerms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [toast, setToast] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form States
    const [examForm, setExamForm] = useState({ 
        examCategoryId: '', 
        classId: '', // Keep for "all" option
        classIds: [], // New for multi-select
        subjectId: '', 
        date: '', 
        academicYearId: '',
        termId: ''
    });
    const [categoryForm, setCategoryForm] = useState({ name: '', maxScore: 100, description: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [examRes, catRes, classRes, yearRes, subRes, curriculumRes] = await Promise.all([
                getExams(),
                getExamCategories(),
                getClasses(),
                getCurrentAcademicYear(),
                getSubjects(),
                getClassSubjects()
            ]);
            setExams(examRes.data);
            setCategories(catRes.data);
            setClasses(classRes.data);
            setCurrentYear(yearRes.data);
            setSubjects(subRes.data);
            setClassSubjects(curriculumRes.data || []);
            if (yearRes.data) {
                setExamForm(prev => ({ ...prev, academicYearId: yearRes.data._id }));
                const termRes = await getTerms(yearRes.data._id);
                setTerms(termRes.data || []);
            }
        } catch {
            setToast({ type: 'error', message: 'Failed to load data' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateExam = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // If classId is not 'all', ensure classIds matches the selection
            const payload = { ...examForm };
            if (payload.classId === 'all') {
                payload.classIds = []; // Let backend handle "all"
            } else if (payload.classIds.length === 0 && payload.classId) {
                payload.classIds = [payload.classId];
            }

            const res = await createExam(payload);
            
            // Handle the detailed response from our new controller
            if (res.success) {
                setToast({ type: 'success', message: res.message || 'Exam Authorized' });
            }

            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Failed to create exam' });
        } finally {
            setSaving(false);
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await createExamCategory(categoryForm);
            setToast({ type: 'success', message: 'Category created' });
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Failed' });
        } finally {
            setSaving(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await updateExamStatus(id, status);
            setToast({ type: 'success', message: `Exam marked as ${status}` });
            fetchData();
        } catch {
            setToast({ type: 'error', message: 'Status update failed' });
        }
    };

    const handleDeleteExam = async (id) => {
        if (!window.confirm('Are you sure you want to delete this exam?')) return;
        try {
            await deleteExam(id);
            setToast({ type: 'success', message: 'Exam deleted' });
            fetchData();
        } catch (error) {
            setToast({ type: 'error', message: error.response?.data?.message || 'Deletion failed' });
        }
    };

    if (loading && exams.length === 0) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <Spinner size="lg" />
            <p className="text-slate-400 font-black animate-pulse uppercase tracking-widest text-xs">Synchronizing Academic Engine...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header section with Premium feel */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-linear-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-xl flex items-center justify-center shadow-sm">
                        <BookOpen size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Academic Oversight</h1>
                        <p className="text-slate-400 font-medium text-xs">Configure examination structures and manage grading sessions.</p>
                    </div>
                </div>

                <div className="flex bg-slate-100/80 p-1 rounded-xl gap-1 h-fit border border-slate-200/50">
                    <button 
                        onClick={() => setActiveTab('exams')}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${activeTab === 'exams' ? 'bg-white text-[var(--primary)] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Exams
                    </button>
                    <button 
                        onClick={() => setActiveTab('categories')}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${activeTab === 'categories' ? 'bg-white text-[var(--primary)] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Templates
                    </button>
                </div>

                <Button 
                    onClick={() => {
                        setIsModalOpen(true);
                        if (activeTab === 'exams') {
                            setExamForm({ ...examForm, academicYearId: currentYear?._id || '' });
                        }
                    }} 
                    className="font-semibold uppercase text-xs tracking-wider"
                >
                    <Plus size={16} strokeWidth={2.5} /> {activeTab === 'exams' ? 'Authorize Exam' : 'New Template'}
                </Button>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {loading ? (
                 <div className="py-20 flex justify-center"><Spinner /></div>
            ) : (
                <div className="animate-fade-in">
                    {activeTab === 'exams' ? (
                        <div className="space-y-6">
                             <Card className="p-0 overflow-hidden border border-slate-200 shadow-sm rounded-xl bg-white">
                                <Table headers={['Exam Identity', 'Scope (Class/Sub)', 'Timeline', 'Availability', 'Standards', 'Actions']}>
                                    {exams.map(exam => (
                                        <tr key={exam._id} className="group hover:bg-slate-50/80 transition-all border-b border-slate-50 last:border-0">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-[var(--primary)]/10 group-hover:text-[var(--primary)] transition-colors">
                                                        <Calendar size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-850 tracking-tight">{exam.examCategoryId?.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="space-y-1">
                                                    <Badge variant="emerald" className="bg-emerald-50 text-emerald-600 border-emerald-100/50 px-3 py-1 font-black text-[10px] uppercase">
                                                        {exam.classId?.name}
                                                    </Badge>
                                                    <div className="flex items-center gap-1.5 text-slate-500 ml-1">
                                                        <BookOpen size={12} />
                                                        <span className="text-[11px] font-bold tracking-wide">{exam.subjectId?.name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-xs font-bold text-slate-600">{exam.date ? new Date(exam.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible Date'}</p>
                                                <p className="text-[10px] font-black uppercase text-slate-400 mt-1">{exam.termId?.name || currentYear?.name}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <Badge 
                                                    variant={exam.status === 'Closed' ? 'red' : exam.status === 'Open' ? 'emerald' : 'slate'}
                                                    className="px-4 py-1.5 rounded-full border-2 font-black uppercase tracking-[0.1em] text-[10px]"
                                                >
                                                    {exam.status === 'Draft' && <Clock size={10} className="mr-1 inline" />}
                                                    {exam.status === 'Open' && <CheckCircle size={10} className="mr-1 inline" />}
                                                    {exam.status}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <Target size={14} className="text-slate-300" />
                                                    <span className="font-black text-slate-800">{exam.examCategoryId?.maxScore}</span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marks</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {exam.status === 'Draft' && (
                                                        <Button variant="outline" size="sm" onClick={() => handleStatusUpdate(exam._id, 'Open')} className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all">
                                                            Open Entry
                                                        </Button>
                                                    )}
                                                    {exam.status === 'Open' && (
                                                        <Button variant="outline" size="sm" onClick={() => handleStatusUpdate(exam._id, 'Closed')} className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all">
                                                            Close Entry
                                                        </Button>
                                                    )}
                                                    <button 
                                                        onClick={() => handleDeleteExam(exam._id)}
                                                        className="h-9 w-9 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Delete Exam"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {exams.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="py-24 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-30">
                                                    <Search size={48} className="text-slate-200" />
                                                    <p className="font-black text-slate-400 uppercase tracking-widest text-sm">No clinical sessions authorized yet.</p>
                                                    <Button variant="outline" className="mt-2" onClick={() => setIsModalOpen(true)}>Initialize Session</Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Table>
                            </Card>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                             {categories.map(cat => (
                                <Card key={cat._id} className="p-5 border border-slate-200 shadow-sm rounded-xl bg-white group transition-all duration-200">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="h-10 w-10 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                                            <Settings2 size={18} />
                                        </div>
                                        <Badge variant="emerald" className="px-2 py-0.5 text-[10px]">Active Template</Badge>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-1 uppercase">{cat.name}</h3>
                                    <p className="text-slate-500 text-sm font-medium mb-4 min-h-[40px] leading-relaxed">{cat.description || 'Global assessment template for general scoring sessions.'}</p>
                                    
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <div>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Max Capacity</p>
                                            <p className="font-bold text-slate-800 text-base">{cat.maxScore} <span className="text-[10px] text-slate-400">PTS</span></p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {categories.length === 0 && (
                                <div className="col-span-full py-20 text-center opacity-40">
                                    <Layers size={48} className="mx-auto mb-4 text-slate-300" />
                                    <p className="font-black text-slate-400 uppercase tracking-widest">Create templates first to authorize exams.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Modal Refactored for Premium Theme */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={activeTab === 'exams' ? "Authorize Academic Session" : "New Template Configuration"}
                className="max-w-2xl"
            >
                {activeTab === 'exams' ? (
                     <form onSubmit={handleCreateExam} className="space-y-6 py-2">
                        <div className="bg-[var(--primary)]/5 border border-[var(--primary)]/10 rounded-xl p-4 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--primary)] mb-0.5">Academic Context</p>
                                <p className="font-bold text-[var(--primary)] tracking-tight text-base">{currentYear?.name}</p>
                            </div>
                            <Calendar size={20} className="text-[var(--primary)]/40" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                            <Select 
                                label="Assessment Type"
                                options={categories.map(c => ({ value: c._id, label: `${c.name} (${c.maxScore} pts)` }))}
                                value={examForm.examCategoryId}
                                onChange={e => setExamForm({...examForm, examCategoryId: e.target.value})}
                                required
                            />
                            <Select
                                label="Academic Term (Optional)"
                                options={terms.map(term => ({ value: term._id, label: term.name }))}
                                value={examForm.termId}
                                onChange={e => setExamForm({...examForm, termId: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Academic Scope (Class)</label>
                                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-250 min-h-[80px]">
                                    <button 
                                        type="button"
                                        onClick={() => setExamForm(prev => ({ ...prev, classId: prev.classId === 'all' ? '' : 'all', classIds: [] }))}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all ${examForm.classId === 'all' ? 'bg-[var(--primary)] text-white shadow-sm' : 'bg-white text-slate-500 hover:text-slate-700 border border-slate-200'}`}
                                    >
                                        Apply to All
                                    </button>
                                    {examForm.classId !== 'all' && classes.map(c => (
                                        <button 
                                            key={c._id}
                                            type="button"
                                            onClick={() => {
                                                const newIds = examForm.classIds.includes(c._id) 
                                                    ? examForm.classIds.filter(id => id !== c._id)
                                                    : [...examForm.classIds, c._id];
                                                setExamForm(prev => ({ ...prev, classIds: newIds, classId: '' }));
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all ${examForm.classIds.includes(c._id) ? 'bg-[var(--primary)] text-white shadow-sm' : 'bg-white text-slate-500 hover:text-slate-700 border border-slate-200'}`}
                                        >
                                            {c.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <Select 
                                label="Knowledge Area"
                                options={(examForm.classId === 'all' ? subjects : (
                                    // Filter subjects assigned to ANY of the selected classes
                                    subjects.filter(s => {
                                        if (examForm.classIds.length === 0) return true; // Show all if none selected
                                        return classSubjects.some(cs => 
                                            examForm.classIds.includes(cs.classId?._id || cs.classId) && 
                                            (cs.subjectId?._id || cs.subjectId) === s._id
                                        );
                                    })
                                )).map(s => ({ value: s._id, label: s.name }))}
                                value={examForm.subjectId}
                                onChange={e => setExamForm({...examForm, subjectId: e.target.value})}
                                required
                            />
                        </div>

                        <Input 
                            type="date"
                            label="Session Date (Optional)"
                            value={examForm.date}
                            onChange={e => setExamForm({...examForm, date: e.target.value})}
                        />

                         <div className="flex gap-4 pt-4">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Abort</Button>
                            <Button type="submit" className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white" disabled={saving}>
                                {saving ? <Spinner size="sm" /> : 'Authorize Assessment'}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleCreateCategory} className="space-y-8 py-4">
                        <Input 
                            label="Template Name"
                            placeholder="e.g. Mid-Term Review"
                            value={categoryForm.name}
                            onChange={e => setCategoryForm({...categoryForm, name: e.target.value})}
                            required
                        />
                         <div className="grid grid-cols-2 gap-6">
                            <Input 
                                type="number"
                                label="Maximum Score"
                                placeholder="100"
                                value={categoryForm.maxScore}
                                onChange={e => setCategoryForm({...categoryForm, maxScore: e.target.value})}
                                required
                            />
                            <div className="pt-6">
                                <Badge variant="slate" className="h-11 w-full flex items-center justify-center rounded-xl border font-semibold uppercase text-[10px]">Points System</Badge>
                            </div>
                        </div>
                        <Input 
                            label="Brief Description (Optional)"
                            placeholder="Describe the purpose of this assessment template..."
                            value={categoryForm.description}
                            onChange={e => setCategoryForm({...categoryForm, description: e.target.value})}
                        />
                          <div className="flex gap-4 pt-4">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit" className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white" disabled={saving}>
                                {saving ? <Spinner size="sm" /> : 'Commit Template'}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default Exams;
