import React, { useEffect, useState } from 'react';
import {
  Utensils,
  PlusCircle,
  Filter,
  Info,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { CanteenItem } from '../types';

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Snacks', 'Beverages', 'Specials'];

export const CanteenPage: React.FC = () => {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<CanteenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterVegOnly, setFilterVegOnly] = useState(false);

  // Admin Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Breakfast',
    price: '',
    isVeg: true,
    isAvailable: true,
    description: '',
  });
  const [modalLoading, setModalLoading] = useState(false);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(selectedCategory !== 'All' ? { category: selectedCategory } : {}),
        ...(filterVegOnly ? { isVeg: 'true' } : {}),
      });

      const res = await api.get<CanteenItem[]>(`/campus/canteen?${params.toString()}`);
      if (res.success && res.data) {
        setMenuItems(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [selectedCategory, filterVegOnly]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      category: 'Breakfast',
      price: '',
      isVeg: true,
      isAvailable: true,
      description: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: CanteenItem) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      category: item.category,
      price: String(item.price),
      isVeg: item.isVeg,
      isAvailable: item.isAvailable,
      description: item.description || '',
    });
    setShowModal(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      let res;
      if (editingId) {
        res = await api.put(`/campus/canteen/${editingId}`, formData);
      } else {
        res = await api.post('/campus/canteen', formData);
      }

      if (res.success) {
        setShowModal(false);
        fetchMenu();
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Delete this menu item?')) return;
    const res = await api.delete(`/campus/canteen/${id}`);
    if (res.success) fetchMenu();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campus Canteen Menu</h1>
          <p className="mt-1 text-xs text-slate-500">
            Official daily food court offerings, rates, and dietary availability
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-royal-600 hover:bg-royal-700 text-white text-xs font-bold shadow-md shadow-royal-600/20 transition self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" /> Add Menu Item
          </button>
        )}
      </div>

      {/* Institutional Disclaimer Notice */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">NOTICE: Campus Menu Information Service</span>
          <span>
            This module provides informational cafeteria menus and fixed rates for student convenience.
            It does NOT process digital payments or order bookings. All purchases are handled at the counter.
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition ${
                selectedCategory === cat
                  ? 'bg-royal-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={filterVegOnly}
            onChange={(e) => setFilterVegOnly(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
          />
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Vegetarian Only
          </span>
        </label>
      </div>

      {/* Menu Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">Loading daily menu...</div>
      ) : menuItems.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
          <Utensils className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No items available</h3>
          <p className="text-xs text-slate-500">No food items listed for this category today.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center ${
                        item.isVeg ? 'border-emerald-600' : 'border-rose-600'
                      }`}
                      title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      />
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.isAvailable
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.isAvailable ? 'Available Now' : 'Sold Out'}
                  </span>
                </div>

                <h2 className="text-base font-bold text-slate-900">{item.name}</h2>
                {item.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-lg font-extrabold text-royal-700">
                  ₹{item.price.toFixed(0)} <span className="text-[10px] font-medium text-slate-400">/ plate</span>
                </div>

                {user?.role === 'ADMIN' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Menu Item' : 'Add Canteen Menu Item'}
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Masala Dosa with Sambar"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₹) *</label>
              <input
                type="number"
                step="1"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="45"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border rounded-xl text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={formData.isVeg}
                onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span>Vegetarian Dish</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                className="rounded text-royal-600 focus:ring-royal-500 w-4 h-4"
              />
              <span>Currently In Stock</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Freshly prepared, ingredients, accompaniments..."
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
              {modalLoading ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
