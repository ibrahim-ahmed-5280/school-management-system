import React, { useState, useEffect } from 'react';
import { Check, X, Calendar, User, MessageSquare, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const StaffLeavesManager = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviewModal, setReviewModal] = useState(null); // hold leave object being reviewed
    const [reviewRemarks, setReviewRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/hr/leaves');
            if (res.data?.success) {
                setRequests(res.data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleReview = async (status) => {
        if (!reviewModal) return;
        setSubmitting(true);
        try {
            await api.put(`/hr/leaves/${reviewModal._id}/review`, {
                status,
                reviewRemarks
            });
            setReviewModal(null);
            setReviewRemarks('');
            fetchRequests();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to review request');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                    Leaves Manager
                </h1>
                <p className="text-slate-400 font-medium text-xs">Review and process leave requests for staff and instructors.</p>
            </div>

            {requests.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-6 text-center max-w-md mx-auto shadow-sm">
                    <Calendar className="mx-auto text-slate-300 mb-4" size={36} />
                    <h3 className="text-lg font-bold text-slate-800 mb-1">No Leave Requests</h3>
                    <p className="text-slate-500 text-sm">
                        There are currently no staff leave requests logged.
                    </p>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/20">
                                    <th className="p-6">Employee</th>
                                    <th className="p-6">Type</th>
                                    <th className="p-6">Duration</th>
                                    <th className="p-6">Reason</th>
                                    <th className="p-6">Status</th>
                                    <th className="p-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map(request => (
                                    <tr key={request._id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold">
                                                    {request.userId?.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900">{request.userId?.name}</p>
                                                    <p className="text-xs text-slate-400 capitalize font-bold">{request.userId?.role}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 font-black text-slate-800">{request.type}</td>
                                        <td className="p-6 text-sm text-slate-600 font-bold">
                                            <div>{new Date(request.startDate).toLocaleDateString()}</div>
                                            <div className="text-xs text-slate-400 font-bold">to {new Date(request.endDate).toLocaleDateString()}</div>
                                        </td>
                                        <td className="p-6 text-sm text-slate-500 font-bold max-w-xs truncate">
                                            {request.reason}
                                        </td>
                                        <td className="p-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                                                request.status === 'Approved' 
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                    : request.status === 'Rejected'
                                                    ? 'bg-rose-50 text-rose-600 border-rose-100'
                                                    : 'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                                {request.status}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            {request.status === 'Pending' ? (
                                                <button 
                                                    onClick={() => setReviewModal(request)}
                                                    className="h-10 px-6 bg-slate-900 hover:bg-[var(--primary)] text-white rounded-xl transition-all font-black text-[10px] tracking-widest uppercase"
                                                >
                                                    Review
                                                </button>
                                            ) : (
                                                <span className="text-xs font-bold text-slate-400 italic">
                                                    Reviewed by {request.reviewedBy?.name || 'Admin'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Review Leave Modal */}
            {reviewModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setReviewModal(null)} />
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl relative z-10 overflow-hidden flex flex-col max-h-full animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-slate-205 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-805">Review Leave</h3>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Review Time Off Details</p>
                            </div>
                            <button onClick={() => setReviewModal(null)} className="p-1.5 hover:bg-slate-205 rounded-lg transition-all shadow-sm">
                                <X size={16} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            <div className="bg-slate-50 p-4 rounded-xl space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Leave Details</p>
                                <p className="text-sm font-semibold text-slate-800">Applicant: {reviewModal.userId?.name}</p>
                                <p className="text-sm text-slate-605">Type: {reviewModal.type}</p>
                                <p className="text-xs text-slate-500">
                                    Duration: {new Date(reviewModal.startDate).toLocaleDateString()} to {new Date(reviewModal.endDate).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-slate-600 italic mt-2 border-t border-slate-200/50 pt-2">Reason: "{reviewModal.reason}"</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-505 uppercase tracking-wider">Admin Remarks</label>
                                <textarea 
                                    rows="3"
                                    placeholder="Provide remarks or reason for approval/rejection..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all resize-none"
                                    value={reviewRemarks}
                                    onChange={(e) => setReviewRemarks(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => handleReview('Approved')}
                                    disabled={submitting}
                                    className="h-10 bg-emerald-600 text-white rounded-lg font-semibold tracking-wider text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-700 transition-all"
                                >
                                    <Check size={16} />
                                    APPROVE
                                </button>
                                <button 
                                    onClick={() => handleReview('Rejected')}
                                    disabled={submitting}
                                    className="h-10 bg-rose-600 text-white rounded-lg font-semibold tracking-wider text-xs flex items-center justify-center gap-1.5 hover:bg-rose-700 transition-all"
                                >
                                    <X size={16} />
                                    REJECT
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffLeavesManager;
