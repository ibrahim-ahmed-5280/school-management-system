import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, CheckCircle2, XCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const ParentStudentAttendance = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [children, setChildren] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loadingChildren, setLoadingChildren] = useState(true);
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    
    const activeStudentId = searchParams.get('studentId') || '';

    // Fetch children list first
    useEffect(() => {
        const fetchChildren = async () => {
            try {
                const res = await api.get('/parent/dashboard');
                if (res.data?.success) {
                    setChildren(res.data.data);
                    if (!activeStudentId && res.data.data.length > 0) {
                        setSearchParams({ studentId: res.data.data[0].student._id });
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingChildren(false);
            }
        };
        fetchChildren();
    }, [activeStudentId, setSearchParams]);

    // Fetch attendance when activeStudentId changes
    useEffect(() => {
        if (!activeStudentId) return;

        const fetchAttendance = async () => {
            setLoadingAttendance(true);
            try {
                const res = await api.get(`/parent/students/${activeStudentId}/attendance`);
                if (res.data?.success) {
                    setAttendance(res.data.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingAttendance(false);
            }
        };

        fetchAttendance();
    }, [activeStudentId]);

    const activeChild = children.find(c => c.student._id === activeStudentId);

    // Calculate metrics
    const totalCount = attendance.length;
    const presentCount = attendance.filter(r => r.status === 'PRESENT').length;
    const absentCount = attendance.filter(r => r.status === 'ABSENT').length;
    const lateCount = attendance.filter(r => r.status === 'LATE').length;
    const attendancePercentage = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) + '%' : 'N/A';

    if (loadingChildren) {
        return (
            <div className="h-96 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
                        Attendance <span className="text-[var(--primary)]">Logs</span>
                    </h1>
                    <p className="text-slate-500 font-bold">Monitor class attendance details and arrival timestamps.</p>
                </div>

                {/* Child Selector */}
                {children.length > 1 && (
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Student:</span>
                        <select 
                            value={activeStudentId} 
                            onChange={(e) => setSearchParams({ studentId: e.target.value })}
                            className="h-12 bg-white border border-slate-100 rounded-2xl px-4 font-bold text-slate-800 outline-none shadow-sm focus:ring-4 focus:ring-[var(--primary)]/5"
                        >
                            {children.map(c => (
                                <option key={c.student._id} value={c.student._id}>
                                    {c.student.firstName} {c.student.lastName}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Attendance display */}
            {!activeStudentId ? (
                <div className="bg-white border border-slate-200 rounded-xl p-6 text-center max-w-md mx-auto shadow-sm">
                    <AlertTriangle className="mx-auto text-amber-500 mb-4" size={36} />
                    <p className="text-slate-500 text-sm font-semibold">No student selected or linked.</p>
                </div>
            ) : loadingAttendance ? (
                <div className="h-64 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Stat Summaries */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                            <span className="text-[10px] font-semibold tracking-wider text-slate-450 uppercase">Attendance Rate</span>
                            <p className="text-xl font-bold text-slate-800 mt-1">{attendancePercentage}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                            <span className="text-[10px] font-semibold tracking-wider text-slate-450 uppercase">Present Days</span>
                            <p className="text-xl font-bold text-emerald-500 mt-1">{presentCount}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                            <span className="text-[10px] font-semibold tracking-wider text-slate-450 uppercase">Late Arrivals</span>
                            <p className="text-xl font-bold text-amber-500 mt-1">{lateCount}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                            <span className="text-[10px] font-semibold tracking-wider text-slate-450 uppercase">Absent Days</span>
                            <p className="text-xl font-bold text-rose-500 mt-1">{absentCount}</p>
                        </div>
                    </div>

                    {/* Attendance list */}
                    {attendance.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center max-w-md mx-auto shadow-sm">
                            <Calendar className="mx-auto text-slate-300 mb-4" size={36} />
                            <h3 className="text-lg font-bold text-slate-805 mb-1">No Attendance Records</h3>
                            <p className="text-slate-500 text-sm">
                                There are currently no marked attendance records for {activeChild?.student?.firstName || 'this student'}.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="p-5 border-b border-slate-205 bg-slate-50">
                                <h3 className="text-base font-bold text-slate-805">
                                    Attendance History for {activeChild?.student?.firstName} {activeChild?.student?.lastName}
                                </h3>
                                <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">
                                    Total Sessions Logged: {totalCount} | Current Term
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/20">
                                            <th className="p-6">Date</th>
                                            <th className="p-6">Period</th>
                                            <th className="p-6">Instructor</th>
                                            <th className="p-6">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendance.map(record => (
                                            <tr key={record._id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                                                <td className="p-6 font-black text-slate-900">
                                                    {new Date(record.sessionId?.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                </td>
                                                <td className="p-6 text-sm text-slate-600 font-bold">
                                                    Period {record.sessionId?.period || 'N/A'}
                                                </td>
                                                <td className="p-6 text-sm text-slate-500 font-bold">
                                                    {record.sessionId?.teacherUserId?.name || 'Class Instructor'}
                                                </td>
                                                <td className="p-6">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                                                        record.status === 'PRESENT' 
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                            : record.status === 'LATE'
                                                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                                                            : 'bg-rose-50 text-rose-600 border-rose-100'
                                                    }`}>
                                                        {record.status === 'PRESENT' && <CheckCircle2 size={12} />}
                                                        {record.status === 'ABSENT' && <XCircle size={12} />}
                                                        {record.status === 'LATE' && <AlertCircle size={12} />}
                                                        {record.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ParentStudentAttendance;
