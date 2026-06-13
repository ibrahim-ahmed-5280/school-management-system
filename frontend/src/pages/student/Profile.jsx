import React, { useState, useEffect } from 'react';
import { Card, Spinner } from '../../components/ui';
import { apiGetStudentProfile } from '../../services/api/student.api';
import { User, Phone, Mail, Calendar, Heart, Shield, GraduationCap } from 'lucide-react';

const StudentProfile = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await apiGetStudentProfile();
                setData(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) return <div className="flex h-96 items-center justify-center"><Spinner size="lg" /></div>;

    const { student, enrollment } = data;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="flex items-center justify-between">
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Personal Profile</h1>
                <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
                    <Shield size={14} />
                    Verified Student
                </span>
            </div>

            <Card className="p-0 border-0 shadow-2xl shadow-slate-200/50 bg-white overflow-hidden rounded-[2.5rem]">
                {/* Cover Header */}
                <div className="h-48 bg-linear-to-r from-[var(--primary)] to-[var(--primary-dark)] relative">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                </div>

                {/* Profile Info Overlay */}
                <div className="px-10 pb-10">
                    <div className="relative flex flex-col md:flex-row items-end gap-8 -mt-16 mb-10">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-white p-2 shadow-2xl relative">
                            <div className="w-full h-full rounded-[2rem] bg-slate-100 flex items-center justify-center text-[var(--primary)] text-4xl font-black border-4 border-white">
                                {student.firstName.charAt(0)}
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl border-4 border-white flex items-center justify-center text-white shadow-lg">
                                <CheckCircle size={20} />
                            </div>
                        </div>
                        <div className="flex-1 pb-4 text-center md:text-left">
                            <h2 className="text-4xl font-black text-slate-800 tracking-tight">{student.firstName} {student.lastName}</h2>
                            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">{student.studentCode} • {enrollment?.classId?.name || 'No Class'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6 border-t border-slate-50">
                        <section className="space-y-8">
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <User size={14} /> Personal Information
                                </h3>
                                <div className="space-y-5">
                                    <InfoItem icon={Calendar} label="Date of Birth" value={new Date(student.DOB).toLocaleDateString()} />
                                    <InfoItem icon={User} label="Gender" value={student.gender} />
                                    <InfoItem icon={GraduationCap} label="Admission date" value={new Date(student.createdAt).toLocaleDateString()} />
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <Heart size={14} /> Guardian Details
                                </h3>
                                <div className="space-y-5">
                                    <InfoItem icon={User} label="Guardian Name" value={student.guardianInfo?.name} />
                                    <InfoItem icon={Phone} label="Contact" value={student.guardianInfo?.phone} />
                                    <InfoItem icon={Mail} label="Email" value={student.guardianInfo?.email || 'N/A'} />
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
                                        <p className="text-2xl font-black text-slate-800 tracking-tight">{enrollment?.classId?.name || 'N/A'}</p>
                                        <div className="mt-6 flex items-center gap-3">
                                            <span className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                {enrollment?.academicYearId?.name}
                                            </span>
                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                Active
                                            </span>
                                        </div>
                                     </div>
                                     <GraduationCap size={120} className="absolute -right-8 -bottom-8 text-slate-200/50 group-hover:scale-110 transition-transform duration-500" />
                                </div>
                            </div>

                             <div className="p-8 bg-linear-to-br from-indigo-600 to-blue-700 rounded-[2rem] text-white shadow-xl shadow-indigo-100">
                                <h4 className="font-bold mb-4">Need help?</h4>
                                <p className="text-sm text-indigo-100 font-medium leading-relaxed mb-6">If you notice any corrections needed in your profile, please contact the school registrar.</p>
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
                <p className="text-sm font-bold text-slate-700">{value}</p>
            </div>
        </div>
    );
};

const CheckCircle = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

export default StudentProfile;

