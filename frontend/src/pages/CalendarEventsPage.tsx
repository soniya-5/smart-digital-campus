import React, { useEffect, useState } from 'react';
import {
  Calendar,
  PlusCircle,
  MapPin,
  Users,
  CheckCircle,
  Clock,
  Filter,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { CalendarEvent } from '../types';

const EVENT_TYPES = ['ALL', 'ACADEMIC', 'EXAM', 'HOLIDAY', 'CULTURAL', 'SPORTS'];

export const CalendarEventsPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('ALL');

  // Modal (Admin/Staff)
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'ACADEMIC',
    startDate: '',
    endDate: '',
    location: '',
    organizer: '',
    capacity: '200',
  });
  const [modalLoading, setModalLoading] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(selectedType !== 'ALL' ? { eventType: selectedType } : {}),
      });

      const res = await api.get<CalendarEvent[]>(`/academic/events?${params.toString()}`);
      if (res.success && res.data) {
        setEvents(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedType]);

  const handleRegister = async (eventId: string) => {
    const res = await api.post(`/academic/events/${eventId}/register`);
    if (res.success) {
      fetchEvents();
    } else {
      alert(res.error || 'Registration failed');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await api.post('/academic/events', formData);
      if (res.success) {
        setShowModal(false);
        fetchEvents();
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
          <h1 className="text-2xl font-bold text-slate-900">College Calendar & Campus Events</h1>
          <p className="mt-1 text-xs text-slate-500">
            Institutional schedule, symposiums, holidays, and campus activity registrations
          </p>
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
          <button
            onClick={() => {
              setFormData({
                title: '',
                description: '',
                eventType: 'ACADEMIC',
                startDate: '',
                endDate: '',
                location: '',
                organizer: '',
                capacity: '200',
              });
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-royal-600 hover:bg-royal-700 text-white text-xs font-bold shadow-md shadow-royal-600/20 transition self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" /> Publish Event
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-2 text-xs">
        {EVENT_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition ${
              selectedType === type
                ? 'bg-royal-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {type === 'ALL' ? 'All Events' : type}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">Loading campus calendar...</div>
      ) : events.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No events scheduled</h3>
          <p className="text-xs text-slate-500">Check back later for updated academic dates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-royal-800 uppercase">
                    {ev.eventType}
                  </span>
                  {ev.capacity && (
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {ev.registeredCount || 0} / {ev.capacity} reg
                    </span>
                  )}
                </div>

                <h2 className="text-base font-bold text-slate-900">{ev.title}</h2>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {ev.description}
                </p>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-royal-600" />
                    <span>{new Date(ev.startDate).toLocaleDateString()}</span>
                  </div>
                  {ev.location && (
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{ev.location}</span>
                    </div>
                  )}
                  {ev.organizer && (
                    <div className="text-[11px] text-slate-400">
                      Organizer: <span className="text-slate-600 font-medium">{ev.organizer}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                {ev.isUserRegistered ? (
                  <div className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1.5 py-1.5 bg-emerald-50 rounded-xl">
                    <CheckCircle className="w-4 h-4" /> Registered
                  </div>
                ) : ev.capacity && (ev.registeredCount || 0) >= ev.capacity ? (
                  <button
                    disabled
                    className="w-full py-2 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl"
                  >
                    Event Full
                  </button>
                ) : (
                  <button
                    onClick={() => handleRegister(ev.id)}
                    className="w-full py-2 bg-royal-600 hover:bg-royal-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    Register for Event
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Publish Official Event">
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Event Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Annual Campus Robotics Showcase 2026"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Event Type *</label>
              <select
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white"
              >
                {EVENT_TYPES.filter((t) => t !== 'ALL').map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Seat Capacity</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full p-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full p-2 text-xs rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Main Auditorium"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Organizer</label>
              <input
                type="text"
                value={formData.organizer}
                onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                placeholder="Dean of Academic Affairs"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              {modalLoading ? 'Publishing...' : 'Publish Event'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
