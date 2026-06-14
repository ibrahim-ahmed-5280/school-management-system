import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Award, BookOpen, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api';

const ParentStudentGrades = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [children, setChildren] = useState([]);
    const [years, setYears] = useState([]);
    const [selectedYearId, setSelectedYearId] = useState('');
    const [grades, setGrades] = useState([]);
    const [rankData, setRankData] = useState(null);

    const [loadingChildren, setLoadingChildren] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [error, setError] = useState('');

    const activeStudentId = searchParams.get('studentId') || '';

    // Fetch children list
    useEffect(() => {
        const fetchChildren = async () => {
            try {
                const res = await api.get('/parent/dashboard');
                if (res.data?.success) {
                    setChildren(res.data.data);
                    if (!activeStudentId && res.data.data.length > 0) {
                        setSearchParams({ studentId: res.data.data[0].student._id });
                    }
                } else {
                    setError('Failed to retrieve children list.');
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Error loading student profiles.');
            } finally {
                setLoadingChildren(false);
            }
        };
        fetchChildren();
    }, [activeStudentId, setSearchParams]);

    // Fetch academic years when child changes
    useEffect(() => {
        if (!activeStudentId) return;

        const fetchYears = async () => {
            setError('');
            try {
                const res = await api.get(`/parent/students/${activeStudentId}/academic-years`);
                if (res.data?.success) {
                    const yearList = res.data.data || [];
                    setYears(yearList);
                    
                    const currentYear = yearList.find(y => y.isCurrent) || yearList[0];
                    if (currentYear) {
                        setSelectedYearId(currentYear._id);
                    } else {
                        setSelectedYearId('');
                    }
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load academic years.');
            }
        };
        fetchYears();
    }, [activeStudentId]);

    // Fetch grades and rank when student or year changes
    const fetchGradesAndRank = useCallback(async () => {
        if (!activeStudentId) return;
        setLoadingData(true);
        setError('');
        try {
            const params = selectedYearId ? { schoolYearId: selectedYearId } : {};
            const [gradesRes, rankRes] = await Promise.all([
                api.get(`/parent/students/${activeStudentId}/grades`, { params }),
                api.get(`/parent/students/${activeStudentId}/rank`, { params })
            ]);

            if (gradesRes.data?.success) {
                setGrades(gradesRes.data.data || []);
            }
            if (rankRes.data?.success) {
                setRankData(rankRes.data.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error loading academic results or ranking.');
        } finally {
            setLoadingData(false);
        }
    }, [activeStudentId, selectedYearId]);

    useEffect(() => {
        fetchGradesAndRank();
    }, [fetchGradesAndRank]);

    const activeChild = children.find(c => c.student._id === activeStudentId);

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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
                        Grades & <span className="text-[var(--primary)]">Results</span>
                    </h1>
                    <p className="text-slate-500 font-bold">Review report cards, exam scores, and academic standings.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Child Selector */}
                    {children.length > 1 && (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student:</span>
                            <select 
                                value={activeStudentId} 
                                onChange={(e) => {
                                    setSearchParams({ studentId: e.target.value });
                                    setYears([]);
                                    setSelectedYearId('');
                                    setGrades([]);
                                    setRankData(null);
                                }}
                                className="h-10 bg-white border border-slate-200 rounded-xl px-3 font-bold text-slate-800 outline-none shadow-sm focus:ring-4 focus:ring-[var(--primary)]/5 text-xs"
                            >
                                {children.map(c => (
                                    <option key={c.student._id} value={c.student._id}>
                                        {c.student.firstName} {c.student.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Academic Year Selector */}
                    {years.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Year:</span>
                            <select 
                                value={selectedYearId} 
                                onChange={(e) => setSelectedYearId(e.target.value)}
                                className="h-10 bg-white border border-slate-200 rounded-xl px-3 font-bold text-slate-800 outline-none shadow-sm focus:ring-4 focus:ring-[var(--primary)]/5 text-xs"
                            >
                                {years.map(y => (
                                    <option key={y._id} value={y._id}>
                                        {y.name} {y.isCurrent ? '(Current)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-900">
                    <AlertCircle className="text-rose-500 flex-shrink-0" size={20} />
                    <div className="text-sm font-semibold flex-1">{error}</div>
                    <button 
                        onClick={fetchGradesAndRank} 
                        className="text-xs bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
                    >
                        <RefreshCw size={12} />
                        Retry
                    </button>
                </div>
            )}

            {!activeStudentId ? (
                <div className="bg-white border border-slate-100 rounded-[30px] p-12 text-center max-w-xl mx-auto shadow-sm">
                    <AlertTriangle className="mx-auto text-amber-500 mb-6" size={48} />
                    <p className="text-slate-500 text-sm font-bold">No student selected or linked.</p>
                </div>
            ) : loadingData ? (
                <div className="h-64 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : years.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-[30px] p-12 text-center max-w-xl mx-auto shadow-sm">
                    <AlertTriangle className="mx-auto text-amber-500 mb-6" size={48} />
                    <p className="text-slate-500 text-sm font-bold">No academic year records found for this child.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Rank Summary Stats Card */}
                    {rankData && rankData.rank !== null && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                                <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Class Rank</span>
                                <p className="text-2xl font-black text-[var(--primary)] mt-1">{rankData.rank} / {rankData.classSize}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                                <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Total Marks</span>
                                <p className="text-2xl font-black text-slate-800 mt-1">{rankData.totalMarks}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                                <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Status</span>
                                <p className={`text-2xl font-black mt-1 ${rankData.overallStatus === 'PASS' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {rankData.overallStatus}
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                                <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Academic Context</span>
                                <p className="text-sm font-bold text-slate-500 mt-2 truncate">
                                    {rankData.className} ({rankData.academicYearName})
                                </p>
                            </div>
                        </div>
                    )}

                    {grades.length === 0 ? (
                        <div className="bg-white border border-slate-100 rounded-[40px] p-12 text-center max-w-xl mx-auto shadow-sm">
                            <Award className="mx-auto text-slate-300 mb-6" size={48} />
                            <h3 className="text-xl font-black text-slate-900 mb-2">No Grade Records</h3>
                            <p className="text-slate-500 text-sm font-bold">
                                There are currently no published exam results for {activeChild?.student?.firstName || 'this student'} in the selected year.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-sm">
                            <div className="p-8 border-b border-slate-50 bg-slate-50/50">
                                <h3 className="text-lg font-black text-slate-900">
                                    Exam Report Card for {activeChild?.student?.firstName} {activeChild?.student?.lastName}
                                </h3>
                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                                    Class Section: {rankData?.className || activeChild?.className} | Academic Year: {years.find(y => y._id === selectedYearId)?.name}
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/20">
                                            <th className="p-6">Exam Name</th>
                                            <th className="p-6">Subject</th>
                                            <th className="p-6">Category</th>
                                            <th className="p-6">Class/Enrollment</th>
                                            <th className="p-6">Score Obtained</th>
                                            <th className="p-6">Grade / Status</th>
                                            <th className="p-6">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {grades.map(grade => {
                                            // BUG-S11: display historic class name dynamically
                                            const examClass = grade.examId?.classId?.name || rankData?.className || activeChild?.className || 'N/A';
                                            return (
                                                <tr key={grade._id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                                                    <td className="p-6 font-black text-slate-900">
                                                        {grade.examId?.name || 'Assessment'}
                                                    </td>
                                                    <td className="p-6 text-sm text-slate-600 font-bold">
                                                        {grade.examId?.subjectId?.name || 'General'}
                                                    </td>
                                                    <td className="p-6 text-xs text-slate-400 font-bold uppercase tracking-tight">
                                                        {grade.examId?.examCategoryId?.name || 'Class Exam'}
                                                    </td>
                                                    <td className="p-6 text-xs text-slate-500 font-bold">
                                                        {examClass}
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-slate-900 text-base">{grade.marksObtained}</span>
                                                            <span className="text-slate-400 text-xs font-bold">/ {grade.maxScore}</span>
                                                            <span className="text-slate-400 text-[10px] font-bold">({grade.percentage}%)</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                                                            grade.status === 'PASS' 
                                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                                : 'bg-rose-50 text-rose-600 border-rose-100'
                                                        }`}>
                                                            {grade.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-6 text-sm text-slate-500 font-bold italic">
                                                        {grade.remarks || 'No remarks added'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
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

export default ParentStudentGrades;
