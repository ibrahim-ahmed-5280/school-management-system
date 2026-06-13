import React, { useState, useEffect } from 'react';
import { Card, Spinner } from '../../components/ui';
import { apiGetStudentAttendance } from '../../services/api/student.api';
import { 
    CalendarCheck, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    Calendar,
    Search,
    UserCheck
} from 'lucide-react';

const StudentAttendance = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const res = await apiGetStudentAttendance();
                setAttendance(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAttendance();
    }, []);

    const filtered = attendance.filter(a => filter === 'All' ? true : a.status === filter);

    const stats = {
        Present: attendance.filter(a => a.status === 'PRESENT').length,
        Absent: attendance.filter(a => a.status === 'ABSENT').length,
        Late: attendance.filter(a => a.status === 'LATE').length,
    };

    const attendanceRate = attendance.length > 0 
        ? Math.round(((stats.Present + stats.Late * 0.5) / attendance.length) * 100) 
        : 100;

    if (loading) return <div className="flex h-96 items-center justify-center"><Spinner size="lg" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Attendance Tracking</h1>
                <p className="text-slate-500 mt-1 font-medium">Review your daily attendance records and consistency report.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6 border-0 shadow-xl shadow-slate-200/50 bg-white group border-b-4 border-b-[var(--primary)]">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Overall Presence</p>
                    <div className="flex items-end justify-between">
                        <h3 className="text-4xl font-black text-slate-800">{attendanceRate}%</h3>
                        <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/5 text-[var(--primary)] flex items-center justify-center group-hover:scale-110 transition-transform">
                            <CheckCircle2 size={24} />
                        </div>
                    </div>
                    <div className="mt-4 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--primary)] rounded-full" style={{ width: `${attendanceRate}%` }}></div>
                    </div>
                </Card>

                <Card className="p-6 border-0 shadow-xl shadow-slate-200/50 bg-white group border-b-4 border-b-emerald-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Days Present</p>
                    <div className="flex items-end justify-between">
                        <h3 className="text-4xl font-black text-emerald-600">{stats.Present}</h3>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <CheckCircle2 size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border-0 shadow-xl shadow-slate-200/50 bg-white group border-b-4 border-b-red-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Days Absent</p>
                    <div className="flex items-end justify-between">
                        <h3 className="text-4xl font-black text-red-600">{stats.Absent}</h3>
                        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <XCircle size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border-0 shadow-xl shadow-slate-200/50 bg-white group border-b-4 border-b-amber-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Late Arrivals</p>
                    <div className="flex items-end justify-between">
                        <h3 className="text-4xl font-black text-amber-600">{stats.Late}</h3>
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Clock size={24} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Attendance List */}
            <Card className="p-0 border-0 shadow-2xl shadow-slate-200/50 bg-white overflow-hidden rounded-3xl">
                <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-50/30">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { value: 'All', label: 'All' },
                            { value: 'PRESENT', label: 'Present' },
                            { value: 'ABSENT', label: 'Absent' },
                            { value: 'LATE', label: 'Late' }
                        ].map((item) => (
                            <button
                                key={item.value}
                                onClick={() => setFilter(item.value)}
                                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                    filter === item.value 
                                    ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20 translate-y-[-2px]' 
                                    : 'bg-white text-slate-500 border border-slate-200 hover:border-[var(--primary)] hover:text-[var(--primary)]'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="divide-y divide-slate-50">
                    {filtered.length > 0 ? filtered.map((record) => (
                        <div key={record._id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors group">
                            <div className="flex items-center gap-6">
                                <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-md relative overflow-hidden ${
                                    record.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-600' :
                                    record.status === 'ABSENT' ? 'bg-red-50 text-red-600' :
                                    'bg-amber-50 text-amber-600'
                                }`}>
                                     <div className={`absolute top-0 left-0 w-1 h-full ${
                                        record.status === 'PRESENT' ? 'bg-emerald-500' :
                                        record.status === 'ABSENT' ? 'bg-red-500' :
                                        'bg-amber-500'
                                    }`}></div>
                                    <p className="text-[10px] font-black uppercase leading-none mb-1">{new Date(record.sessionId?.date).toLocaleDateString('en-US', { month: 'short' })}</p>
                                    <p className="text-xl font-black leading-none">{new Date(record.sessionId?.date).getDate()}</p>
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-slate-800 tracking-tight group-hover:text-[var(--primary)] transition-colors">{record.sessionId?.period || 'General Session'}</h4>
                                    <div className="flex items-center gap-4 mt-1">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            <Calendar size={12} className="text-slate-300" />
                                            <span>{new Date(record.sessionId?.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            <UserCheck size={12} className="text-slate-300" />
                                            <span> Teacher: {record.sessionId?.teacherUserId?.name || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm ${
                                    record.status === 'PRESENT' ? 'bg-emerald-100/50 text-emerald-700 border border-emerald-200' :
                                    record.status === 'ABSENT' ? 'bg-red-100/50 text-red-700 border border-red-200' :
                                    'bg-amber-100/50 text-amber-700 border border-amber-200'
                                }`}>
                                    {record.status}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="p-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6">
                                <CalendarCheck size={40} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800">No attendance records</h3>
                            <p className="text-slate-500 font-medium mt-2">There are no records found for the selected filter.</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default StudentAttendance;

