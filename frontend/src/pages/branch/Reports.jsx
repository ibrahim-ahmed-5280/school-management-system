import React, { useEffect, useState } from 'react';
import { getBranchOverview, getCurrentAcademicYear } from '../../services/api/branch.api';
import { Card, Spinner } from '../../components/ui';
import { DollarSign, Users } from 'lucide-react';

const Reports = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [academicYear, setAcademicYear] = useState(null);

    useEffect(() => {
        const init = async () => {
            try {
                const yearRes = await getCurrentAcademicYear();
                setAcademicYear(yearRes.data);
                
                const dataRes = await getBranchOverview(yearRes.data?._id);
                setStats(dataRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    if (loading) return <Spinner />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Analytic Reports</h1>
                <div className="text-sm text-slate-500 bg-white px-3 py-1 rounded border">
                    Year: {academicYear?.name || '-'}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ReportCard title="Student Population" icon={Users}>
                    <div className="flex items-end justify-between mt-4">
                        <div>
                            <p className="text-3xl font-bold text-slate-800">{stats?.students?.totalActive}</p>
                            <p className="text-sm text-slate-500">Active Students</p>
                        </div>
                        <div className="text-right">
                             <p className="text-2xl font-bold text-blue-600">{stats?.students?.enrolledCurrentYear}</p>
                             <p className="text-sm text-slate-500">Current Enrollments</p>
                        </div>
                    </div>
                </ReportCard>

                <ReportCard title="Financial Summary" icon={DollarSign}>
                    <div className="space-y-4 mt-2">
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-slate-600">Total Invoiced</span>
                            <span className="font-bold text-slate-800">${stats?.finance?.totalInvoiced?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-slate-600">Total Collected</span>
                            <span className="font-bold text-green-600">${stats?.finance?.totalCollected?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Outstanding</span>
                            <span className="font-bold text-red-500">
                                ${( (stats?.finance?.totalInvoiced || 0) - (stats?.finance?.totalCollected || 0) ).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </ReportCard>
            </div>
        </div>
    );
};

const ReportCard = ({ title, icon, children }) => (
    <div className="bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3 mb-4 border-b pb-4">
            <div className="bg-slate-100 p-2 rounded-lg">
                {React.createElement(icon, { size: 20, className: 'text-slate-600' })}
            </div>
            <h3 className="font-semibold text-slate-800">{title}</h3>
        </div>
        {children}
    </div>
);

export default Reports;
