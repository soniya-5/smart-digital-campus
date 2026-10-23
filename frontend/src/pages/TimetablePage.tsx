import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  PlusCircle,
  Trash2,
  MapPin,
  User,
  AlertCircle,
  GraduationCap,
  CalendarCheck,
  CheckCircle,
  BookOpen,
} from 'lucide-react';
import { api } from '../api/client';
import { Modal } from '../components/common/Modal';
import { TimetableEntry } from '../types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const BATCHES = ['ALL', 'A', 'B', 'C'];

export const TimetablePage: React.FC = () => {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [metadata, setMetadata] = useState<any>({
    className: 'S.E. (III) (Computer Engg.)',
    semester: 'SEM III',
    classroom: '005',
    gfm: 'Prof. M.A. Patil (MAP)',
    wef: '06/07/2026',
  });
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState('Monday');
  const [selectedBatch, setSelectedBatch] = useState('ALL');

  // Modal for personal custom classes
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    code: '',
    dayOfWeek: 'Monday',
    startTime: '09:15',
    endTime: '10:15',
    location: '005',
    facultyName: '',
    batch: 'ALL',
    type: 'LECTURE',
  });
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>(`/academic/timetable?batch=${selectedBatch}`);
      if (res.success && res.data) {
        if (Array.isArray(res.data)) {
          setEntries(res.data);
        } else if (res.data.entries) {
          setEntries(res.data.entries);
          if (res.data.metadata) setMetadata(res.data.metadata);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [selectedBatch]);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalLoading(true);

    try {
      const res = await api.post('/academic/timetable', formData);
      if (res.success) {
        setShowModal(false);
        fetchTimetable();
      } else {
        setModalError(res.error || 'Failed to add class.');
      }
    } catch {
      setModalError('Network error adding class.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    const res = await api.delete(`/academic/timetable/${id}`);
    if (res.success) fetchTimetable();
  };

  const dayEntries = entries.filter((e) => e.dayOfWeek === activeDay);

  return (
    <div className="space-y-6">
      {/* College Schedule Banner / Header */}
      <div className="bg-gradient-to-r from-royal-900 via-royal-800 to-royal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-royal-700/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-700/60 border border-royal-600/50 text-[11px] font-bold tracking-wide text-royal-200">
              <GraduationCap className="w-3.5 h-3.5 text-royal-300" />
              {metadata.className} &bull; {metadata.semester}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              College Timetable & Schedule
            </h1>
            <p className="text-xs sm:text-sm text-royal-200/90 flex flex-wrap gap-x-4 gap-y-1">
              <span>Classroom: <strong className="text-white">{metadata.classroom}</strong></span>
              <span>GFM: <strong className="text-white">{metadata.gfm}</strong></span>
              <span>w.e.f: <strong className="text-white">{metadata.wef}</strong></span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/attendance"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-royal-50 text-royal-900 text-xs font-bold shadow-md transition"
            >
              <CalendarCheck className="w-4 h-4 text-royal-700" /> Mark Attendance
            </Link>
            <button
              onClick={() => {
                setFormData({
                  subject: '',
                  code: '',
                  dayOfWeek: activeDay,
                  startTime: '09:15',
                  endTime: '10:15',
                  location: '005',
                  facultyName: '',
                  batch: selectedBatch === 'ALL' ? 'ALL' : selectedBatch,
                  type: 'LECTURE',
                });
                setModalError(null);
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-royal-700/80 hover:bg-royal-600 border border-royal-500/50 text-white text-xs font-bold shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" /> Add Custom Class
            </button>
          </div>
        </div>
      </div>

      {/* Batch & Day Selector Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Batch Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Filter Batch:</span>
            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              {BATCHES.map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBatch(b)}
                  className={`px-3 py-1 rounded-lg font-bold transition text-xs ${
                    selectedBatch === b
                      ? 'bg-royal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {b === 'ALL' ? 'All Classes' : `Batch ${b}`}
                </button>
              ))}
            </div>
          </div>

          <span className="text-[11px] text-slate-400">
            {selectedBatch === 'ALL' ? 'Viewing master class schedule' : `Showing lectures + Batch ${selectedBatch} practicals/tutorials`}
          </span>
        </div>

        {/* Day Selector */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
          {DAYS.map((day) => {
            const count = entries.filter((e) => e.dayOfWeek === day).length;
            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeDay === day
                    ? 'bg-royal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 bg-slate-50'
                }`}
              >
                <span>{day}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      activeDay === day ? 'bg-royal-800 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Classes List for Selected Day */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-royal-600" />
            Schedule for {activeDay} {selectedBatch !== 'ALL' && `(Batch ${selectedBatch})`}
          </h2>
          <span className="text-xs text-slate-500 font-medium">{dayEntries.length} sessions scheduled</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading schedule...</div>
        ) : dayEntries.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Clock className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs">No scheduled lectures for {activeDay}.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayEntries.map((e) => {
              const isPractical = e.type === 'PRACTICAL';
              const isTutorial = e.type === 'TUTORIAL';
              const isActivity = e.type === 'ACTIVITY';

              return (
                <div
                  key={e.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-royal-50/40 transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-royal-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        {e.startTime} - {e.endTime}
                      </span>

                      {e.code && (
                        <span className="font-mono text-xs font-extrabold text-royal-900 bg-royal-100 px-2 py-0.5 rounded">
                          {e.code}
                        </span>
                      )}

                      <span className="text-sm font-bold text-slate-900">{e.subject}</span>

                      {/* Type Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isPractical
                            ? 'bg-purple-100 text-purple-800'
                            : isTutorial
                            ? 'bg-amber-100 text-amber-800'
                            : isActivity
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-royal-800'
                        }`}
                      >
                        {e.type || 'LECTURE'}
                      </span>

                      {/* Batch Badge */}
                      {e.batch && e.batch !== 'ALL' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                          Batch {e.batch}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap gap-4 pt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-royal-600" /> Room / Venue: <strong>{e.location}</strong>
                      </span>
                      {e.facultyName && (
                        <span className="flex items-center gap-1 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400" /> Faculty: <strong>{e.facultyName}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Link
                      to={`/attendance?date=${new Date().toISOString().split('T')[0]}&batch=${selectedBatch}`}
                      className="px-3 py-1.5 bg-royal-50 hover:bg-royal-100 text-royal-700 text-xs font-semibold rounded-lg transition"
                    >
                      Track
                    </Link>
                    {e.userId && (
                      <button
                        onClick={() => handleDeleteEntry(e.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        title="Remove Custom Class"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for adding custom class */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Timetable Entry">
        <form onSubmit={handleAddEntry} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Name *</label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g. Data Structures"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Code / Abbreviation</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. DS, OS, OOPCGL"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Class Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="LECTURE">Theory Lecture</option>
                <option value="PRACTICAL">Lab Practical</option>
                <option value="TUTORIAL">Tutorial</option>
                <option value="ACTIVITY">Activity / Sports</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Day *</label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time *</label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full p-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Time *</label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full p-2 text-xs rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Room / Venue *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="005, 210B, etc."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty Code</label>
              <input
                type="text"
                value={formData.facultyName}
                onChange={(e) => setFormData({ ...formData, facultyName: e.target.value })}
                placeholder="e.g. MAP, JCJ"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Batch</label>
              <select
                value={formData.batch}
                onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="ALL">All Batches</option>
                <option value="A">Batch A</option>
                <option value="B">Batch B</option>
                <option value="C">Batch C</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="px-5 py-2 bg-royal-600 hover:bg-royal-700 text-white rounded-xl text-xs font-bold"
            >
              {modalLoading ? 'Saving...' : 'Add Class'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
