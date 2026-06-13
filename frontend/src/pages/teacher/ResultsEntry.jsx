import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Card, Button, Input, Select, Spinner, Toast, Badge } from '../../components/ui';
import { 
    getExams, 
    batchEnterResults, 
    getTeacherAssignments,
    getExamStudents
} from '../../services/api/teacher.api';
import { Save, UserCheck, BookOpen, ArrowLeft, Trophy, Target, ClipboardList, Search, AlertCircle, CheckCircle2 } from 'lucide-react';

const ResultsEntry = () => {
    const [searchParams] = useSearchParams();
    const { examId: routeExamId } = useParams();
    const navigate = useNavigate();
    
    // Combine route param and search param (route param takes precedence)
    const examIdParam = routeExamId || searchParams.get('examId');
    const classIdParam = searchParams.get('classId');

    const [exams, setExams] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [students, setStudents] = useState([]);
    const [existingResults, setExistingResults] = useState([]);
    const [activeExam, setActiveExam] = useState(null); // Authority context
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState({ message: '', type: 'success' });
    const [entryDisabledReason, setEntryDisabledReason] = useState('');

    // Selections
    const [selection, setSelection] = useState({
        classId: classIdParam || '',
        subjectId: '',
        examId: examIdParam || ''
    });

    // Student Scores State: { studentId: { marksObtained, isAbsent, remarks } }
    const [scores, setScores] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [examsRes, assignmentsRes] = await Promise.all([
                    getExams(),
                    getTeacherAssignments()
                ]);
                setExams(examsRes.data || []);
                setAssignments(assignmentsRes.data || []);
            } catch {
                setToast({ message: 'Failed to fetch initial data', type: 'error' });
            } finally {
                if (!examIdParam) setLoading(false);
            }
        };
        fetchData();
    }, [examIdParam]);

    // Update selection if route param changes
    useEffect(() => {
        if (routeExamId) {
            setSelection(prev => routeExamId === prev.examId ? prev : ({ ...prev, examId: routeExamId }));
        }
    }, [routeExamId]);

    // Effect to fetch students and existing results when selection changes
    useEffect(() => {
        const fetchContext = async () => {
            if (!selection.examId) {
                setStudents([]);
                setScores({});
                setActiveExam(null);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                // Use the centralized api service which includes auth headers
                const res = await getExamStudents(selection.examId);
                const { exam, students, existingResults } = res.data;

                setStudents(students || []);
                setExistingResults(existingResults || []);
                setActiveExam(exam || null);

                const existingMap = new Map((existingResults || []).map(r => [
                    (r.studentId?._id || r.studentId).toString(),
                    r
                ]));

                // Initialize scores
                const initialScores = {};
                (students || []).forEach(student => {
                    const existing = existingMap.get(student._id.toString());
                    initialScores[student._id] = {
                        marksObtained: existing ? existing.marksObtained : 0,
                        isAbsent: existing ? existing.isAbsent : false,
                        remarks: existing ? existing.remarks : ''
                    };
                });
                setScores(initialScores);

                const status = exam?.status || 'DRAFT';
                if (status !== 'OPEN') {
                    setEntryDisabledReason('Closed');
                } else if (exam?.canEnter === false) {
                    setEntryDisabledReason('Not assigned');
                } else {
                    setEntryDisabledReason('');
                }
                
                // If we also have class/subject info from the exam, update selection state for consistency
                if (exam) {
                    setSelection(prev => ({
                        ...prev,
                        classId: exam.classId?._id || exam.classId || prev.classId,
                        subjectId: exam.subjectId?._id || exam.subjectId || prev.subjectId
                    }));
                }

            } catch (err) {
                console.error('[SYNC ERROR]', err);
                setToast({ message: err.response?.data?.message || 'Failed to synchronize assessment context', type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchContext();
    }, [selection.examId]);

    const handleScoreChange = (studentId, field, value) => {
        setScores(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: field === 'marksObtained' ? (value === '' ? '' : Number(value)) : value
            }
        }));
    };

    const handleBatchSubmit = async (e) => {
        e.preventDefault();
        if (!selection.examId || !activeExam) return;
        if (entryDisabledReason) {
            return setToast({ message: `Entry disabled: ${entryDisabledReason}`, type: 'error' });
        }

        const maxScore = activeExam.maxScore || 100;

        // Validation
        const payload = [];
        for (const studentId in scores) {
            const s = scores[studentId];
            if (!s.isAbsent && (s.marksObtained < 0 || s.marksObtained > maxScore)) {
                return setToast({ message: `Score for one student is invalid (Max: ${maxScore})`, type: 'error' });
            }
            payload.push({ studentId, ...s });
        }

        setSubmitting(true);
        try {
            await batchEnterResults(selection.examId, payload);
            setToast({ message: 'All results updated successfully', type: 'success' });
            setTimeout(() => navigate('/teacher/exams'), 1500);
        } catch (err) {
            setToast({ message: err.response?.data?.message || 'Failed to save results', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    // Filtered options
    const availableExams = exams.filter(e => {
        const matchesClass = selection.classId ? (e.classId?._id || e.classId) === selection.classId : true;
        const matchesSubject = selection.subjectId ? (e.subjectId?._id || e.subjectId) === selection.subjectId : true;
        return matchesClass && matchesSubject;
    });

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <Spinner size="lg" />
            <p className="text-slate-400 font-black animate-pulse uppercase tracking-widest text-xs">Initializing Entry Terminal...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-32">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="h-16 w-16 flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl shadow-sm text-slate-400 hover:text-blue-600 transition-all active:scale-95">
                        <ArrowLeft size={28} strokeWidth={3} />
                    </button>
                    <div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">Scoresheet Portal</h1>
                        <p className="text-slate-500 font-medium mt-2">Precision bulk entry for authorized academic assessments.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="text-right px-4 border-r border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Capacity</p>
                        <p className="font-black text-slate-900">{students.length} Students</p>
                    </div>
                    <div className="px-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recorded</p>
                        <p className="font-black text-blue-600">{existingResults.length} Enrolled</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                <Card className="lg:col-span-1 p-8 border-none shadow-2xl bg-[#0F172A] text-white rounded-[2.5rem] sticky top-8">
                    <h3 className="text-xl font-black tracking-tight mb-10 flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <Search size={22} />
                        </div>
                        Context Filter
                    </h3>

                    <div className="space-y-8">
                        <Select 
                            label="Target Class"
                            options={Array.from(new Set(assignments.map(a => a.classId?._id))).map(id => {
                                const cls = assignments.find(a => a.classId?._id === id)?.classId;
                                return { label: cls?.name, value: id };
                            })}
                            value={selection.classId}
                            onChange={e => setSelection({...selection, classId: e.target.value, examId: ''})}
                            className="bg-slate-800 border-slate-700 text-white font-bold h-14 rounded-xl"
                        />

                        <Select 
                            label="Knowledge Area"
                            options={assignments.filter(a => a.classId?._id === selection.classId).map(a => ({
                                label: a.subjectId?.name,
                                value: a.subjectId?._id
                            }))}
                            value={selection.subjectId}
                            onChange={e => setSelection({...selection, subjectId: e.target.value, examId: ''})}
                            className="bg-slate-800 border-slate-700 text-white font-bold h-14 rounded-xl"
                            disabled={!selection.classId}
                        />

                        <Select 
                            label="Target Assessment"
                            options={availableExams.map(e => ({
                                label: `${e.name || e.examCategoryId?.name || 'Unnamed'} (${e.termId?.name || 'No Term'})`,
                                value: e._id
                            }))}
                            value={selection.examId}
                            onChange={e => setSelection({...selection, examId: e.target.value})}
                            className="bg-slate-800 border-slate-700 text-white font-bold h-14 rounded-xl"
                            disabled={!selection.subjectId}
                        />

                        {activeExam && (
                            <div className="pt-8 border-t border-slate-800 space-y-4">
                                <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-2xl">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Max Score</span>
                                    <Badge variant="blue" className="px-3 py-1 bg-blue-500/10 border-0 text-blue-400 font-black">{activeExam.maxScore || 100} Pts</Badge>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-2xl">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</span>
                                    <Badge variant={activeExam.status === 'OPEN' ? 'success' : 'warning'} className="px-3 py-1 font-black uppercase text-[9px]">{activeExam.status}</Badge>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                <div className="lg:col-span-3 space-y-8">
                    {!selection.examId ? (
                        <Card className="p-20 text-center border-none shadow-xl rounded-[3rem] bg-white border-2 border-dashed border-slate-100 flex flex-col items-center">
                            <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-8">
                                <Search size={48} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-400 tracking-tight uppercase">Select Session Context</h2>
                            <p className="text-slate-400 mt-2 font-medium">Use the left panel to filter the specific class, subject, and exam you wish to grade.</p>
                        </Card>
                    ) : !activeExam ? (
                         <Card className="p-20 text-center border-none shadow-xl rounded-[3rem] bg-white border-2 border-dashed border-slate-100 flex flex-col items-center animate-pulse">
                            <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-8">
                                <Spinner size="lg" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-400 tracking-tight uppercase">Loading Context...</h2>
                        </Card>
                    ) : (
                        <form onSubmit={handleBatchSubmit} className="space-y-8">
                            {entryDisabledReason && (
                                <Card className="p-6 border-2 border-amber-100 bg-amber-50/40 rounded-2xl">
                                    <div className="flex items-center gap-3 text-amber-700 font-semibold">
                                        <AlertCircle size={18} />
                                        Entry disabled: {entryDisabledReason}
                                    </div>
                                </Card>
                            )}
                            <Card className="p-0 border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
                                <div className="p-10 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Active Students</h2>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Authorized for {activeExam.classId?.name}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge variant="blue" className="px-6 py-2 rounded-xl border-none font-black text-xs uppercase">{activeExam.subjectId?.name}</Badge>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-white">
                                            <tr>
                                                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Learner Identity</th>
                                                <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Clinical Status</th>
                                                <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Score ({activeExam.maxScore || 100})</th>
                                                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Clinical Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {students.map(student => {
                                                const scoreData = scores[student._id] || { marksObtained: 0, isAbsent: false, remarks: '' };
                                                const hasResult = existingResults.some(r => (r.studentId?._id || r.studentId).toString() === student._id.toString());

                                                return (
                                                    <tr key={student._id} className={`group hover:bg-blue-50/30 transition-all ${scoreData.isAbsent ? 'bg-red-50/30' : ''}`}>
                                                        <td className="px-10 py-8">
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-lg uppercase group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                                                                    {student.firstName?.[0]}{student.lastName?.[0]}
                                                                </div>
                                                                <div>
                                                                    <p className="font-black text-slate-800 tracking-tight text-lg">{student.firstName} {student.lastName}</p>
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{student.admissionNumber}</p>
                                                                </div>
                                                                {hasResult && <CheckCircle2 className="text-emerald-500" size={18} />}
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-8">
                                                            <div className="flex justify-center">
                                                                <label className="flex flex-col items-center gap-2 cursor-pointer group/toggle">
                                                                    <div className={`h-8 w-14 rounded-full border-2 transition-all flex items-center px-1 ${scoreData.isAbsent ? 'bg-red-500 border-red-400 justify-end' : 'bg-slate-100 border-slate-200 justify-start'}`}>
                                                                        <div className="h-5 w-5 bg-white rounded-full shadow-md transition-all"></div>
                                                                    </div>
                                                                    <input 
                                                                        type="checkbox" 
                                                                        className="hidden" 
                                                                        checked={scoreData.isAbsent}
                                                                        onChange={e => handleScoreChange(student._id, 'isAbsent', e.target.checked)}
                                                                        disabled={!!entryDisabledReason}
                                                                    />
                                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${scoreData.isAbsent ? 'text-red-500' : 'text-slate-400'}`}>
                                                                        {scoreData.isAbsent ? 'Absent' : 'Present'}
                                                                    </span>
                                                                </label>
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-8">
                                                            <div className="flex justify-center">
                                                                <div className="relative w-32 group/input">
                                                                    <input 
                                                                        type="number"
                                                                        disabled={scoreData.isAbsent || !!entryDisabledReason}
                                                                        max={activeExam.maxScore || 100}
                                                                        min="0"
                                                                        className={`w-full h-14 bg-white border-2 rounded-2xl text-center font-black text-xl transition-all outline-none ${scoreData.isAbsent ? 'border-slate-100 text-slate-200 bg-slate-50' : 'border-slate-100 focus:border-blue-500 text-slate-900 shadow-sm focus:shadow-blue-200/50'}`}
                                                                        value={scoreData.marksObtained}
                                                                        onChange={e => handleScoreChange(student._id, 'marksObtained', e.target.value)}
                                                                    />
                                                                    {!scoreData.isAbsent && scoreData.marksObtained > (activeExam.maxScore || 100) && (
                                                                        <div className="absolute -top-2 -right-2 text-red-500 animate-bounce">
                                                                            <AlertCircle size={24} fill="white" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-8">
                                                            <input 
                                                                placeholder="Academic notes..."
                                                                className="w-full bg-transparent border-b border-slate-100 focus:border-blue-400 py-2 text-sm font-medium outline-none transition-all placeholder:text-slate-300"
                                                                value={scoreData.remarks}
                                                                onChange={e => handleScoreChange(student._id, 'remarks', e.target.value)}
                                                                disabled={!!entryDisabledReason}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="p-10 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500">
                                            <AlertCircle size={24} />
                                        </div>
                                        <p className="text-slate-400 text-sm font-medium leading-tight">
                                            Double-check all scores before commitment.<br/>
                                            <span className="text-xs text-slate-600">Once committed, results align with curriculum standards.</span>
                                        </p>
                                    </div>
                                    <Button 
                                        onClick={handleBatchSubmit}
                                        disabled={submitting || !!entryDisabledReason}
                                        className="h-16 px-16 bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-500/20 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl transition-all active:scale-95 flex items-center gap-4"
                                    >
                                        {submitting ? <Spinner size="sm" /> : <Save size={20} />}
                                        Initialize Batch Commit
                                    </Button>
                                </div>
                            </Card>
                        </form>
                    )}
                </div>
            </div>

            {toast.message && <Toast message={toast.message} type={toast.type} onClose={() => setToast({message: ''})} />}
        </div>
    );
};

export default ResultsEntry;
