import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  ArrowRight,
  CheckCircle2,
  Users,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { HealthScoreData } from '../types';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [healthScore, setHealthScore] = useState<HealthScoreData | null>(null);

  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') navigate('/admin-dashboard');
      else if (user.role === 'STAFF') navigate('/staff-dashboard');
      else navigate('/dashboard');
    }

    api.get<HealthScoreData>('/community/health-score').then((res: any) => {
      if (res.success && res.data) {
        setHealthScore(res.data);
      }
    });
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-white">
      {/* Top Banner / Academic Header */}
      <div className="bg-royal-900 text-white py-2 px-4 text-center text-xs font-medium">
        🎓 Smart Digital Campus Infrastructure Issue Reporting & Resolution System &bull; Academic Year 2026
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-royal-50/50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Campus Health Score Pill */}
            {healthScore && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow-sm border border-royal-200 text-xs font-semibold text-royal-800 mb-6">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Campus Health Score: <span className="font-extrabold text-royal-700">{healthScore.score}/100</span> ({healthScore.grade})
              </div>
            )}

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight">
              Report Campus Issues. <br />
              <span className="text-royal-600">Track Resolutions in Real Time.</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed">
              A comprehensive full-stack digital platform for smart college infrastructure management.
              Empowering students to report facilities issues, enabling maintenance staff to resolve tasks promptly,
              and giving administrators complete transparent operational oversight.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-royal-600 hover:bg-royal-700 text-white text-sm font-bold shadow-lg shadow-royal-600/30 transition-all"
              >
                Get Started as Student
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-semibold shadow-sm transition-all"
              >
                Sign In to Campus Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Engineered for Robust Campus Operations</h2>
            <p className="mt-2 text-sm text-slate-600">Built using modern software architecture with end-to-end data integrity.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-royal-100 text-royal-700 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Automated Routing</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Pre-defined rule based routing immediately maps electrical, plumbing, IT, and estate complaints to authorized departments.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Duplicate Detection</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Similarity analysis flags potential duplicate issues in the same building before submission, reducing backlogs.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-royal-700 flex items-center justify-center mb-4">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Transparent Timeline</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Full immutable audit trail and status timestamps from Submitted, Under Review, Assigned, to In Progress and Resolved.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Campus SOS & Safety</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Instant internal emergency alerts sent directly to campus security with location coordinates and incident details.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-4 text-center text-xs">
        <p className="font-semibold text-slate-300">Smart Digital Campus Infrastructure Issue Reporting & Resolution System</p>
        <p className="mt-1 text-slate-500">Academic Project Submission &bull; Free, Open-Source & Locally Runnable</p>
      </footer>
    </div>
  );
};
