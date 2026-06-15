import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Mail, School, User, Eye, EyeOff, Clock, CheckCircle2, ArrowLeft, Mail as MailIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import platformService from '../services/platformService';

const NAVY      = '#1b2a4a';
const BLUE      = '#4477f5';
const BLUE_LITE = '#e8f0fe';

const RegisterTenant = () => {
    const [formData, setFormData] = useState({
        schoolName: '',
        domain: '',
        adminName: '',
        email: '',
        password: '',
        plan: '',
        billingCycle: 'monthly'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pendingData, setPendingData] = useState(null);
    const [registrationEnabled, setRegistrationEnabled] = useState(true);
    const [plans, setPlans] = useState([]);
    const [checkingRegistration, setCheckingRegistration] = useState(true);
    const { registerTenant } = useAuth();

    useEffect(() => {
        Promise.all([platformService.getPublicSettings(), platformService.getPublicPlans()])
            .then(([settingsResponse, plansResponse]) => {
                const settings = settingsResponse.data || {};
                const activePlans = plansResponse.data || [];
                setRegistrationEnabled(settings.isRegistrationEnabled !== false);
                setPlans(activePlans);
                setFormData(current => ({
                    ...current,
                    plan: current.plan || settings.defaultPlan || activePlans[0]?.slug || ''
                }));
            })
            .catch(() => setError('Could not load platform registration settings. Please try again.'))
            .finally(() => setCheckingRegistration(false));
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await registerTenant(formData);
            setPendingData({ schoolName: formData.schoolName, email: formData.email });
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Pending approval screen ──────────────────────────────
    if (pendingData) {
        return (
            <div className="public-page min-h-screen flex items-center justify-center px-6 py-12"
                style={{ background: `linear-gradient(160deg, ${BLUE_LITE} 0%, #f8faff 60%, #fff 100%)` }}>
                <div className="w-full max-w-md">
                    <Link to="/" className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold mb-8 group"
                        style={{ color: NAVY }}>
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" style={{ color: BLUE }} />
                        Back to Home
                    </Link>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_40px_rgba(27,42,74,0.10)] overflow-hidden">
                        <div className="px-8 py-6 text-center" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #2a3a5c 100%)` }}>
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                style={{ background: 'rgba(255,255,255,0.12)' }}>
                                <Clock size={30} className="text-white" />
                            </div>
                            <h1 className="text-2xl font-extrabold text-white mb-1">Registration Submitted!</h1>
                            <p className="text-white/60 text-sm font-medium">Your account is pending platform approval</p>
                        </div>

                        <div className="px-8 py-8 space-y-5">
                            <div className="flex items-center gap-3 p-4 rounded-xl border"
                                style={{ background: BLUE_LITE, borderColor: '#c7d9fd' }}>
                                <School size={18} style={{ color: BLUE, flexShrink: 0 }} />
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">School</p>
                                    <p className="font-extrabold text-sm" style={{ color: NAVY }}>{pendingData.schoolName}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50">
                                <MailIcon size={18} className="text-slate-400 flex-shrink-0" />
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Email</p>
                                    <p className="font-semibold text-sm text-slate-700">{pendingData.email}</p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">What Happens Next</p>
                                {[
                                    { done: true,  text: 'Your registration has been received' },
                                    { done: false, text: 'Platform admin will review your application' },
                                    { done: false, text: 'You will receive an email once approved' },
                                    { done: false, text: 'Sign in using the credentials you just created' },
                                ].map(({ done, text }, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold ${!done ? 'bg-slate-200 text-slate-400' : ''}`}
                                            style={done ? { background: BLUE } : {}}>
                                            {done ? <CheckCircle2 size={13} /> : i + 1}
                                        </div>
                                        <p className={`text-sm font-medium leading-snug ${done ? 'text-slate-700' : 'text-slate-400'}`}>{text}</p>
                                    </div>
                                ))}
                            </div>

                            <Link to="/login"
                                className="block w-full text-center py-3 rounded-xl font-bold text-sm text-white mt-2 hover:opacity-90 transition-opacity shadow-md"
                                style={{ background: NAVY }}>
                                Go to Sign In
                            </Link>
                            <Link to="/" className="block text-center text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors">
                                ← Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Registration form ────────────────────────────────────
    if (checkingRegistration) {
        return <div className="min-h-screen flex items-center justify-center text-sm font-semibold text-slate-500">Checking registration availability...</div>;
    }

    if (!registrationEnabled) {
        return (
            <AuthLayout title="Registration Unavailable" subtitle="New school registration is currently disabled." backTo="/" backLabel="Back to Home">
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800">
                    School registration is currently disabled. Please contact platform support or try again later.
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Register Your School"
            subtitle="Create your school account and admin profile in one step."
            backTo="/"
            backLabel="Back to Home"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                        {error}
                    </div>
                )}

                <div className="flex items-start gap-3 p-3 rounded-xl border text-[12px] font-medium"
                    style={{ background: BLUE_LITE, borderColor: '#c7d9fd', color: '#2a4a8c' }}>
                    <Clock size={14} className="mt-0.5 flex-shrink-0" style={{ color: BLUE }} />
                    <span>After registration, your account must be approved by the platform admin before you can sign in.</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                        <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">School Name</span>
                        <div className="relative">
                            <School size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input name="schoolName" type="text" placeholder="e.g. Al-Nuur Academy"
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-slate-800 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#4477f5] focus:bg-white focus:ring-4 focus:ring-[#4477f5]/10"
                                value={formData.schoolName} onChange={handleChange} required />
                        </div>
                    </label>
                    <label className="block">
                        <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Domain Slug</span>
                        <input name="domain" type="text" placeholder="e.g. al-nuur"
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-800 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#4477f5] focus:bg-white focus:ring-4 focus:ring-[#4477f5]/10"
                            value={formData.domain} onChange={handleChange} required />
                    </label>
                </div>

                <label className="block">
                    <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Admin Name</span>
                    <div className="relative">
                        <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input name="adminName" type="text" placeholder="Your full name"
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-slate-800 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#4477f5] focus:bg-white focus:ring-4 focus:ring-[#4477f5]/10"
                            value={formData.adminName} onChange={handleChange} required />
                    </div>
                </label>

                <label className="block">
                    <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Admin Email</span>
                    <div className="relative">
                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input name="email" type="email" placeholder="admin@yourschool.com"
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-slate-800 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#4477f5] focus:bg-white focus:ring-4 focus:ring-[#4477f5]/10"
                            value={formData.email} onChange={handleChange} required />
                    </div>
                </label>

                {plans.length > 0 && (
                    <label className="block">
                        <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Subscription Plan</span>
                        <select name="plan" value={formData.plan} onChange={handleChange} required
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-800 text-sm outline-none transition-all focus:border-[#4477f5] focus:bg-white focus:ring-4 focus:ring-[#4477f5]/10">
                            {plans.map(plan => (
                                <option key={plan._id || plan.slug} value={plan.slug}>
                                    {plan.name} - {typeof plan.price === 'number' ? `$${plan.price}/${plan.billingCycle || 'month'}` : plan.price}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                <label className="block">
                    <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Billing Cycle</span>
                    <select name="billingCycle" value={formData.billingCycle} onChange={handleChange} required
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-800 text-sm outline-none transition-all focus:border-[#4477f5] focus:bg-white focus:ring-4 focus:ring-[#4477f5]/10">
                        <option value="monthly">Monthly billing</option>
                        <option value="yearly">Yearly billing</option>
                    </select>
                </label>

                <label className="block">
                    <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Password</span>
                    <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Create a strong password"
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-11 text-slate-800 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#4477f5] focus:bg-white focus:ring-4 focus:ring-[#4477f5]/10"
                            value={formData.password} onChange={handleChange} required />
                        <button type="button" onClick={() => setShowPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    </div>
                </label>

                <button type="submit" disabled={loading}
                    className="w-full h-11 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed shadow-md mt-2"
                    style={{ background: NAVY }}>
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Creating Account...
                        </span>
                    ) : 'Register School'}
                </button>

                <p className="text-center text-sm text-slate-500 pt-1">
                    Already have an account?{' '}
                    <Link to="/login" className="font-bold hover:underline" style={{ color: NAVY }}>Sign In</Link>
                </p>
            </form>
        </AuthLayout>
    );
};

export default RegisterTenant;
