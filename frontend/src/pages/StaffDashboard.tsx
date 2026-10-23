import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { Complaint } from '../types';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<{
    stats: {
      assignedCount: number;
      inProgressCount: number;
      resolvedCount: number;
      criticalCount: number;
      departmentName: string;
    };
    assignedComplaints: Complaint[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboards/staff').then((res) => {
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
        <p className="text-xs text-slate-500">Loading staff maintenance console...</p>
      </div>
    );
  }

  const stats = data?.stats || {
    assignedCount: 0,
    inProgressCount: 0,
    resolvedCount: 0,
    criticalCount: 0,
    departmentName: 'General Maintenance',
  };

  return (
    <div className="space-y-6">
      {/* Staff Header */}
      <div className="rounded-2xl bg-royal-900 p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-royal-100 text-xs font-semibold mb-2">
            <Wrench className="w-3.5 h-3.5" /> Maintenance Operations Console
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Hello, {user?.name}
          </h1>
          <p className="text-xs text-royal-200 mt-1">
            Department: <strong>{stats.departmentName}</strong> &bull; Assigned Tasks & Work Orders
          </p>
        </div>

        <Link
          to="/complaints"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-royal-600 hover:bg-royal-500 rounded-xl text-xs font-bold transition shadow-sm self-start sm:self-auto"
        >
          <FileText className="w-4 h-4" /> View All Tasks
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Assigned To Queue</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.assignedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Awaiting inspection</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">In Progress</span>
            <Wrench className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats.inProgressCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Under repair</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Resolved Work</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{stats.resolvedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Completed orders</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Critical Priority</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600">{stats.criticalCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Immediate action required</div>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Current Work Orders</h2>
            <p className="text-xs text-slate-500">
              Assigned to you or your department ({stats.departmentName})
            </p>
          </div>
          <Link
            to="/complaints"
            className="text-xs font-semibold text-royal-600 hover:text-royal-800 flex items-center gap-1"
          >
            Full Task List &rarr;
          </Link>
        </div>

        {data?.assignedComplaints && data.assignedComplaints.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {data.assignedComplaints.map((c) => (
              <div
                key={c.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/70 -mx-3 px-3 rounded-xl transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-royal-700">{c.id}</span>
                    <StatusBadge status={c.status} />
                    <StatusBadge priority={c.priority} type="priority" />
                  </div>
                  <div className="text-xs font-bold text-slate-900">{c.title}</div>
                  <div className="text-[11px] text-slate-500 flex flex-wrap gap-3">
                    <span>📍 {c.location} {c.roomNumber ? `(${c.roomNumber})` : ''}</span>
                    <span>👤 Reporter: {c.reporter?.name}</span>
                  </div>
                </div>

                <Link
                  to={`/complaints/${c.id}`}
                  className="px-3.5 py-1.5 rounded-xl bg-royal-50 hover:bg-royal-100 text-royal-700 font-semibold text-xs flex items-center justify-center gap-1.5 self-start sm:self-auto"
                >
                  Inspect & Update <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            No pending tasks assigned to your department. Great work!
          </div>
        )}
      </div>
    </div>
  );
};
