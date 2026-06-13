import React, { useEffect, useState } from 'react';
import { getAcademicYears, getClasses, getCurrentAcademicYear, promoteStudents } from '../../services/api/branch.api';
import { Button, Card, Spinner, Toast, Select } from '../../components/ui';
import { ArrowRight, AlertTriangle } from 'lucide-react';

const Promotions = () => {
    const [currentYear, setCurrentYear] = useState(null);
    const [years, setYears] = useState([]);
    const [targetYearId, setTargetYearId] = useState('');
    const [classes, setClasses] = useState([]);
    const [classMap, setClassMap] = useState([]); // [{ fromClassId, toClassId }]
    const [loading, setLoading] = useState(true);
    const [promoting, setPromoting] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const init = async () => {
            try {
                const [yearRes, yearsRes, classRes] = await Promise.all([
                    getCurrentAcademicYear(),
                    getAcademicYears(),
                    getClasses()
                ]);
                const currentYearPayload = yearRes?.data || yearRes;
                const yearRows = Array.isArray(yearsRes) ? yearsRes : (yearsRes?.data || []);
                const classRows = classRes?.data || [];

                setCurrentYear(currentYearPayload);
                setYears(yearRows);
                setClasses(classRows);
                
                // Init map with all classes
                const initialMap = classRows.map(c => ({
                    fromClassId: c._id,
                    fromClassName: c.name,
                    toClassId: '' 
                }));
                setClassMap(initialMap);

                // Preselect first available target year that is not the current one
                const nextYear = yearRows.find((y) => String(y._id) !== String(currentYearPayload?._id));
                if (nextYear) {
                    setTargetYearId(nextYear._id);
                }

            } catch (err) {
                console.error(err);
                // Year might be 404
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const handleMapChange = (index, newValue) => {
        const newMap = [...classMap];
        newMap[index].toClassId = newValue;
        setClassMap(newMap);
    };

    const handlePromote = async () => {
        if (!currentYear) return setToast({ type: 'error', message: 'No current active year found' });
        if (!targetYearId) return setToast({ type: 'error', message: 'Please select target academic year' });
        
        // Filter out empty mappings
        const activeMaps = classMap.filter(m => m.toClassId !== '');
        if (activeMaps.length === 0) return setToast({ type: 'error', message: 'Please map at least one class to promote' });

        if (!window.confirm(`Are you sure you want to promote students from ${activeMaps.length} classes? This action creates new enrollments.`)) return;

        setPromoting(true);
        try {
            const payload = {
                fromAcademicYearId: currentYear._id,
                toAcademicYearId: targetYearId,
                rules: {
                    classMap: activeMaps.map(m => ({ fromClassId: m.fromClassId, toClassId: m.toClassId }))
                }
            };
            
            const res = await promoteStudents(payload);
            const stats = res.data || {};
            setToast({
                type: 'success',
                message: `Promotion Complete: ${stats.promoted || 0} promoted, ${stats.failed || 0} failed, ${stats.skippedExisting || 0} already enrolled.`
            });
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Promotion failed' });
        } finally {
            setPromoting(false);
        }
    };

    if (loading) return <Spinner />;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Student Promotions</h1>
            
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3">
                <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                    <p className="font-bold">Warning:</p>
                    <p>Promotions will move students from their current enrollment to the next academic year. This action generates new enrollment records.</p>
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Current Academic Year</label>
                        <div className="p-3 bg-slate-100 rounded-lg font-bold text-slate-700">
                            {currentYear?.name || 'Not Set'}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Target Academic Year</label>
                        <select
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none"
                            value={targetYearId}
                            onChange={(e) => setTargetYearId(e.target.value)}
                        >
                            <option value="">Select Target Year</option>
                            {years
                                .filter((y) => String(y._id) !== String(currentYear?._id))
                                .map((y) => (
                                    <option key={y._id} value={y._id}>
                                        {y.name}
                                    </option>
                                ))}
                        </select>
                        <p className="text-xs text-slate-400 mt-1">Only years different from the current year are selectable.</p>
                    </div>
                </div>

                <h3 className="font-bold text-lg mb-4">Class Mapping Rules</h3>
                <div className="space-y-3">
                    {classMap.map((mapItem, idx) => (
                        <div key={mapItem.fromClassId} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-slate-50">
                            <div className="w-1/3 font-medium text-slate-700">
                                {mapItem.fromClassName}
                            </div>
                            <ArrowRight className="text-slate-400" />
                            <div className="w-1/3">
                                <select 
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={mapItem.toClassId}
                                    onChange={(e) => handleMapChange(idx, e.target.value)}
                                >
                                    <option value="">Do Not Promote</option>
                                    {classes.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex justify-end">
                    <Button 
                        onClick={handlePromote} 
                        disabled={promoting || !currentYear}
                        className="w-full md:w-auto"
                    >
                        {promoting ? 'Processing...' : 'Run Promotion Cycle'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default Promotions;


