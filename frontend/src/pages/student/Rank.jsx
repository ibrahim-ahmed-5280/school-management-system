import React, { useEffect, useState } from 'react';
import { Card, Badge, Spinner } from '../../components/ui';
import { apiGetStudentRank } from '../../services/api/student.api';
import { Trophy } from 'lucide-react';

const StudentRank = () => {
    const [loading, setLoading] = useState(true);
    const [rankData, setRankData] = useState(null);

    useEffect(() => {
        const fetchRank = async () => {
            try {
                const res = await apiGetStudentRank();
                setRankData(res.data || res);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchRank();
    }, []);

    if (loading) return <div className="h-64 flex items-center justify-center"><Spinner size="lg" /></div>;

    if (!rankData) return null;

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Class Rank</h1>
                <p className="text-slate-500 font-medium">Your standing among classmates</p>
            </div>

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
        </div>
    );
};

export default StudentRank;
