import React, { useState, useEffect } from 'react';
import { Card, Table, Spinner, Select, Badge } from '../../components/ui';
import { getExams, getResultsSummary } from '../../services/api/teacher.api';
import { BarChart3, TrendingUp, Users, PieChart, Activity } from 'lucide-react';

const Reports = () => {
    const [exams, setExams] = useState([]);
    const [examId, setExamId] = useState('');
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const examsRes = await getExams();
                setExams(examsRes.data);
                if (examsRes.data.length > 0) {
                    setExamId(examsRes.data[0]._id);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (examId) {
            setFetching(true);
            getResultsSummary({ examId })
                .then(res => setSummary(res.data))
                .catch(err => console.error(err))
                .finally(() => setFetching(false));
        }
    }, [examId]);

    if (loading) return <Spinner size="lg" />;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">Performance Analytics</h1>
                    <p className="text-slate-500 font-medium">Statistical insights into branch examination performance.</p>
                </div>
                <div className="w-full md:w-72">
                    <Select 
                        label="Select Exam to Analyze" 
                        options={exams.map(e => ({ label: e.name, value: e._id }))}
                        value={examId}
                        onChange={(e) => setExamId(e.target.value)}
                    />
                </div>
            </div>

            {fetching ? <Spinner size="lg" /> : summary ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Performance Stats */}
                    <Card className="lg:col-span-1 space-y-6 flex flex-col justify-between">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><TrendingUp size={20} /></div>
                                <h3 className="font-black text-slate-800">Key Statistics</h3>
                            </div>
                            
                            <div className="space-y-4">
                                <StatRow label="Average Score" value={`${summary.averageScore}%`} />
                                <StatRow label="Pass Rate" value={summary.passRate} color="text-green-500" />
                                <StatRow label="Highest Score" value={summary.highestScore} />
                                <StatRow label="Lowest Score" value={summary.lowestScore} />
                                <StatRow label="Sample Size" value={summary.totalStudents} sub="Students" />
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-2xl p-6 text-white text-center mt-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Performance Index</p>
                            <h2 className="text-4xl font-black text-[var(--secondary)]">
                                {Number(summary.passRate?.replace('%', '')) > 70 ? 'Optimal' : 'Needs Review'}
                            </h2>
                        </div>
                    </Card>

                    {/* Chart Visualization (Placeholder representation) */}
                    <Card className="lg:col-span-2 relative overflow-hidden flex flex-col justify-center">
                        <div className="absolute top-4 left-6 flex items-center gap-2">
                             <Activity size={20} className="text-[var(--primary)]" />
                             <h3 className="font-black text-slate-800 uppercase tracking-tighter">Performance Distribution</h3>
                        </div>

                        <div className="flex items-end justify-around h-64 mt-12 px-6">
                             <Bar value={summary.averageScore} label="Class Avg" color="bg-[var(--primary)]" />
                             <Bar value={summary.highestScore} label="Peak" color="bg-[var(--secondary)]" />
                             <Bar value={60} label="Target" color="bg-slate-200" dotted />
                        </div>

                        <div className="mt-12 p-6 bg-slate-50 border-t rounded-b-xl flex items-start gap-4">
                             <PieChart className="text-slate-400 mt-1" size={24} />
                             <div>
                                 <h4 className="font-bold text-slate-700">Distribution Insights</h4>
                                 <p className="text-sm text-slate-500 leading-relaxed">
                                     The majority of students are performing within the <span className="font-bold text-slate-800">Class Average</span> range. 
                                     The pass rate of <span className="font-bold text-green-600">{summary.passRate}</span> suggests consistent teaching methodology 
                                     across this term's curriculum.
                                 </p>
                             </div>
                        </div>
                    </Card>
                </div>
            ) : (
                <div className="text-center py-40 border-2 border-dashed rounded-3xl text-slate-300">
                    <BarChart3 size={64} className="mx-auto mb-4 opacity-20" />
                    <p className="font-bold text-xl uppercase tracking-widest opacity-30">Select an exam to view analysis</p>
                </div>
            )}
        </div>
    );
};

const StatRow = ({ label, value, color = 'text-slate-800', sub }) => (
    <div className="flex items-center justify-between group">
        <span className="text-sm font-bold text-slate-400 group-hover:text-slate-600 transition-colors uppercase tracking-tight">{label}</span>
        <div className="text-right">
            <span className={`text-xl font-black ${color}`}>{value}</span>
            {sub && <p className="text-[10px] font-black text-slate-300 uppercase -mt-1">{sub}</p>}
        </div>
    </div>
);

const Bar = ({ value, label, color, dotted }) => (
    <div className="flex flex-col items-center gap-2 flex-1">
        <div className="relative w-12 h-48 bg-slate-100 rounded-full flex items-end">
            <div 
                className={`w-full rounded-full transition-all duration-1000 ${color} ${dotted ? 'opacity-30' : 'shadow-lg'}`}
                style={{ height: `${value}%` }}
            ></div>
            <span className={`absolute -top-6 left-0 right-0 text-center font-black text-xs ${dotted ? 'text-slate-400' : 'text-slate-800'}`}>
                {value}%
            </span>
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{label}</span>
    </div>
);

export default Reports;


