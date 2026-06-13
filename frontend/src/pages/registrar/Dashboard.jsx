import React, { useEffect, useState } from 'react';
import { getStudents, getCurrentAcademicYear } from '../../services/api/registrar.api';
import { Card, Spinner } from '../../components/ui';
import { Users, BookOpen, UserPlus, Clock } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({ totalStudents: 0, activeStudents: 0, inactiveStudents: 0 });
    const [currentYear, setCurrentYear] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            try {
                const yearRes = await getCurrentAcademicYear();
                setCurrentYear(yearRes.data);

                // Fetch students to count (a real backend might have a stats endpoint)
                const studentsRes = await getStudents({});
                const students = studentsRes.data.data || [];
                
                setStats({
                    totalStudents: students.length,
                    activeStudents: students.filter(s => s.status === 'Active').length,
                    inactiveStudents: students.filter(s => s.status !== 'Active').length
                });

            } catch (err) {
                console.error("Dashboard Load Error", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    if (loading) return <Spinner size="lg" />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Registrar Dashboard</h1>
                <div className="bg-white px-4 py-2 rounded-lg border text-sm">
                    Academic Year: <span className="font-bold text-[var(--primary)]">{currentYear?.data?.name || '...'}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <StatsCard 
                    title="Total Students" 
                    value={stats.totalStudents}
                    icon={Users}
                    color="text-blue-600"
                    bg="bg-blue-50"
                 />
                 <StatsCard 
                    title="Active Enrollments" 
                    value={stats.activeStudents}
                    icon={BookOpen}
                    color="text-green-600"
                    bg="bg-green-50"
                 />
                 <StatsCard 
                    title="Inactive / Graduated" 
                    value={stats.inactiveStudents}
                    icon={Clock}
                    color="text-gray-600"
                    bg="bg-gray-50"
                 />
            </div>

            <div className="flex gap-4">
                <Card className="flex-1 p-6 flex flex-col justify-center items-center text-center hover:shadow-lg transition cursor-pointer" onClick={() => window.location.href='/registrar/admissions'}>
                    <div className="h-12 w-12 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full flex items-center justify-center mb-3">
                        <UserPlus size={24} />
                    </div>
                    <h3 className="font-bold text-lg">New Admission</h3>
                    <p className="text-sm text-slate-500">Register new student</p>
                </Card>
                {/* More quick actions can go here */}
            </div>
        </div>
    );
};

const StatsCard = ({ title, value, icon, color, bg }) => (
    <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-between">
        <div>
            <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
        <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${bg} ${color}`}>
            {React.createElement(icon, { size: 24 })}
        </div>
    </div>
);

export default Dashboard;


