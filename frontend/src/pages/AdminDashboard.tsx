import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Shield,
  Activity,
  ArrowRight,
  TrendingUp,
  Building,
  Timer,
  AlertCircle,
} from 'lucide-react';
import { api } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';
import { Complaint, HealthScoreData } from '../types';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<{
    stats: {
      totalComplaints: number;
      pendingComplaints: number;
      inProgressComplaints: number;
      resolvedComplaints: number;
      criticalComplaints: number;
      overdueComplaints: number;
      totalUsers: number;
      totalStudents: number;
      totalStaff: number;
      activeSOSAlerts: number;
      averageResolutionTimeHours: number;
    };
    categoryChartData: { name: string; count: number }[];
    locationChartData: { name: string; count: number }[];
    departmentPerformance: {
      id: string;
      name: string;
      code: string;
      staffCount: number;
      totalComplaints: number;
      resolvedComplaints: number;
      resolutionRate: number;
    }[];
    recentComplaints: Complaint[];
    healthScore: HealthScoreData;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboards/admin').then((res) => {
      if (res.success && res.data) {
        setData(res.data);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-royal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Loading campus administration analytics...</p>
      </div>
    );
  }

  const stats = data?.stats || {
    totalComplaints: 0,
    pendingComplaints: 0,
    inProgressComplaints: 0,
    resolvedComplaints: 0,
    criticalComplaints: 0,
    overdueComplaints: 0,
    totalUsers: 0,
    totalStudents: 0,
    totalStaff: 0,
    activeSOSAlerts: 0,
    averageResolutionTimeHours: 0,
  };

  const maxCategoryCount = Math.max(
    ...(data?.categoryChartData?.map((c) => c.count) || [1]),
    1
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-royal-950 p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-royal-800 text-royal-200 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5" /> Administrative Command Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Campus Infrastructure Analytics
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Real-time operational KPIs, resolution metrics, and department throughput across 12 facilities.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/admin/users"
            className="px-4 py-2 bg-royal-700 hover:bg-royal-600 rounded-xl text-xs font-bold transition text-white"
          >
            Manage Users & Roles
          </Link>
          <Link
            to="/complaints"
            className="px-4 py-2 bg-royal-600 hover:bg-royal-500 rounded-xl text-xs font-bold transition text-white"
          >
            All Work Orders
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">Total Issues</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalComplaints}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Lifetime reports</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">Pending Review</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{stats.pendingComplaints}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Awaiting routing</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">In Progress</div>
          <div className="text-2xl font-extrabold text-royal-600 mt-1">{stats.inProgressComplaints}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Assigned to staff</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">Resolved</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.resolvedComplaints}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Successfully closed</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/30">
          <div className="text-[11px] font-semibold text-rose-700">Critical Issues</div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">{stats.criticalComplaints}</div>
          <div className="text-[10px] text-rose-500 mt-0.5">High safety priority</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/30">
          <div className="text-[11px] font-semibold text-amber-800">Overdue (&gt; 72h)</div>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">{stats.overdueComplaints}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">Needs escalation</div>
        </div>
      </div>

      {/* Operational Efficiency Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-royal-50 text-royal-700 flex items-center justify-center shrink-0">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Average Resolution Time</div>
            <div className="text-xl font-bold text-slate-900">
              {stats.averageResolutionTimeHours} hrs
            </div>
            <div className="text-[10px] text-slate-400">From submission to resolved</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Registered Users</div>
            <div className="text-xl font-bold text-slate-900">
              {stats.totalUsers} users
            </div>
            <div className="text-[10px] text-slate-400">
              {stats.totalStudents} students &bull; {stats.totalStaff} staff
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-700 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Active SOS Alerts</div>
            <div className="text-xl font-bold text-red-600">
              {stats.activeSOSAlerts} active
            </div>
            <Link to="/sos" className="text-[10px] font-bold text-red-600 hover:underline">
              Open emergency dispatcher &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid: Category Breakdown & Department Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown (Clean SVG/Bar distribution) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Complaints by Category</h2>
            <span className="text-xs text-slate-400">All registered</span>
          </div>

          <div className="space-y-3 pt-2">
            {data?.categoryChartData && data.categoryChartData.length > 0 ? (
              data.categoryChartData.map((cat) => {
                const percentage = Math.round((cat.count / maxCategoryCount) * 100);
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{cat.name}</span>
                      <span className="text-slate-500 font-mono font-bold">{cat.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-royal-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400">No category records found.</p>
            )}
          </div>
        </div>

        {/* Department Performance Table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Department Performance</h2>
            <span className="text-xs text-slate-400">Resolution throughput</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3 text-center">Staff</th>
                  <th className="py-2.5 px-3 text-center">Total</th>
                  <th className="py-2.5 px-3 text-center">Resolved</th>
                  <th className="py-2.5 px-3 text-right">Success Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.departmentPerformance && data.departmentPerformance.length > 0 ? (
                  data.departmentPerformance.map((dept) => (
                    <tr key={dept.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {dept.name}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                        {dept.staffCount}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                        {dept.totalComplaints}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-emerald-600 font-bold">
                        {dept.resolvedComplaints}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] ${
                            dept.resolutionRate >= 75
                              ? 'bg-emerald-100 text-emerald-800'
                              : dept.resolutionRate >= 50
                              ? 'bg-blue-100 text-royal-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {dept.resolutionRate}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400">
                      No department data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Building Hotspots Summary & Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hotspots Quick View (1 col) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Top Issue Hotspots</h2>
            <Link to="/hotspots" className="text-xs font-semibold text-royal-600 hover:underline">
              Map View &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {data?.locationChartData && data.locationChartData.slice(0, 6).map((loc) => (
              <div key={loc.name} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50">
                <span className="font-semibold text-slate-800 line-clamp-1">📍 {loc.name}</span>
                <span className="font-mono font-bold text-royal-700 px-2 py-0.5 rounded bg-royal-100 shrink-0">
                  {loc.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Complaints Table (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recently Submitted Complaints</h2>
            <Link to="/complaints" className="text-xs font-semibold text-royal-600 hover:underline">
              View all &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">ID</th>
                  <th className="py-2 px-3">Title</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3">Priority</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.recentComplaints && data.recentComplaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-royal-700">{c.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-xs truncate">{c.title}</td>
                    <td className="py-2.5 px-3">{c.category}</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge priority={c.priority} type="priority" />
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/complaints/${c.id}`}
                        className="text-royal-600 font-semibold hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
