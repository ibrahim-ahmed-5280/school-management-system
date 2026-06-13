import React, { useEffect, useMemo, useState } from 'react';
import { Search, Trophy, Users } from 'lucide-react';
import { Card, Table, Badge, Button, Spinner, Input, Select } from '../../components/ui';
import { getClasses, getCurrentAcademicYear, getStudents, getStudentResults } from '../../services/api/branch.api';

const StudentResults = () => {
    const [classes, setClasses] = useState([]);
    const [currentYear, setCurrentYear] = useState(null);
    const [filters, setFilters] = useState({
        academicYearId: '',
        classId: '',
        q: ''
    });
    const [students, setStudents] = useState([]);
    const [resultData, setResultData] = useState(null);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [loadingResults, setLoadingResults] = useState(false);

    useEffect(() => {
        const loadMeta = async () => {
            try {
                const [classRes, yearRes] = await Promise.all([
                    getClasses(),
                    getCurrentAcademicYear()
                ]);
                setClasses(classRes.data || []);
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

    const classOptions = useMemo(() => (
        classes.map(c => ({ value: c._id, label: c.name }))
    ), [classes]);

    const handleSearch = async () => {
        if (!filters.q?.trim()) {
            setStudents([]);
            setResultData(null);
            return;
        }
        setLoadingSearch(true);
        setResultData(null);
        try {
            const payload = await getStudents({
                q: filters.q,
                classId: filters.classId,
                academicYearId: filters.academicYearId
            });
            setStudents(payload.data || []);
        } catch (err) {
            console.error('Search students failed', err);
        } finally {
            setLoadingSearch(false);
        }
    };

    const handleViewResults = async (student) => {
        setLoadingResults(true);
        try {
            const payload = await getStudentResults({
                studentId: student._id,
                academicYearId: filters.academicYearId
            });
            setResultData(payload.data || payload);
        } catch (err) {
            console.error('Load student results failed', err);
        } finally {
            setLoadingResults(false);
        }
    };

    const categories = resultData?.categories || [];
    const subjects = resultData?.subjects || [];
    const overall = resultData?.overall;
    const rank = resultData?.rank;
    const enrollment = resultData?.enrollment;
    const studentInfo = resultData?.student;

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-16">
            <div className="flex items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Student Results Search</h1>
                    <p className="text-slate-500 text-sm mt-1">Search a student to view subject results, totals, and class rank.</p>
                </div>
            </div>

            <Card className="p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-end">
                    <Select
                        label="Academic Year"
                        value={filters.academicYearId}
                        onChange={(e) => setFilters(prev => ({ ...prev, academicYearId: e.target.value }))}
                        options={currentYear ? [{ value: currentYear._id, label: currentYear.name }] : []}
                        placeholder={currentYear?.name ? `Current: ${currentYear.name}` : 'Select Academic Year'}
                    />
                    <Select
                        label="Class (Optional)"
                        value={filters.classId}
                        onChange={(e) => setFilters(prev => ({ ...prev, classId: e.target.value }))}
                        options={classOptions}
                        placeholder="All Classes"
                    />
                    <Input
                        label="Search Student"
                        placeholder="Name, admission number, or code"
                        value={filters.q}
                        onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))}
                        icon={<Search size={18} />}
                    />
                    <Button className="h-[46px]" onClick={handleSearch} disabled={loadingSearch}>
                        {loadingSearch ? 'Searching...' : 'Search'}
                    </Button>
                </div>
            </Card>

            <Card title="Search Results" className="p-0">
                {loadingSearch ? (
                    <Spinner />
                ) : (
                    <Table headers={['Student', 'Admission No.', 'Action']}>
                        {students.map(std => (
                            <tr key={std._id} className="hover:bg-slate-50">
                                <td className="px-8 py-4 font-medium">{std.firstName} {std.lastName}</td>
                                <td className="px-8 py-4 font-mono text-xs">{std.admissionNumber}</td>
                                <td className="px-8 py-4">
                                    <Button size="sm" variant="outline" onClick={() => handleViewResults(std)}>
                                        View Results
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {students.length === 0 && (
                            <tr>
                                <td colSpan="3" className="text-center py-10 text-slate-400">
                                    Search for a student to see results.
                                </td>
                            </tr>
                        )}
                    </Table>
                )}
            </Card>

            <Card className="p-6">
                {loadingResults ? (
                    <Spinner />
                ) : resultData ? (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">
                                    {studentInfo?.firstName} {studentInfo?.lastName}
                                </h2>
                                <p className="text-slate-500 text-sm mt-1">
                                    Admission No: {studentInfo?.admissionNumber || '--'} • Class: {enrollment?.className || '--'}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant={overall?.overallStatus === 'PASS' ? 'success' : 'danger'}>
                                    {overall?.overallStatus || 'N/A'}
                                </Badge>
                                <div className="text-sm text-slate-500 flex items-center gap-2">
                                    <Trophy size={16} /> Rank {rank?.rank || '--'} / {rank?.classSize || 0}
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            <Card className="p-4">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Marks</p>
                                <p className="text-2xl font-black text-slate-900 mt-2">
                                    {overall?.totalMarks || 0} / {overall?.totalMax || 0}
                                </p>
                            </Card>
                            <Card className="p-4">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Pass Threshold</p>
                                <p className="text-2xl font-black text-slate-900 mt-2">
                                    {overall?.overallPassMark || 0}
                                </p>
                            </Card>
                            <Card className="p-4">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Academic Year</p>
                                <p className="text-2xl font-black text-slate-900 mt-2">
                                    {enrollment?.academicYearName || '--'}
                                </p>
                            </Card>
                        </div>

                        <Table headers={['Subject', ...categories.map(c => `${c.categoryName} / ${c.maxScore}`), 'Percentage', 'Total', 'Status']}>
                            {subjects.map(subject => (
                                <tr key={subject.subjectId} className="hover:bg-slate-50">
                                    <td className="px-8 py-4 font-medium">{subject.subjectName}</td>
                                    {subject.categoryMarks.map((mark, idx) => (
                                        <td key={`${subject.subjectId}-${idx}`} className="px-8 py-4 text-center font-mono">
                                            {mark.marksObtained === null ? '-' : mark.marksObtained}
                                        </td>
                                    ))}
                                    <td className="px-8 py-4 text-center font-mono text-slate-500">{subject.percentage}%</td>
                                    <td className="px-8 py-4 text-center font-mono text-slate-600">{subject.totalMarks} / {subject.totalMax}</td>
                                    <td className="px-8 py-4">
                                        <Badge variant={subject.status === 'PASS' ? 'success' : 'danger'}>
                                            {subject.status}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                            {subjects.length === 0 && (
                                <tr>
                                    <td colSpan={categories.length + 4} className="text-center py-10 text-slate-400">
                                        No subject results found for this student.
                                    </td>
                                </tr>
                            )}
                        </Table>
                    </div>
                ) : (
                    <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-3">
                        <Users size={32} />
                        <p>Select a student to view results.</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default StudentResults;
