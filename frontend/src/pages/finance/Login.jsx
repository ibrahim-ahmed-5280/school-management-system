import React, { useState } from 'react';
import { Eye, EyeOff, Landmark, Lock, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import { useAuth } from '../../context/AuthContext';

const FinanceLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [tenantDomain, setTenantDomain] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { financeLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        try {
            await financeLogin(email, password, tenantDomain);
            navigate('/finance', { replace: true });
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Finance director sign-in failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Finance Director Portal"
            subtitle="Sign in with the separate finance director account created by your school administrator."
            backTo="/login"
            backLabel="Use another portal"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold leading-5 text-emerald-800">
                    <span className="flex items-center gap-2 font-black uppercase tracking-wider">
                        <Landmark size={15} />
                        Finance-only access
                    </span>
                    School super-admin credentials cannot open this dashboard.
                </div>

                {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                        {error}
                    </div>
                )}

                <label className="block">
                    <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Finance Director Email</span>
                    <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="finance@school.com"
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                            required
                        />
                    </div>
                </label>

                <label className="block">
                    <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                        Institution Domain <span className="font-normal text-slate-400">(needed when emails are duplicated)</span>
                    </span>
                    <input
                        type="text"
                        value={tenantDomain}
                        onChange={(event) => setTenantDomain(event.target.value)}
                        placeholder="e.g. al-nuur"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />
                </label>

                <label className="block">
                    <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Password</span>
                    <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Enter finance director password"
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-11 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((current) => !current)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </label>

                <button
                    type="submit"
                    disabled={loading}
                    className="h-11 w-full rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? 'Signing In...' : 'Open Finance Dashboard'}
                </button>

                <p className="text-center text-xs font-semibold leading-5 text-slate-500">
                    Need an account? Ask the school super admin to create a Finance Director from{' '}
                    <Link to="/login" className="font-black text-slate-800 hover:underline">School Admin &gt; Users</Link>.
                </p>
            </form>
        </AuthLayout>
    );
};

export default FinanceLogin;
