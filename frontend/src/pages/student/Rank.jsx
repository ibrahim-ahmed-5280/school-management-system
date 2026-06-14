import React, { useEffect, useState } from 'react';
import { Card, Badge, Spinner } from '../../components/ui';
import { apiGetStudentRank, apiGetStudentAcademicYears } from '../../services/api/student.api';
import { Trophy, AlertCircle } from 'lucide-react';

const StudentRank = () => {
    const [loading, setLoading] = useState(true);
    const [rankData, setRankData] = useState(null);
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYearId, setSelectedYearId] = useState('');
    const [error, setError] = useState('');

    // Load academic years on mount
    useEffect(() => {
        const fetchYears = async () => {
            try {
                const yearsRes = await apiGetStudentAcademicYears();
                const yearsPayload = yearsRes.data || yearsRes || [];
                setAcademicYears(yearsPayload);
                if (yearsPayload.length) {
                    const current = yearsPayload.find(y => y.isCurrent);
                    setSelectedYearId((current || yearsPayload[0])._id);
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load academic years.');
                setLoading(false);
            }
        };
        fetchYears();
    }, []);

    // Fetch rank when year changes
    useEffect(() => {
        if (!selectedYearId) return;
        const fetchRank = async () => {
            try {
                setLoading(true);
                setError('');
                const res = await apiGetStudentRank({ schoolYearId: selectedYearId });
                setRankData(res.data || res);
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.message || 'Failed to load rank. Please try again.');
                setRankData(null);
            } finally {
                setLoading(false);
            }
        };
        fetchRank();
    }, [selectedYearId]);

    if (loading) return <div className="h-64 flex items-center justify-center"><Spinner size="lg" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Class Rank</h1>
                    <p className="text-slate-500 font-medium">Your standing among classmates</p>
                </div>
                {academicYears.length > 0 && (
                    <div className="max-w-xs w-full">
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
                </div>
            )}

            {/* No rank data */}
            {!error && !rankData && (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <Trophy size={48} className="mx-auto text-slate-200 mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">Rank Not Available</h3>
                    <p className="text-slate-400">Ranking will appear once results are entered for this academic year.</p>
                </div>
            )}

            {/* Rank card */}
            {!error && rankData && (
                <Card className="border-none shadow-xl">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                            <Trophy size={28} />
                        </div>
                        <div>
                            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Rank</p>
                            <h3 className="text-3xl font-black text-slate-800">
                                {rankData.rank || '—'} <span className="text-slate-400 text-sm">/ {rankData.classSize}</span>
                            </h3>
                            <div className="mt-2 flex items-center gap-3">
                                <Badge variant={rankData.overallStatus === 'PASS' ? 'success' : 'danger'}>
                                    {rankData.overallStatus}
                                </Badge>
                                <span className="text-slate-500 text-sm font-medium">Total Marks: {rankData.totalMarks}</span>
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default StudentRank;
