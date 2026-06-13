import React, { useCallback, useEffect, useState } from 'react';
import { getStudents } from '../../services/api/registrar.api';
import { getClasses } from '../../services/api/branch.api';
import { Table, Button, Spinner, Badge, Input } from '../../components/ui';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

const Students = () => {
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ classId: '', status: '', q: '' });
    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [stdRes, clsRes] = await Promise.all([
                getStudents(filters),
                // Only fetch classes once ideally, but here simplicity
                getClasses() 
            ]);
            setStudents(stdRes.data.data || stdRes.data); // data might be nested
            setClasses(clsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(fetchData, 500);
        return () => clearTimeout(timer);
    }, [fetchData]);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Students Directory</h1>

            <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none"
                        placeholder="Search by name or admission no..."
                        value={filters.q}
                        onChange={(e) => setFilters({...filters, q: e.target.value})}
                    />
                </div>
                
                <select 
                    className="border rounded-lg px-4 py-2"
                    value={filters.classId}
                    onChange={(e) => setFilters({...filters, classId: e.target.value})}
                >
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>

                <select 
                    className="border rounded-lg px-4 py-2"
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Transferred">Transferred</option>
                </select>
            </div>

            {loading ? <Spinner /> : (
                <Table headers={['Student ID', 'Name', 'Status', 'Guardian', 'Actions']}>
                    {students.map(s => (
                        <tr 
                            key={s._id} 
                            className="hover:bg-slate-50 cursor-pointer" 
                            onClick={() => navigate(`/registrar/students/${s._id}`)}
                        >
                            <td className="px-6 py-4 font-mono font-medium">{s.admissionNumber}</td>
                            <td className="px-6 py-4 font-semibold text-slate-700">{s.firstName} {s.lastName}</td>
                            <td className="px-6 py-4">
                                <Badge variant={s.status === 'Active' ? 'success' : 'default'}>{s.status}</Badge>
                            </td>
                            <td className="px-6 py-4">{s.guardianInfo?.name}</td>
                            <td className="px-6 py-4">
                                <Button variant="ghost" size="sm">View</Button>
                            </td>
                        </tr>
                    ))}
                    {students.length === 0 && <tr><td colSpan="5" className="text-center py-8 text-slate-500">No students found.</td></tr>}
                </Table>
            )}
        </div>
    );
};

export default Students;


