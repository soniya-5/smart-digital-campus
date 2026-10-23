import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  PlusCircle,
  Search,
  Filter,
  Tag,
  Edit2,
  Trash2,
  Phone,
  Mail,
  CheckCircle,
} from 'lucide-react';
import { api, getFileUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { MarketplaceListing } from '../types';

const CATEGORIES = ['All', 'Books', 'Electronics', 'Furniture', 'Stationery', 'Misc'];

export const MarketplacePage: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('AVAILABLE');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Books',
    price: '',
    condition: 'Good',
    contactMethod: '',
    status: 'AVAILABLE',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(search ? { search } : {}),
        ...(category !== 'All' ? { category } : {}),
        ...(status !== 'All' ? { status } : {}),
      });

      const res = await api.get<MarketplaceListing[]>(`/campus/marketplace?${params.toString()}`);
      if (res.success && res.data) {
        setListings(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [category, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      category: 'Books',
      price: '',
      condition: 'Good',
      contactMethod: user?.email ? `Email: ${user.email}` : '',
      status: 'AVAILABLE',
    });
    setImageFile(null);
    setModalError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (item: MarketplaceListing) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      description: item.description,
      category: item.category,
      price: String(item.price),
      condition: item.condition,
      contactMethod: item.contactMethod,
      status: item.status,
    });
    setImageFile(null);
    setModalError(null);
    setShowModal(true);
  };

  const handleSaveListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalLoading(true);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('price', formData.price);
      data.append('condition', formData.condition);
      data.append('contactMethod', formData.contactMethod);
      data.append('status', formData.status);
      if (imageFile) {
        data.append('image', imageFile);
      }

      let res;
      if (editingId) {
        res = await api.put(`/campus/marketplace/${editingId}`, data);
      } else {
        res = await api.post('/campus/marketplace', data);
      }

      if (res.success) {
        setShowModal(false);
        fetchListings();
      } else {
        setModalError(res.error || 'Failed to save listing');
      }
    } catch {
      setModalError('Network error saving listing.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    const res = await api.delete(`/campus/marketplace/${id}`);
    if (res.success) {
      fetchListings();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campus Marketplace</h1>
          <p className="mt-1 text-xs text-slate-500">
            Peer-to-peer student marketplace for course textbooks, calculators, electronics, and supplies
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-royal-600 hover:bg-royal-700 text-white text-xs font-bold shadow-md shadow-royal-600/20 transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Create Listing
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search listings by title or description..."
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

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" /> Category:
          </div>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                category === cat
                  ? 'bg-royal-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium"
            >
              <option value="All">All</option>
              <option value="AVAILABLE">Available</option>
              <option value="SOLD">Sold</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-royal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading marketplace listings...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
          <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No listings found</h3>
          <p className="text-xs text-slate-500">Be the first to list an item or broaden your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => {
            const isOwner = user?.id === item.sellerId;
            const canManage = isOwner || user?.role === 'ADMIN';

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  {item.image ? (
                    <img
                      src={getFileUrl(item.image)}
                      alt={item.title}
                      className="w-full h-44 object-cover border-b border-slate-100"
                    />
                  ) : (
                    <div className="w-full h-36 bg-slate-100 flex items-center justify-center text-slate-400 border-b border-slate-100">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                  )}

                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-royal-100 text-royal-800 uppercase">
                        {item.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === 'AVAILABLE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <h2 className="text-sm font-bold text-slate-900 line-clamp-1">{item.title}</h2>
                    <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="text-base font-extrabold text-royal-700">
                        ${item.price.toFixed(2)}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Condition: {item.condition}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 pt-1">
                      <div className="font-semibold text-slate-700">Contact: {item.contactMethod}</div>
                      <div>Seller: {item.seller?.name || 'Campus Student'}</div>
                    </div>
                  </div>
                </div>

                {canManage && (
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition"
                      title="Edit Listing"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteListing(item.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 transition"
                      title="Delete Listing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Marketplace Listing' : 'Create Marketplace Listing'}
      >
        <form onSubmit={handleSaveListing} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold">
              {modalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. TI-84 Plus CE Graphing Calculator"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white"
              >
                {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Price ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="25.00"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="Brand New">Brand New</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="AVAILABLE">Available</option>
                <option value="SOLD">Sold</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Method *</label>
            <input
              type="text"
              required
              value={formData.contactMethod}
              onChange={(e) => setFormData({ ...formData, contactMethod: e.target.value })}
              placeholder="e.g. Email: alex@campus.edu or Campus Room B-201"
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
              placeholder="Include details about item functionality, included accessories, or pickup arrangements..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Optional Photo</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => e.target.files && setImageFile(e.target.files[0])}
              className="text-xs text-slate-500"
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
              {modalLoading ? 'Saving...' : 'Save Listing'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
