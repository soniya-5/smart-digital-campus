import React, { useEffect, useState } from 'react';
import {
  Users,
  PlusCircle,
  Calendar,
  BookOpen,
  MapPin,
  CheckCircle,
  LogOut,
  Search,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { StudyGroup } from '../types';

export const StudyGroupsPage: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    course: '',
    meetingMode: 'Hybrid',
    schedule: '',
    capacity: '6',
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await api.get<StudyGroup[]>(
        `/campus/study-groups?${search ? `search=${encodeURIComponent(search)}` : ''}`
      );
      if (res.success && res.data) {
        setGroups(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleJoinGroup = async (groupId: string) => {
    const res = await api.post(`/campus/study-groups/${groupId}/join`);
    if (res.success) {
      fetchGroups();
    } else {
      alert(res.error || 'Could not join group');
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    const res = await api.post(`/campus/study-groups/${groupId}/leave`);
    if (res.success) {
      fetchGroups();
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalLoading(true);

    try {
      const res = await api.post('/campus/study-groups', formData);
      if (res.success) {
        setShowModal(false);
        fetchGroups();
      } else {
        setModalError(res.error || 'Failed to create group');
      }
    } catch {
      setModalError('Network error creating group.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Study Group Finder</h1>
          <p className="mt-1 text-xs text-slate-500">
            Form collaborative academic study circles with course peers with capacity management
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              title: '',
              description: '',
              subject: '',
              course: '',
              meetingMode: 'Hybrid',
              schedule: '',
              capacity: '6',
            });
            setModalError(null);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-royal-600 hover:bg-royal-700 text-white text-xs font-bold shadow-md shadow-royal-600/20 transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" /> Form New Group
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchGroups();
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by subject, course name, or study group topic..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-royal-500/20"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-royal-600 hover:bg-royal-700 text-white text-xs font-bold rounded-xl transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Study Groups Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-royal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading academic study circles...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No active study groups</h3>
          <p className="text-xs text-slate-500">Create a study circle for your course and invite classmates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((g) => {
            const memberCount = g.members?.length || 0;
            const isFull = memberCount >= g.capacity;
            const isMember = g.members?.some((m) => m.userId === user?.id);

            return (
              <div
                key={g.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 uppercase">
                      {g.meetingMode}
                    </span>
                    <span
                      className={`text-xs font-bold font-mono ${
                        isFull ? 'text-rose-600' : 'text-royal-700'
                      }`}
                    >
                      {memberCount} / {g.capacity} members
                    </span>
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-slate-900 line-clamp-1">{g.title}</h2>
                    <div className="text-xs font-semibold text-royal-600 mt-0.5">
                      {g.subject} &bull; {g.course}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {g.description}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700 space-y-1">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-royal-600" />
                      <span>{g.schedule}</span>
                    </div>
                    <div className="text-slate-400">
                      Organized by: <span className="text-slate-700 font-semibold">{g.creator?.name || 'Student'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  {isMember ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Joined
                      </span>
                      <button
                        onClick={() => handleLeaveGroup(g.id)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Leave Group
                      </button>
                    </div>
                  ) : (
                    <button
                      disabled={isFull}
                      onClick={() => handleJoinGroup(g.id)}
                      className="w-full py-2 bg-royal-600 hover:bg-royal-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-40"
                    >
                      {isFull ? 'Capacity Full' : 'Join Study Circle'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Form New Study Circle"
      >
        <form onSubmit={handleCreateGroup} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold">
              {modalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Circle Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Algorithms & Dynamic Programming Study Group"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject *</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g. Data Structures"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Course Code *</label>
              <input
                type="text"
                required
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                placeholder="e.g. CS201 / Semester 3"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Meeting Mode</label>
              <select
                value={formData.meetingMode}
                onChange={(e) => setFormData({ ...formData, meetingMode: e.target.value })}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="Hybrid">Hybrid</option>
                <option value="In-Person">In-Person</option>
                <option value="Online">Online</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Member Capacity *</label>
              <input
                type="number"
                min="2"
                max="30"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Schedule & Location *</label>
            <input
              type="text"
              required
              value={formData.schedule}
              onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
              placeholder="e.g. Mondays & Wednesdays at 4:30 PM, Library Room 3"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Explain the goals of this study circle and preparation expectations..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
            />
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
              {modalLoading ? 'Creating...' : 'Create Study Group'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
