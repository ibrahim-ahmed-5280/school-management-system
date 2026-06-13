import React, { useEffect, useState } from 'react';
import { getCurrentAcademicYear, createStudentAdmission } from '../../services/api/registrar.api';
import { getClasses, getSections } from '../../services/api/branch.api';
import { Input, Button, Card, Spinner, Toast } from '../../components/ui';
import { useNavigate } from 'react-router-dom';

const Admissions = () => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [sectionsLoading, setSectionsLoading] = useState(false);
    const [academicYear, setAcademicYear] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        DOB: '',
        gender: 'Male',
        guardianName: '',
        guardianPhone: '',
        guardianAddress: '',
        classId: '',
        sectionId: '',
        sectionName: '',
        status: 'Active'
    });
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const init = async () => {
            try {
                const [yearRes, classRes] = await Promise.all([
                    getCurrentAcademicYear(),
                    getClasses()
                ]);
                setAcademicYear(yearRes.data?.data); // Adjusted based on previous response structure which usually wraps in data
                setClasses(classRes.data);
            } catch (err) {
                console.error(err);
                setToast({ type: 'error', message: 'Failed to load form requirements.' });
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const loadSections = async (classId) => {
        if (!classId) {
            setSections([]);
            return;
        }
        setSectionsLoading(true);
        try {
            const secRes = await getSections(classId);
            setSections(secRes.data || []);
        } catch (err) {
            console.error(err);
            setSections([]);
            setToast({ type: 'error', message: 'Failed to load sections for selected class.' });
        } finally {
            setSectionsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'classId') {
            setFormData(prev => ({ ...prev, classId: value, sectionId: '', sectionName: '' }));
            loadSections(value);
            return;
        }
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setToast(null);

        try {
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                DOB: formData.DOB,
                gender: formData.gender,
                guardianInfo: {
                    name: formData.guardianName,
                    phone: formData.guardianPhone,
                    address: formData.guardianAddress
                },
                classId: formData.classId,
                sectionId: formData.sectionId || undefined,
                sectionName: formData.sectionName?.trim() || undefined,
                academicYearId: academicYear?._id,
                status: formData.status
            };

            const res = await createStudentAdmission(payload);
            const createdStudentId = res.data?.data?.student?.admissionNumber;
            const loginId = res.data?.data?.account?.username || createdStudentId;
            const defaultPassword = res.data?.data?.account?.defaultPassword;
            setToast({
                type: 'success',
                message: `Student admitted. Student ID: ${createdStudentId}, Login ID: ${loginId}, Temporary password: ${defaultPassword || 'Unavailable'}`
            });
            
            // Redirect to details after short delay
            setTimeout(() => {
                navigate(`/registrar/students/${res.data.data.student._id}`);
            }, 1000);

        } catch (err) {
            const msg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Admission failed';
            setToast({ type: 'error', message: msg });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Spinner />;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">New Admission</h1>
            
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <Card className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Academic Context */}
                    <div className="bg-slate-50 p-4 rounded-lg border flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">Academic Year</span>
                        <span className="font-bold text-[var(--primary)]">{academicYear?.name || 'Not Available'}</span>
                    </div>

                    {/* Student Info */}
                    <h3 className="font-bold text-lg text-slate-800 border-b pb-2">Student Details</h3>
                    <div className="bg-blue-50 border border-blue-100 text-blue-700 text-sm rounded-lg px-4 py-3">
                        Student ID is auto-generated when you submit (format: STD-001, STD-002, ...).
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">Class to Join</label>
                            <select name="classId" value={formData.classId} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg">
                                <option value="">-- Select Class --</option>
                                {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">Section (Optional)</label>
                            <select
                                name="sectionId"
                                value={formData.sectionId}
                                onChange={handleChange}
                                disabled={!formData.classId || sectionsLoading}
                                className="w-full px-4 py-2 border rounded-lg disabled:bg-slate-100"
                            >
                                <option value="">
                                    {sectionsLoading ? 'Loading sections...' : '-- Select Existing Section --'}
                                </option>
                                {sections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                            </select>
                        </div>
                        <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
                        <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
                        <Input label="Date of Birth" name="DOB" type="date" value={formData.DOB} onChange={handleChange} required />
                        <div>
                             <label className="text-sm font-medium text-slate-700 mb-1 block">Gender</label>
                             <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                        <Input
                            label="Create New Section (Optional)"
                            name="sectionName"
                            value={formData.sectionName}
                            onChange={handleChange}
                            placeholder="e.g. A, Blue, East Wing"
                        />
                    </div>

                    {/* Guardian Info */}
                    <h3 className="font-bold text-lg text-slate-800 border-b pb-2 mt-6">Guardian Info</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Guardian Name" name="guardianName" value={formData.guardianName} onChange={handleChange} required />
                        <Input label="Phone Number" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} required />
                        <div className="md:col-span-2">
                            <Input label="Address" name="guardianAddress" value={formData.guardianAddress} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="flex justify-end pt-6">
                        <Button type="submit" size="lg" disabled={submitting || !academicYear}>
                            {submitting ? 'Processing...' : 'Complete Admission'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default Admissions;

