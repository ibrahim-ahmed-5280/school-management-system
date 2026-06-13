import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Upload, 
  CheckCircle2, 
  Globe, 
  RefreshCw, 
  Loader2,
  Trash2
} from 'lucide-react';
import { useBranding } from '../../context/BrandingContext';

const Branding = () => {
    const { branding, updateBranding, loadBranding } = useBranding();
    const [formData, setFormData] = useState({
        primaryColor: '',
        secondaryColor: '',
        logoUrl: ''
    });
    const [logoFile, setLogoFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (branding) {
            setFormData({
                primaryColor: branding.primaryColor || '#2563eb',
                secondaryColor: branding.secondaryColor || '#22c55e',
                logoUrl: branding.logoUrl || ''
            });
        }
    }, [branding]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);
        try {
            let payload;
            if (logoFile) {
                payload = new FormData();
                payload.append('primaryColor', formData.primaryColor);
                payload.append('secondaryColor', formData.secondaryColor);
                payload.append('logo', logoFile);
            } else {
                payload = formData;
            }
            await updateBranding(payload);
            setLogoFile(null);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to update branding:', error);
            alert('Failed to save branding changes.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl space-y-8 pb-20">
            <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight mb-1">Institutional <span className="text-[var(--primary)]">Branding</span></h1>
                <p className="text-slate-500 text-xs font-bold">Define the visual identity applied across all branches and student portals.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Form Side */}
                <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        {/* Colors */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Color Palette</label>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <p className="text-xs font-black text-slate-800 ml-1">Primary Signature Color</p>
                                    <div className="flex gap-3">
                                        <div className="relative group overflow-hidden w-10 h-10 rounded-lg border-2 border-slate-100 shadow-sm cursor-pointer active:scale-95 transition-transform">
                                            <input 
                                                type="color" 
                                                className="absolute inset-0 w-full h-full cursor-pointer scale-150" 
                                                value={formData.primaryColor}
                                                onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                                            />
                                        </div>
                                        <input 
                                            type="text" 
                                            className="flex-1 px-3 h-10 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[var(--primary)]/10 focus:bg-white transition-all uppercase text-sm"
                                            value={formData.primaryColor}
                                            onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-black text-slate-800 ml-1">Secondary Accent Color</p>
                                    <div className="flex gap-3">
                                        <div className="relative group overflow-hidden w-10 h-10 rounded-lg border-2 border-slate-100 shadow-sm cursor-pointer active:scale-95 transition-transform">
                                            <input 
                                                type="color" 
                                                className="absolute inset-0 w-full h-full cursor-pointer scale-150" 
                                                value={formData.secondaryColor}
                                                onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                                            />
                                        </div>
                                        <input 
                                            type="text" 
                                            className="flex-1 px-3 h-10 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[var(--secondary)]/10 focus:bg-white transition-all uppercase text-sm"
                                            value={formData.secondaryColor}
                                            onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Logo */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Logo Asset</label>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {/* Local Upload */}
                                <div className="space-y-2">
                                    <p className="text-xs font-black text-slate-800 ml-1">Upload Logo Image</p>
                                    <div className="flex items-center gap-3">
                                        <label className="flex-1 h-10 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 border-dashed rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]">
                                            <Upload size={16} className="text-slate-400" />
                                            <span className="text-xs font-semibold text-slate-600 truncate">
                                                {logoFile ? logoFile.name : 'Choose local file...'}
                                            </span>
                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                className="hidden" 
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        setLogoFile(e.target.files[0]);
                                                    }
                                                }}
                                            />
                                        </label>
                                        {logoFile && (
                                            <button 
                                                type="button"
                                                onClick={() => setLogoFile(null)}
                                                className="w-10 h-10 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center transition-colors"
                                                title="Remove file"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* URL Input */}
                                <div className="space-y-2">
                                    <p className="text-xs font-black text-slate-800 ml-1">Or Logo Provider URL</p>
                                    <div className="relative group">
                                        <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input 
                                            type="text" 
                                            placeholder="https://storage.com/logo.png"
                                            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[var(--primary)]/10 focus:bg-white transition-all text-sm"
                                            value={formData.logoUrl}
                                            onChange={(e) => {
                                                setFormData({...formData, logoUrl: e.target.value});
                                                if (logoFile) setLogoFile(null);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 ml-1">Transparent PNG or SVG recommended for best results.</p>
                        </div>

                        {/* Action Bar */}
                        <div className="pt-4 flex justify-between items-center border-t border-slate-100">
                             <button 
                                type="button"
                                onClick={() => { loadBranding(); setLogoFile(null); }}
                                className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
                             >
                                <RefreshCw size={12} />
                                DISCARD CHANGES
                             </button>
                             <button 
                                type="submit"
                                disabled={loading}
                                className="h-10 px-6 bg-[var(--primary)] text-white rounded-lg font-black text-[10px] tracking-widest uppercase hover:bg-[var(--primary-dark)] transition shadow active:scale-95 disabled:opacity-50 flex items-center gap-2"
                             >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                    success ? <CheckCircle2 className="text-emerald-400" size={14} /> : <span className="text-white">SAVE IDENTITY</span>
                                )}
                             </button>
                        </div>
                    </div>
                </form>

                {/* Preview Side */}
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 delay-200">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Live Interface Preview</label>
                    <div className="bg-[var(--sidebar-bg)] rounded-2xl p-6 shadow-xl relative overflow-hidden group border border-[var(--sidebar-border)]">
                        {/* Simulated Sidebar */}
                        <div className="space-y-8 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center p-1.5 shadow-inner" style={{ backgroundColor: formData.primaryColor }}>
                                    {formData.logoUrl ? (
                                        <img src={formData.logoUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="text-white font-black text-base">
                                             {branding.tenantName?.charAt(0) || 'L'}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <div className="h-2 w-20 bg-white/20 rounded-full" />
                                    <div className="h-1 w-12 bg-white/10 rounded-full" />
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: formData.primaryColor }} />
                                     <div className="h-2 w-24 bg-white/20 rounded-full" />
                                </div>
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center gap-3 opacity-30">
                                         <div className="w-8 h-8 rounded-lg bg-white/10" />
                                         <div className="h-2 w-16 bg-white/10 rounded-full" />
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-white/5 space-y-4">
                                 <div className="h-10 w-full rounded-lg flex items-center justify-center font-black text-[9px] tracking-widest uppercase border border-white/10" style={{ color: formData.secondaryColor }}>
                                     BUTTON PREVIEW
                                 </div>
                             </div>
                        </div>

                        {/* Glass Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                    </div>

                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex gap-3 text-emerald-800">
                         <CheckCircle2 className="shrink-0 mt-0.5" size={16} />
                         <div>
                            <p className="text-xs font-black mb-0.5">Theme Dynamic Propagation</p>
                            <p className="text-[9px] leading-relaxed font-bold opacity-80 uppercase tracking-tight">Updating these values will immediately affect the login screen, all staff dashboards, and student result receipts across the whole network.</p>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Branding;


