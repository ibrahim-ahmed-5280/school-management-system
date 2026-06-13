import React, { useEffect, useState } from 'react';
import { 
    getBranchUsers, 
    getTeacherAssignments, 
    updateTeacherAssignments, 
    getClasses, 
    getSections,
    getCurrentAcademicYear,
    getAllBranchAssignments,
    getClassSubjects
} from '../../services/api/branch.api';
import { Table, Button, Modal, Spinner, Toast, Badge, Select } from '../../components/ui';
import { BookOpen, Save, X, Plus, GraduationCap, Link2, ShieldCheck, Info, Layers, Target } from 'lucide-react';

const TeacherAssignments = () => {
    const [teachers, setTeachers] = useState([]);
    const [allAssignments, setAllAssignments] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [classSubjects, setClassSubjects] = useState([]); // Added this to store class-subject links
    const [currentYear, setCurrentYear] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const init = async () => {
        setLoading(true);
        try {
            const [teacherRes, classRes, secRes, yearRes, assignmentsRes, clsSubRes] = await Promise.all([
                getBranchUsers('teacher'),
                getClasses(),
                getSections(),
                getCurrentAcademicYear(),
                getAllBranchAssignments(),
                getClassSubjects() // Fetch the curriculum links
            ]);
            setTeachers(teacherRes.data);
            setClasses(classRes.data);
            setSections(secRes.data);
            setCurrentYear(yearRes.data);
            setAllAssignments(assignmentsRes.data);
            setClassSubjects(clsSubRes.data);
        } catch (err) {
            console.error(err);
            setToast({ type: 'error', message: 'Failed to initialize system data' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        init();
    }, []);

    const handleOpenAssignments = async (teacher) => {
        setSelectedTeacher(teacher);
        try {
            const res = await getTeacherAssignments(teacher._id);
            setAssignments(res.data.map(a => ({
                classId: a.classId?._id || a.classId,
                sectionId: a.sectionId?._id || a.sectionId || '',
                subjectId: a.subjectId?._id || a.subjectId,
                academicYearId: a.academicYearId?._id || a.academicYearId
            })));
            setIsModalOpen(true);
        } catch (err) {
            console.error(err);
            setToast({ type: 'error', message: 'Failed to fetch current assignments' });
        }
    };

    const handleAddAssignment = () => {
        setAssignments([...assignments, { 
            classId: '', 
            sectionId: '', 
            subjectId: '', 
            academicYearId: currentYear?._id 
        }]);
    };

    const handleRemoveAssignment = (index) => {
        const newAssignments = [...assignments];
        newAssignments.splice(index, 1);
        setAssignments(newAssignments);
    };

    const handleAssignmentChange = (index, field, value) => {
        const newAssignments = [...assignments];
        newAssignments[index][field] = value;
        // Reset sub-dependent fields
        if (field === 'classId') {
            newAssignments[index].sectionId = '';
            newAssignments[index].subjectId = '';
        }
        setAssignments(newAssignments);
    };

    const handleSave = async () => {
        const isValid = assignments.every(a => a.classId && a.subjectId);
        if (!isValid) {
            setToast({ type: 'error', message: 'Linkage Error: Every assignment must have a secure Class and Subject link.' });
            return;
        }

        setSaving(true);
        try {
            await updateTeacherAssignments(selectedTeacher._id, assignments);
            setToast({ type: 'success', message: 'Teacher credentials and authorizations updated' });
            setIsModalOpen(false);
            init();
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Security protocol failed' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-10 animate-fade-in pb-10">
            {/* Header Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[var(--primary)] rounded-xl flex items-center justify-center text-white shadow-md shadow-[var(--primary)]/20">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                            Academic Personnel
                        </h1>
                        <p className="text-slate-400 font-medium text-xs">Link specialized teachers to authorized class curriculum</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-250 shadow-inner">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[var(--primary)] shadow-sm">
                        <Link2 size={16} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Scope</p>
                        <p className="font-black text-slate-700">{currentYear?.name || 'Loading...'}</p>
                    </div>
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {loading ? <Spinner /> : (
                <Table headers={['Academic Profile', 'Current Credentials', 'Duty Status', 'Actions']}>
                    {teachers.map(teacher => {
                        const teacherAsgns = allAssignments.filter(a => (a.teacherUserId?._id || a.teacherUserId) === teacher._id);
                        return (
                            <tr key={teacher._id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-5">
                                        <div className="relative">
                                            <div className="w-14 h-14 bg-linear-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:rotate-6 transition-transform">
                                                {teacher.name.charAt(0)}
                                            </div>
                                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${teacher.isActive ? 'bg-emerald-500' : 'bg-slate-300 shadow-sm'}`}></div>
                                        </div>
                                        <div className="space-y-0.5">
                                            <span className="font-bold text-lg text-slate-800 block leading-none">{teacher.name}</span>
                                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">{teacher.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-wrap gap-2 max-w-sm">
                                        {teacherAsgns.length > 0 ? teacherAsgns.map((a, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-[var(--primary)]/5 border border-[var(--primary)]/10 px-3 py-1.5 rounded-xl shadow-sm hover:border-[var(--primary)]/20 transition-colors group/tag">
                                                <Target size={12} className="text-[var(--primary)] group-hover/tag:scale-110 transition-transform" />
                                                <span className="text-[10px] font-black text-[var(--primary-dark)] uppercase tracking-tight">
                                                    {a.classId?.name}{a.sectionId ? ` (${a.sectionId.name})` : ''} • {a.subjectId?.name}
                                                </span>
                                            </div>
                                        )) : (
                                            <span className="text-xs font-black text-slate-300 italic tracking-widest uppercase">No Credentials Defined</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <Badge variant={teacher.isActive ? 'success' : 'danger'} className="rounded-xl px-5 py-2 font-black shadow-sm uppercase text-[10px] tracking-widest">
                                        {teacher.isActive ? 'Operational' : 'Off-Duty'}
                                    </Badge>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <Button size="sm" variant="outline" onClick={() => handleOpenAssignments(teacher)} className="flex items-center gap-2 font-black border-2 py-3 px-6 rounded-2xl group-hover:border-[var(--primary)] group-hover:text-[var(--primary)] transition-all bg-white shadow-sm active:scale-95">
                                        <GraduationCap size={18} strokeWidth={2.5} /> Authorize Scopes
                                    </Button>
                                </td>
                            </tr>
                        );
                    })}
                </Table>
            )}

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[var(--primary)] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--primary)]/20">
                            <Target size={24} strokeWidth={3} />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Authorization Portal</h3>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{selectedTeacher?.name}</p>
                        </div>
                    </div>
                }
                maxWidth="3xl"
            >
                <div className="space-y-8 max-h-[70vh] overflow-y-auto px-2 pr-4 custom-scrollbar">
                    <div className="bg-[var(--primary)]/5 p-4 rounded-xl border border-[var(--primary)]/10 flex gap-3 items-start relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                            <ShieldCheck size={80} />
                        </div>
                        <Info className="text-[var(--primary)] mt-0.5 shrink-0" size={18} strokeWidth={2.5} />
                        <div className="space-y-1 relative z-10">
                            <p className="text-sm font-black text-[var(--primary-dark)] uppercase tracking-widest leading-none">Security Directive</p>
                            <p className="text-xs font-medium text-[var(--primary)]/80 leading-relaxed">
                                Personnel only display authorized subjects defined in the <span className="font-semibold underline">Class Curriculum</span>. 
                                Ensure you have populated Class Curriculum before assigning instructors.
                            </p>
                        </div>
                    </div>

                    {assignments.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 group">
                            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                <Plus size={24} className="text-slate-200" strokeWidth={3} />
                            </div>
                            <h4 className="text-slate-450 font-semibold uppercase tracking-wider text-xs mb-4">Credential Status: Empty</h4>
                            <Button variant="outline" onClick={handleAddAssignment} className="rounded-lg py-1.5 px-4 font-semibold text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all">Initialize Security Link</Button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {assignments.map((assign, idx) => {
                                // Dynamic filtering of subjects based on curriculum mapping
                                const availableSubjects = classSubjects
                                    .filter(cs => {
                                        const isSameClass = (cs.classId?._id || cs.classId) === assign.classId;
                                        const curriculumSectionId = cs.sectionId?._id || cs.sectionId;
                                        // A subject is available if:
                                        // 1. It is linked to the selected class AND has no specific section (Global)
                                        // 2. OR it is linked to the selected class AND matches the selected section exactly
                                        const isGlobalOrSpecificMatch = !curriculumSectionId || curriculumSectionId === assign.sectionId;
                                        return isSameClass && isGlobalOrSpecificMatch;
                                    })
                                    .map(cs => ({ 
                                        value: cs.subjectId?._id || cs.subjectId, 
                                        label: cs.subjectId?.name || 'Unknown Subject' 
                                    }));

                                return (
                                    <div key={idx} className="p-5 border border-slate-200 rounded-xl bg-white transition-all relative group shadow-sm">
                                        
                                        <button 
                                            onClick={() => handleRemoveAssignment(idx)}
                                            className="absolute top-4 right-4 bg-rose-500 text-white rounded-lg w-8 h-8 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 z-20"
                                        >
                                            <X size={16} strokeWidth={2} />
                                        </button>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                                            <Select 
                                                label="Target Class"
                                                placeholder="Choose Territory..."
                                                value={assign.classId}
                                                onChange={(e) => handleAssignmentChange(idx, 'classId', e.target.value)}
                                                options={classes.map(c => ({ value: c._id, label: c.name }))}
                                                required
                                            />
                                            <Select 
                                                label="Sub-Section"
                                                placeholder="Global Access"
                                                value={assign.sectionId}
                                                onChange={(e) => handleAssignmentChange(idx, 'sectionId', e.target.value)}
                                                options={sections
                                                    .filter(s => (s.classId?._id || s.classId) === assign.classId)
                                                    .map(s => ({ value: s._id, label: s.name }))
                                                }
                                                disabled={!assign.classId}
                                            />
                                            <Select 
                                                label="Curriculum Subject"
                                                placeholder={assign.classId ? "Select Authorized Subject" : "Awaiting Class..."}
                                                value={assign.subjectId}
                                                onChange={(e) => handleAssignmentChange(idx, 'subjectId', e.target.value)}
                                                options={availableSubjects}
                                                disabled={!assign.classId || availableSubjects.length === 0}
                                                required
                                            />
                                        </div>
                                        
                                        {!assign.classId && (
                                            <div className="mt-4 flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 animate-pulse">
                                                <Layers size={14} className="text-slate-400" />
                                                <span className="text-[10px] font-semibold text-slate-455 uppercase tracking-wider">Select Class Territory to see available Curriculum subjects</span>
                                            </div>
                                        )}

                                        {assign.classId && availableSubjects.length === 0 && (
                                            <div className="mt-4 flex items-center gap-2 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                                                <X size={14} className="text-amber-500" />
                                                <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">No curriculum subjects linked to this class in academic configuration</span>
                                            </div>
                                        )}
                                        
                                        <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-100">
                                             <div className="h-2 w-2 rounded-full bg-[var(--primary)] animate-pulse shadow-sm"></div>
                                             <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Digital Authentication: {currentYear?.name}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-100">
                        <Button variant="ghost" onClick={handleAddAssignment} className="flex items-center gap-1.5 font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/10 w-full md:w-auto text-[11px] uppercase tracking-wider transition-all">
                            <Plus size={16} strokeWidth={2.5} /> Extend Instructor Scope
                        </Button>
                        <div className="flex gap-3 w-full md:w-auto">
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 md:flex-none">Cancel</Button>
                            <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2 flex-1 md:flex-none justify-center bg-[var(--primary)]">
                                {saving ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Linking...
                                    </div>
                                ) : <><ShieldCheck size={16} strokeWidth={2} /> Secure Credentials</>}
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; padding: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 20px; border: 3px solid white; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e2e8f0; }
            `}} />
        </div>
    );
};

export default TeacherAssignments;
