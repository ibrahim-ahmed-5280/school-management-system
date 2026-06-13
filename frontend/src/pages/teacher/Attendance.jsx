import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Table, Select, Badge, Toast } from '../../components/ui';
import { useSearchParams } from 'react-router-dom';
import { getTeacherAssignments, getStudents } from '../../services/api/teacher.api';
import { 
    CalendarCheck, 
    Users, 
    BookOpen, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    Save, 
    Plus,
    Calendar,
    Search,
    ChevronRight,
    AlertCircle,
    User,
    ClipboardCheck
} from 'lucide-react';
import http from '../../services/api/http';

const TeacherAttendance = () => {
    const [searchParams] = useSearchParams();
    const classIdParam = searchParams.get('classId');

    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({}); // { studentId: status }
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [period, setPeriod] = useState('Morning Session');
    const [toast, setToast] = useState({ message: '', type: 'success' });

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const res = await getTeacherAssignments();
                const asgns = res.data;
                setAssignments(asgns);
                
                if (asgns.length > 0) {
                    const preselected = classIdParam 
                        ? asgns.find(a => a.classId?._id === classIdParam) || asgns[0]
                        : asgns[0];
                    setSelectedAssignment(preselected);
                }
            } catch (err) {
                console.error(err);
                setToast({ message: 'Failed to load assignments', type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchInitial();
    }, [classIdParam]);

    useEffect(() => {
        if (selectedAssignment) {
            fetchStudents(selectedAssignment.classId._id, selectedAssignment.academicYearId._id);
        }
    }, [selectedAssignment]);

    const fetchStudents = async (classId, academicYearId) => {
        setLoading(true);
        try {
            const res = await getStudents({ classId, academicYearId });
            setStudents(res.data);
            const initialAttendance = {};
            res.data.forEach(s => initialAttendance[s._id] = 'PRESENT');
            setAttendance(initialAttendance);
        } catch (err) {
            console.error(err);
            setToast({ message: 'Failed to load students', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (studentId, status) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            let sessionId;

            // 1. Check if session already exists for this slot
            try {
                const existingSessionRes = await http.get('/teacher/attendance/sessions', {
                    params: {
                        classId: selectedAssignment.classId._id,
                        academicYearId: selectedAssignment.academicYearId._id,
                        from: date,
                        to: date
                    }
                });

                // Find session with matching period
                const existingSession = existingSessionRes.data.data?.find(
                    s => s.period === period && s.date === date
                );

                if (existingSession) {
                    sessionId = existingSession._id;
                } else {
                    // Create new session
                    const sessionRes = await http.post('/teacher/attendance/sessions', {
                        classId: selectedAssignment.classId._id,
                        academicYearId: selectedAssignment.academicYearId._id,
                        date,
                        period
                    });
                    sessionId = sessionRes.data.data._id;
                }
            } catch {
                // If fetching fails, try to create (ignoring fetch error)
                const sessionRes = await http.post('/teacher/attendance/sessions', {
                    classId: selectedAssignment.classId._id,
                    academicYearId: selectedAssignment.academicYearId._id,
                    date,
                    period
                });
                sessionId = sessionRes.data.data._id;
            }

            // 2. Submit records
            const records = Object.entries(attendance).map(([studentId, status]) => ({
                studentId,
                status
            }));

            await http.post(`/teacher/attendance/sessions/${sessionId}/records`, { records });
            
            setToast({ message: 'Attendance recorded successfully!', type: 'success' });
        } catch (err) {
            setToast({ message: err.response?.data?.message || 'Failed to save attendance', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const stats = [
        { label: 'Present', count: Object.values(attendance).filter(s => s === 'PRESENT').length, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Absent', count: Object.values(attendance).filter(s => s === 'ABSENT').length, color: 'text-rose-500', bg: 'bg-rose-50' },
        { label: 'Late', count: Object.values(attendance).filter(s => s === 'LATE').length, color: 'text-amber-500', bg: 'bg-amber-50' },
    ];

    if (loading && assignments.length === 0) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <Spinner size="lg" />
            <p className="text-slate-400 font-black animate-pulse uppercase tracking-widest text-xs">Loading Register...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                            <CalendarCheck size={32} />
                        </div>
                        Attendance Register
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium ml-1">Record and manage daily presence for your assigned classes.</p>
                </div>
                <div className="flex gap-4">
                    {stats.map((s, idx) => (
                        <div key={idx} className={`${s.bg} px-6 py-3 rounded-2xl flex flex-col items-center`}>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</span>
                            <span className={`text-xl font-black ${s.color}`}>{s.count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Config Bar */}
            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-linear-to-r from-slate-50 to-slate-100/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Select 
                        label="Select Class" 
                        options={assignments.map(a => ({ label: `${a.classId.name} (${a.academicYearId.name})`, value: a._id }))}
                        value={selectedAssignment?._id || ''}
                        onChange={(e) => setSelectedAssignment(assignments.find(a => a._id === e.target.value))}
                    />

                    <div className="space-y-1.5 flex-1">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Date</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Calendar size={18} />
                            </div>
                            <input 
                                type="date" 
                                className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-700"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5 flex-1">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Session/Period</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Clock size={18} />
                            </div>
                            <input 
                                type="text" 
                                placeholder="e.g. Morning Session"
                                className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-700"
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Student List */}
            {selectedAssignment && (
                <div className="animate-fade-in">
                    <Table headers={['Roll & Code', 'Student Information', 'Attendance Status']}>
                        {students.map((student, idx) => (
                            <tr key={student._id} className="hover:bg-indigo-50/30 transition-all group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-black text-slate-300 w-6">{(idx + 1).toString().padStart(2, '0')}</span>
                                        <Badge variant="indigo" className="bg-slate-100 border-none text-slate-500 px-3">#{student.studentCode || student.admissionNumber}</Badge>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 tracking-tight text-lg leading-none mb-1">{student.firstName} {student.lastName}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrollment Active</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        {[
                                            { label: 'PRESENT', displayLabel: 'Present', icon: <CheckCircle2 size={12} />, variant: 'success' },
                                            { label: 'ABSENT', displayLabel: 'Absent', icon: <XCircle size={12} />, variant: 'danger' },
                                            { label: 'LATE', displayLabel: 'Late', icon: <Clock size={12} />, variant: 'warning' }
                                        ].map(status => (
                                            <button
                                                key={status.label}
                                                type="button"
                                                onClick={() => handleStatusChange(student._id, status.label)}
                                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                    attendance[student._id] === status.label 
                                                    ? status.label === 'PRESENT' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 border-emerald-500' :
                                                      status.label === 'ABSENT' ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30 border-rose-500' :
                                                      'bg-amber-600 text-white shadow-lg shadow-amber-500/30 border-amber-500'
                                                    : 'bg-white text-slate-400 border-2 border-slate-100 hover:border-slate-200 hover:text-slate-600'
                                                }`}
                                            >
                                                {status.icon}
                                                {status.displayLabel}
                                            </button>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </Table>

                    {/* Footer Actions */}
                    <div className="mt-8 flex justify-end">
                        <Button 
                            onClick={handleSubmit} 
                            disabled={saving || students.length === 0}
                            size="lg"
                            className="px-12 h-16 shadow-2xl"
                        >
                            {saving ? <Spinner size="sm" /> : (
                                <>
                                    <ClipboardCheck size={24} />
                                    <span>Sync Register To Cloud</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
            {toast.message && <Toast message={toast.message} type={toast.type} onClose={() => setToast({message: ''})} />}
        </div>
    );
};

export default TeacherAttendance;
