import React, { useEffect, useState } from 'react';
import { 
    getClasses, createClass,
    getClassCategories, createClassCategory,
    getSections, createSection,
    getSubjects, createSubject,
    getClassSubjects, createClassSubject, deleteClassSubject
} from '../../services/api/branch.api';
import { Table, Button, Modal, Input, Spinner, Toast, Badge, Select, Card } from '../../components/ui';
import { Plus, Layers, BookOpen, Layout, Grid, Trash2, ShieldCheck, GraduationCap, Target } from 'lucide-react';

const Classes = () => {
    const [activeTab, setActiveTab] = useState('categories');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ categories: [], classes: [], sections: [], subjects: [], classSubjects: [] });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState({});
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catRes, classRes, secRes, subRes, clsSubRes] = await Promise.all([
                getClassCategories(),
                getClasses(),
                getSections(),
                getSubjects(),
                getClassSubjects()
            ]);
            setData({
                categories: catRes.data || [],
                classes: classRes.data || [],
                sections: secRes.data || [],
                subjects: subRes.data || [],
                classSubjects: clsSubRes.data || []
            });
        } catch (err) {
            console.error(err);
            setToast({ type: 'error', message: 'Failed to synchronize academic data' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenCreate = () => {
        setCurrentItem({
            totalMarks: 100,
            passMarks: 40,
            classId: '',
            sectionId: '',
            subjectId: ''
        });
        setIsModalOpen(true);
    };

    const handleDeleteClassSubject = async (id) => {
        if (!window.confirm('Are you sure you want to remove this subject from this scope? This will not delete the subject itself.')) return;
        try {
            await deleteClassSubject(id);
            setToast({ type: 'success', message: 'Subject detached successfully' });
            fetchData();
        } catch {
            setToast({ type: 'error', message: 'Failed to detach subject' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (activeTab === 'categories') {
                await createClassCategory(currentItem);
            } else if (activeTab === 'classes') {
                await createClass(currentItem);
            } else if (activeTab === 'sections') {
                await createSection(currentItem);
            } else if (activeTab === 'subjects') {
                await createSubject(currentItem);
            } else if (activeTab === 'curriculum') {
                await createClassSubject(currentItem);
            }
            setToast({ type: 'success', message: 'Academic record updated successfully' });
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Transaction failed' });
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'categories', name: 'Categories', icon: Layers },
        { id: 'classes', name: 'Classes', icon: Grid },
        { id: 'sections', name: 'Sections', icon: Layout },
        { id: 'subjects', name: 'Master Subjects', icon: BookOpen },
        { id: 'curriculum', name: 'Class Curriculum', icon: GraduationCap },
    ];

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-200">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                            Academic Configuration
                        </h1>
                        <p className="text-slate-400 font-medium text-xs">Define the foundation of your school curriculum</p>
                    </div>
                </div>
                <Button onClick={handleOpenCreate} className="flex items-center gap-1.5 font-semibold uppercase text-xs tracking-wider">
                    <Plus size={16} strokeWidth={2.5} /> Add {activeTab === 'curriculum' ? 'Curriculum Link' : activeTab.slice(0, -1).replace('class-', '')}
                </Button>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white/50 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 w-fit flex flex-wrap gap-1 shadow-sm">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200
                            ${activeTab === tab.id 
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}
                        `}
                    >
                        <tab.icon size={18} />
                        {tab.name}
                    </button>
                ))}
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {loading ? <Spinner /> : (
                <div className="animate-fade-in">
                    {activeTab === 'categories' && (
                        <Table headers={['Category Profile', 'Description', 'Registration Date']}>
                            {data.categories.map(cat => (
                                <tr key={cat._id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <span className="font-black text-slate-700 block text-lg">{cat.name}</span>
                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Academic Department</span>
                                    </td>
                                    <td className="px-8 py-6 text-slate-500 font-medium">{cat.description || <span className="text-slate-300 italic">No description provided</span>}</td>
                                    <td className="px-8 py-6 text-slate-400 text-xs font-black uppercase tracking-tighter">{new Date(cat.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</td>
                                </tr>
                            ))}
                        </Table>
                    )}

                    {activeTab === 'classes' && (
                        <Table headers={['Class Designation', 'Academic Level', 'System Grade', 'Created']}>
                            {data.classes.map(cls => (
                                <tr key={cls._id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <span className="font-black text-slate-700 block text-lg">{cls.name}</span>
                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Primary Territory</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <Badge variant="indigo" className="rounded-xl px-4 py-1 font-black uppercase text-[10px] tracking-widest border-2">{cls.categoryId?.name}</Badge>
                                    </td>
                                    <td className="px-8 py-6 text-slate-500 font-black text-xl">{cls.gradeLevel}</td>
                                    <td className="px-8 py-6 text-slate-400 text-xs font-black uppercase tracking-tighter">{new Date(cls.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</td>
                                </tr>
                            ))}
                        </Table>
                    )}

                    {activeTab === 'sections' && (
                        <Table headers={['Sub-Territory', 'Parent Class', 'Authorized Room', 'Max Occupancy']}>
                            {data.sections.map(sec => (
                                <tr key={sec._id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <span className="font-black text-slate-700 block text-lg">{sec.name}</span>
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Specific Section</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            <span className="font-bold text-slate-600">{sec.classId?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-slate-500 font-medium font-mono">{sec.roomNumber || <span className="text-slate-300">N/A</span>}</td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden min-w-[60px]">
                                                <div className="bg-blue-500 h-full w-[40%]"></div>
                                            </div>
                                            <span className="font-black text-slate-700 text-sm">{sec.capacity || '???'}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </Table>
                    )}

                    {activeTab === 'subjects' && (
                        <Table headers={['Master Knowledge Base', 'System Code', 'Operational Since']}>
                            {data.subjects.map(sub => (
                                <tr key={sub._id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <span className="font-black text-slate-700 block text-lg">{sub.name}</span>
                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Master Course</span>
                                    </td>
                                    <td className="px-8 py-6 font-mono font-bold text-slate-500">
                                        <span className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">{sub.code || 'NO-CODE'}</span>
                                    </td>
                                    <td className="px-8 py-6 text-slate-400 text-xs font-black uppercase tracking-tighter">{new Date(sub.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</td>
                                </tr>
                            ))}
                        </Table>
                    )}

                    {activeTab === 'curriculum' && (
                        <Table headers={['Scope Designation', 'Active Course', 'Scoring Standards', 'Actions']}>
                            {data.classSubjects.map(cs => (
                                <tr key={cs._id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="indigo" className="px-4 py-2 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px]">{cs.classId?.name}</Badge>
                                            {cs.sectionId ? (
                                                <Badge variant="emerald" className="px-4 py-2 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px]">Sec: {cs.sectionId.name}</Badge>
                                            ) : (
                                                <Badge variant="outline" className="px-4 py-2 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] border-slate-200 text-slate-400 italic">All Sections</Badge>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="font-black text-slate-800 text-lg block leading-none">{cs.subjectId?.name}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cs.subjectId?.code}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Maximum</p>
                                                <p className="font-black text-slate-700 text-xl">{cs.totalMarks}</p>
                                            </div>
                                            <div className="h-8 w-px bg-slate-100"></div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-black text-rose-300 uppercase tracking-tighter">Pass Threshold</p>
                                                <p className="font-black text-rose-500 text-xl">{cs.passMarks}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button 
                                            onClick={() => handleDeleteClassSubject(cs._id)}
                                            className="p-4 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all active:scale-90 border border-transparent hover:border-rose-100"
                                            title="Detach Subject"
                                        >
                                            <Trash2 size={22} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </Table>
                    )}
                    
                    {data[activeTab === 'curriculum' ? 'classSubjects' : activeTab]?.length === 0 && (
                        <Card className="p-8 text-center border-dashed border border-slate-200 rounded-xl bg-slate-50/30 shadow-none">
                            <div className="flex flex-col items-center gap-4">
                                <Plus size={48} className="text-slate-300" strokeWidth={1.5} />
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-slate-500 uppercase tracking-wider">Registry Empty</h3>
                                    <p className="text-slate-400 text-sm">Initialize the {activeTab} collection to begin academic planning.</p>
                                </div>
                                <Button onClick={handleOpenCreate} variant="outline" className="rounded-lg border font-semibold py-2 px-6 uppercase text-xs tracking-wider hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all">Construct First Entry</Button>
                            </div>
                        </Card>
                    )}
                </div>
            )}

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200">
                            <Target size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">
                                {activeTab === 'curriculum' ? 'Establish Curriculum Link' : `Register ${activeTab.slice(0, -1).toUpperCase()}`}
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Academic Registry Protocol</p>
                        </div>
                    </div>
                }
                maxWidth="3xl"
            >
                <form onSubmit={handleSubmit} className="space-y-10 py-4">
                    {activeTab === 'categories' && (
                        <div className="space-y-6">
                            <Input 
                                label="Scope Classification" 
                                value={currentItem.name || ''} 
                                onChange={e => setCurrentItem({...currentItem, name: e.target.value})}
                                placeholder="e.g. Primary School, Secondary, KG"
                                required
                            />
                            <Input 
                                label="Scope Description" 
                                value={currentItem.description || ''} 
                                onChange={e => setCurrentItem({...currentItem, description: e.target.value})}
                                placeholder="Describe the purpose of this category..."
                            />
                        </div>
                    )}

                    {activeTab === 'classes' && (
                        <div className="space-y-8">
                            <Select 
                                label="Parent Category"
                                placeholder="Select Strategic Group"
                                options={data.categories.map(c => ({ value: c._id, label: c.name }))}
                                value={currentItem.categoryId || ''}
                                onChange={e => setCurrentItem({...currentItem, categoryId: e.target.value})}
                                required
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Input 
                                    label="Class Identity" 
                                    value={currentItem.name || ''} 
                                    onChange={e => setCurrentItem({...currentItem, name: e.target.value})}
                                    placeholder="e.g. Grade 1-Alpha"
                                    required
                                />
                                <Input 
                                    label="Grade Coefficient (Numerical)" 
                                    value={currentItem.gradeLevel || ''} 
                                    onChange={e => setCurrentItem({...currentItem, gradeLevel: e.target.value})}
                                    placeholder="e.g. 1"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'sections' && (
                        <div className="space-y-8">
                            <Select 
                                label="Assign to Parent Class"
                                placeholder="Select Root Class"
                                options={data.classes.map(c => ({ value: c._id, label: c.name }))}
                                value={currentItem.classId || ''}
                                onChange={e => setCurrentItem({...currentItem, classId: e.target.value})}
                                required
                            />
                            <Input 
                                label="Internal Section Name" 
                                value={currentItem.name || ''} 
                                onChange={e => setCurrentItem({...currentItem, name: e.target.value})}
                                placeholder="e.g. Block-A"
                                required
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Input 
                                    label="Physical Room Location" 
                                    value={currentItem.roomNumber || ''} 
                                    onChange={e => setCurrentItem({...currentItem, roomNumber: e.target.value})}
                                    placeholder="Room Code..."
                                />
                                <Input 
                                    label="Maximum Capacity" 
                                    type="number"
                                    value={currentItem.capacity || ''} 
                                    onChange={e => setCurrentItem({...currentItem, capacity: e.target.value})}
                                    placeholder="Total Students"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'subjects' && (
                        <div className="space-y-8">
                            <Input 
                                label="Subject Name (Master List)" 
                                value={currentItem.name || ''} 
                                onChange={e => setCurrentItem({...currentItem, name: e.target.value})}
                                placeholder="e.g. Mathematics"
                                required
                            />
                            <Input 
                                label="Subject Canonical Code" 
                                value={currentItem.code || ''} 
                                onChange={e => setCurrentItem({...currentItem, code: e.target.value})}
                                placeholder="e.g. MATH-X"
                                className="font-mono uppercase tracking-wider"
                            />
                        </div>
                    )}

                    {activeTab === 'curriculum' && (
                        <div className="space-y-8">
                            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex gap-3 items-start">
                                <ShieldCheck className="text-blue-500 mt-0.5 shrink-0" size={18} />
                                <p className="text-xs font-semibold text-blue-900 leading-relaxed uppercase tracking-wider">
                                    Strategic Definition: You are mapping a specialized subject to a specific territory (Class & Section).
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Select 
                                    label="Root Class Territory"
                                    placeholder="Required Class..."
                                    options={data.classes.map(c => ({ value: c._id, label: c.name }))}
                                    value={currentItem.classId || ''}
                                    onChange={e => setCurrentItem({...currentItem, classId: e.target.value, sectionId: ''})}
                                    required
                                />
                                <Select 
                                    label="Specific Section (Optional)"
                                    placeholder="All Sections (Global)"
                                    options={data.sections
                                        .filter(s => (s.classId?._id || s.classId) === currentItem.classId)
                                        .map(s => ({ value: s._id, label: s.name }))
                                    }
                                    value={currentItem.sectionId || ''}
                                    onChange={e => setCurrentItem({...currentItem, sectionId: e.target.value})}
                                    disabled={!currentItem.classId}
                                />
                                <Select 
                                    label="Course Authority"
                                    placeholder="Select Master Subject"
                                    options={data.subjects.map(s => ({ value: s._id, label: s.name }))}
                                    value={currentItem.subjectId || ''}
                                    onChange={e => setCurrentItem({...currentItem, subjectId: e.target.value})}
                                    required
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                <Input 
                                    label="Standard Total Marks" 
                                    type="number"
                                    value={currentItem.totalMarks} 
                                    onChange={e => setCurrentItem({...currentItem, totalMarks: e.target.value})}
                                    required
                                />
                                <Input 
                                    label="Acceptable Pass Threshold" 
                                    type="number"
                                    value={currentItem.passMarks} 
                                    onChange={e => setCurrentItem({...currentItem, passMarks: e.target.value})}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Abort Changes</Button>
                        <Button type="submit" disabled={saving} className="bg-blue-600">
                            {saving ? 'Synchronizing...' : `Initialize Scope Link`}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Classes;
