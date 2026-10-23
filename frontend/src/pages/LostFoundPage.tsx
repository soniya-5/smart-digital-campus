import React, { useEffect, useState } from 'react';
import {
  Search,
  PlusCircle,
  MapPin,
  Calendar,
  Tag,
  CheckCircle,
  HelpCircle,
  Image,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { LostAndFoundItem } from '../types';

export const LostFoundPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<LostAndFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'LOST' | 'FOUND'>('ALL');
  const [search, setSearch] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'LOST',
    itemName: '',
    category: 'Electronics',
    location: '',
    description: '',
    contactInfo: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(activeTab !== 'ALL' ? { type: activeTab } : {}),
        ...(search ? { search } : {}),
      });

      const res = await api.get<LostAndFoundItem[]>(`/campus/lost-found?${params.toString()}`);
      if (res.success && res.data) {
        setItems(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const data = new FormData();
      data.append('type', formData.type);
      data.append('itemName', formData.itemName);
      data.append('category', formData.category);
      data.append('location', formData.location);
      data.append('description', formData.description);
      data.append('contactInfo', formData.contactInfo);
      if (imageFile) data.append('image', imageFile);

      const res = await api.post('/campus/lost-found', data);
      if (res.success) {
        setShowModal(false);
        fetchItems();
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const res = await api.patch(`/campus/lost-found/${id}/status`, { status: newStatus });
    if (res.success) {
      fetchItems();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campus Lost & Found Hub</h1>
          <p className="mt-1 text-xs text-slate-500">
            Report misplaced possessions or hand in discovered items for safe campus retrieval
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              type: 'LOST',
              itemName: '',
              category: 'Electronics',
              location: '',
              description: '',
              contactInfo: user?.email ? `Contact via: ${user.email}` : '',
            });
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-royal-600 hover:bg-royal-700 text-white text-xs font-bold shadow-md shadow-royal-600/20 transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" /> Report Lost / Found Item
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-2">
          {(['ALL', 'LOST', 'FOUND'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === tab
                  ? 'bg-royal-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab === 'ALL' ? 'All Items' : tab === 'LOST' ? 'Lost Items' : 'Found Items'}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchItems();
          }}
          className="flex gap-2 w-full sm:w-72"
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items or location..."
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-royal-500/20"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-royal-600 text-white text-xs font-bold rounded-xl"
          >
            Go
          </button>
        </form>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">Loading lost & found reports...</div>
      ) : items.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No items reported</h3>
          <p className="text-xs text-slate-500">All items have been retrieved or none reported under this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const isReporter = user?.id === item.reporterId;
            const canManage = isReporter || user?.role === 'ADMIN';

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.itemName}
                      className="w-full h-40 object-cover border-b border-slate-100"
                    />
                  ) : (
                    <div className="w-full h-28 bg-slate-100 flex items-center justify-center text-slate-400">
                      <HelpCircle className="w-8 h-8" />
                    </div>
                  )}

                  <div className="p-5 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] ${
                          item.type === 'LOST'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.type} REPORT
                      </span>
                      <span className="font-semibold text-slate-400 text-[10px]">
                        Status: {item.status}
                      </span>
                    </div>

                    <h2 className="text-sm font-bold text-slate-900 line-clamp-1">{item.itemName}</h2>
                    <p className="text-slate-600 line-clamp-2">{item.description}</p>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-[11px] text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-royal-600" />
                        <span>Last seen: {item.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Date: {new Date(item.dateReported).toLocaleDateString()}</span>
                      </div>
                      {item.contactInfo && (
                        <div className="pt-1 text-slate-500 font-medium">
                          Contact: {item.contactInfo}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {canManage && item.status !== 'RETURNED' && (
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                    <button
                      onClick={() => handleUpdateStatus(item.id, 'RETURNED')}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px]"
                    >
                      Mark as Returned
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Report Lost or Found Item">
        <form onSubmit={handleCreateReport} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Report Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="LOST">I Lost an Item</option>
                <option value="FOUND">I Found an Item</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="Electronics">Electronics</option>
                <option value="Cards/ID">Student ID / Cards</option>
                <option value="Books">Books / Notes</option>
                <option value="Accessories">Keys / Accessories</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name *</label>
            <input
              type="text"
              required
              value={formData.itemName}
              onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
              placeholder="e.g. Navy Blue HydroFlask Water Bottle or Black ThinkPad Charger"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Campus Location *</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. 2nd Floor Study Lounge, Central Library"
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
              placeholder="Distinguishing stickers, scratches, model specifics, or pickup location..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Protocol *</label>
            <input
              type="text"
              required
              value={formData.contactInfo}
              onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
              placeholder="e.g. Drop at Security Desk A, or email alex@campus.edu"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Attach Photo (Optional)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => e.target.files && setImageFile(e.target.files[0])}
              className="text-xs text-slate-500"
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
              {modalLoading ? 'Submitting...' : 'Post Item Report'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
