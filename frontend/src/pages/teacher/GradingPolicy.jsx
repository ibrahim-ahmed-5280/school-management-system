import React, { useState, useEffect } from 'react';
import { Card, Table, Spinner, Badge } from '../../components/ui';
import { getGradingPolicy } from '../../services/api/teacher.api';
import { FileSpreadsheet, Info, CheckCircle2, AlertCircle } from 'lucide-react';

const GradingPolicy = () => {
    const [policy, setPolicy] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getGradingPolicy().then(res => {
            setPolicy(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <Spinner size="lg" />;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-2xl text-green-600">
                    <FileSpreadsheet size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Grading Policy</h1>
                    <p className="text-slate-500 font-medium">Official branch policy for automated grade assignment.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Scale Display */}
                <div className="md:col-span-2 space-y-6">
                    <Card title="Current Grading Scale" className="border-none shadow-sm overflow-hidden">
                        <Table headers={['Rank / Grade', 'Percentage Range', 'Status']}>
                            {[...policy].sort((a,b) => b.min - a.min).map((rule, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <Badge 
                                            variant={rule.grade === 'A' ? 'success' : rule.grade === 'F' ? 'danger' : 'primary'}
                                            className="text-lg px-4 py-1"
                                        >
                                            {rule.grade}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 font-black text-slate-700 text-lg">
                                        {rule.min}% - {rule.max}%
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            <CheckCircle2 size={14} className="text-green-500" />
                                            Active
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </Table>
                    </Card>

                    <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex items-start gap-4">
                        <Info className="text-blue-500 mt-1" size={24} />
                        <div>
                            <h4 className="font-bold text-blue-800">About Automated Grading</h4>
                            <p className="text-sm text-blue-600 font-medium leading-relaxed">
                                Grades are computed by taking the total score across all subjects and dividing by 
                                the maximum possible score (total subjects × 100). The resulting percentage is then 
                                mapped to the scale above.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-[2rem] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                        
                        <h3 className="text-xl font-black italic tracking-tighter">Branch Standards</h3>
                        
                        <div className="space-y-4">
                            <InfoItem title="Immutable Policy" desc="Teachers have read-only access. Only Branch Admins can modify these thresholds." />
                            <InfoItem title="System Logic" desc="Calculations are performed server-side for maximum result integrity." />
                            <InfoItem title="Audit Ready" desc="Every result generated follows this exact scale for compliance." />
                        </div>
                    </div>

                    <div className="p-8 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center text-center space-y-4">
                        <div className="p-2 bg-amber-50 rounded-xl text-amber-500">
                            <AlertCircle size={32} />
                        </div>
                        <h4 className="font-bold text-slate-700">Need an Adjustment?</h4>
                        <p className="text-sm text-slate-400 font-medium">
                            If you believe the grading thresholds need revision, please contact your Branch Administrator.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InfoItem = ({ title, desc }) => (
    <div className="space-y-1">
        <p className="text-xs font-black uppercase tracking-widest text-[var(--secondary)]">{title}</p>
        <p className="text-sm text-slate-400 font-medium">{desc}</p>
    </div>
);

export default GradingPolicy;


