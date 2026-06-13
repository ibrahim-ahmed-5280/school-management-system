import React, { useState, useEffect, useMemo } from 'react';
import { apiGetStudentAcademicYears, apiGetStudentResultsBy } from '../../services/api/student.api';
import { Card, Spinner, Badge, Table } from '../../components/ui';
import { FileText } from 'lucide-react';

const StudentResults = () => {
    const [loading, setLoading] = useState(true);
    const [subjects, setSubjects] = useState([]);
    const [overall, setOverall] = useState(null);
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYearId, setSelectedYearId] = useState('');

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
            } catch (error) {
                console.error(error);
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
                const data = await apiGetStudentResultsBy({ schoolYearId: selectedYearId });
                const payload = data.data || data;
                setSubjects(payload.subjects || []);
                setOverall(payload.overall || null);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [selectedYearId]);

    const categoryHeaders = useMemo(() => {
        const map = new Map();
        subjects.forEach(subject => {
            (subject.categories || []).forEach(cat => {
                if (!map.has(cat.categoryId?.toString() || cat.categoryName)) {
                    map.set(cat.categoryId?.toString() || cat.categoryName, {
                        id: cat.categoryId?.toString() || cat.categoryName,
                        name: cat.categoryName || 'Category',
                        maxScore: cat.maxScore || 0
                    });
                }
            });
        });
        return Array.from(map.values());
    }, [subjects]);

    if (loading) return <div className="h-64 flex items-center justify-center"><Spinner size="lg" /></div>;

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Results</h1>
                <p className="text-slate-500 font-medium">Subject-wise performance summary</p>
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
            </div>

            {subjects.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <FileText size={48} className="mx-auto text-slate-200 mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">No Results Yet</h3>
                    <p className="text-slate-400">Your results will appear here after grading.</p>
                </div>
            ) : (
                <>
                    <Card className="border-none shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-xs uppercase font-bold tracking-widest">Total</p>
                                <h3 className="text-2xl font-black text-slate-800">
                                    {overall?.totalMarks ?? 0} / {overall?.totalMax ?? 0}
                                </h3>
                            </div>
                            <Badge variant={overall?.overallStatus === 'PASS' ? 'success' : 'danger'}>
                                {overall?.overallStatus || '—'}
                            </Badge>
                        </div>
                    </Card>

                    <Table 
                        headers={[
                            'Subject',
                            ...categoryHeaders.map(h => `${h.name} / ${h.maxScore}`),
                            'Percentage',
                            'Total',
                            'Grade'
                        ]}
                    >
                        {subjects.map((subject) => (
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
                                    <Badge variant={subject.status === 'PASS' ? 'success' : 'danger'}>
                                        {subject.status}
                                    </Badge>
                                </td>
                            </tr>
                        ))}
                    </Table>
                </>
            )}
        </div>
    );
};

export default StudentResults;
