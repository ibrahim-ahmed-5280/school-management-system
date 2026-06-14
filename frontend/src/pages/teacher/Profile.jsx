import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Spinner, Toast } from '../../components/ui';
import { getProfile, updateProfile, changePassword } from '../../services/api/teacher.api';
import { User, Phone, MapPin, Key, Mail, Shield } from 'lucide-react';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingProfile, setUpdatingProfile] = useState(false);
    const [updatingPassword, setUpdatingPassword] = useState(false);
    const [toast, setToast] = useState(null);

    // Profile form state
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    // Password form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            const res = await getProfile();
            setProfile(res.data);
            setName(res.data.name || '');
            setPhone(res.data.phone || '');
            setAddress(res.data.address || '');
        } catch {
            setToast({ type: 'error', message: 'Failed to load profile details' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setUpdatingProfile(true);
        try {
            const res = await updateProfile({ name, phone, address });
            setProfile(res.data);
            setToast({ type: 'success', message: 'Profile details updated successfully' });
        } catch (error) {
            setToast({ type: 'error', message: error.response?.data?.message || 'Failed to update profile' });
        } finally {
            setUpdatingProfile(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword.length < 8) {
            setToast({ type: 'error', message: 'New password must be at least 8 characters long' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setToast({ type: 'error', message: 'New passwords do not match' });
            return;
        }

        setUpdatingPassword(true);
        try {
            await changePassword({ currentPassword, newPassword, confirmPassword });
            setToast({ type: 'success', message: 'Password updated successfully' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            setToast({ type: 'error', message: error.response?.data?.message || 'Failed to change password' });
        } finally {
            setUpdatingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
            {/* Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-[var(--primary)] to-indigo-900 rounded-3xl p-8 md:p-12 text-white shadow-xl">
                <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative flex flex-col md:flex-row items-center gap-6 z-10">
                    <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl font-black shadow-inner border border-white/10">
                        {profile?.name?.charAt(0).toUpperCase() || 'T'}
                    </div>
                    <div className="text-center md:text-left space-y-1">
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight">{profile?.name}</h1>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm font-semibold opacity-90">
                            <span className="flex items-center gap-1"><Mail size={16} /> {profile?.email}</span>
                            <span className="flex items-center gap-1"><Shield size={16} /> Role: {String(profile?.role).toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile Settings */}
                <Card title="Personal Details" className="border-none shadow-sm p-6 space-y-4">
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                    <User size={18} />
                                </span>
                                <Input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your full name"
                                    className="pl-10 w-full"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                    <Phone size={18} />
                                </span>
                                <Input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Enter phone number"
                                    className="pl-10 w-full"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Address</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                    <MapPin size={18} />
                                </span>
                                <Input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Enter home/office address"
                                    className="pl-10 w-full"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full flex justify-center py-3 font-bold"
                            disabled={updatingProfile}
                        >
                            {updatingProfile ? 'Saving Details...' : 'Save Profile Details'}
                        </Button>
                    </form>
                </Card>

                {/* Password Change */}
                <Card title="Security Settings" className="border-none shadow-sm p-6 space-y-4">
                    <form onSubmit={handleChangePassword} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Password</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                    <Key size={18} />
                                </span>
                                <Input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="pl-10 w-full"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">New Password (min 8 chars)</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                    <Key size={18} />
                                </span>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="pl-10 w-full"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Confirm New Password</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                    <Key size={18} />
                                </span>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="pl-10 w-full"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="secondary"
                            className="w-full flex justify-center py-3 font-bold"
                            disabled={updatingPassword}
                        >
                            {updatingPassword ? 'Updating Password...' : 'Change Password'}
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default Profile;
