import React, { useEffect, useState } from 'react';
import {
  Clock,
  PlusCircle,
  Calendar,
  MapPin,
  Award,
  AlertCircle,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { ExamRecord } from '../types';

export const ExamCountdownPage: React.FC = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal (Admin)
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    courseCode: '',
    courseName: '',
    examDate: '',
    startTime: '09:30 AM',
    endTime: '12:30 PM',
    venue: '',
    department: 'Computer Science',
    seatNumber: '',
    notes: '',
  });
  const [modalLoading, setModalLoading] = useState(false);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.get<ExamRecord[]>('/academic/exams');
      if (res.success && res.data) {
        setExams(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await api.post('/academic/exams', formData);
      if (res.success) {
        setShowModal(false);
        fetchExams();
      }
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">End-Semester Examination Countdown</h1>
          <p className="mt-1 text-xs text-slate-500">
            Real-time countdown calculated strictly from verified institutional examination schedules
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <button
            onClick={() => {
              setFormData({
                courseCode: '',
                courseName: '',
                examDate: '',
                startTime: '09:30 AM',
                endTime: '12:30 PM',
                venue: '',
                department: 'Computer Science',
                seatNumber: '',
                notes: '',
              });
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-royal-600 hover:bg-royal-700 text-white text-xs font-bold shadow-md shadow-royal-600/20 transition self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" /> Add Exam Schedule
          </button>
        )}
      </div>

      {/* Exam Countdown Cards */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">Loading exam schedules...</div>
      ) : exams.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
          <Clock className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No examination schedules posted</h3>
          <p className="text-xs text-slate-500">Official schedules will be synchronized prior to testing week.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => {
            const days = exam.daysRemaining ?? 0;
            const isImminent = days >= 0 && days <= 5;
            const isPast = days < 0;

            return (
              <div
                key={exam.id}
                className={`bg-white rounded-2xl border p-6 shadow-xs flex flex-col justify-between space-y-4 transition ${
                  isImminent
                    ? 'border-amber-300 ring-2 ring-amber-100'
                    : isPast
                    ? 'border-slate-200 opacity-60'
                    : 'border-slate-200'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-royal-50 text-royal-700 border border-royal-200">
                      {exam.courseCode}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {exam.department}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900">{exam.courseName}</h2>

                  {/* Countdown Timer Badge */}
                  <div
                    className={`p-4 rounded-xl text-center space-y-1 ${
                      isPast
                        ? 'bg-slate-100 text-slate-500'
                        : isImminent
                        ? 'bg-amber-50 text-amber-900 border border-amber-200'
                        : 'bg-royal-50 text-royal-950 border border-royal-200'
                    }`}
                  >
                    <div className="text-3xl font-black">
                      {isPast ? 'COMPLETED' : `${days} DAYS`}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500">
                      {isPast ? 'Examination concluded' : 'Remaining until test time'}
                    </div>
                  </div>

                  {/* Logistics Detail */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-royal-600" />
                      <span>{new Date(exam.examDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-royal-600" />
                      <span>{exam.startTime} - {exam.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-royal-600" />
                      <span>Venue: {exam.venue}</span>
                    </div>
                    {exam.seatNumber && (
                      <div className="font-mono text-[11px] text-royal-700 font-bold pt-1">
                        Assigned Desk: {exam.seatNumber}
                      </div>
                    )}
                  </div>
                </div>

                {exam.notes && (
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 italic">
                    Note: {exam.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Schedule Examination">
        <form onSubmit={handleCreateExam} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Course Code *</label>
              <input
                type="text"
                required
                value={formData.courseCode}
                onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                placeholder="CS401"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Computer Science"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Course Name *</label>
            <input
              type="text"
              required
              value={formData.courseName}
              onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
              placeholder="Distributed Systems & Cloud Computing"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Exam Date *</label>
              <input
                type="date"
                required
                value={formData.examDate}
                onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                className="w-full p-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time *</label>
              <input
                type="text"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                placeholder="09:30 AM"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Time *</label>
              <input
                type="text"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                placeholder="12:30 PM"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Venue / Hall *</label>
              <input
                type="text"
                required
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="Exam Hall 1 (Admin Block)"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Seat Number (Optional)</label>
              <input
                type="text"
                value={formData.seatNumber}
                onChange={(e) => setFormData({ ...formData, seatNumber: e.target.value })}
                placeholder="DESK-A14"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Special Instructions</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="No programmable calculators permitted"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
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
              {modalLoading ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
