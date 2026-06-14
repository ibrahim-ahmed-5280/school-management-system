import React, { useEffect, useState } from 'react';
import { getStudents, getCurrentAcademicYear, createEnrollment } from '../../services/api/registrar.api';
import { getClasses, getSections } from '../../services/api/branch.api';
import { Button, Card, Toast } from '../../components/ui';

const normalizeList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    return [];
};

const normalizeAcademicYear = (payload) => payload?.data?.data || payload?.data || payload || null;

const NewEnrollment = () => {
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [year, setYear] = useState(null);
    const [searchQ, setSearchQ] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [sectionsLoading, setSectionsLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);
    const [loadError, setLoadError] = useState('');

    // Initial Load
    useEffect(() => {
        const init = async () => {
            try {
                const [yRes, cRes] = await Promise.all([getCurrentAcademicYear(), getClasses()]);
                setYear(normalizeAcademicYear(yRes));
                setClasses(normalizeList(cRes));
                setLoadError('');
            } catch (err) {
                console.error('Failed to load enrollment requirements:', err);
                setClasses([]);
                setLoadError(err.response?.data?.message || 'Failed to load classes or academic year.');
            } finally {
                setLoadingInitial(false);
            }
        };
        init();
    }, []);

    const handleClassChange = async (classId) => {
        setSelectedClass(classId);
        setSelectedSection(''); // Reset selected sectionId when class changes
        if (!classId) {
            setSections([]);
            return;
        }
        setSectionsLoading(true);
        try {
            const res = await getSections(classId);
            setSections(res.data || res || []);
        } catch (err) {
            console.error('Failed to load sections:', err);
            setSections([]);
        } finally {
            setSectionsLoading(false);
        }
    };

    // Search Students
    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await getStudents({ q: searchQ });
            setStudents(res.data.data || res.data);
            setSelectedStudent(null);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedStudent || !selectedClass || !year) return;
        setSubmitting(true);
        try {
            await createEnrollment({
                studentId: selectedStudent._id,
                classId: selectedClass,
                sectionId: selectedSection || undefined,
                academicYearId: year._id,
                status: 'Current'
            });
            setToast({ type: 'success', message: 'Enrollment Created Successfully!' });
            setSelectedStudent(null);
            setSelectedClass('');
            setSelectedSection('');
            setSections([]);
            setStudents([]); 
            setSearchQ('');
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Enrollment Failed' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">New Enrollment</h1>
             {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <Card className="p-6">
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-1">1. Find Student</label>
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input 
                            className="flex-1 px-3 py-2 border rounded-lg"
                            placeholder="Enter Name or Admission #"
                            value={searchQ}
                            onChange={e => setSearchQ(e.target.value)}
                        />
                        <Button type="submit" disabled={loading}>Search</Button>
                    </form>
                </div>

                {students.length > 0 && !selectedStudent && (
                    <div className="mb-6 border rounded-lg max-h-48 overflow-y-auto">
                        {students.map(s => (
                            <div 
                                key={s._id} 
                                className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-0"
                                onClick={() => setSelectedStudent(s)}
                            >
                                <div className="font-bold">{s.firstName} {s.lastName}</div>
                                <div className="text-xs text-slate-500">{s.admissionNumber}</div>
                            </div>
                        ))}
                    </div>
                )}

                {selectedStudent && (
                    <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
                        <div>
                            <div className="font-bold text-blue-900">{selectedStudent.firstName} {selectedStudent.lastName}</div>
                            <div className="text-xs text-blue-700">{selectedStudent.admissionNumber}</div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedStudent(null)}>Change</Button>
                    </div>
                )}

                <div className="mb-6">
                    <label className="block text-sm font-medium mb-1">2. Select Class</label>
                    <select 
                        className="w-full px-3 py-2 border rounded-lg disabled:bg-slate-100 disabled:text-slate-400"
                        value={selectedClass}
                        onChange={e => handleClassChange(e.target.value)}
                        disabled={loadingInitial || classes.length === 0}
                    >
                        <option value="">
                            {loadingInitial
                                ? 'Loading classes...'
                                : classes.length === 0
                                    ? '-- No classes found for this branch --'
                                    : '-- Choose Class --'}
                        </option>
                        {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                    {!loadingInitial && classes.length === 0 && (
                        <p className="mt-2 text-xs font-semibold text-rose-600">
                            No classes are available in this registrar branch. Ask the branch admin to create classes first.
                        </p>
                    )}
                </div>

                {selectedClass && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-1">Select Section</label>
                        {sectionsLoading ? (
                            <div className="text-sm text-slate-500">Loading sections...</div>
                        ) : sections.length > 0 ? (
                            <select
                                className="w-full px-3 py-2 border rounded-lg"
                                value={selectedSection}
                                onChange={e => setSelectedSection(e.target.value)}
                            >
                                <option value="">-- Choose Section (Optional) --</option>
                                {sections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                            </select>
                        ) : (
                            <div className="p-3 bg-amber-50 border border-amber-250 text-amber-900 text-xs rounded-xl font-medium">
                                No sections configured for this class.
                            </div>
                        )}
                    </div>
                )}

                <div className="mb-6">
                     <label className="block text-sm font-medium mb-1">Academic Year</label>
                     <div className="p-2 bg-slate-100 rounded border text-slate-500 text-sm">
                         {year?.name || 'Loading...'}
                     </div>
                </div>

                {loadError && (
                    <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                        {loadError}
                    </div>
                )}

                <Button 
                    className="w-full" 
                    size="lg" 
                    disabled={submitting || !selectedStudent || !selectedClass || !year}
                    onClick={handleSubmit}
                >
                    {submitting ? 'Enrolling...' : 'Confirm Enrollment'}
                </Button>
            </Card>
        </div>
    );
};

export default NewEnrollment;
