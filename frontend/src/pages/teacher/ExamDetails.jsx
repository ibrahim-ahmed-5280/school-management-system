import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Table, Button, Spinner, Badge, Toast } from '../../components/ui';
import { getExam, getResults, getResultsSummary } from '../../services/api/teacher.api';
import { 
    Users, 
    Plus, 
    ArrowLeft,
    TrendingUp,
    Award
} from 'lucide-react';

const ExamDetails = () => {
    const { examId } = useParams();
    const [exam, setExam] = useState(null);
    const [results, setResults] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [examRes, resultsRes, summaryRes] = await Promise.all([
                    getExam(examId),
                    getResults({ examId }),
                    getResultsSummary({ examId })
                ]);
                setExam(examRes.data);
                setResults(resultsRes.data);
                setSummary(summaryRes.data);
            } catch {
                setToast('Failed to load exam details');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [examId]);

    if (loading) return <Spinner size="lg" />;
    if (!exam) return <div className="text-center py-20 font-bold text-slate-400">Exam not found.</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/teacher/exams" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <ArrowLeft size={24} className="text-slate-400" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800">{exam.name}</h1>
                        <p className="text-slate-500 font-semibold">
                            {exam.termId?.name || (typeof exam.termId === 'string' ? exam.termId : '') || exam.term || "Term not specified"} • Class: {exam.classId?.name || (typeof exam.classId === 'string' ? exam.classId : '') || exam.className || "Class not specified"}
                        </p>
                    </div>
                </div>
                <Link to={`/teacher/results/entry?examId=${examId}`}>
                    <Button className="flex items-center gap-2 px-8 shadow-lg shadow-[var(--primary)]/30">
                        <Plus size={20} />
                        Add Result
                    </Button>
                </Link>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="bg-[var(--primary)] text-white border-none shadow-xl">
                        <p className="text-xs font-bold uppercase tracking-wider opacity-80">Avg Score</p>
                        <h3 className="text-3xl font-black mt-1">{summary.averageScore}%</h3>
                        <div className="mt-4 flex items-center gap-1 text-xs opacity-90">
                            <TrendingUp size={14} /> <span>Branch Average</span>
                        </div>
                    </Card>
                    <Card className="bg-slate-900 text-white border-none shadow-xl">
                        <p className="text-xs font-bold uppercase tracking-wider opacity-80">Pass Rate</p>
                        <h3 className="text-3xl font-black mt-1 text-[var(--secondary)]">{summary.passRate}</h3>
                        <div className="mt-4 flex items-center gap-1 text-xs opacity-70">
                            <Award size={14} /> <span>Successful Students</span>
                        </div>
                    </Card>
                    <Card>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Entries</p>
                        <h3 className="text-3xl font-black mt-1 text-slate-800">{summary.totalStudents}</h3>
                        <div className="mt-4 flex items-center gap-1 text-xs text-slate-500">
                            <Users size={14} /> <span>Students Graded</span>
                        </div>
                    </Card>
                    <Card>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</p>
                        <h3 className="text-3xl font-black mt-1 flex items-center gap-2">
                             <Badge variant={exam.status === 'OPEN' ? 'success' : 'warning'} className="text-lg px-4">{exam.status || 'Active'}</Badge>
                        </h3>
                        <div className="mt-4 flex items-center gap-1 text-xs text-slate-500 font-medium italic">
                            {exam.status === 'OPEN' ? 'Accepting results' : 'Results locked'}
                        </div>
                    </Card>
                </div>
            )}

            {/* Results Table */}
            <Card title="Student Performance List" className="border-none shadow-sm overflow-hidden">
                <Table headers={['Student', 'Admission #', 'Score (Max)', 'Grade/Status', 'Action']}>
                    {results.map((res) => (
                        <tr key={res._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-800">
                                {res.studentId?.firstName} {res.studentId?.lastName}
                            </td>
                            <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">
                                {res.studentId?.admissionNumber}
                            </td>
                            <td className="px-6 py-4 font-black text-[var(--primary)]">
                                {res.marksObtained ?? 0} / {res.maxScore ?? exam.maxScore ?? '—'} ({res.percentage ?? 0}%)
                            </td>
                            <td className="px-6 py-4">
                                <Badge 
                                    variant={res.status === 'PASS' || res.grade === 'A' || res.grade === 'B' ? 'success' : (res.status === 'FAIL' || res.grade === 'F' ? 'danger' : 'warning')}
                                >
                                    {res.grade || res.status || '—'}
                                </Badge>
                            </td>
                            <td className="px-6 py-4">
                                <Link to={`/teacher/results/entry?edit=${res._id}`}>
                                    <Button variant="ghost" size="sm" className="font-bold">Edit Scores</Button>
                                </Link>
                            </td>
                        </tr>
                    ))}
                    {results.length === 0 && (
                        <tr>
                            <td colSpan="5" className="px-6 py-10 text-center text-slate-400 italic">
                                No results recorded for this exam yet.
                            </td>
                        </tr>
                    )}
                </Table>
            </Card>

            {toast && <Toast message={toast} onClose={() => setToast('')} />}
        </div>
    );
};

export default ExamDetails;
