import React from 'react';
import {
  Receipt,
  ShieldCheck,
  Coins,
  FileSpreadsheet,
  Camera,
  ArrowRight,
  CheckCircle2,
  Lock,
  Users,
  Building,
  TrendingUp,
  FileCheck2,
  Sparkles,
  Zap,
  Globe,
  Database,
  KeyRound,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BatchSummary } from '../types/invoice';
import { formatAED } from '../utils/exporter';

interface HomePageProps {
  summary: BatchSummary;
  onGetStarted: () => void;
  onOpenAuth: () => void;
  onOpenDashboard: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  summary,
  onGetStarted,
  onOpenAuth,
  onOpenDashboard,
}) => {
  const { user, loginWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#0a1e3f] via-[#0e2a5c] to-[#123673] text-white pt-16 pb-24 px-6 lg:px-12 overflow-hidden">
        {/* Subtle geometric glowing background pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#60a5fa_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto text-center space-y-8">
          {/* Top UAE Compliance Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs text-blue-200 font-semibold shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>UAE Federal Tax Authority (FTA) Executive Regulation Art. 59 Ready</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Intelligent UAE Tax Invoice Processing & VAT Compliance
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg text-blue-100/90 max-w-2xl mx-auto leading-relaxed font-normal">
            Automate invoice extraction via <span className="text-white font-semibold">Multimodal AI and Live Camera</span>, verify 15-digit TRNs, validate 5% VAT calculations, and export directly to <span className="text-white font-semibold">Zoho Books (UAE)</span> & <span className="text-white font-semibold">Tally Prime</span> with zero manual entry.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl text-sm font-bold text-[#0e2a5c] bg-white hover:bg-blue-50 shadow-xl shadow-blue-950/30 transition active:scale-95 cursor-pointer"
            >
              <span>Launch IPT Workspace</span>
              <ArrowRight className="w-4 h-4 text-[#0e2a5c]" />
            </button>

            {!user ? (
              <button
                onClick={() =>
                  loginWithGoogle(
                    'pdc-subcom@icaiauh.org',
                    'Senior Tax Administrator',
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'
                  )
                }
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign In with Gmail / Google</span>
              </button>
            ) : (
              <button
                onClick={onOpenDashboard}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-white bg-blue-600/60 hover:bg-blue-600 border border-blue-400/40 backdrop-blur-md transition cursor-pointer"
              >
                <span>View Analytics Dashboard</span>
              </button>
            )}
          </div>

          {/* Quick Stats Banner */}
          <div className="pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 text-left max-w-4xl mx-auto">
            <div>
              <div className="text-2xl lg:text-3xl font-extrabold text-white">15 Digits</div>
              <div className="text-xs text-blue-200/80 mt-0.5">FTA TRN Validation</div>
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-extrabold text-white">5% VAT</div>
              <div className="text-xs text-blue-200/80 mt-0.5">Automated Math Tie-In</div>
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-extrabold text-emerald-400">100% Form 201</div>
              <div className="text-xs text-blue-200/80 mt-0.5">Box 9 & 7 Emirates Allocation</div>
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-extrabold text-white">RBAC Secure</div>
              <div className="text-xs text-blue-200/80 mt-0.5">Role-Based Access & Audit Log</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 px-6 lg:px-12 max-w-6xl mx-auto space-y-12 flex-1">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Enterprise Pillars
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Built Specifically for UAE Tax Regulations
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Everything your finance and tax team needs to process high volumes of tax invoices with full audit defense.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 border border-blue-100">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Multimodal OCR & Camera Scanning
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upload PDF tax invoices or snap receipt photos with your device camera. Our multimodal engine reads Arabic & English text, extracting all 22 required fields instantly.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 border border-emerald-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              FTA Compliance & TRN Audit
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Validates 15-digit TRN structure, verifies presence of the legal "Tax Invoice" title under Art. 59, and cross-checks standard 5% VAT mathematical equations.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 border border-indigo-100">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Zoho Books & Tally Prime Integration
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Download mapped Excel templates formatted specifically for Zoho Books UAE Bills and Tally Prime Purchase Vouchers for seamless one-click ledger import.
            </p>
          </div>
        </div>

        {/* Role-Based Access Control Showcase */}
        <div className="bg-gradient-to-r from-slate-900 to-[#0e2a5c] rounded-3xl p-8 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8 border border-blue-900">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
              <Lock className="w-3.5 h-3.5" />
              <span>Enterprise RBAC Security</span>
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              Granular Role-Based Permissions
            </h3>
            <p className="text-xs sm:text-sm text-blue-200/80 leading-relaxed">
              Segment your accounting department into dedicated roles: <strong>Administrators</strong> oversee settings and batch purges; <strong>Tax Auditors</strong> review and flag non-compliant TRNs; <strong>Accountants</strong> upload and adjust entries; and <strong>Viewers</strong> access read-only executive dashboards.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
              <div className="font-extrabold text-amber-400">Admin</div>
              <div className="text-[11px] text-blue-200/70">Full System Control</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
              <div className="font-extrabold text-emerald-400">Tax Auditor</div>
              <div className="text-[11px] text-blue-200/70">Compliance Review</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
              <div className="font-extrabold text-indigo-400">Accountant</div>
              <div className="text-[11px] text-blue-200/70">Upload & Line Items</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
              <div className="font-extrabold text-slate-300">Viewer</div>
              <div className="text-[11px] text-blue-200/70">Read-Only Analytics</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-6 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">
          Invoice Processing Tool (IPT) - UAE VAT Compliance Edition
        </p>
        <p className="mt-1 text-slate-400">
          Compliant with UAE Federal Decree-Law No. (8) on Value Added Tax & Executive Regulations
        </p>
      </footer>
    </div>
  );
};
