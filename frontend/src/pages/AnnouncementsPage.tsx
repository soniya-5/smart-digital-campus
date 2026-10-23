import React, { useEffect, useState } from 'react';
import {
  BellRing,
  PlusCircle,
  Pin,
  Calendar,
  Edit2,
  Archive,
  CheckCircle,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';

export const AnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    isPinned: false,
  });
  const [modalLoading, setModalLoading] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/academic/announcements');
      if (res.success && res.data) {
        setAnnouncements(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      title: '',
      content: '',
      category: 'General',
      isPinned: false,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (ann: any) => {
    setEditingId(ann.id);
    setFormData({
      title: ann.title,
      content: ann.content,
      category: ann.category,
      isPinned: ann.isPinned,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      let res;
      if (editingId) {
        res = await api.put(`/academic/announcements/${editingId}`, formData);
      } else {
        res = await api.post('/academic/announcements', formData);
      }

      if (res.success) {
        setShowModal(false);
        fetchAnnouncements();
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleArchive = async (id: string) => {
    const res = await api.put(`/academic/announcements/${id}`, { isArchived: true });
    if (res.success) fetchAnnouncements();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campus Announcements & Notices</h1>
          <p className="mt-1 text-xs text-slate-500">
            Official communications, maintenance schedules, and administrative circulars
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-royal-600 hover:bg-royal-700 text-white text-xs font-bold shadow-md shadow-royal-600/20 transition self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" /> Publish Announcement
          </button>
        )}
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">Loading notices...</div>
      ) : announcements.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
          <BellRing className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No active circulars</h3>
          <p className="text-xs text-slate-500">Official bulletins will appear here when published.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`p-6 rounded-2xl border shadow-xs transition ${
                ann.isPinned
                  ? 'bg-amber-50/40 border-amber-200 ring-1 ring-amber-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  {ann.isPinned && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                      <Pin className="w-3 h-3" /> PINNED CIRCULAR
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-royal-100 text-royal-800 uppercase">
                    {ann.category}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                  <span>&bull; Author: {ann.author?.name || 'Administration'}</span>
                </div>
              </div>

              <h2 className="text-base font-bold text-slate-900 mb-2">{ann.title}</h2>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {ann.content}
              </p>

              {user?.role === 'ADMIN' && (
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                  <button
                    onClick={() => handleOpenEdit(ann)}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleArchive(ann.id)}
                    className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-100"
                    title="Archive"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Announcement' : 'Publish Announcement'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Campus Power Grid Maintenance Scheduled for Saturday"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="General">General</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Academic">Academic</option>
                <option value="Event">Event</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="rounded text-royal-600 focus:ring-royal-500 w-4 h-4"
                />
                <span>Pin to top of feed</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Content *</label>
            <textarea
              required
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Full announcement details..."
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
              {modalLoading ? 'Saving...' : 'Publish'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
