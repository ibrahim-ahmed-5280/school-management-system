import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Spinner, Badge } from '../../components/ui';
import { getGradingPolicy } from '../../services/api/teacher.api';
import {
    AlertCircle,
    Award,
    CheckCircle2,
    FileSpreadsheet,
    Info,
    Lock
} from 'lucide-react';

const asArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
};

const gradeVariant = (grade) => {
    const normalized = String(grade || '').toUpperCase();
    if (normalized === 'A') return 'success';
    if (normalized === 'F') return 'danger';
    if (normalized === 'B') return 'primary';
    return 'default';
};

const GradingPolicy = () => {
    const [policy, setPolicy] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getGradingPolicy()
            .then((res) => setPolicy(asArray(res)))
            .catch(() => setPolicy([]))
            .finally(() => setLoading(false));
    }, []);

    const sortedPolicy = useMemo(() => (
        [...policy].sort((a, b) => Number(b.min || 0) - Number(a.min || 0))
    ), [policy]);

    const passingRules = sortedPolicy.filter((rule) => String(rule.grade || '').toUpperCase() !== 'F');
    const lowestPassingRule = passingRules[passingRules.length - 1];
    const topGrade = sortedPolicy[0];

    if (loading) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
                <Spinner size="lg" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading grading policy...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                            <FileSpreadsheet size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-900">Grading Policy</h1>
                            <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                                Read-only branch grading scale used when the system calculates result grades.
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className="w-fit gap-1.5 rounded-lg">
                        <Lock size={13} />
                        Teacher read-only
                    </Badge>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card className="shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Rules</p>
                            <p className="mt-2 text-2xl font-black text-slate-900">{sortedPolicy.length}</p>
                        </div>
                        <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                            <Award size={22} />
                        </div>
                    </div>
                </Card>
                <Card className="shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Top Grade</p>
                            <p className="mt-2 text-2xl font-black text-slate-900">{topGrade?.grade || '-'}</p>
                        </div>
                        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                            <CheckCircle2 size={22} />
                        </div>
                    </div>
                </Card>
                <Card className="shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Pass Mark</p>
                            <p className="mt-2 text-2xl font-black text-slate-900">
                                {lowestPassingRule ? `${lowestPassingRule.min}%` : '-'}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                            <AlertCircle size={22} />
                        </div>
                    </div>
                </Card>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <Card title="Current Grading Scale" className="shadow-sm xl:col-span-2">
                    {sortedPolicy.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                            <FileSpreadsheet size={38} className="mx-auto mb-3 text-slate-300" />
                            <p className="font-bold text-slate-700">No grading scale configured</p>
                            <p className="mt-1 text-sm text-slate-500">Ask the school super admin to configure grade thresholds.</p>
                        </div>
                    ) : (
                        <Table headers={['Grade', 'Percentage Range', 'Status']}>
                            {sortedPolicy.map((rule, index) => (
                                <tr key={`${rule.grade}-${index}`} className="hover:bg-slate-50/70">
                                    <td className="px-4 py-4">
                                        <Badge variant={gradeVariant(rule.grade)} className="min-w-12 justify-center rounded-lg text-sm">
                                            {rule.grade}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-4 font-black text-slate-800">
                                        {rule.min}% - {rule.max}%
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600">
                                            <CheckCircle2 size={14} />
                                            Active
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </Table>
                    )}
                </Card>

                <div className="space-y-6">
                    <Card title="How It Works" className="shadow-sm">
                        <div className="space-y-4 text-sm font-medium leading-6 text-slate-600">
                            <div className="flex gap-3">
                                <Info size={18} className="mt-1 shrink-0 text-[var(--primary)]" />
                                <p>Teachers enter scores. The backend applies this grading policy during result calculation.</p>
                            </div>
                            <div className="flex gap-3">
                                <Lock size={18} className="mt-1 shrink-0 text-[var(--primary)]" />
                                <p>Teachers cannot edit thresholds. School super admins manage these rules for consistency.</p>
                            </div>
                            <div className="flex gap-3">
                                <CheckCircle2 size={18} className="mt-1 shrink-0 text-[var(--primary)]" />
                                <p>Every published result uses the same scale, so reports stay consistent across classes.</p>
                            </div>
                        </div>
                    </Card>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                        <div className="flex gap-3">
                            <AlertCircle size={20} className="mt-0.5 shrink-0 text-amber-600" />
                            <div>
                                <h3 className="font-black text-amber-900">Need a change?</h3>
                                <p className="mt-1 text-sm font-medium leading-6 text-amber-800">
                                    Contact the school super admin before entering final results if the grading thresholds look incorrect.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default GradingPolicy;
