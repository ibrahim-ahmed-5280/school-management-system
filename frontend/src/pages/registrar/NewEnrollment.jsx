import React, { useEffect, useState } from 'react';
import { getStudents, getCurrentAcademicYear, createEnrollment } from '../../services/api/registrar.api';
import { getClasses } from '../../services/api/branch.api';
import { Input, Button, Card, Spinner, Toast } from '../../components/ui';

const NewEnrollment = () => {
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [year, setYear] = useState(null);
    const [searchQ, setSearchQ] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedClass, setSelectedClass] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    // Initial Load
    useEffect(() => {
        const init = async () => {
             const [yRes, cRes] = await Promise.all([getCurrentAcademicYear(), getClasses()]);
             setYear(yRes.data?.data);
             setClasses(cRes.data);
        };
        init();
    }, []);

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
                academicYearId: year._id,
                status: 'Current'
            });
            setToast({ type: 'success', message: 'Enrollment Created Successfully!' });
            setSelectedStudent(null);
            setSelectedClass('');
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
                        className="w-full px-3 py-2 border rounded-lg"
                        value={selectedClass}
                        onChange={e => setSelectedClass(e.target.value)}
                        disabled={!selectedStudent}
                    >
                        <option value="">-- Choose Class --</option>
                        {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                </div>

                <div className="mb-6">
                     <label className="block text-sm font-medium mb-1">Academic Year</label>
                     <div className="p-2 bg-slate-100 rounded border text-slate-500 text-sm">
                         {year?.name || 'Loading...'}
                     </div>
                </div>

                <Button 
                    className="w-full" 
                    size="lg" 
                    disabled={submitting || !selectedStudent || !selectedClass}
                    onClick={handleSubmit}
                >
                    {submitting ? 'Enrolling...' : 'Confirm Enrollment'}
                </Button>
            </Card>
        </div>
    );
};

export default NewEnrollment;
