import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Award, BookOpen, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const ParentStudentGrades = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [children, setChildren] = useState([]);
    const [grades, setGrades] = useState([]);
    const [loadingChildren, setLoadingChildren] = useState(true);
    const [loadingGrades, setLoadingGrades] = useState(false);
    
    const activeStudentId = searchParams.get('studentId') || '';

    // Fetch children list first
    useEffect(() => {
        const fetchChildren = async () => {
            try {
                const res = await api.get('/parent/dashboard');
                if (res.data?.success) {
                    setChildren(res.data.data);
                    // If no student selected in URL, default to first child
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

    // Fetch grades when activeStudentId changes
    useEffect(() => {
        if (!activeStudentId) return;

        const fetchGrades = async () => {
            setLoadingGrades(true);
            try {
                const res = await api.get(`/parent/students/${activeStudentId}/grades`);
                if (res.data?.success) {
                    setGrades(res.data.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingGrades(false);
            }
        };

        fetchGrades();
    }, [activeStudentId]);

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
                        Grades & <span className="text-[var(--primary)]">Results</span>
                    </h1>
                    <p className="text-slate-500 font-bold">Review report cards, exam scores, and academic standings.</p>
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

            {/* Main Grades Display */}
            {!activeStudentId ? (
                <div className="bg-white border border-slate-100 rounded-[30px] p-12 text-center max-w-xl mx-auto shadow-sm">
                    <AlertTriangle className="mx-auto text-amber-500 mb-6" size={48} />
                    <p className="text-slate-500 text-sm font-bold">No student selected or linked.</p>
                </div>
            ) : loadingGrades ? (
                <div className="h-64 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : grades.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-[40px] p-12 text-center max-w-xl mx-auto shadow-sm">
                    <Award className="mx-auto text-slate-300 mb-6" size={48} />
                    <h3 className="text-xl font-black text-slate-900 mb-2">No Grade Records</h3>
                    <p className="text-slate-500 text-sm font-bold">
                        There are currently no published exam results for {activeChild?.student?.firstName || 'this student'}.
                    </p>
                </div>
            ) : (
                <div className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-sm">
                    <div className="p-8 border-b border-slate-50 bg-slate-50/50">
                        <h3 className="text-lg font-black text-slate-900">
                            Exam Report Card for {activeChild?.student?.firstName} {activeChild?.student?.lastName}
                        </h3>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                            Current Class: {activeChild?.className} | Academic Term Summary
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/20">
                                    <th className="p-6">Exam Name</th>
                                    <th className="p-6">Subject</th>
                                    <th className="p-6">Category</th>
                                    <th className="p-6">Score Obtained</th>
                                    <th className="p-6">Grade / Status</th>
                                    <th className="p-6">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {grades.map(grade => (
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ParentStudentGrades;
