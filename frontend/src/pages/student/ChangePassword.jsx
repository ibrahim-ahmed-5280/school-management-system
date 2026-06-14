import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card, Spinner } from '../../components/ui';
import { apiChangeStudentPassword } from '../../services/api/student.api';
import { ShieldAlert, Lock, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

const ChangePassword = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (newPassword !== confirmPassword) {
            return setError('New passwords do not match');
        }

        if (newPassword.length < 8) {
             return setError('Password must be at least 8 characters');
        }

        setLoading(true);
        try {
            await apiChangeStudentPassword(oldPassword, newPassword);
            setSuccess(true);
            setTimeout(() => navigate('/student'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 font-outfit">
            <Card className="max-w-md w-full p-10 border-0 shadow-2xl bg-white rounded-[2.5rem]">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 mx-auto mb-6 shadow-inner ring-8 ring-amber-50/50">
                        <Lock size={36} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Security Update</h2>
                    <p className="text-slate-500 mt-2 font-semibold">For your security, please update your password.</p>
                </div>

                {success ? (
                    <div className="text-center py-10 animate-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-6">
                            <CheckCircle size={48} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800">Password Updated!</h3>
                        <p className="text-slate-500 mt-2 font-medium">Redirecting you to the portal...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 animate-pulse">
                                <AlertCircle size={20} />
                                <span className="text-sm font-bold">{error}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                            <Input
                                type="password"
                                placeholder="Enter current password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                className="h-14 bg-slate-50 border-transparent focus:bg-white focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 rounded-2xl font-semibold transition-all shadow-inner"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                             <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                            <Input
                                type="password"
                                placeholder="Min. 8 characters"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="h-14 bg-slate-50 border-transparent focus:bg-white focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 rounded-2xl font-semibold transition-all shadow-inner"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                             <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                            <Input
                                type="password"
                                placeholder="Repeat new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="h-14 bg-slate-50 border-transparent focus:bg-white focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 rounded-2xl font-semibold transition-all shadow-inner"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-linear-to-r from-[var(--primary)] to-[var(--primary-dark)] hover:from-[var(--primary-dark)] hover:to-[var(--primary)] text-white font-black rounded-2xl shadow-xl shadow-[var(--primary)]/10 flex items-center justify-center gap-3 group transform hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            {loading ? <Spinner size="sm" /> : (
                                <>
                                    <span>Update Password</span>
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>
                )}

                <div className="mt-10 p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <div className="flex gap-4">
                        <ShieldAlert className="text-amber-500 shrink-0" size={24} />
                        <div>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Why this is required?</h4>
                            <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                                You are using a temporary password. To keep your academic data safe, you must set a private password before proceeding.
                            </p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ChangePassword;

