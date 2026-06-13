import React, { useEffect, useState } from 'react';
import {
    getStudents,
    getCurrentAcademicYear,
    getTransferBranches,
    getTransferBranchClasses,
    transferStudentBranch
} from '../../services/api/registrar.api';
import { Button, Card, Toast } from '../../components/ui';

const Transfers = () => {
    // State similar to NewEnrollment but with Target Branch ID input
    const [students, setStudents] = useState([]);
    const [branches, setBranches] = useState([]);
    const [classes, setClasses] = useState([]);
    const [year, setYear] = useState(null);
    const [searchQ, setSearchQ] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [formData, setFormData] = useState({
        toBranchId: '',
        classId: '', // Ideally we need classes of TARGET branch, but since we are isolated, we might not see them. 
                     // Instructions say: "classId (dropdown for target class in new branch — allow manual if branch classes endpoint is not available)"
                     // We will allow manual input option or dropdown if we assume classes are standard across tenant (shared IDs? unlikely).
                     // Let's us Manual Input for Class ID if Dropdown is for current branch contexts.
                     // OR re-use current branch classes dropdown if the user knows they share structure? 
                     // Safe bet: Text Input for Class ID or ask for ID. 
                     // Actually, user said: "allow manual if branch classes endpoint is not available"
                     // So we provide an input.
        reason: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const init = async () => {
             const [yRes, branchRes] = await Promise.all([getCurrentAcademicYear(), getTransferBranches()]);
             setYear(yRes.data?.data);
             setBranches(branchRes.data || []);
        };
        init();
    }, []);

    useEffect(() => {
        if (!formData.toBranchId) {
            setClasses([]);
            return;
        }
        getTransferBranchClasses(formData.toBranchId)
            .then((response) => setClasses(response.data || []))
            .catch(() => setClasses([]));
    }, [formData.toBranchId]);

    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            const res = await getStudents({ q: searchQ });
            setStudents(res.data.data || res.data);
            setSelectedStudent(null);
        } catch (err) { console.error(err); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedStudent || !year?._id) {
            setToast({ type: 'error', message: 'Select a student and ensure an active academic year exists.' });
            return;
        }
        setSubmitting(true);
        try {
            await transferStudentBranch({
                studentId: selectedStudent._id,
                toBranchId: formData.toBranchId,
                classId: formData.classId, // ID of class in TARGET branch
                academicYearId: year._id,
                reason: formData.reason
            });
            setToast({ type: 'success', message: 'Transfer Initiated Successfully!' });
            setSelectedStudent(null);
            setFormData({ toBranchId: '', classId: '', reason: '' });
            setStudents([]);
            setSearchQ('');
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Transfer Failed' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Branch Transfer</h1>
             {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <Card className="p-6">
                 <div className="mb-6">
                    <label className="block text-sm font-medium mb-1">Select Student</label>
                    <form onSubmit={handleSearch} className="flex gap-2 mb-2">
                        <input 
                            className="flex-1 px-3 py-2 border rounded-lg"
                            placeholder="Search Name..."
                            value={searchQ}
                            onChange={e => setSearchQ(e.target.value)}
                        />
                        <Button type="submit">Find</Button>
                    </form>
                    
                    {students.length > 0 && !selectedStudent && (
                        <div className="border rounded-lg max-h-48 overflow-y-auto">
                            {students.map(s => (
                                <div key={s._id} className="p-2 border-b cursor-pointer hover:bg-slate-50" onClick={() => setSelectedStudent(s)}>
                                    {s.firstName} {s.lastName} ({s.admissionNumber})
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {selectedStudent && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between">
                            <span className="font-bold">{selectedStudent.firstName} {selectedStudent.lastName}</span>
                            <button onClick={() => setSelectedStudent(null)} className="text-sm text-blue-600 underline">Change</button>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Target Branch</label>
                        <select
                            className="w-full px-3 py-2 border rounded-lg"
                            value={formData.toBranchId}
                            onChange={e => setFormData({...formData, toBranchId: e.target.value, classId: ''})}
                            required
                        >
                            <option value="">Select target branch</option>
                            {branches.map((branch) => (
                                <option key={branch._id} value={branch._id}>{branch.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Target Class</label>
                         <select
                            className="w-full px-3 py-2 border rounded-lg"
                            value={formData.classId}
                            onChange={e => setFormData({...formData, classId: e.target.value})}
                            required
                         >
                            <option value="">Select target class</option>
                            {classes.map((classItem) => (
                                <option key={classItem._id} value={classItem._id}>{classItem.name}</option>
                            ))}
                         </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Reason</label>
                         <textarea 
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="Reason for transfer..."
                            value={formData.reason}
                            onChange={e => setFormData({...formData, reason: e.target.value})}
                            required
                        />
                    </div>

                    <Button className="w-full justify-center" disabled={submitting || !selectedStudent || !year?._id}>
                        {submitting ? 'Processing...' : 'Execute Transfer'}
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default Transfers;
