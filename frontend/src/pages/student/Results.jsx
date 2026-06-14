import React, { useState, useEffect } from 'react';
import { Card, Spinner, Badge, Table } from '../../components/ui';
import { FileText, AlertCircle } from 'lucide-react';
import { apiGetStudentAcademicYears, apiGetStudentResultsBy } from '../../services/api/student.api';

// Badge variant for result status
const statusVariant = (status) => {
    if (status === 'PASS') return 'success';
    if (status === 'FAIL') return 'danger';
    return 'default'; // NOT_GRADED
};

const StudentResults = () => {
    const [loading, setLoading] = useState(true);
    const [subjects, setSubjects] = useState([]);
    const [overall, setOverall] = useState(null);
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYearId, setSelectedYearId] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchYears = async () => {
            try {
                const yearsRes = await apiGetStudentAcademicYears();
                const yearsPayload = yearsRes.data || yearsRes || [];
                setAcademicYears(yearsPayload);
                if (yearsPayload.length) {
                    const current = yearsPayload.find((year) => year.isCurrent);
                    setSelectedYearId((current || yearsPayload[0])._id);
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.message || 'Failed to load academic years.');
                setLoading(false);
            }
        };
        fetchYears();
    }, []);

    useEffect(() => {
        if (!selectedYearId) return;
        const fetchResults = async () => {
            try {
                setLoading(true);
                setError('');
                const data = await apiGetStudentResultsBy({ schoolYearId: selectedYearId });
                const payload = data.data || data;
                setSubjects(payload.subjects || []);
                setOverall(payload.overall || null);
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.message || 'Failed to load results. Please try again.');
                setSubjects([]);
                setOverall(null);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [selectedYearId]);

    // Derived: only graded subjects go into the table headers
    const gradedSubjects = subjects.filter(s => s.status !== 'NOT_GRADED');

    const categoryHeaders = (() => {
        const map = new Map();
        gradedSubjects.forEach(subject => {
            (subject.categories || []).forEach(cat => {
                const key = cat.categoryId?.toString() || cat.categoryName;
                if (key && !map.has(key)) {
                    map.set(key, {
                        id: key,
                        name: cat.categoryName || 'Category',
                        maxScore: cat.maxScore || 0
                    });
                }
            });
        });
        return Array.from(map.values());
    })();

    if (loading) return <div className="h-64 flex items-center justify-center"><Spinner size="lg" /></div>;

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Results</h1>
                <p className="text-slate-500 font-medium">Subject-wise performance summary</p>
                {academicYears.length > 0 && (
                    <div className="mt-4 max-w-sm">
                        <select
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            value={selectedYearId}
                            onChange={(e) => setSelectedYearId(e.target.value)}
                        >
                            {academicYears.map((year) => (
                                <option key={year._id} value={year._id}>
                                    {year.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Error banner */}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl">
                    <AlertCircle size={20} className="shrink-0" />
                    <span className="text-sm font-semibold">{error}</span>
                    <button
                        className="ml-auto text-xs underline font-bold"
                        onClick={() => setSelectedYearId(prev => prev)}
                    >
                        Retry
                    </button>
                </div>
            )}

            {!error && subjects.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <FileText size={48} className="mx-auto text-slate-200 mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">No Results Yet</h3>
                    <p className="text-slate-400">Your results will appear here after grading.</p>
                </div>
            ) : !error && (
                <>
                    {/* Overall summary */}
                    {gradedSubjects.length > 0 && overall && (
                        <Card className="border-none shadow-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-400 text-xs uppercase font-bold tracking-widest">Graded Total</p>
                                    <h3 className="text-2xl font-black text-slate-800">
                                        {overall.totalMarks ?? 0} / {overall.totalMax ?? 0}
                                    </h3>
                                </div>
                                <Badge variant={overall.overallStatus === 'PASS' ? 'success' : 'danger'}>
                                    {overall.overallStatus || '—'}
                                </Badge>
                            </div>
                        </Card>
                    )}

                    {/* Graded subjects table */}
                    {gradedSubjects.length > 0 && (
                        <Table
                            headers={[
                                'Subject',
                                ...categoryHeaders.map(h => `${h.name} / ${h.maxScore}`),
                                'Percentage',
                                'Total',
                                'Grade'
                            ]}
                        >
                            {gradedSubjects.map((subject) => (
                                <tr key={subject.subjectId} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-8 py-5 font-semibold text-slate-700">{subject.subjectName}</td>
                                    {categoryHeaders.map(header => {
                                        const match = (subject.categories || []).find(cat => (cat.categoryId?.toString() || cat.categoryName) === header.id);
                                        const value = match ? match.marksObtained : 0;
                                        return (
                                            <td key={header.id} className="px-8 py-5 text-center font-mono text-slate-600">
                                                {value}
                                            </td>
                                        );
                                    })}
                                    <td className="px-8 py-5 text-center font-mono text-slate-500">
                                        {subject.percentage}%
                                    </td>
                                    <td className="px-8 py-5 text-center font-mono text-slate-600">
                                        {subject.totalMarks} / {subject.totalMax}
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <Badge variant={statusVariant(subject.status)}>
                                            {subject.status}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </Table>
                    )}

                    {/* Ungraded subjects — shown separately */}
                    {subjects.filter(s => s.status === 'NOT_GRADED').length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Not Yet Graded</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {subjects.filter(s => s.status === 'NOT_GRADED').map(subject => (
                                    <div key={subject.subjectId} className="flex items-center justify-between border border-dashed border-slate-200 rounded-2xl px-5 py-4 bg-white opacity-70">
                                        <p className="font-semibold text-slate-700">{subject.subjectName}</p>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-lg">Not graded</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Term filter note */}
            <p className="text-xs text-slate-400 text-center">
                Tip: To filter by term, contact your school administrator.
            </p>
        </div>
    );
};

export default StudentResults;
