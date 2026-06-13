import React, { useState, useEffect } from 'react';
import { Card, Button, Select, Spinner, Toast } from '../../components/ui';
import { getExams, exportResults } from '../../services/api/teacher.api';
import { Download, FileText, FileSpreadsheet, Sparkles, CheckCircle2 } from 'lucide-react';

const Exports = () => {
    const [exams, setExams] = useState([]);
    const [examId, setExamId] = useState('');
    const [format, setFormat] = useState('csv');
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [toast, setToast] = useState('');

    useEffect(() => {
        getExams().then(res => {
            setExams(res.data);
            if (res.data.length > 0) setExamId(res.data[0]._id);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleExport = async () => {
        if (!examId) return;
        setExporting(true);
        try {
            const data = await exportResults(examId, format);
            
            // Trigger download
            const url = window.URL.createObjectURL(new Blob([data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `results_${examId}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            setToast('Export successful! Check your downloads.');
        } catch {
            setToast('Failed to export. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    if (loading) return <Spinner size="lg" />;

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in py-10">
            <div className="text-center space-y-2">
                <div className="h-16 w-16 bg-gradient-to-tr from-[var(--primary)] to-[var(--secondary)] rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl mb-4 rotate-6">
                    <Download size={32} />
                </div>
                <h1 className="text-4xl font-black text-slate-800 tracking-tight">Export Data</h1>
                <p className="text-slate-500 font-medium">Generate official result sheets for administrative review.</p>
            </div>

            <Card className="border-none shadow-2xl p-8 space-y-8">
                <div className="space-y-6">
                    <Select 
                        label="Select Examination" 
                        options={exams.map(e => ({ label: `${e.name} (${e.term})`, value: e._id }))}
                        value={examId}
                        onChange={(e) => setExamId(e.target.value)}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => setFormat('csv')}
                            className={`p-6 rounded-2xl border-2 transition-all text-left flex flex-col gap-3 group
                                ${format === 'csv' 
                                    ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-inner' 
                                    : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                                }`}
                        >
                            <div className={`${format === 'csv' ? 'text-[var(--primary)]' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                <FileSpreadsheet size={32} />
                            </div>
                            <div>
                                <h4 className={`font-bold ${format === 'csv' ? 'text-slate-800' : 'text-slate-500'}`}>CSV Spreadsheet</h4>
                                <p className="text-xs text-slate-400 font-medium">Standard for Excel/Sheets</p>
                            </div>
                        </button>

                        <button 
                            onClick={() => setFormat('json')}
                            className={`p-6 rounded-2xl border-2 transition-all text-left flex flex-col gap-3 group
                                ${format === 'json' 
                                    ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-inner' 
                                    : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                                }`}
                        >
                            <div className={`${format === 'json' ? 'text-[var(--primary)]' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                <FileText size={32} />
                            </div>
                            <div>
                                <h4 className={`font-bold ${format === 'json' ? 'text-slate-800' : 'text-slate-500'}`}>JSON Data</h4>
                                <p className="text-xs text-slate-400 font-medium">Structured raw data</p>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl space-y-3">
                     <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">What's included in the export:</h5>
                     <ul className="space-y-2">
                        <IncludedItem text="Student Admission Numbers" />
                        <IncludedItem text="Full Names & Descriptions" />
                        <IncludedItem text="Broken down Subject Scores" />
                        <IncludedItem text="Computed Totals & Final Grades" />
                     </ul>
                </div>

                <Button 
                    className="w-full py-5 text-xl font-black shadow-xl disabled:opacity-50"
                    onClick={handleExport}
                    disabled={exporting || !examId}
                >
                    {exporting ? (
                        <>
                            <Spinner size="sm" /> 
                            <span className="ml-2">Compiling Records...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles size={24} className="mr-2" />
                            Generate Official Export
                        </>
                    )}
                </Button>
            </Card>

            {toast && <Toast message={toast} onClose={() => setToast('')} />}
        </div>
    );
};

const IncludedItem = ({ text }) => (
    <li className="flex items-center gap-2 text-sm font-bold text-slate-600">
        <CheckCircle2 size={14} className="text-green-500" />
        {text}
    </li>
);

export default Exports;


