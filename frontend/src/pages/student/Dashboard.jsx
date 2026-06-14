import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    apiGetStudentProfile,
    apiGetStudentResultsBy,
    apiGetStudentRank,
    apiGetStudentAcademicYears
} from '../../services/api/student.api';
import { Card, Spinner, Badge } from '../../components/ui';
import { GraduationCap, Trophy, BookOpen, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const StudentDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [overall, setOverall] = useState(null);
    const [rankInfo, setRankInfo] = useState(null);
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYearId, setSelectedYearId] = useState('');
    const [yearError, setYearError] = useState('');

    useEffect(() => {
        const loadProfileAndYears = async () => {
            try {
                const [profileRes, yearsRes] = await Promise.all([
                    apiGetStudentProfile(),
                    apiGetStudentAcademicYears()
                ]);

                setProfile(profileRes.data || profileRes);
                const yearsPayload = yearsRes.data || yearsRes || [];
                setAcademicYears(yearsPayload);
                if (yearsPayload.length) {
                    const current = yearsPayload.find((year) => year.isCurrent);
                    setSelectedYearId((current || yearsPayload[0])._id);
                } else {
                    // FIX BUG-S8: stop loading if no academic years
                    setLoading(false);
                }
            } catch (error) {
                console.error(error);
                setYearError('Failed to load academic year data.');
                // FIX BUG-S8: stop loading on error too
                setLoading(false);
            }
        };

        loadProfileAndYears();
    }, []);

    useEffect(() => {
        if (!selectedYearId) return;
        const loadYearData = async () => {
            try {
                setLoading(true);
                const [resultsRes, rankRes] = await Promise.all([
                    apiGetStudentResultsBy({ schoolYearId: selectedYearId }),
                    apiGetStudentRank({ schoolYearId: selectedYearId })
                ]);

                const resultPayload = resultsRes.data || resultsRes;
                setSubjects(resultPayload.subjects || []);
                setOverall(resultPayload.overall || null);
                setRankInfo(rankRes.data || rankRes);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        loadYearData();
    }, [selectedYearId]);

    // FIX BUG-S8: show empty state if no years at all
    if (!loading && academicYears.length === 0) {
        return (
            <div className="space-y-8 animate-fade-in">
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl p-8 text-white shadow-2xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                            <GraduationCap size={32} className="text-white" />
                        </div>
                        <span className="font-bold tracking-widest uppercase text-white/70 text-sm">Student Portal</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight">
                        Hello, {user?.firstName || profile?.student?.firstName || 'Scholar'}!
                    </h1>
                </div>
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300 mb-6">
                        <AlertCircle size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700">No academic year records found yet</h3>
                    <p className="text-slate-500 mt-2 max-w-sm">
                        {yearError || 'Your academic history will appear here once you are enrolled in an academic year.'}
                    </p>
                </div>
            </div>
        );
    }

    if (loading) return <div className="h-64 flex items-center justify-center"><Spinner size="lg" /></div>;

    // Only show subjects that have been graded
    const gradedSubjects = subjects.filter(s => s.status !== 'NOT_GRADED');
    const ungradedSubjects = subjects.filter(s => s.status === 'NOT_GRADED');

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                            <GraduationCap size={32} className="text-white" />
                        </div>
                        <span className="font-bold tracking-widest uppercase text-white/70 text-sm">Student Portal</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">
                        Hello, {user?.firstName || profile?.student?.firstName || 'Scholar'}!
                    </h1>
                    <p className="text-lg text-blue-100 font-medium max-w-2xl">
                        Track your academic progress and performance in real time.
                    </p>
                    <div className="mt-6 max-w-sm">
                        <select
                            className="w-full rounded-xl border border-white/30 bg-white/20 px-4 py-3 text-sm font-bold text-white outline-none backdrop-blur"
                            value={selectedYearId}
                            onChange={(e) => setSelectedYearId(e.target.value)}
                        >
                            {academicYears.map((year) => (
                                <option key={year._id} value={year._id} className="text-slate-900">
                                    {year.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute left-0 bottom-0 w-64 h-64 bg-indigo-900/20 rounded-full blur-3xl -ml-20 -mb-20"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-white border-none shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <BookOpen size={28} />
                        </div>
                        <div>
                            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Total</p>
                            <h3 className="text-2xl font-black text-slate-800">
                                {overall?.totalMarks ?? 0}/{overall?.totalMax ?? 0}
                            </h3>
                        </div>
                    </div>
                </Card>

                <Card className="bg-white border-none shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                            <Trophy size={28} />
                        </div>
                        <div>
                            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Overall</p>
                            <h3 className="text-2xl font-black text-slate-800">{overall?.overallStatus || '—'}</h3>
                            <p className="text-xs text-slate-400">Pass ≥ {overall?.overallPassMark ?? 0}</p>
                        </div>
                    </div>
                </Card>

                <Card className="bg-white border-none shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 size={28} />
                        </div>
                        <div>
                            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Rank</p>
                            <h3 className="text-2xl font-black text-slate-800">
                                {rankInfo?.rank || '—'} <span className="text-slate-400 text-sm">/ {rankInfo?.classSize || 0}</span>
                            </h3>
                        </div>
                    </div>
                </Card>

                <Card className="bg-white border-none shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                            <XCircle size={28} />
                        </div>
                        <div>
                            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Subjects</p>
                            <h3 className="text-2xl font-black text-slate-800">{subjects.length}</h3>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="space-y-3">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Subject Status</h2>
                <Card className="border-none shadow-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {gradedSubjects.map(subject => (
                            <div key={subject.subjectId} className="flex items-center justify-between border border-slate-100 rounded-2xl px-5 py-4">
                                <div>
                                    <p className="font-bold text-slate-800">{subject.subjectName}</p>
                                    <p className="text-xs text-slate-400">{subject.totalMarks}/{subject.totalMax}</p>
                                </div>
                                <Badge variant={subject.status === 'PASS' ? 'success' : 'danger'}>
                                    {subject.status}
                                </Badge>
                            </div>
                        ))}
                        {ungradedSubjects.map(subject => (
                            <div key={subject.subjectId} className="flex items-center justify-between border border-dashed border-slate-200 rounded-2xl px-5 py-4 opacity-60">
                                <div>
                                    <p className="font-bold text-slate-700">{subject.subjectName}</p>
                                    <p className="text-xs text-slate-400">No exams recorded yet</p>
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-lg">Not graded</span>
                            </div>
                        ))}
                        {subjects.length === 0 && (
                            <div className="col-span-full text-center text-slate-400 py-6">No subject results yet.</div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default StudentDashboard;
