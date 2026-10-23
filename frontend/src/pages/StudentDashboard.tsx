import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  FileText,
  PlusCircle,
  Award,
  ArrowRight,
  ShoppingBag,
  Users,
  Utensils,
  MapPin,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { Complaint, NotificationItem, HealthScoreData, ExamRecord } from '../types';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    stats: {
      totalComplaints: number;
      openComplaints: number;
      inProgressComplaints: number;
      resolvedComplaints: number;
      points: number;
      activeSOSAlerts: number;
    };
    recentComplaints: Complaint[];
    recentNotifications: NotificationItem[];
    upcomingExams: ExamRecord[];
    healthScore: HealthScoreData;
  } | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboards/student');
      if (res.success && res.data) {
        setData(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-royal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading your student dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalComplaints: 0,
    openComplaints: 0,
    inProgressComplaints: 0,
    resolvedComplaints: 0,
    points: 0,
    activeSOSAlerts: 0,
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-royal-900 via-royal-800 to-royal-700 p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-royal-100 text-xs font-medium mb-3">
            <span>Student Portal</span> &bull; <span>ID: {user?.studentId || 'N/A'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-royal-100 leading-relaxed">
            Report infrastructure bottlenecks, track work orders in real-time, earn improvement points,
            and access college services.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/complaints/submit"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-royal-900 text-xs font-bold hover:bg-royal-50 transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-royal-600" />
              Report Infrastructure Issue
            </Link>
            <Link
              to="/complaints"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 text-white text-xs font-semibold hover:bg-white/20 transition"
            >
              <FileText className="w-4 h-4" />
              Track My Complaints
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Reported</span>
            <FileText className="w-4 h-4 text-royal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalComplaints}</div>
          <div className="mt-1 text-[11px] text-slate-400">All submitted issues</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats.openComplaints}</div>
          <div className="mt-1 text-[11px] text-slate-400">Under review or queued</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">In Progress</span>
            <AlertCircle className="w-4 h-4 text-royal-500" />
          </div>
          <div className="text-2xl font-bold text-royal-600">{stats.inProgressComplaints}</div>
          <div className="mt-1 text-[11px] text-slate-400">Actively being worked on</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{stats.resolvedComplaints}</div>
          <div className="mt-1 text-[11px] text-slate-400">Successfully fixed</div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 mb-2">
            <span className="text-xs font-semibold">Campus Points</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-900">{stats.points}</div>
          <div className="mt-1 text-[11px] text-amber-700">Participation rewards</div>
        </div>
      </div>

      {/* Main Content Grid: Recent Complaints & Campus Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Complaints (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Recent Complaints</h2>
                <p className="text-xs text-slate-500">Live progress of your reported issues</p>
              </div>
              <Link
                to="/complaints"
                className="text-xs font-semibold text-royal-600 hover:text-royal-800 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {data?.recentComplaints && data.recentComplaints.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {data.recentComplaints.map((c) => (
                  <Link
                    key={c.id}
                    to={`/complaints/${c.id}`}
                    className="py-3.5 flex items-center justify-between hover:bg-slate-50/70 -mx-3 px-3 rounded-xl transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-royal-700">{c.id}</span>
                        <StatusBadge status={c.status} />
                        <StatusBadge priority={c.priority} type="priority" />
                      </div>
                      <div className="text-xs font-semibold text-slate-900 line-clamp-1">
                        {c.title}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-3">
                        <span>📍 {c.location}</span>
                        <span>🏷️ {c.category}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 ml-4" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500">
                <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-medium">No complaints submitted yet.</p>
                <Link
                  to="/complaints/submit"
                  className="mt-2 inline-block text-xs font-bold text-royal-600 hover:underline"
                >
                  Report your first issue &rarr;
                </Link>
              </div>
            )}
          </div>

          {/* Quick Access to Frequently Used Campus Services */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4">Quick Campus Services</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                to="/hotspots"
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-royal-50 border border-slate-200 hover:border-royal-200 transition text-center group"
              >
                <MapPin className="w-6 h-6 mx-auto text-emerald-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="block text-xs font-semibold text-slate-800">Campus Map</span>
                <span className="block text-[10px] text-slate-500">Issue Hotspots</span>
              </Link>

              <Link
                to="/marketplace"
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-royal-50 border border-slate-200 hover:border-royal-200 transition text-center group"
              >
                <ShoppingBag className="w-6 h-6 mx-auto text-royal-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="block text-xs font-semibold text-slate-800">Marketplace</span>
                <span className="block text-[10px] text-slate-500">Buy & Sell Items</span>
              </Link>

              <Link
                to="/study-groups"
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-royal-50 border border-slate-200 hover:border-royal-200 transition text-center group"
              >
                <Users className="w-6 h-6 mx-auto text-purple-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="block text-xs font-semibold text-slate-800">Study Groups</span>
                <span className="block text-[10px] text-slate-500">Peer Collaboration</span>
              </Link>

              <Link
                to="/canteen"
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-royal-50 border border-slate-200 hover:border-royal-200 transition text-center group"
              >
                <Utensils className="w-6 h-6 mx-auto text-amber-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="block text-xs font-semibold text-slate-800">Canteen Menu</span>
                <span className="block text-[10px] text-slate-500">Daily Food Rates</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Health Score & Upcoming Exams */}
        <div className="space-y-6">
          {/* Health Score Card */}
          {data?.healthScore && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Campus Health Score
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-royal-100 text-royal-800">
                  {data.healthScore.grade}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-extrabold text-slate-900">
                  {data.healthScore.score}
                </span>
                <span className="text-sm font-semibold text-slate-400">/ 100</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-3">
                <div
                  className="bg-royal-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${data.healthScore.score}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                {data.healthScore.formulaDescription}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
                <div>
                  <span className="text-slate-400 text-[10px]">Active Issues:</span>
                  <div className="font-bold text-slate-800">
                    {data.healthScore.metrics.activeComplaints}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Resolution Efficiency:</span>
                  <div className="font-bold text-emerald-600">
                    {data.healthScore.metrics.resolutionRatePercentage}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Examinations Countdown Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-royal-600" />
                <h3 className="text-sm font-bold text-slate-900">Upcoming Exams</h3>
              </div>
              <Link to="/exams" className="text-xs font-semibold text-royal-600 hover:underline">
                View all
              </Link>
            </div>

            {data?.upcomingExams && data.upcomingExams.length > 0 ? (
              <div className="space-y-3">
                {data.upcomingExams.map((exam) => (
                  <div key={exam.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-royal-700">
                        {exam.courseCode}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-royal-100 text-royal-800">
                        {new Date(exam.examDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800 mt-1 line-clamp-1">
                      {exam.courseName}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      📍 {exam.venue} &bull; ⏰ {exam.startTime}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No scheduled exams at this time.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
