import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiChangeStudentPassword } from '../../services/api/student.api';
import { Button, Input, Card, Spinner, Toast } from '../../components/ui';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';

const StudentChangePassword = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword.length < 4) {
            setError('Password must be at least 4 characters');
            return;
        }

        setLoading(true);

        try {
            await apiChangeStudentPassword(oldPassword, newPassword);
            setSuccess('Password changed successfully! Redirecting...');
            setTimeout(() => {
                navigate('/student');
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password. check your old password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-[var(--primary)] to-[var(--primary-dark)]"></div>
                
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--primary)]">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">Change Password</h2>
                    <p className="text-slate-500 mt-2 text-sm">
                        For security, please update your temporary password to proceed.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 text-sm font-bold animate-shake">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl flex items-center gap-3 text-sm font-bold animate-slide-up">
                            <CheckCircle size={18} />
                            {success}
                        </div>
                    )}

                    <div className="space-y-4">
                        <Input
                            label="Current Password"
                            type="password"
                            icon={<Lock size={18} />}
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            required
                            placeholder="Enter current password"
                        />
                        <Input
                            label="New Password"
                            type="password"
                            icon={<Lock size={18} />}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            placeholder="Minimum 4 characters"
                        />
                        <Input
                            label="Confirm New Password"
                            type="password"
                            icon={<Lock size={18} />}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Re-enter new password"
                        />
                    </div>

                    <div className="pt-2">
                        <Button 
                            type="submit" 
                            className="w-full h-12 text-lg font-bold"
                            disabled={loading || success}
                        >
                            {loading ? <Spinner size="sm" /> : 'Update Password & Continue'}
                        </Button>
                    </div>

                    <div className="text-center">
                        <button 
                            type="button" 
                            onClick={() => {
                                logout();
                                navigate('/student/login');
                            }}
                            className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            Cancel & Logout
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default StudentChangePassword;
