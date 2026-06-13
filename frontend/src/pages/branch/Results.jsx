import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getClassResults, getClasses, getSubjects, getCurrentAcademicYear } from '../../services/api/branch.api';
import { Table, Spinner, Badge, Card } from '../../components/ui';
import { FileSearch, Users, Target, Search, Download } from 'lucide-react';

const Results = () => {
    const [searchParams] = useSearchParams();
    const [results, setResults] = useState([]);
    const [categories, setCategories] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [currentYear, setCurrentYear] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const [filters, setFilters] = useState({
        academicYearId: searchParams.get('academicYearId') || '',
        classId: searchParams.get('classId') || '',
        subjectId: searchParams.get('subjectId') || '',
        term: searchParams.get('term') || ''
    });

    useEffect(() => {
        const loadMeta = async () => {
            try {
                const [classRes, subjectRes, yearRes] = await Promise.all([
                    getClasses(),
                    getSubjects(),
                    getCurrentAcademicYear()
                ]);
                setClasses(classRes.data || []);
                setSubjects(subjectRes.data || []);
                setCurrentYear(yearRes.data || null);
                if (yearRes.data?._id) {
                    setFilters(prev => prev.academicYearId ? prev : ({ ...prev, academicYearId: yearRes.data._id }));
                }
            } catch (err) {
                console.error(err);
            }
        };
        loadMeta();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!filters.classId || !filters.subjectId || !filters.academicYearId) {
                setResults([]);
                setCategories([]);
                return;
            }
            setLoading(true);
            try {
                const resData = await getClassResults(filters);
                const payload = resData.data || resData;
                setResults(payload.rows || []);
                setCategories(payload.categories || []);
            } catch (err) {
                console.error("Fetch Results Error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filters]);

    const subjectOptions = useMemo(() => {
        if (!filters.classId) return subjects;
        return subjects;
    }, [subjects, filters.classId]);

    const handleExport = () => {
        if (results.length === 0) return;
        const headers = [
            'Student',
            'Admission Number',
            ...categories.map((category) => category.categoryName || 'Assessment'),
            'Percentage',
            'Total',
            'Status'
        ];
        const rows = results.map((row) => [
            `${row.student?.firstName || ''} ${row.student?.lastName || ''}`.trim(),
            row.student?.admissionNumber || '',
            ...(row.categoryMarks || []).map((mark) => mark.marksObtained ?? ''),
            row.percentage ?? '',
            `${row.totalMarks ?? 0}/${row.totalMax ?? 0}`,
            row.status || ''
        ]);
        const csv = [headers, ...rows]
            .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
            .join('\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'class-results.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-linear-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-xl flex items-center justify-center shadow-sm">
                        <FileSearch size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none">Result Analytics</h1>
                        <p className="text-slate-400 font-medium text-xs mt-1">Comprehensive oversight of institutional academic performance.</p>
                    </div>
                </div>
                <button
                    onClick={handleExport}
                    disabled={results.length === 0}
                    className="h-10 px-4 bg-slate-900 text-white font-semibold uppercase tracking-wider text-xs rounded-lg hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-40"
                >
                    <Download size={14} strokeWidth={2.5} />
                    Export Batch Ledger
                </button>
            </div>

            {/* Filter Terminal */}
            <Card className="p-5 border border-slate-200 shadow-sm rounded-xl bg-white flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Academic Year</label>
                    <select 
                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-[var(--primary)] transition-all appearance-none"
                        value={filters.academicYearId}
                        onChange={(e) => setFilters(prev => ({ ...prev, academicYearId: e.target.value }))}
                    >
                        <option value="">{currentYear?.name ? `Current: ${currentYear.name}` : '-- Select Year --'}</option>
                        {currentYear && <option value={currentYear._id}>{currentYear.name}</option>}
                    </select>
                </div>

                <div className="flex-1 space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Academic Scope (Filter)</label>
                    <select 
                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-[var(--primary)] transition-all appearance-none"
                        value={filters.classId}
                        onChange={(e) => setFilters(prev => ({ ...prev, classId: e.target.value }))}
                    >
                        <option value="">All Classes</option>
                        {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                </div>

                <div className="flex-1 space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</label>
                    <select 
                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-[var(--primary)] transition-all appearance-none"
                        value={filters.subjectId}
                        onChange={(e) => setFilters(prev => ({ ...prev, subjectId: e.target.value }))}
                    >
                        <option value="">Select Subject</option>
                        {subjectOptions.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                </div>

            </Card>

            {loading ? (
                <div className="flex justify-center p-10"><Spinner /></div>
            ) : (
                <Card className="p-0 border border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
                    <Table headers={['Learner', ...categories.map(c => `${c.categoryName || 'Category'} / ${c.maxScore || 100}`), 'Percentage', 'Total', 'Rank', 'Status']}>
                        {results.map(row => (
                            <tr key={row.student.id} className="group hover:bg-slate-50/50 transition-all border-b border-slate-50 last:border-0">
                                <td className="px-4 py-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 bg-slate-100 rounded-lg flex items-center justify-center font-semibold text-slate-500 text-sm group-hover:bg-[var(--primary)] group-hover:text-white transition-all">
                                            {row.student.firstName?.[0]}{row.student.lastName?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-805 tracking-tight leading-none text-sm">
                                                {row.student.firstName} {row.student.lastName}
                                            </p>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">ID: {row.student.admissionNumber}</p>
                                        </div>
                                    </div>
                                </td>
                                {row.categoryMarks.map((mark, idx) => (
                                    <td key={`${row.student.id}-${idx}`} className="px-10 py-4 text-center font-mono text-slate-600">
                                        {mark.marksObtained}
                                    </td>
                                ))}
                                <td className="px-10 py-4 text-center font-mono text-slate-500">{row.percentage}%</td>
                                <td className="px-10 py-4 text-center font-mono text-slate-600">{row.totalMarks} / {row.totalMax}</td>
                                <td className="px-10 py-4 text-center font-black text-slate-700">{row.rank || '-'}</td>
                                <td className="px-10 py-4">
                                    <div className={`px-4 py-1.5 rounded-full border-2 font-black text-[9px] uppercase tracking-[0.15em] w-fit ${
                                        row.status === 'PASS' 
                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                                        : 'bg-red-50 border-red-100 text-red-500'
                                    }`}>
                                        {row.status}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </Table>
                    {filters.classId && filters.subjectId && results.length === 0 && (
                        <div className="py-32 text-center opacity-30 flex flex-col items-center gap-6">
                            <Users size={64} className="text-slate-200" />
                            <p className="font-black text-slate-400 uppercase tracking-[0.3em] text-sm">No results for this class/subject.</p>
                        </div>
                    )}
                    {(!filters.classId || !filters.subjectId || !filters.academicYearId) && (
                        <div className="py-32 text-center opacity-30 flex flex-col items-center gap-6">
                            <Target size={64} className="text-slate-200" />
                            <p className="font-black text-slate-400 uppercase tracking-[0.3em] text-sm">Select year, class, and subject.</p>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
};

export default Results;
