import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  Info,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Award,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { api } from '../api/client';
import {
  AttendanceSession,
  AttendanceStatsResponse,
  AttendanceSubjectStat,
} from '../types';

const BATCHES = ['ALL', 'A', 'B', 'C'];

export const AttendanceTrackerPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const initialBatch = searchParams.get('batch') || 'ALL';

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedBatch, setSelectedBatch] = useState(initialBatch);

  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [stats, setStats] = useState<AttendanceStatsResponse['overall'] | null>(null);
  const [subjectBreakdown, setSubjectBreakdown] = useState<AttendanceSubjectStat[]>([]);

  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Helper to fetch sessions for selected date & batch
  const fetchSessions = async (date: string, batch: string) => {
    try {
      setLoadingSessions(true);
      const res = await api.get<any>(`/academic/attendance/sessions?date=${date}&batch=${batch}`);
      if (res.success && res.data) {
        setSessions(res.data.sessions || []);
        setDayOfWeek(res.data.dayOfWeek || '');
      }
    } finally {
      setLoadingSessions(false);
    }
  };

  // Helper to fetch overall & subject stats
  const fetchStats = async (batch: string) => {
    try {
      setLoadingStats(true);
      const res = await api.get<AttendanceStatsResponse>(`/academic/attendance/stats?batch=${batch}`);
      if (res.success && res.data) {
        setStats(res.data.overall);
        setSubjectBreakdown(res.data.subjectBreakdown || []);
      }
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchSessions(selectedDate, selectedBatch);
  }, [selectedDate, selectedBatch]);

  useEffect(() => {
    fetchStats(selectedBatch);
  }, [selectedBatch]);

  // Mark session attendance
  const handleMarkAttendance = async (
    timetableEntryId: string,
    status: 'ATTENDED' | 'NOT_ATTENDED'
  ) => {
    try {
      setActionLoading(timetableEntryId);
      const res = await api.post('/academic/attendance/mark', {
        timetableEntryId,
        date: selectedDate,
        status,
      });

      if (res.success) {
        // Optimistic / direct state update
        setSessions((prev) =>
          prev.map((s) => (s.timetableEntryId === timetableEntryId ? { ...s, status } : s))
        );
        // Refresh summary stats
        fetchStats(selectedBatch);
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Date Navigation Helpers
  const changeDateByDays = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const newDateStr = d.toISOString().split('T')[0];
    setSelectedDate(newDateStr);
    setSearchParams({ date: newDateStr, batch: selectedBatch });
  };

  const handleSetToday = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setSelectedDate(todayStr);
    setSearchParams({ date: todayStr, batch: selectedBatch });
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-royal-100 text-royal-800 font-extrabold text-[10px] tracking-wide uppercase">
              S.E. (III) Computer Engg.
            </span>
            <span className="text-xs text-slate-400 font-medium">&bull; Classroom 005</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Timetable Attendance Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mark your lecture and lab practical attendance directly against the official timetable schedule.
          </p>
        </div>

        <Link
          to="/timetable"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold shadow-xs transition self-start sm:self-auto"
        >
          <Clock className="w-4 h-4 text-royal-600" />
          Full Schedule View
        </Link>
      </div>

      {/* Institutional Disclaimer Notice */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-royal-200 flex items-start gap-3 text-xs text-royal-950 shadow-2xs">
        <Info className="w-5 h-5 text-royal-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block text-royal-900">ACADEMIC ATTENDANCE PLANNING</strong>
          <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
            Attendance percentages are calculated based on your marked sessions: <strong>(Attended / Total Recorded) &times; 100</strong>. Unmarked or upcoming sessions do not reduce your standing. Maintain at least <strong>75%</strong> to remain eligible for semester term examinations.
          </p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Percentage Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Overall Attendance</span>
            <TrendingUp className="w-4 h-4 text-royal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold ${
                !stats?.hasData
                  ? 'text-slate-400'
                  : stats.isEligible
                  ? 'text-emerald-600'
                  : 'text-rose-600'
              }`}
            >
              {stats?.hasData ? `${stats.percentage}%` : '0%'}
            </span>
            <span className="text-xs text-slate-400">
              {stats?.hasData ? `(Target: ${stats.target}%)` : '(No marked records)'}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                !stats?.hasData
                  ? 'bg-slate-300 w-0'
                  : stats.isEligible
                  ? 'bg-emerald-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, stats?.percentage || 0)}%` }}
            />
          </div>
        </div>

        {/* Total Attended */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Sessions Attended</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {stats?.totalAttended || 0}
          </div>
          <p className="text-[11px] text-slate-400">
            Lectures & practicals attended
          </p>
        </div>

        {/* Total Recorded */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Total Recorded</span>
            <CalendarCheck className="w-4 h-4 text-royal-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {stats?.totalRecorded || 0}
          </div>
          <p className="text-[11px] text-slate-400">
            Total marked sessions so far
          </p>
        </div>

        {/* Eligibility Standing */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Exam Standing</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="pt-1">
            {!stats?.hasData ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                Awaiting Marks
              </span>
            ) : stats.isEligible ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Eligible (&ge; 75%)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-extrabold">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Shortage (&lt; 75%)
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 pt-1">
            Based on institutional threshold
          </p>
        </div>
      </div>

      {/* Date & Batch Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Date Selector Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => changeDateByDays(-1)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50">
            <Calendar className="w-4 h-4 text-royal-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSearchParams({ date: e.target.value, batch: selectedBatch });
              }}
              className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
            />
            <span className="text-xs font-extrabold text-royal-700 border-l border-slate-300 pl-2">
              {dayOfWeek || 'Selected Day'}
            </span>
          </div>

          <button
            onClick={() => changeDateByDays(1)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isToday && (
            <button
              onClick={handleSetToday}
              className="px-3 py-1.5 rounded-xl bg-royal-50 hover:bg-royal-100 text-royal-700 text-xs font-bold transition"
            >
              Today
            </button>
          )}
        </div>

        {/* Batch Filter Pills */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-600">Select Batch:</span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            {BATCHES.map((b) => (
              <button
                key={b}
                onClick={() => {
                  setSelectedBatch(b);
                  setSearchParams({ date: selectedDate, batch: b });
                }}
                className={`px-3 py-1 rounded-lg font-bold transition text-xs ${
                  selectedBatch === b
                    ? 'bg-royal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {b === 'ALL' ? 'All' : `Batch ${b}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Section: Today's Scheduled Sessions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-royal-600" />
              Classes Scheduled for {dayOfWeek} ({selectedDate})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click <strong>Attended</strong> or <strong>Not Attended</strong> to record attendance for each lecture or practical session.
            </p>
          </div>
          <span className="text-xs font-bold text-royal-700 bg-royal-50 px-3 py-1 rounded-full border border-royal-200">
            {sessions.length} sessions
          </span>
        </div>

        {loadingSessions ? (
          <div className="py-16 text-center text-xs text-slate-500">
            Loading timetable sessions for {selectedDate}...
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <Clock className="w-10 h-10 mx-auto text-slate-300" />
            <h3 className="text-sm font-bold text-slate-700">No scheduled classes on this day</h3>
            <p className="text-xs max-w-sm mx-auto text-slate-500">
              There are no timetable classes recorded for {dayOfWeek} with the selected batch filter. Use the date arrows above to navigate to an active academic weekday.
            </p>
            <Link
              to="/timetable"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-royal-600 hover:text-royal-800"
            >
              Open Timetable Setup &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const isAttended = session.status === 'ATTENDED';
              const isNotAttended = session.status === 'NOT_ATTENDED';
              const isUnmarked = session.status === 'UNMARKED';
              const isBusy = actionLoading === session.timetableEntryId;

              return (
                <div
                  key={session.timetableEntryId}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isAttended
                      ? 'bg-emerald-50/40 border-emerald-200 shadow-2xs'
                      : isNotAttended
                      ? 'bg-rose-50/40 border-rose-200 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-royal-300'
                  }`}
                >
                  {/* Session Details */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-royal-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        {session.startTime} - {session.endTime}
                      </span>

                      {session.code && (
                        <span className="font-mono text-xs font-black text-royal-950 bg-royal-100 px-2.5 py-0.5 rounded">
                          {session.code}
                        </span>
                      )}

                      <h3 className="text-sm font-bold text-slate-900">
                        {session.subject}
                      </h3>

                      {session.type && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            session.type === 'PRACTICAL'
                              ? 'bg-purple-100 text-purple-800'
                              : session.type === 'TUTORIAL'
                              ? 'bg-amber-100 text-amber-800'
                              : session.type === 'ACTIVITY'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-royal-800'
                          }`}
                        >
                          {session.type}
                        </span>
                      )}

                      {session.batch && session.batch !== 'ALL' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                          Batch {session.batch}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap gap-4 pt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-royal-600" />
                        Room / Venue: <strong>{session.location}</strong>
                      </span>
                      {session.facultyName && (
                        <span className="flex items-center gap-1 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Faculty: <strong>{session.facultyName}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Attendance Marking Action Buttons */}
                  <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                    {/* Status Pill Indicator */}
                    <div className="mr-2">
                      {isAttended && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Attended
                        </span>
                      )}
                      {isNotAttended && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-extrabold text-[11px]">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" /> Not Attended
                        </span>
                      )}
                      {isUnmarked && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> Unmarked
                        </span>
                      )}
                    </div>

                    {/* Attended Button */}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleMarkAttendance(session.timetableEntryId, 'ATTENDED')}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs ${
                        isAttended
                          ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-500/30'
                          : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-300'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Attended
                    </button>

                    {/* Not Attended Button */}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleMarkAttendance(session.timetableEntryId, 'NOT_ATTENDED')}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs ${
                        isNotAttended
                          ? 'bg-rose-600 text-white shadow-rose-600/30 ring-2 ring-rose-500/30'
                          : 'bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      Not Attended
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Subject-Wise Attendance Breakdown Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Subject-by-Subject Attendance Breakdown
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Attendance percentages calculated separately for each course in your S.E. (III) timetable.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {subjectBreakdown.length} subjects monitored
          </span>
        </div>

        {loadingStats ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Calculating attendance analytics...
          </div>
        ) : subjectBreakdown.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No subjects configured in timetable.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectBreakdown.map((subj) => {
              const hasRecorded = subj.totalRecorded > 0;
              const pct = subj.percentage;

              return (
                <div
                  key={subj.code}
                  className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3 hover:bg-royal-50/30 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black text-royal-950 bg-royal-100 px-2 py-0.5 rounded">
                          {subj.code}
                        </span>
                        {hasRecorded && (
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              subj.isEligible
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {subj.isEligible ? 'Eligible' : 'Shortage'}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">
                        {subj.subject}
                      </h4>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-xl font-extrabold ${
                          !hasRecorded
                            ? 'text-slate-400'
                            : subj.isEligible
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {hasRecorded ? `${pct}%` : '—'}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {hasRecorded ? `${subj.attended}/${subj.totalRecorded} sessions` : 'No records yet'}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        !hasRecorded
                          ? 'bg-slate-300 w-0'
                          : subj.isEligible
                          ? 'bg-emerald-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, pct || 0)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span className="truncate max-w-[120px]">
                      Room: <strong>{subj.location}</strong>
                    </span>
                    {subj.faculty && (
                      <span className="truncate max-w-[120px]">
                        Faculty: <strong>{subj.faculty}</strong>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
