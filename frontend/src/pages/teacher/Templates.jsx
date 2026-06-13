import React, { useEffect, useState } from 'react';
import { Card, Table, Badge, Spinner, Toast } from '../../components/ui';
import { getExamTemplates } from '../../services/api/teacher.api';

const Templates = () => {
    const [loading, setLoading] = useState(true);
    const [templates, setTemplates] = useState([]);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await getExamTemplates();
                setTemplates(res.data || []);
            } catch {
                setToast({ type: 'error', message: 'Failed to load exam templates' });
            } finally {
                setLoading(false);
            }
        };
        fetchTemplates();
    }, []);

    if (loading) return <div className="min-h-[40vh] flex items-center justify-center"><Spinner size="lg" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Exam Templates</h1>
                <p className="text-slate-500 font-medium">Read-only scoring templates (max score fixed at 100)</p>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <Card className="p-0">
                <Table headers={['Template', 'Max Score', 'Description', 'Status']}>
                    {templates.map((template) => (
                        <tr key={template._id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-8 py-5 font-semibold text-slate-700">{template.name}</td>
                            <td className="px-8 py-5 font-mono text-slate-600 text-center">100</td>
                            <td className="px-8 py-5 text-slate-500">{template.description || '—'}</td>
                            <td className="px-8 py-5">
                                <Badge variant={template.isActive ? 'success' : 'default'}>
                                    {template.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </td>
                        </tr>
                    ))}
                    {templates.length === 0 && (
                        <tr>
                            <td colSpan="4" className="px-8 py-10 text-center text-slate-400">No templates found.</td>
                        </tr>
                    )}
                </Table>
            </Card>
        </div>
    );
};

export default Templates;
