import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Spinner } from '../../components/ui';
import { apiGetStudentProfile } from '../../services/api/student.api';
import { User, Phone, Mail, Calendar, Heart, Shield, GraduationCap, CheckCircle2, Lock } from 'lucide-react';

// Map enrollment status to badge colors
const statusStyle = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'active' || s === 'current') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (s === 'transferred') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (s === 'graduated') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (s === 'inactive' || s === 'withdrawn') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-slate-100 text-slate-500 border-slate-200';
};

const StudentProfile = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await apiGetStudentProfile();
                setData(res.data || null);
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.message || 'Failed to load profile. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) return <div className="flex h-96 items-center justify-center"><Spinner size="lg" /></div>;

    if (error) {
        return (
            <div className="max-w-4xl mx-auto mt-12 text-center space-y-4">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-400 mx-auto">
                    <User size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-700">Profile unavailable</h2>
                <p className="text-slate-500">{error}</p>
            </div>
        );
    }

    // Safe destructure with fallbacks
    const student = data?.student || null;
    const enrollment = data?.enrollment || null;

    if (!student) {
        return (
            <div className="max-w-4xl mx-auto mt-12 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto">
                    <User size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-700">No profile found</h2>
                <p className="text-slate-500">Your student record could not be loaded. Please contact the registrar.</p>
            </div>
        );
    }

    const firstName = student.firstName || '';
    const lastName = student.lastName || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown Student';
    const avatarLetter = firstName.charAt(0).toUpperCase() || '?';

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Personal Profile</h1>
                <div className="flex items-center gap-3">
                    <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
                        <Shield size={14} />
                        Verified Student
                    </span>
                    <Link
                        to="/student/change-password"
                        className="px-4 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-black uppercase tracking-widest border border-amber-200 flex items-center gap-2 hover:bg-amber-100 transition-colors"
                    >
                        <Lock size={14} />
                        Change Password
                    </Link>
                </div>
            </div>

            <Card className="p-0 border-0 shadow-2xl shadow-slate-200/50 bg-white overflow-hidden rounded-[2.5rem]">
                {/* Cover Header */}
                <div className="h-48 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark,#1e3a8a)] relative">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                </div>

                {/* Profile Info Overlay */}
                <div className="px-10 pb-10">
                    <div className="relative flex flex-col md:flex-row items-end gap-8 -mt-16 mb-10">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-white p-2 shadow-2xl relative">
                            <div className="w-full h-full rounded-[2rem] bg-slate-100 flex items-center justify-center text-[var(--primary)] text-4xl font-black border-4 border-white">
                                {avatarLetter}
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl border-4 border-white flex items-center justify-center text-white shadow-lg">
                                <CheckCircle2 size={20} />
                            </div>
                        </div>
                        <div className="flex-1 pb-4 text-center md:text-left">
                            <h2 className="text-4xl font-black text-slate-800 tracking-tight">{fullName}</h2>
                            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">
                                {student.studentCode || student.admissionNumber || '—'} • {enrollment?.classId?.name || 'No Class'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6 border-t border-slate-50">
                        <section className="space-y-8">
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <User size={14} /> Personal Information
                                </h3>
                                <div className="space-y-5">
                                    <InfoItem
                                        icon={Calendar}
                                        label="Date of Birth"
                                        value={student.DOB ? new Date(student.DOB).toLocaleDateString() : '—'}
                                    />
                                    <InfoItem icon={User} label="Gender" value={student.gender || '—'} />
                                    <InfoItem
                                        icon={GraduationCap}
                                        label="Admission Date"
                                        value={student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '—'}
                                    />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <Heart size={14} /> Guardian Details
                                </h3>
                                <div className="space-y-5">
                                    <InfoItem icon={User} label="Guardian Name" value={student.guardianInfo?.name || '—'} />
                                    <InfoItem icon={Phone} label="Contact" value={student.guardianInfo?.phone || '—'} />
                                    <InfoItem icon={Mail} label="Email" value={student.guardianInfo?.email || '—'} />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-8">
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <Shield size={14} /> Academic Status
                                </h3>
                                <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Enrollment</p>
                                        <p className="text-2xl font-black text-slate-800 tracking-tight">{enrollment?.classId?.name || 'Not enrolled'}</p>
                                        <div className="mt-6 flex items-center gap-3 flex-wrap">
                                            {enrollment?.academicYearId?.name && (
                                                <span className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                    {enrollment.academicYearId.name}
                                                </span>
                                            )}
                                            {/* FIX: use real enrollment status, not hardcoded "Active" */}
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${statusStyle(enrollment?.status)}`}>
                                                {enrollment?.status || 'No active enrollment'}
                                            </span>
                                        </div>
                                    </div>
                                    <GraduationCap size={120} className="absolute -right-8 -bottom-8 text-slate-200/50 group-hover:scale-110 transition-transform duration-500" />
                                </div>
                            </div>

                            <div className="p-8 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] text-white shadow-xl shadow-indigo-100">
                                <h4 className="font-bold mb-2">Need corrections?</h4>
                                <p className="text-sm text-indigo-100 font-medium leading-relaxed mb-4">
                                    If you notice any errors in your profile, please contact the school registrar.
                                </p>
                                <Link
                                    to="/student/change-password"
                                    className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors text-white text-xs font-black px-4 py-2 rounded-xl"
                                >
                                    <Lock size={14} /> Change Password
                                </Link>
                            </div>
                        </section>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const InfoItem = ({ icon, label, value }) => {
    return (
        <div className="flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-[var(--primary)]/5 group-hover:text-[var(--primary)] transition-all">
                {React.createElement(icon, { size: 18 })}
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
                <p className="text-sm font-bold text-slate-700">{value || '—'}</p>
            </div>
        </div>
    );
};

export default StudentProfile;
