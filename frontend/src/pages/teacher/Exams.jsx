import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExams, getTeacherAssignments } from '../../services/api/teacher.api';
import { Card, Select, Button, Table, Badge, Spinner } from '../../components/ui';
import { Search, Filter, PenTool, Eye } from 'lucide-react';

const Exams = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [exams, setExams] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);

    const [filters, setFilters] = useState({
        classId: '',
        subjectId: '',
        schoolYearId: '',
        term: ''
    });

    const [classOptions, setClassOptions] = useState([]);
    const [subjectOptions, setSubjectOptions] = useState([]);
    const [yearOptions, setYearOptions] = useState([]);

    useEffect(() => {
        const loadAssignments = async () => {
            try {
                const assignmentData = await getTeacherAssignments();

                const classes = [...new Map(assignmentData.map(item => [item.classId._id, item.classId])).values()];
                const subjects = [...new Map(assignmentData.map(item => [item.subjectId._id, item.subjectId])).values()];
                const years = [...new Map(assignmentData.map(item => [item.academicYearId?._id, item.academicYearId]).filter(x => x[0])).values()];

                setClassOptions(classes.map(c => ({ value: c._id, label: `${c.name} (${c.gradeLevel})` })));
                setSubjectOptions(subjects.map(s => ({ value: s._id, label: `${s.name} (${s.code})` })));
                setYearOptions(years.map(y => ({ value: y._id, label: y.name })));
            } catch (error) {
                console.error('Failed to load assignments:', error);
            }
        };
        loadAssignments();
    }, []);

    useEffect(() => {
        const fetchExams = async () => {
            setLoading(true);
            try {
                const data = await getExams(filters);
                setExams(data.data || []);
            } catch (error) {
                console.error('Failed to fetch exams:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchExams();
    }, [filters, refreshKey]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const statusVariant = (status) => {
        switch (status) {
            case 'OPEN':
                return 'success';
            case 'CLOSED':
                return 'default';
            default:
                return 'warning';
        }
    };

    const formatStatus = (status) => status ? status.charAt(0) + status.slice(1).toLowerCase() : 'Draft';

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Exams</h1>
                    <p className="text-slate-500 font-medium">Assigned exams created by Branch Admin</p>
                </div>
            </div>

            <Card className="border-l-4 border-l-blue-500">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <Select 
                        label="Academic Year"
                        options={yearOptions}
                        value={filters.schoolYearId}
                        onChange={(e) => handleFilterChange('schoolYearId', e.target.value)}
                        placeholder="All Years"
                    />
                    <Select 
                        label="Class"
                        options={classOptions}
                        value={filters.classId}
                        onChange={(e) => handleFilterChange('classId', e.target.value)}
                        placeholder="All Classes"
                    />
                    <Select 
                        label="Subject"
                        options={subjectOptions}
                        value={filters.subjectId}
                        onChange={(e) => handleFilterChange('subjectId', e.target.value)}
                        placeholder="All Subjects"
                    />
                    <div className="flex gap-2">
                        <Button variant="outline" className="w-full" onClick={() => setRefreshKey(prev => prev + 1)}>
                            <Search size={18} /> Filter
                        </Button>
                    </div>
                </div>
            </Card>

            {loading ? (
                <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 flex justify-center">
                    <Spinner size="lg" />
                </div>
            ) : exams.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <Filter size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">No Exams Found</h3>
                    <p className="text-slate-500">Try adjusting filters or wait for admin to publish exams.</p>
                </div>
            ) : (
                <Table headers={['Category', 'Template (Max)', 'Subject', 'Class', 'Year', 'Term', 'Status', 'Action']}>
                    {exams.map((exam) => {
                        const status = exam.status || 'DRAFT';
                        const canEnter = status === 'OPEN' && exam.canEnter !== false;
                        const disabledReason = status !== 'OPEN' ? 'Closed' : 'Not assigned';

                        return (
                            <tr key={exam._id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="px-8 py-5 font-semibold text-slate-700">{exam.examCategoryId?.name || '—'}</td>
                                <td className="px-8 py-5 text-slate-600">
                                    <div className="font-semibold">{exam.examTemplateId?.name || 'Standard'}</div>
                                    <div className="text-xs text-slate-400">{exam.maxScore ?? exam.examTemplateId?.maxScore ?? '—'}</div>
                                </td>
                                <td className="px-8 py-5 text-slate-600">{exam.subjectId?.name || '—'}</td>
                                <td className="px-8 py-5 text-slate-600">{exam.classId?.name || '—'}</td>
                                <td className="px-8 py-5 text-slate-600">{exam.academicYearId?.name || '—'}</td>
                                <td className="px-8 py-5 text-slate-600">{exam.termId?.name || '—'}</td>
                                <td className="px-8 py-5">
                                    <Badge variant={statusVariant(status)}>{formatStatus(status)}</Badge>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            variant="primary" 
                                            size="sm"
                                            onClick={() => navigate(`/teacher/results-entry/${exam._id}`)}
                                            disabled={!canEnter}
                                            title={canEnter ? '' : disabledReason}
                                        >
                                            <PenTool size={16} /> Enter Results
                                        </Button>
                                        {!canEnter && (
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => navigate(`/teacher/results?examId=${exam._id}`)}
                                            >
                                                <Eye size={16} /> View Results
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </Table>
            )}
        </div>
    );
};

export default Exams;
