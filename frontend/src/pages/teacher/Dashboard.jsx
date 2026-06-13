import React, { useState, useEffect } from 'react';
import { Card, Spinner, Badge, Button } from '../../components/ui';
import { getExams, getGradingPolicy, getTeacherAssignments } from '../../services/api/teacher.api';
import { 
    BookOpen, 
    TrendingUp, 
    PlusCircle,
    FileSpreadsheet,
    ChevronRight,
    Trophy,
    Calendar,
    Users,
    Activity,
    Target,
    Layout,
    Clock,
    Award
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const [exams, setExams] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [policy, setPolicy] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [examsData, policyData, assignmentsData] = await Promise.all([
                    getExams(),
                    getGradingPolicy(),
                    getTeacherAssignments()
                ]);
                setExams(examsData.data);
                setPolicy(policyData.data || []);
                setAssignments(assignmentsData.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <Spinner size="lg" />
            <p className="text-slate-400 font-black animate-pulse uppercase tracking-widest text-xs">Syncing Teacher Portal...</p>
        </div>
    );

    // Grouping assignments by Class/Section for a better view
    const groupedAssignments = assignments.reduce((acc, curr) => {
        const key = `${curr.classId?._id}-${curr.sectionId?._id || 'no-section'}`;
        if (!acc[key]) {
            acc[key] = {
                class: curr.classId,
                section: curr.sectionId,
                subjects: []
            };
        }
        acc[key].subjects.push(curr.subjectId);
        return acc;
    }, {});

    const stats = [
        { 
            label: 'Active Exams', 
            value: exams.length, 
            icon: <BookOpen />, 
            color: 'from-[var(--primary)] to-[var(--primary-dark)]',
            bg: 'bg-[var(--primary)]/5'
        },
        { 
            label: 'Assigned Classes', 
            value: Object.keys(groupedAssignments).length, 
            icon: <Layout />, 
            color: 'from-[var(--secondary)] to-[var(--secondary)]/80',
            bg: 'bg-[var(--secondary)]/5'
        },
        { 
            label: 'Total Subjects', 
            value: assignments.length, 
            icon: <Target />, 
            color: 'from-[var(--primary)]/90 to-[var(--secondary)]/90',
            bg: 'bg-[var(--primary)]/5'
        },
        { 
            label: 'Performance', 
            value: 'Elite', 
            icon: <Award />, 
            color: 'from-[var(--secondary)] to-[var(--primary)]',
            bg: 'bg-[var(--secondary)]/5'
        },
    ];

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-fade-in pb-20">
            {/* Hero Section */}
            <div className="relative group overflow-hidden bg-[#0F172A] rounded-[3rem] p-12 text-white shadow-2xl shadow-[var(--primary)]/5 border border-white/5">
                <div className="relative z-10 flex flex-col xl:flex-row justify-between items-center gap-10">
                    <div className="space-y-6 text-center xl:text-left">
                        <div className="flex flex-wrap justify-center xl:justify-start gap-3">
                            <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-5 py-2 rounded-full font-bold">
                                Academic Year 2023/24
                            </Badge>
                            <Badge className="bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/25 px-5 py-2 rounded-full font-bold">
                                Branch: HQ Main
                            </Badge>
                        </div>
                        <div>
                            <h1 className="text-6xl font-black tracking-tight leading-[1.1]">
                                Hello, <span className="text-transparent bg-clip-text bg-linear-to-r from-[var(--primary)] to-[var(--secondary)]">Educator</span>
                            </h1>
                            <p className="text-slate-400 text-xl mt-4 font-medium max-w-2xl">
                                Your educational ecosystem is ready. Manage curriculums, evaluate progress, and inspire excellence.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link to="/teacher/results-entry">
                            <Button size="lg" className="h-16 px-10 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold text-lg shadow-xl shadow-blue-500/20 transition-all active:scale-95">
                                <PlusCircle className="mr-3" /> Result Entry
                            </Button>
                        </Link>
                        <Link to="/teacher/attendance">
                            <Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl border-white/10 hover:bg-white/5 font-bold text-lg text-white">
                                <Clock className="mr-3" /> Attendance
                            </Button>
                        </Link>
                    </div>
                </div>
                {/* Visual Flair */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--primary)]/10 rounded-full blur-[120px] -mr-64 -mt-64 group-hover:bg-[var(--primary)]/20 transition-all duration-700"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[var(--primary)]/10 rounded-full blur-[80px] -ml-32 -mb-32"></div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((stat, i) => (
                    <div key={i} className="group overflow-hidden bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`w-16 h-16 rounded-2xl ${stat.bg} flex items-center justify-center group-hover:rotate-6 transition-transform duration-500`}>
                                <div className={`text-transparent bg-clip-text bg-linear-to-br ${stat.color}`}>
                                    {React.cloneElement(stat.icon, { size: 32 })}
                                </div>
                            </div>
                            <Activity size={20} className="text-slate-100 group-hover:text-slate-200 transition-colors" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                            <p className="text-5xl font-black text-[#0F172A] tracking-tighter tabular-nums">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Main Content Areas */}
                <div className="lg:col-span-8 space-y-12">
                    {/* Assignments Header */}
                    <section className="space-y-8">
                        <div className="flex items-center justify-between px-2">
                            <div className="space-y-1">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[var(--primary)] rounded-[18px] flex items-center justify-center text-white shadow-lg shadow-[var(--primary)]/20">
                                        <Grid size={24} />
                                    </div>
                                    My Assignments
                                </h2>
                                <p className="text-slate-500 font-medium ml-16 italic">Personalized teaching schedule and subjects</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {Object.values(groupedAssignments).map((group, idx) => (
                                <Card key={idx} className="group relative border-2 border-slate-50 hover:border-[var(--primary)]/20 shadow-xl shadow-slate-200/20 p-0 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:-translate-y-2">
                                    <div className="p-10 space-y-8">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-2">
                                                <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
                                                    {group.class?.name}
                                                </h3>
                                                {group.section && (
                                                    <Badge className="bg-[var(--primary)] text-white border-0 px-4 py-1.5 rounded-full text-sm font-bold shadow-md">
                                                        Section: {group.section.name}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 group-hover:text-[var(--primary)] group-hover:bg-[var(--primary)]/10 transition-all duration-500">
                                                <Layout size={28} />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized Subjects</p>
                                            <div className="flex flex-wrap gap-2">
                                                {group.subjects.map((sub, sIdx) => (
                                                    <div key={sIdx} className="group/btn relative px-4 py-2 bg-slate-50 hover:bg-white border border-transparent hover:border-[var(--primary)]/20 rounded-xl transition-all cursor-default flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full"></span>
                                                        <span className="text-sm font-bold text-slate-700">{sub?.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-8 border-t border-slate-50 flex justify-between items-center">
                                            <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase text-[var(--primary)] tracking-widest hover:bg-[var(--primary)]/10 px-4">
                                                Resources
                                            </Button>
                                            <div className="flex gap-2">
                                                <Link to={`/teacher/attendance?classId=${group.class?._id}`}>
                                                    <Button size="sm" className="bg-slate-900 hover:bg-slate-800 rounded-xl px-5 text-xs font-bold">Attendance</Button>
                                                </Link>
                                                <Link to={`/teacher/results-entry?classId=${group.class?._id}`}>
                                                    <Button size="sm" className="bg-[var(--primary)] hover:bg-[var(--primary-dark)] rounded-xl px-5 text-xs font-bold">Grades</Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {assignments.length === 0 && (
                                <div className="col-span-2 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 py-32 text-center">
                                    <Target size={64} className="mx-auto text-slate-200 mb-6" />
                                    <h4 className="text-slate-400 font-black uppercase tracking-widest mb-2">Awaiting Assignments</h4>
                                    <p className="text-slate-400 text-sm">Contact management to link your subjects.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Latest Exams Section */}
                    <section className="space-y-8">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-[18px] flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                    <BookOpen size={24} />
                                </div>
                                Active Examinations
                            </h2>
                            <Link to="/teacher/exams">
                                <Button variant="ghost" size="sm" className="font-black text-xs uppercase tracking-widest text-blue-600 hover:bg-blue-50">Archives</Button>
                            </Link>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                            {exams.slice(0, 4).map((exam) => (
                                <Link key={exam._id} to={`/teacher/exams/${exam._id}`}>
                                    <Card className="p-0 border-0 shadow-xl shadow-slate-200/10 hover:shadow-2xl hover:shadow-slate-200/30 transition-all group overflow-hidden bg-white">
                                        <div className="flex items-center h-28">
                                            <div className="w-3 bg-blue-500 h-full group-hover:scale-y-110 transition-transform duration-500 origin-left"></div>
                                            <div className="flex-1 px-8 py-6 flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors uppercase">{exam.name || exam.examCategoryId?.name || 'Unnamed Exam'}</h3>
                                                    <div className="flex items-center gap-4">
                                                        <Badge variant="blue" className="bg-blue-50 text-blue-600 border-0 px-3 py-0.5 rounded-lg text-[10px] uppercase font-black tracking-widest">{exam.term}</Badge>
                                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                                                            <Calendar size={14} className="text-slate-300" />
                                                            {new Date(exam.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="w-14 h-14 rounded-2xl bg-slate-50 group-hover:bg-blue-600 flex items-center justify-center text-slate-300 group-hover:text-white transition-all duration-500 origin-right">
                                                    <ChevronRight size={28} />
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Sidebar Section */}
                <div className="lg:col-span-4 space-y-12">
                    {/* Grading Scale */}
                    <div className="space-y-8">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-4 px-2">
                            <div className="w-10 h-10 bg-amber-100 rounded-[14px] flex items-center justify-center text-amber-600 shadow-sm">
                                <Award size={22} />
                            </div>
                            Grading Rule
                        </h2>
                        <Card className="border-0 shadow-2xl bg-[#0F172A] p-1 text-white rounded-[2.5rem]">
                            <div className="p-8 space-y-6">
                                {[...policy].sort((a,b) => b.min - a.min).map((rule, i) => rule.min ? (
                                    <div key={i} className="group flex items-center justify-between p-4 rounded-3xl hover:bg-white/3 transition-colors border border-transparent hover:border-white/5">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Score Range</span>
                                            <span className="text-xl font-bold text-white tracking-widest">{rule.min}% - {rule.max}%</span>
                                        </div>
                                        <div className="w-16 h-16 bg-linear-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            <span className="text-3xl font-black text-white">{rule.grade}</span>
                                        </div>
                                    </div>
                                ) : null)}
                                <Link to="/teacher/grading-policy" className="block text-center text-[10px] font-black text-slate-500 hover:text-white transition-colors mt-8 uppercase tracking-[0.3em] bg-white/5 py-5 rounded-4xl hover:bg-white/10">
                                    Full Grading Schema
                                </Link>
                            </div>
                        </Card>
                    </div>

                    {/* Insights Widget */}
                    <div className="relative overflow-hidden bg-white border border-slate-100 p-10 rounded-[3rem] shadow-xl shadow-slate-200/30">
                        <div className="flex items-center gap-5 mb-8">
                            <div className="w-14 h-14 bg-[var(--primary)]/10 rounded-2xl flex items-center justify-center text-[var(--primary)] shadow-md">
                                <TrendingUp size={28} />
                            </div>
                            <h4 className="font-black text-2xl text-[#0F172A] tracking-tight">AI Analytics</h4>
                        </div>
                        <p className="text-slate-500 text-lg leading-relaxed font-medium">
                            System analysis indicates students in <span className="text-[var(--primary)] font-bold">Grade 1-A</span> require focus in <span className="text-[var(--primary)] font-bold">Reading</span>.
                        </p>
                        <hr className="my-8 border-slate-50" />
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accuracy</p>
                                <p className="text-xl font-black text-slate-800">98.2%</p>
                            </div>
                            <Button variant="ghost" className="rounded-xl font-black text-[var(--primary)] uppercase text-xs tracking-widest">Detail</Button>
                        </div>
                        {/* Decorative */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/10 rounded-full blur-2xl -mr-16 -mt-16 opacity-50"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Simple internal helper for grid icon if missing from imports
const Grid = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
);

export default Dashboard;
