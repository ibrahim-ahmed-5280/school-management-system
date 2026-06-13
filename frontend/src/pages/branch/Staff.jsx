import React, { useCallback, useEffect, useState } from 'react';
import { getBranchUsers, createBranchUser, updateBranchUser } from '../../services/api/branch.api';
import { Table, Button, Modal, Input, Spinner, Toast, Badge, Select } from '../../components/ui';
import { Plus, Edit2, UserCheck, UserX } from 'lucide-react';

const Staff = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [currentItem, setCurrentItem] = useState({ name: '', email: '', password: '', role: 'teacher' });
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [filterRole, setFilterRole] = useState('');

    const fetchStaff = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getBranchUsers(filterRole);
            setStaff(res.data);
        } catch {
            setToast({ type: 'error', message: 'Failed to load staff' });
        } finally {
            setLoading(false);
        }
    }, [filterRole]);

    useEffect(() => {
        fetchStaff();
    }, [fetchStaff]);

    const handleOpenCreate = () => {
        setModalMode('create');
        setCurrentItem({ name: '', email: '', password: '', role: 'teacher' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (user) => {
        setModalMode('edit');
        setCurrentItem({ ...user, password: '' }); // Don't show hash
        setIsModalOpen(true);
    };

    const handleToggleStatus = async (user) => {
        try {
            await updateBranchUser(user._id, { isActive: !user.isActive });
            setToast({ type: 'success', message: `User ${user.isActive ? 'deactivated' : 'activated'}` });
            fetchStaff();
        } catch {
            setToast({ type: 'error', message: 'Failed to update status' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (modalMode === 'create') {
                await createBranchUser(currentItem);
                setToast({ type: 'success', message: 'Staff member created successfully' });
            } else {
                const updateData = { ...currentItem };
                if (!updateData.password) delete updateData.password; // Don't send empty pwd
                await updateBranchUser(currentItem._id, updateData);
                setToast({ type: 'success', message: 'Staff member updated successfully' });
            }
            setIsModalOpen(false);
            fetchStaff();
        } catch (err) {
             setToast({ type: 'error', message: err.response?.data?.message || 'Operation failed' });
        } finally {
            setSaving(false);
        }
    };

    // Branch Admin can only create these roles
    const allowedRoles = [
        { value: 'teacher', label: 'Teacher' },
        { value: 'cashier', label: 'Cashier' },
        { value: 'registrar', label: 'Registrar' }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Staff Management</h1>
                <Button onClick={handleOpenCreate} className="flex items-center gap-2">
                    <Plus size={18} /> Add Staff
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Filter Role:</span>
                <select 
                    className="border rounded-lg px-3 py-1"
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                >
                    <option value="">All Roles</option>
                    {allowedRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {loading ? <Spinner /> : (
                <Table headers={['Name', 'Email', 'Role', 'Status', 'Actions']}>
                    {staff.map(user => (
                        <tr key={user._id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium">{user.name}</td>
                            <td className="px-6 py-4">{user.email}</td>
                            <td className="px-6 py-4"><Badge variant="primary">{user.role}</Badge></td>
                            <td className="px-6 py-4">
                                <Badge variant={user.isActive ? 'success' : 'danger'}>
                                    {user.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </td>
                            <td className="px-6 py-4 flex gap-2">
                                <button onClick={() => handleOpenEdit(user)} className="text-blue-600 hover:text-blue-800" title="Edit">
                                    <Edit2 size={18} />
                                </button>
                                <button onClick={() => handleToggleStatus(user)} className={user.isActive ? "text-red-500 hover:text-red-700" : "text-green-500 hover:text-green-700"} title={user.isActive ? "Deactivate" : "Activate"}>
                                    {user.isActive ? <UserX size={18} /> : <UserCheck size={18} />}
                                </button>
                            </td>
                        </tr>
                    ))}
                    {staff.length === 0 && (
                        <tr><td colSpan="5" className="text-center py-6 text-slate-500">No staff found.</td></tr>
                    )}
                </Table>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`${modalMode === 'create' ? 'Add' : 'Edit'} Staff`}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input 
                        label="Full Name" 
                        value={currentItem.name} 
                        onChange={e => setCurrentItem({...currentItem, name: e.target.value})}
                        required
                    />
                    <Input 
                        label="Email" 
                        type="email"
                        value={currentItem.email} 
                        onChange={e => setCurrentItem({...currentItem, email: e.target.value})}
                        required
                        disabled={modalMode === 'edit'} // Usually email is ID
                    />
                    <Input 
                        label={modalMode === 'edit' ? "New Password (leave blank to keep)" : "Password"}
                        type="password"
                        value={currentItem.password} 
                        onChange={e => setCurrentItem({...currentItem, password: e.target.value})}
                        required={modalMode === 'create'}
                    />
                    
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Role</label>
                        <select 
                            className="w-full px-4 py-2 border rounded-lg"
                            value={currentItem.role}
                            onChange={(e) => setCurrentItem({...currentItem, role: e.target.value})}
                            disabled={modalMode === 'edit'} // Prevent role change if not desired
                        >
                            {allowedRoles.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Staff'}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Staff;
