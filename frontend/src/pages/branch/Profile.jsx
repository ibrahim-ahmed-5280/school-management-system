import React, { useEffect, useState } from 'react';
import { getBranchProfile, updateBranchProfile } from '../../services/api/branch.api';
import { Input, Button, Card, Spinner, Toast } from '../../components/ui';

const Profile = () => {
    const [profile, setProfile] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await getBranchProfile();
                setProfile(res.data);
            } catch (err) {
                console.error(err);
                setMessage({ type: 'error', text: 'Failed to load profile' });
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            await updateBranchProfile(profile);
            setMessage({ type: 'success', text: 'Profile updated successfully' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Spinner />;

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Branch Profile</h1>
            
            {message && (
                <Toast 
                    message={message.text} 
                    type={message.type} 
                    onClose={() => setMessage(null)} 
                />
            )}

            <Card className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input 
                            label="Branch Name" 
                            value={profile.name || ''} 
                            disabled 
                            className="bg-slate-100 cursor-not-allowed"
                        />
                        <Input 
                            label="Branch Code" 
                            value={profile.code || ''} 
                            disabled 
                            className="bg-slate-100 cursor-not-allowed"
                        />
                    </div>

                    <Input 
                        label="Address" 
                        name="address"
                        value={profile.address || ''} 
                        onChange={handleChange}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input 
                            label="Phone" 
                            name="phone"
                            value={profile.phone || ''} 
                            onChange={handleChange}
                        />
                        <Input 
                            label="Email" 
                            name="email"
                            type="email"
                            value={profile.email || ''} 
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Receipt Footer</label>
                        <textarea
                            name="receiptFooter"
                            value={profile.receiptFooter || ''}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-all h-24"
                        />
                    </div>
                    
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Saving...' : 'Update Profile'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default Profile;


