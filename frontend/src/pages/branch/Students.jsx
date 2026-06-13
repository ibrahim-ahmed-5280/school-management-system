import React, { useCallback, useEffect, useState } from 'react';
import { getStudents, getClasses } from '../../services/api/branch.api';
import { Table, Spinner, Toast, Badge } from '../../components/ui';

const Students = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState([]);
    const [filters, setFilters] = useState({ classId: '', status: 'Active', q: '' });
    const [toast, setToast] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [studentRes, classRes] = await Promise.all([
                getStudents(filters),
                getClasses()
            ]);
            setStudents(studentRes.data);
            setClasses(classRes.data);
        } catch {
            setToast({ type: 'error', message: 'Failed to load data' });
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]); // Re-fetch when filters change

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Student Directory</h1>
            </div>

            <div className="flex flex-wrap gap-4 bg-white p-4 rounded-lg border shadow-sm items-end">
                <div className="w-full sm:w-auto min-w-[200px]">
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Filter by Class</label>
                    <select 
                        className="w-full px-3 py-2 border rounded-lg"
                        value={filters.classId}
                        onChange={(e) => handleFilterChange('classId', e.target.value)}
                    >
                        <option value="">All Classes</option>
                        {classes.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                
                <div className="w-full sm:w-auto min-w-[200px]">
                     <label className="text-sm font-medium text-slate-700 mb-1 block">Status</label>
                     <select 
                        className="w-full px-3 py-2 border rounded-lg"
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                     >
                        <option value="">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Transferred">Transferred</option>
                        <option value="Graduated">Graduated</option>
                    </select>
                </div>

                <input
                    className="flex-1 min-w-56 px-3 py-2 border rounded-lg text-sm"
                    placeholder="Search by name or admission number"
                    value={filters.q}
                    onChange={(event) => handleFilterChange('q', event.target.value)}
                />
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {loading ? <Spinner /> : (
                <Table headers={['Adm. No.', 'Name', 'Status', 'Guardian', 'Phone']}>
                    {students.map(std => (
                        <tr key={std._id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-mono text-xs">{std.admissionNumber}</td>
                            <td className="px-6 py-4 font-medium">{std.firstName} {std.lastName}</td>
                            <td className="px-6 py-4">
                                <Badge variant={std.status === 'Active' ? 'success' : 'default'}>
                                    {std.status}
                                </Badge>
                            </td>
                             <td className="px-6 py-4">{std.guardianInfo?.name || '-'}</td>
                             <td className="px-6 py-4">{std.guardianInfo?.phone || '-'}</td>
                        </tr>
                    ))}
                    {students.length === 0 && (
                        <tr><td colSpan="5" className="text-center py-6 text-slate-500">No students found.</td></tr>
                    )}
                </Table>
            )}
        </div>
    );
};

export default Students;
