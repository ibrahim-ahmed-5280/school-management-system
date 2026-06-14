import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    BookOpen, Users, BarChart3, ChevronRight,
    Activity, CalendarCheck, Clock, GraduationCap, CheckCircle2,
    ArrowRight, Star, Building2, Globe, Zap, TrendingUp,
    Menu, X, Shield, Sparkles, Loader2
} from 'lucide-react';
import platformService from '../services/platformService';
import { API_ORIGIN } from '../services/api';

/* ─── Brand tokens (public / platform only) ─────────────────── */
const NAVY      = '#1b2a4a';
const NAVY_MID  = '#2a3a5c';
const BLUE      = '#4477f5';
const BLUE_SOFT = '#c7d9fd';
const BLUE_LITE = '#e8f0fe';

const Landing = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [stats, setStats] = useState(null);
    const [plans, setPlans] = useState([]);
    const [plansLoading, setPlansLoading] = useState(true);
    const [platformSettings, setPlatformSettings] = useState({ platformName: 'MadrasaHub', isRegistrationEnabled: true });

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 16);
        window.addEventListener('scroll', fn);
        return () => window.removeEventListener('scroll', fn);
    }, []);

    // Fetch live stats and plans from backend
    useEffect(() => {
        platformService.getPublicStats()
            .then(res => setStats(res.data))
            .catch(() => {}); // silently fall back to null
        platformService.getPublicPlans()
            .then(res => setPlans(res.data || []))
            .catch(() => setPlans([]))
            .finally(() => setPlansLoading(false));
        platformService.getPublicSettings()
            .then(res => setPlatformSettings(current => ({ ...current, ...(res.data || {}) })))
            .catch(() => {});
    }, []);

    const registrationOpen = platformSettings.isRegistrationEnabled !== false;

    return (
        <div className="public-page min-h-screen bg-white text-slate-900 overflow-x-hidden">

            {/* ══════════ NAVBAR ══════════ */}
            <nav
                className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
                    scrolled
                        ? 'bg-white/95 backdrop-blur-lg shadow-[0_1px_24px_rgba(27,42,74,0.08)] border-b border-slate-100'
                        : 'bg-transparent'
                }`}
            >
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        {platformSettings.logoUrl ? (
                            <img src={platformSettings.logoUrl.startsWith('http') ? platformSettings.logoUrl : `${API_ORIGIN}${platformSettings.logoUrl}`} alt={platformSettings.platformName} className="w-9 h-9 object-contain rounded-xl" />
                        ) : (
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform"
                                style={{ background: NAVY }}
                            >
                                <GraduationCap size={18} className="text-white" />
                            </div>
                        )}
                        <span className="text-[1.15rem] font-extrabold tracking-tight" style={{ color: NAVY }}>
                            {platformSettings.platformName}
                        </span>
                    </Link>

                    {/* Desktop links */}
                    <div className="hidden md:flex items-center gap-7">
                        {[['#features','Features'],['#modules','Modules'],['#pricing','Pricing']].map(([href, label]) => (
                            <a
                                key={href}
                                href={href}
                                className="text-[0.85rem] font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                            >
                                {label}
                            </a>
                        ))}
                        <Link
                            to="/login"
                            className="text-[0.85rem] font-bold transition-colors hover:opacity-80"
                            style={{ color: NAVY }}
                        >
                            Sign In
                        </Link>
                        {registrationOpen && <NavCTA to="/register" label="Get Started Free" />}
                    </div>

                    {/* Mobile toggle */}
                    <button
                        className="md:hidden p-2 rounded-lg transition-colors hover:bg-slate-100"
                        onClick={() => setMenuOpen(v => !v)}
                    >
                        {menuOpen ? <X size={22} style={{ color: NAVY }} /> : <Menu size={22} style={{ color: NAVY }} />}
                    </button>
                </div>

                {/* Mobile drawer */}
                {menuOpen && (
                    <div className="md:hidden border-t border-slate-100 bg-white px-6 py-4 space-y-1 shadow-xl">
                        {[['#features','Features'],['#modules','Modules'],['#pricing','Pricing']].map(([href, label]) => (
                            <a key={href} href={href} onClick={() => setMenuOpen(false)}
                                className="block py-2.5 text-sm font-semibold text-slate-600">
                                {label}
                            </a>
                        ))}
                        <Link to="/login" onClick={() => setMenuOpen(false)}
                            className="block py-2.5 text-sm font-bold" style={{ color: NAVY }}>
                             Sign In
                        </Link>
                        {registrationOpen ? (
                            <Link
                                to="/register"
                                onClick={() => setMenuOpen(false)}
                                className="block mt-2 text-center py-3 rounded-xl text-sm font-bold text-white shadow-md"
                                style={{ background: NAVY }}
                            >
                                Get Started Free
                            </Link>
                        ) : (
                            <div className="block mt-2 text-center py-3 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-100">
                                School registration is currently closed.
                            </div>
                        )}
                    </div>
                )}
            </nav>

            {/* ══════════ HERO ══════════ */}
            <section className="relative pt-28 pb-24 overflow-hidden" style={{ background: `linear-gradient(160deg, ${BLUE_LITE} 0%, #f8faff 55%, #ffffff 100%)` }}>
                {/* Decorative blobs */}
                <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full opacity-40 blur-3xl pointer-events-none" style={{ background: BLUE_SOFT }} />
                <div className="absolute -bottom-24 -left-24 w-[380px] h-[380px] rounded-full opacity-30 blur-3xl pointer-events-none" style={{ background: BLUE_SOFT }} />

                <div className="relative max-w-6xl mx-auto px-6 text-center">
                    {/* Badge */}
                    <div
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[0.7rem] font-bold tracking-widest uppercase mb-8 border"
                        style={{ background: BLUE_LITE, color: BLUE, borderColor: BLUE_SOFT }}
                    >
                        <Sparkles size={11} />
                        Multi-School Management Platform
                        <span className="flex h-2 w-2 rounded-full animate-ping" style={{ background: BLUE }} />
                    </div>

                    <h1
                        className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.06] mb-6 max-w-4xl mx-auto"
                        style={{ color: NAVY }}
                    >
                        Manage Every School
                        <span className="block" style={{ color: BLUE }}> In One Place</span>
                    </h1>

                    <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto mb-10">
                        {platformSettings.platformName} is a modern all-in-one platform for managing multiple schools — fees, students, teachers, results, and more — all in one secure place.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                        {registrationOpen ? (
                            <HeroCTA to="/register" primary label="Get Started Free" icon={<ArrowRight size={17} />} />
                        ) : (
                            <div className="inline-flex items-center justify-center border border-amber-200 bg-amber-50 px-6 py-4 rounded-2xl text-[0.95rem] font-bold text-amber-800 shadow-sm cursor-default">
                                School registration is currently closed.
                            </div>
                        )}
                        <HeroCTA to="/login" label="Sign In to Your Account" />
                    </div>

                    {/* ── Dashboard mockup — live data preview ── */}
                    <div className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden border border-slate-200 shadow-[0_30px_80px_rgba(27,42,74,0.15)] bg-white">
                        {/* Window chrome */}
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100" style={{ background: NAVY }}>
                            <div className="flex gap-1.5">
                                <span className="h-3 w-3 rounded-full bg-rose-400/80" />
                                <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                                <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-white/50">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                {platformSettings.platformName} · Global Network Console
                            </div>
                            <div className="w-16" />
                        </div>

                        {/* Stat row using real system stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 text-left divide-x divide-slate-100" style={{ background: '#f7f9ff' }}>
                            {[
                                { label: 'Active Institutions', value: stats ? (stats.activeSchools || 0).toLocaleString() : '0', trend: 'Live' },
                                { label: 'Total Branches', value: stats ? (stats.totalBranches || 0).toLocaleString() : '0', trend: 'Live' },
                                { label: 'Students Registered', value: stats ? (stats.totalStudents || 0).toLocaleString() : '0', trend: 'Live' },
                                { label: 'Active Plans', value: stats ? (stats.activePlans || 0).toLocaleString() : '0', trend: 'Live' },
                            ].map(({ label, value, trend }) => (
                                <div key={label} className="p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
                                    <p className="text-xl font-extrabold" style={{ color: NAVY }}>{value}</p>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 inline-block bg-emerald-50 text-emerald-700">
                                        {trend}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Progress bars */}
                        <div className="p-5 grid sm:grid-cols-2 gap-5 bg-white border-t border-slate-100">
                            {[
                                { label: 'Real-Time System Health', pct: 100, color: NAVY },
                                { label: 'Active Service Availability', pct: 100, color: BLUE },
                            ].map(({ label, pct, color }) => (
                                <div key={label}>
                                    <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1.5">
                                        <span>{label}</span>
                                        <span style={{ color }}>{pct}%</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════ FEATURES ══════════ */}
            <section id="features" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <SectionHeader
                        badge={<><Zap size={11} /> Features</>}
                        title="Everything You Need to Run a School"
                        sub="A complete system — from student registration to payroll reports."
                    />

                    <div id="modules" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                        {[
                            { icon: <Users size={20} />, title: 'Branch Management', desc: 'Create independent branches, assign roles, transfer students, and sync data with the central admin.' },
                            { icon: <BarChart3 size={20} />, title: 'Finance & Fees', desc: 'Design fee structures, auto-generate invoices, track collections, and export financial reports.' },
                            { icon: <BookOpen size={20} />, title: 'Academics', desc: 'Manage timetables, term subjects, teacher grading, and student results.' },
                            { icon: <Activity size={20} />, title: 'Parent Portal', desc: 'Parents can view their child\'s attendance, current grades, and outstanding fee invoices in real time.' },
                            { icon: <CalendarCheck size={20} />, title: 'Leave Management', desc: 'Submit leave requests digitally, track remaining days, and approve or reject them efficiently.' },
                            { icon: <Clock size={20} />, title: 'Payroll & HR', desc: 'Generate monthly payroll records, process payments, and manage staff leave.' },
                        ].map(({ icon, title, desc }) => (
                            <FeatureCard key={title} icon={icon} title={title} desc={desc} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════ WHY PLATFORM ══════════ */}
            <section className="py-24 bg-slate-50" style={{ background: `linear-gradient(180deg, ${BLUE_LITE} 0%, white 100%)` }}>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div
                                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[0.7rem] font-bold tracking-widest uppercase mb-6 border"
                                style={{ background: BLUE_LITE, color: BLUE, borderColor: BLUE_SOFT }}
                            >
                                <TrendingUp size={11} /> Why {platformSettings.platformName}
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-5 leading-tight" style={{ color: NAVY }}>
                                Fast, Secure &<br />
                                <span style={{ color: BLUE }}>Built for Schools</span>
                            </h2>
                            <p className="text-slate-500 font-medium leading-relaxed mb-8 text-base">
                                {platformSettings.platformName} is built on the principle that school administrators deserve full control — without needing any technical expertise.
                            </p>
                            <div className="space-y-3.5">
                                {[
                                    'Learn once, manage multiple schools',
                                    'Role-based access control for every team member',
                                    'Real-time reports and detailed analytics',
                                    'Custom branding for every school',
                                    'Tenant isolation and role-based access controls',
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <CheckCircle2 size={18} style={{ color: BLUE, flexShrink: 0 }} />
                                        <span className="text-slate-700 font-semibold text-[0.9rem]">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Stat grid — live from API */}
                        <div className="grid grid-cols-2 gap-5">
                            {[
                                { valueKey: 'totalSchools',   fallback: '0',  label: 'Schools Registered',    icon: <Building2 size={20} /> },
                                { valueKey: 'activeSchools',  fallback: '0',  label: 'Active Schools',        icon: <Star size={20} /> },
                                { valueKey: 'totalStudents',  fallback: '0',  label: 'Total Students',        icon: <GraduationCap size={20} /> },
                                { valueKey: 'totalBranches',  fallback: '0',  label: 'Branches Created',      icon: <Globe size={20} /> },
                            ].map(({ valueKey, fallback, label, icon }) => {
                                const live = valueKey && stats ? stats[valueKey] : null;
                                const display = live !== null && live !== undefined
                                    ? live.toLocaleString()
                                    : fallback;
                                const isLoading = valueKey && !stats;
                                return (
                                    <div key={label} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 text-white" style={{ background: NAVY }}>
                                            {icon}
                                        </div>
                                        {isLoading
                                            ? <div className="h-8 w-16 rounded-lg bg-slate-100 animate-pulse mb-1" />
                                            : <p className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: NAVY }}>{display}</p>
                                        }
                                        <p className="text-[0.8rem] font-semibold text-slate-400">{label}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════ PRICING ══════════ */}
            <section id="pricing" className="py-24 bg-white">
                <div className="max-w-5xl mx-auto px-6">
                    <SectionHeader
                        badge="Pricing"
                        title="Choose the Right Plan"
                        sub="Start free, upgrade when you need more."
                    />
                    {plansLoading ? (
                        <div className="flex items-center justify-center gap-3 mt-16 text-slate-400">
                            <Loader2 size={22} className="animate-spin" />
                            <span className="text-sm font-semibold">Loading plans...</span>
                        </div>
                    ) : plans.length > 0 ? (
                        <div className="grid md:grid-cols-3 gap-6 mt-12">
                            {plans.map((plan, idx) => {
                                const featured = idx === 1;
                                const priceDisplay = (plan.price === 0 || plan.price === '0')
                                    ? '$0'
                                    : plan.price === 'Custom'
                                        ? 'Contact Us'
                                        : `$${plan.price}`;
                                const features = [
                                    plan.maxBranches === 'Unlimited' ? 'Unlimited Branches' : `${plan.maxBranches} Branch${plan.maxBranches > 1 ? 'es' : ''}`,
                                    plan.maxStudents === 'Unlimited' ? 'Unlimited Students' : `${plan.maxStudents} Students`,
                                    plan.maxUsers === 'Unlimited' ? 'Unlimited Users' : `${plan.maxUsers} Users`,
                                    `Storage: ${plan.storage || '—'}`,
                                    ...(plan.hasPrioritySupport ? ['Priority Support 24/7'] : ['Email Support']),
                                ];
                                return (
                                    <PricingCard
                                        key={plan._id || plan.slug}
                                        name={plan.name}
                                        price={priceDisplay}
                                        desc={plan.maxBranches === 'Unlimited' ? 'For large institutions' : plan.maxBranches <= 1 ? 'For small schools getting started' : 'For growing schools'}
                                        featured={featured}
                                        features={features}
                                        registrationOpen={registrationOpen}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        // Fallback if API returns empty
                        <div className="text-center py-12 text-slate-400 font-semibold text-sm">
                            No active subscription plans available at this moment.
                        </div>
                    )}
                </div>
            </section>

            {/* ══════════ CTA BANNER ══════════ */}
            <section className="py-24" style={{ background: NAVY }}>
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <div
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[0.7rem] font-bold tracking-widest uppercase mb-8 border"
                        style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.12)' }}
                    >
                        <span className="flex h-2 w-2 rounded-full bg-white animate-ping" />
                        Ready to Get Started?
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-5 leading-tight">
                        Start Today.
                    </h2>
                    <p className="text-white/60 text-lg font-medium mb-10 max-w-xl mx-auto">
                        Register your school for platform review and choose the active plan that fits your current needs.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        {registrationOpen ? (
                            <Link
                                to="/register"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-[0.95rem] font-bold text-white transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-lg"
                                style={{ background: BLUE }}
                            >
                                Get Started Free
                                <ArrowRight size={17} />
                            </Link>
                        ) : (
                            <div className="inline-flex items-center justify-center rounded-2xl text-[0.95rem] font-bold bg-white/10 text-white/80 border border-white/20 px-8 py-4 cursor-default">
                                School registration is currently closed.
                            </div>
                        )}
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center border-2 px-8 py-4 rounded-2xl text-[0.95rem] font-bold text-white hover:bg-white/10 transition-all"
                            style={{ borderColor: 'rgba(255,255,255,0.2)' }}
                        >
                            Sign In to Your Account
                        </Link>
                    </div>
                </div>
            </section>

            {/* ══════════ FOOTER ══════════ */}
            <footer className="py-14 px-6" style={{ background: '#111827' }}>
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-12">
                        <div className="max-w-xs">
                            <div className="flex items-center gap-2.5 mb-4">
                                {platformSettings.logoUrl ? (
                                    <img src={platformSettings.logoUrl.startsWith('http') ? platformSettings.logoUrl : `${API_ORIGIN}${platformSettings.logoUrl}`} alt={platformSettings.platformName} className="w-8 h-8 object-contain rounded-xl" />
                                ) : (
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: BLUE }}>
                                        <GraduationCap size={16} className="text-white" />
                                    </div>
                                )}
                                <span className="text-lg font-extrabold text-white">{platformSettings.platformName}</span>
                            </div>
                            <p className="text-sm leading-relaxed font-medium text-slate-400">
                                The leading multi-school management platform — modern, secure, and easy to use.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 text-sm">
                            <div>
                                <p className="font-extrabold text-white uppercase tracking-widest text-[11px] mb-4">Platform</p>
                                <div className="space-y-2.5 text-slate-400">
                                    <a href="#features" className="block hover:text-white transition-colors font-medium">Features</a>
                                    <a href="#modules" className="block hover:text-white transition-colors font-medium">Modules</a>
                                    <a href="#pricing" className="block hover:text-white transition-colors font-medium">Pricing</a>
                                </div>
                            </div>
                            <div>
                                <p className="font-extrabold text-white uppercase tracking-widest text-[11px] mb-4">Account</p>
                                <div className="space-y-2.5 text-slate-400">
                                    <Link to="/login" className="block hover:text-white transition-colors font-medium">Sign In</Link>
                                    {registrationOpen && <Link to="/register" className="block hover:text-white transition-colors font-medium">Register School</Link>}
                                    <Link to="/platform/login" className="block hover:text-white transition-colors font-medium">Platform Admin</Link>
                                </div>
                            </div>
                            <div>
                                <p className="font-extrabold text-white uppercase tracking-widest text-[11px] mb-4">Contact</p>
                                <div className="space-y-2.5 text-slate-400">
                                    {platformSettings.supportEmail && (
                                        <a href={`mailto:${platformSettings.supportEmail}`} className="block hover:text-white transition-colors font-medium">Support</a>
                                    )}
                                    <a href="#" className="block hover:text-white transition-colors font-medium">Contact Us</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm font-medium text-slate-500">
                            © {new Date().getFullYear()} {platformSettings.platformName} · All Rights Reserved
                        </p>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                            <Globe size={12} />
                            Somalia · Djibouti · Ethiopia
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

/* ─── Shared sub-components ──────────────────────────────────── */

const NavCTA = ({ to, label }) => (
    <Link
        to={to}
        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[0.82rem] font-bold text-white shadow-md transition-all hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0"
        style={{ background: NAVY }}
    >
        {label}
        <ChevronRight size={14} />
    </Link>
);

const HeroCTA = ({ to, label, primary, icon }) => (
    <Link
        to={to}
        className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-[0.95rem] font-bold transition-all hover:-translate-y-0.5 active:translate-y-0"
        style={
            primary
                ? { background: NAVY, color: '#fff', boxShadow: `0 10px 30px ${NAVY}33` }
                : { background: '#fff', color: NAVY, border: `2px solid ${BLUE_SOFT}` }
        }
    >
        {label}
        {icon}
    </Link>
);

const SectionHeader = ({ badge, title, sub }) => (
    <div className="text-center max-w-2xl mx-auto">
        <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[0.7rem] font-bold tracking-widest uppercase mb-5 border"
            style={{ background: BLUE_LITE, color: BLUE, borderColor: BLUE_SOFT }}
        >
            {badge}
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4" style={{ color: NAVY }}>
            {title}
        </h2>
        <p className="text-slate-500 font-medium text-base leading-relaxed">{sub}</p>
    </div>
);

const FeatureCard = ({ icon, title, desc }) => (
    <div className="group p-7 rounded-2xl border border-slate-100 bg-white hover:border-[#c7d9fd] hover:shadow-[0_8px_40px_rgba(68,119,245,0.08)] hover:-translate-y-1 transition-all duration-300 text-left cursor-default">
        <div
            className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 text-white transition-transform group-hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_MID} 100%)` }}
        >
            {icon}
        </div>
        <h3 className="text-[1rem] font-extrabold mb-2.5 tracking-tight" style={{ color: NAVY }}>{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed font-medium">{desc}</p>
    </div>
);

const PricingCard = ({ name, price, desc, features, featured, registrationOpen }) => (
    <div
        className={`rounded-2xl p-8 border flex flex-col transition-all duration-200 ${
            featured
                ? 'shadow-[0_20px_60px_rgba(27,42,74,0.25)] scale-[1.03]'
                : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5'
        }`}
        style={featured ? { background: NAVY, borderColor: NAVY } : {}}
    >
        {featured && (
            <div
                className="inline-flex items-center gap-1.5 text-[0.65rem] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full mb-4 border w-fit"
                style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)', borderColor: 'rgba(255,255,255,0.18)' }}
            >
                <Star size={9} fill="currentColor" /> Most Popular
            </div>
        )}
        <h3 className={`text-xl font-extrabold mb-1 ${featured ? 'text-white' : ''}`} style={!featured ? { color: NAVY } : {}}>{name}</h3>
        <p className={`text-sm font-medium mb-5 ${featured ? 'text-white/60' : 'text-slate-400'}`}>{desc}</p>
        <p className={`text-4xl font-extrabold tracking-tight mb-1 ${featured ? 'text-white' : ''}`} style={!featured ? { color: NAVY } : {}}>
            {price}
            {price !== 'Contact Us' && <span className={`text-sm font-semibold ml-1 ${featured ? 'text-white/50' : 'text-slate-400'}`}>/mo</span>}
        </p>
        <div className={`border-t my-6 ${featured ? 'border-white/15' : 'border-slate-100'}`} />
        <ul className="space-y-3 mb-8 flex-1">
            {features.map((f, i) => (
                <li key={i} className={`flex items-center gap-2.5 text-[0.88rem] font-medium ${featured ? 'text-white/85' : 'text-slate-600'}`}>
                    <CheckCircle2 size={15} style={{ color: featured ? '#86efac' : BLUE, flexShrink: 0 }} />
                    {f}
                </li>
            ))}
        </ul>
        {registrationOpen ? (
            <Link
                to="/register"
                className="block w-full text-center py-3 rounded-xl font-bold text-[0.88rem] transition-all hover:-translate-y-0.5 active:translate-y-0"
                style={
                    featured
                        ? { background: BLUE, color: '#fff', boxShadow: `0 6px 20px rgba(68,119,245,0.4)` }
                        : { background: BLUE_LITE, color: NAVY }
                }
            >
                {price === 'Contact Us' ? 'Contact Sales' : 'Get Started'}
            </Link>
        ) : (
            <div className="block w-full text-center py-3 rounded-xl font-bold text-[0.88rem] bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed">
                Closed
            </div>
        )}
    </div>
);

export default Landing;
