import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudentById, updateStudent, apiResetStudentPassword } from '../../services/api/registrar.api';
import { Card, Spinner, Button, Input, Badge, Toast } from '../../components/ui';
import { RefreshCw, ShieldAlert } from 'lucide-react';

const StudentDetails = () => {
    const { studentId: id } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [formData, setFormData] = useState({});
    const [toast, setToast] = useState(null);
    const [error, setError] = useState(null);

    const fetchStudent = async (studentId) => {
        try {
            setError(null);
            const res = await getStudentById(studentId);
            const data = res.data.data || res.data;
            setStudent(data);
            setFormData(data);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to load student details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id && id !== 'undefined' && id.length === 24) {
            fetchStudent(id);
        } else {
            setError(id === 'undefined' ? "No Student ID provided." : "Invalid ID format in URL.");
            setLoading(false);
        }
    }, [id]);

    const handleSave = async () => {
        try {
            await updateStudent(id, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                guardianInfo: formData.guardianInfo,
                status: formData.status
            });
            setToast({ type: 'success', message: 'Student updated successfully' });
            setEditing(false);
            fetchStudent(id);
        } catch (err) {
            console.error(err);
            setToast({ type: 'error', message: 'Update failed' });
        }
    };

    const handleResetPassword = async () => {
        if (!window.confirm('Reset this student password and generate a new temporary password?')) return;
        setResetting(true);
        try {
            const response = await apiResetStudentPassword(id);
            const temporaryPassword = response.data?.data?.temporaryPassword;
            setToast({
                type: 'success',
                message: temporaryPassword
                    ? `Password reset. Temporary password: ${temporaryPassword}`
                    : 'Password reset successfully'
            });
        } catch (err) {
            console.error(err);
            setToast({ type: 'error', message: 'Reset failed' });
        } finally {
            setResetting(false);
        }
    };

    if (loading) return (
        <div className="h-96 flex items-center justify-center">
            <Spinner size="lg" />
        </div>
    );

    if (!student) return (
        <div className="flex flex-col items-center justify-center py-20 px-4 animate-fade-in text-center">
            <div className="bg-slate-100 p-6 rounded-full mb-6">
                <ShieldAlert size={64} className="text-slate-400" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Student Not Found</h2>
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm mb-6 border border-red-100 font-medium">
                Reason: {error || "Access Denied / Record Missing"}
            </div>
            <p className="text-slate-500 max-w-md mb-8">
                The student record you requested could not be found in your current branch. 
                Double check the student list or try searching again.
            </p>
            <div className="flex gap-4">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                    Go Back
                </Button>
                <Button onClick={() => navigate('/registrar/students')}>
                    View Student Directory
                </Button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">
                    {student.firstName} {student.lastName} 
                    <span className="ml-3 text-lg font-normal text-slate-500">ID: {student.admissionNumber}</span>
                </h1>
                {!editing ? (
                    <div className="flex gap-2">
                        <Button 
                            variant="warning" 
                            className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2"
                            onClick={handleResetPassword}
                            disabled={resetting}
                        >
                            <RefreshCw size={16} className={resetting ? 'animate-spin' : ''} />
                            Reset Pass
                        </Button>
                        <Button onClick={() => setEditing(true)}>Edit Profile</Button>
                    </div>
                ) : (
                     <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => { setEditing(false); setFormData(student); }}>Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                     </div>
                )}
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-6 space-y-6">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="font-bold font-sans text-slate-800">Student Information</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                             <ShieldAlert size={14} />
                             <span>Portal Username: <span className="font-bold text-slate-600">{student.portalAccount?.username || 'N/A'}</span></span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="First Name" 
                            value={formData.firstName || ''} 
                            onChange={e => setFormData({...formData, firstName: e.target.value})}
                            disabled={!editing} 
                        />
                        <Input 
                            label="Last Name" 
                            value={formData.lastName || ''} 
                            onChange={e => setFormData({...formData, lastName: e.target.value})}
                            disabled={!editing} 
                        />
                        <Input label="Date of Birth" value={student.DOB ? new Date(student.DOB).toLocaleDateString() : 'N/A'} disabled />
                        <div className="form-group">
                            <label className="text-sm font-medium mb-1 block text-slate-700">Status</label>
                            {editing ? (
                                <select 
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none"
                                    value={formData.status}
                                    onChange={e => setFormData({...formData, status: e.target.value})}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Transferred">Transferred</option>
                                </select>
                            ) : (
                                <Badge variant={student.status === 'Active' ? 'success' : 'default'}>{student.status}</Badge>
                            )}
                        </div>
                    </div>

                    <h3 className="font-bold border-b pb-2 pt-4 font-sans text-slate-800">Guardian Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Input 
                            label="Guardian Name" 
                            value={formData.guardianInfo?.name || ''} 
                            onChange={e => setFormData({...formData, guardianInfo: {...formData.guardianInfo, name: e.target.value}})}
                            disabled={!editing} 
                        />
                        <Input 
                            label="Phone" 
                            value={formData.guardianInfo?.phone || ''} 
                            onChange={e => setFormData({...formData, guardianInfo: {...formData.guardianInfo, phone: e.target.value}})}
                            disabled={!editing} 
                        />
                         <Input 
                            label="Address" 
                            value={formData.guardianInfo?.address || ''} 
                            onChange={e => setFormData({...formData, guardianInfo: {...formData.guardianInfo, address: e.target.value}})}
                            disabled={!editing} 
                            containerClassName="md:col-span-2"
                        />
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="font-bold border-b pb-4 mb-4 font-sans text-slate-800">Enrollment History</h3>
                    <div className="space-y-4">
                        {student.enrollments?.map(enrol => (
                            <div key={enrol._id} className="p-3 bg-slate-50 rounded-lg border hover:border-indigo-200 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-[var(--primary)] text-sm">{enrol.academicYearId?.name}</span>
                                    <Badge variant={enrol.status === 'Current' ? 'success' : 'default'} size="sm">{enrol.status}</Badge>
                                </div>
                                <div className="text-sm">
                                    <p className="font-semibold text-slate-700">{enrol.classId?.name}</p>
                                    <p className="text-slate-500 text-xs mt-1">Section: {enrol.sectionId?.name || 'Not Assigned'}</p>
                                    <p className="text-slate-500 text-xs mt-1 italic">Branch: {enrol.branchId?.name}</p>
                                </div>
                            </div>
                        ))}
                        {(student.enrollments || []).length === 0 && (
                            <div className="text-center py-6 text-slate-400">
                                <p className="text-sm font-medium italic">No enrollment history found.</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default StudentDetails;

