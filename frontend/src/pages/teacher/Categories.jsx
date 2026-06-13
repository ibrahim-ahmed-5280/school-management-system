import React, { useEffect, useState } from 'react';
import { Card, Table, Badge, Spinner, Toast } from '../../components/ui';
import { getExamCategories } from '../../services/api/teacher.api';

const Categories = () => {
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await getExamCategories();
                setCategories(res.data || []);
            } catch {
                setToast({ type: 'error', message: 'Failed to load exam categories' });
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    if (loading) return <div className="min-h-[40vh] flex items-center justify-center"><Spinner size="lg" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Exam Categories</h1>
                <p className="text-slate-500 font-medium">Read-only assessment categories (e.g. Midterm, Final)</p>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <Card className="p-0">
                <Table headers={['Category', 'Description', 'Status']}>
                    {categories.map((category) => (
                        <tr key={category._id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-8 py-5 font-semibold text-slate-700">{category.name}</td>
                            <td className="px-8 py-5 text-slate-500">{category.description || '—'}</td>
                            <td className="px-8 py-5">
                                <Badge variant={category.isActive ? 'success' : 'default'}>
                                    {category.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </td>
                        </tr>
                    ))}
                    {categories.length === 0 && (
                        <tr>
                            <td colSpan="3" className="px-8 py-10 text-center text-slate-400">No categories found.</td>
                        </tr>
                    )}
                </Table>
            </Card>
        </div>
    );
};

export default Categories;
