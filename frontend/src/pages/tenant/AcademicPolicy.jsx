import React, { useEffect, useMemo, useState } from 'react';
import { Award, CalendarDays, GraduationCap, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import tenantService from '../../services/tenantService';

const EMPTY_TERM = { name: '', sequence: 1, startDate: '', endDate: '' };

const AcademicPolicy = () => {
    const [policy, setPolicy] = useState({ name: '', finalGradeLevel: '12', graduationRequiresPass: true, rules: [] });
    const [years, setYears] = useState([]);
    const [selectedYearId, setSelectedYearId] = useState('');
    const [terms, setTerms] = useState([]);
    const [termForm, setTermForm] = useState(EMPTY_TERM);
    const [loading, setLoading] = useState(true);
    const [savingPolicy, setSavingPolicy] = useState(false);
    const [savingTerm, setSavingTerm] = useState(false);

    const selectedYear = useMemo(
        () => years.find((year) => year._id === selectedYearId),
        [selectedYearId, years]
    );

    const loadTerms = async (yearId) => {
        if (!yearId) {
            setTerms([]);
            return;
        }
        const response = await tenantService.getTerms(yearId);
        setTerms(response.data || []);
    };

    useEffect(() => {
        const load = async () => {
            try {
                const [policyResponse, yearsResponse] = await Promise.all([
                    tenantService.getAcademicPolicy(),
                    tenantService.getAcademicYears()
                ]);
                setPolicy(policyResponse.data);
                const loadedYears = yearsResponse.data || [];
                setYears(loadedYears);
                const initialYear = loadedYears.find((year) => year.isCurrent)?._id || loadedYears[0]?._id || '';
                setSelectedYearId(initialYear);
                await loadTerms(initialYear);
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to load academic policy');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const updateRule = (index, field, value) => {
        setPolicy((current) => ({
            ...current,
            rules: current.rules.map((rule, ruleIndex) => (
                ruleIndex === index ? { ...rule, [field]: field === 'grade' ? value : Number(value) } : rule
            ))
        }));
    };

    const savePolicy = async (event) => {
        event.preventDefault();
        setSavingPolicy(true);
        try {
            const response = await tenantService.updateAcademicPolicy(policy);
            setPolicy(response.data);
            alert('Academic policy saved');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save academic policy');
        } finally {
            setSavingPolicy(false);
        }
    };

    const createTerm = async (event) => {
        event.preventDefault();
        setSavingTerm(true);
        try {
            await tenantService.createTerm(selectedYearId, termForm);
            setTermForm(EMPTY_TERM);
            await loadTerms(selectedYearId);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to create term');
        } finally {
            setSavingTerm(false);
        }
    };

    const deleteTerm = async (term) => {
        if (!window.confirm(`Delete ${term.name}?`)) return;
        try {
            await tenantService.deleteTerm(term._id);
            await loadTerms(selectedYearId);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete term');
        }
    };

    if (loading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>;
    }

    return (
        <div className="space-y-6 pb-16">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Academic Policy</h1>
                <p className="mt-1 text-sm font-medium text-slate-500">Control grading, final-grade graduation, and academic terms across the school.</p>
            </div>

            <form onSubmit={savePolicy} className="space-y-5 border-y border-slate-200 bg-white py-6">
                <div className="grid gap-5 px-1 md:grid-cols-3">
                    <label className="space-y-1.5">
                        <span className="text-xs font-bold uppercase text-slate-500">Policy name</span>
                        <input required value={policy.name || ''} onChange={(event) => setPolicy({ ...policy, name: event.target.value })} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[var(--primary)]" />
                    </label>
                    <label className="space-y-1.5">
                        <span className="text-xs font-bold uppercase text-slate-500">Final grade level</span>
                        <input required value={policy.finalGradeLevel || ''} onChange={(event) => setPolicy({ ...policy, finalGradeLevel: event.target.value })} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[var(--primary)]" />
                    </label>
                    <label className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3">
                        <span>
                            <span className="block text-xs font-bold text-slate-800">Require passing results</span>
                            <span className="block text-[11px] font-medium text-slate-500">Block graduation when results are missing or failed.</span>
                        </span>
                        <input type="checkbox" checked={policy.graduationRequiresPass !== false} onChange={(event) => setPolicy({ ...policy, graduationRequiresPass: event.target.checked })} className="h-5 w-5 accent-[var(--primary)]" />
                    </label>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Award size={18} className="text-[var(--primary)]" />
                            <h2 className="font-bold text-slate-900">Grading scale</h2>
                        </div>
                        <button type="button" onClick={() => setPolicy({ ...policy, rules: [...policy.rules, { min: 0, max: 0, grade: '' }] })} className="flex items-center gap-1 text-xs font-bold text-[var(--primary)]">
                            <Plus size={14} /> Add rule
                        </button>
                    </div>
                    <div className="overflow-x-auto border-y border-slate-200">
                        <table className="w-full min-w-[540px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr><th className="px-4 py-3">Grade</th><th className="px-4 py-3">Minimum</th><th className="px-4 py-3">Maximum</th><th className="w-16 px-4 py-3" /></tr>
                            </thead>
                            <tbody>
                                {policy.rules.map((rule, index) => (
                                    <tr key={`${rule.grade}-${index}`} className="border-t border-slate-100">
                                        <td className="px-4 py-3"><input required value={rule.grade} onChange={(event) => updateRule(index, 'grade', event.target.value)} className="h-9 w-full rounded-md border border-slate-200 px-2 font-bold" /></td>
                                        <td className="px-4 py-3"><input required type="number" min="0" max="100" value={rule.min} onChange={(event) => updateRule(index, 'min', event.target.value)} className="h-9 w-full rounded-md border border-slate-200 px-2" /></td>
                                        <td className="px-4 py-3"><input required type="number" min="0" max="100" value={rule.max} onChange={(event) => updateRule(index, 'max', event.target.value)} className="h-9 w-full rounded-md border border-slate-200 px-2" /></td>
                                        <td className="px-4 py-3"><button type="button" title="Remove rule" onClick={() => setPolicy({ ...policy, rules: policy.rules.filter((_, ruleIndex) => ruleIndex !== index) })} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button disabled={savingPolicy} className="flex h-10 items-center gap-2 rounded-lg bg-[var(--primary)] px-5 text-xs font-bold uppercase text-white disabled:opacity-50">
                        {savingPolicy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save policy
                    </button>
                </div>
            </form>

            <section className="space-y-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                    <div className="flex items-center gap-3">
                        <CalendarDays size={20} className="text-[var(--primary)]" />
                        <div><h2 className="font-bold text-slate-900">Academic terms</h2><p className="text-xs font-medium text-slate-500">Terms are scoped to one academic year and can be attached to exams.</p></div>
                    </div>
                    <select value={selectedYearId} onChange={async (event) => { setSelectedYearId(event.target.value); await loadTerms(event.target.value); }} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold">
                        {years.map((year) => <option key={year._id} value={year._id}>{year.name}</option>)}
                    </select>
                </div>

                <form onSubmit={createTerm} className="grid gap-3 border-y border-slate-200 bg-white py-4 md:grid-cols-5">
                    <input required placeholder="Term name" value={termForm.name} onChange={(event) => setTermForm({ ...termForm, name: event.target.value })} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
                    <input required type="number" min="1" placeholder="Sequence" value={termForm.sequence} onChange={(event) => setTermForm({ ...termForm, sequence: Number(event.target.value) })} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
                    <input required type="date" min={selectedYear?.startDate?.slice(0, 10)} max={selectedYear?.endDate?.slice(0, 10)} value={termForm.startDate} onChange={(event) => setTermForm({ ...termForm, startDate: event.target.value })} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
                    <input required type="date" min={selectedYear?.startDate?.slice(0, 10)} max={selectedYear?.endDate?.slice(0, 10)} value={termForm.endDate} onChange={(event) => setTermForm({ ...termForm, endDate: event.target.value })} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
                    <button disabled={!selectedYearId || savingTerm} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-bold uppercase text-white disabled:opacity-50">
                        {savingTerm ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Add term
                    </button>
                </form>

                <div className="divide-y divide-slate-100 border-y border-slate-200 bg-white">
                    {terms.map((term) => (
                        <div key={term._id} className="flex items-center justify-between gap-4 px-3 py-4">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-black text-slate-700">{term.sequence}</span>
                                <div className="min-w-0"><p className="truncate font-bold text-slate-900">{term.name}</p><p className="text-xs font-medium text-slate-500">{new Date(term.startDate).toLocaleDateString()} to {new Date(term.endDate).toLocaleDateString()}</p></div>
                            </div>
                            <button type="button" title="Delete term" onClick={() => deleteTerm(term)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={17} /></button>
                        </div>
                    ))}
                    {terms.length === 0 && <div className="flex items-center gap-3 px-3 py-8 text-sm font-medium text-slate-500"><GraduationCap size={20} /> No terms configured for this academic year.</div>}
                </div>
            </section>
        </div>
    );
};

export default AcademicPolicy;
