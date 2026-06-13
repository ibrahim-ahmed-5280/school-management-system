import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Shield, Users, BarChart3, BookOpen } from 'lucide-react';

const NAVY      = '#1b2a4a';
const NAVY_MID  = '#2a3a5c';
const BLUE      = '#4477f5';
const BLUE_SOFT = '#c7d9fd';

const AuthLayout = ({
    title,
    subtitle,
    children,
    backTo    = '/',
    backLabel = 'Back to Home',
}) => (
    <div className="public-page min-h-screen flex bg-slate-50">

        {/* ── Left decorative panel ─────────────────────── */}
        <div
            className="hidden lg:flex lg:w-[42%] flex-col justify-between p-10 relative overflow-hidden"
            style={{ background: `linear-gradient(160deg, ${NAVY} 0%, ${NAVY_MID} 100%)` }}
        >
            {/* Blobs */}
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-10" style={{ background: BLUE }} />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full opacity-10" style={{ background: BLUE }} />
            <div className="absolute top-1/2 right-0 w-40 h-40 rounded-full opacity-5 translate-x-1/2 -translate-y-1/2" style={{ background: BLUE_SOFT }} />

            {/* Logo */}
            <div className="relative z-10">
                <Link to="/" className="inline-flex items-center gap-2.5 group">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/15 group-hover:scale-105 transition-transform"
                        style={{ background: BLUE }}
                    >
                        <GraduationCap size={20} className="text-white" />
                    </div>
                    <span className="text-xl font-extrabold text-white tracking-tight">
                        Madrasa<span style={{ color: BLUE_SOFT }}>Hub</span>
                    </span>
                </Link>
            </div>

            {/* Middle copy */}
            <div className="relative z-10 space-y-8">
                <div>
                    <h2 className="text-3xl font-extrabold text-white leading-snug mb-3">
                        The Future of<br />
                        <span className="text-white/50">School Management</span>
                    </h2>
                    <p className="text-white/55 font-medium text-[0.92rem] leading-relaxed max-w-[260px]">
                        Manage multiple schools securely and efficiently — all from one place.
                    </p>
                </div>

                {/* Feature pills */}
                <div className="space-y-2.5">
                    {[
                        { icon: <Users size={14} />,      label: 'Branch Management' },
                        { icon: <BarChart3 size={14} />,  label: 'Finance & Fees' },
                        { icon: <BookOpen size={14} />,   label: 'Academics & Results' },
                        { icon: <Shield size={14} />,     label: 'Secure & Role-Based' },
                    ].map(({ icon, label }) => (
                        <div
                            key={label}
                            className="flex items-center gap-3 rounded-xl px-4 py-2.5 border"
                            style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.09)' }}
                        >
                            <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
                                style={{ background: 'rgba(255,255,255,0.12)' }}
                            >
                                {icon}
                            </div>
                            <span className="text-[0.82rem] font-semibold text-white/75">{label}</span>
                        </div>
                    ))}
                </div>

                {/* Mini stats */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                    {[['500+','Schools'],['50K+','Students'],['98%','Satisfaction'],['24/7','Support']].map(([v, l]) => (
                        <div key={l} className="rounded-xl p-3 border" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }}>
                            <p className="text-xl font-extrabold text-white">{v}</p>
                            <p className="text-[0.72rem] font-semibold text-white/45 mt-0.5">{l}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="relative z-10">
                <p className="text-white/30 text-xs font-medium">
                    © {new Date().getFullYear()} MadrasaHub · All Rights Reserved
                </p>
            </div>
        </div>

        {/* ── Right form panel ──────────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

            {/* Mobile logo */}
            <div className="lg:hidden mb-8 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: NAVY }}>
                    <GraduationCap size={18} className="text-white" />
                </div>
                <span className="text-[1.1rem] font-extrabold tracking-tight" style={{ color: NAVY }}>
                    Madrasa<span style={{ color: BLUE }}>Hub</span>
                </span>
            </div>

            <div className="w-full max-w-[420px]">
                {/* Back link */}
                <Link
                    to={backTo}
                    className="inline-flex items-center gap-1.5 text-[0.83rem] font-semibold mb-8 group transition-colors"
                    style={{ color: NAVY }}
                >
                    <ArrowLeft
                        size={15}
                        className="group-hover:-translate-x-1 transition-transform"
                        style={{ color: BLUE }}
                    />
                    {backLabel}
                </Link>

                {/* Card */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_8px_40px_rgba(27,42,74,0.10)]">
                    {/* Card header */}
                    <div className="px-8 py-7" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_MID} 100%)` }}>
                        <div className="flex items-center gap-3 mb-3">
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: BLUE }}
                            >
                                <GraduationCap size={17} className="text-white" />
                            </div>
                            <div
                                className="text-[10px] font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-full border"
                                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.12)' }}
                            >
                                MadrasaHub
                            </div>
                        </div>
                        <h1 className="text-[1.5rem] font-extrabold text-white mb-1 tracking-tight">{title}</h1>
                        <p className="text-white/55 text-[0.85rem] font-medium">{subtitle}</p>
                    </div>

                    {/* Form */}
                    <div className="px-8 py-8">
                        {children}
                    </div>
                </div>

                {/* Bottom note */}
                <p className="text-center text-[0.78rem] text-slate-400 font-medium mt-5">
                    Your data is protected · MadrasaHub
                </p>
            </div>
        </div>
    </div>
);

export default AuthLayout;
