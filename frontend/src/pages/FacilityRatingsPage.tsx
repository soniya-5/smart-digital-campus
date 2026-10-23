import React, { useEffect, useState } from 'react';
import { Star, PlusCircle, MessageSquare, ThumbsUp, Building2 } from 'lucide-react';
import { api } from '../api/client';
import { Modal } from '../components/common/Modal';
import { FacilityRating } from '../types';

const FACILITIES = [
  'Library',
  'Workshop',
  'Sports Room',
  'Computer Labs',
  'Seminar Hall',
  'Washrooms',
  'Classrooms',
  'Lift',
  'Wi-Fi',
];

export const FacilityRatingsPage: React.FC = () => {
  const [ratings, setRatings] = useState<FacilityRating[]>([]);
  const [averages, setAverages] = useState<Record<string, { sum: number; count: number; avg: number }>>({});
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(FACILITIES[0]);
  const [userRating, setUserRating] = useState(5);
  const [comments, setComments] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/campus/ratings');
      if (res.success && res.data) {
        setRatings(res.data.ratings || []);
        setAverages(res.data.averages || {});
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, []);

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await api.post('/campus/ratings', {
        facilityName: selectedFacility,
        rating: userRating,
        comments,
      });
      if (res.success) {
        setShowModal(false);
        setComments('');
        fetchRatings();
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
          <h1 className="text-2xl font-bold text-slate-900">Campus Facility Ratings & Feedback</h1>
          <p className="mt-1 text-xs text-slate-500">
            Student community reviews and satisfaction scores for campus infrastructure and amenities
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-royal-600 hover:bg-royal-700 text-white text-xs font-bold shadow-md shadow-royal-600/20 transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" /> Rate a Facility
        </button>
      </div>

      {/* Facility Cards Average Overview (9 Core Campus Facilities) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FACILITIES.map((fac) => {
          const data = averages[fac];
          const hasRatings = data && data.count > 0;
          return (
            <div key={fac} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="line-clamp-1">{fac}</span>
                <Building2 className="w-4 h-4 text-royal-600" />
              </div>
              <div className="flex items-baseline gap-2">
                {hasRatings ? (
                  <>
                    <span className="text-2xl font-extrabold text-slate-900">{data.avg.toFixed(1)}</span>
                    <span className="text-xs text-slate-400">/ 5.0</span>
                  </>
                ) : (
                  <span className="text-xs font-semibold text-slate-400">No ratings yet</span>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <div className="flex text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        hasRatings && s <= Math.round(data.avg)
                          ? 'fill-amber-500 text-amber-500'
                          : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <span>{hasRatings ? `${data.count} review${data.count === 1 ? '' : 's'}` : '0 reviews'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Community Comments Thread */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">Recent Student Reviews</h2>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading reviews...</div>
        ) : ratings.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">
            No reviews yet. Be the first to share your thoughts on campus facilities!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ratings.map((r) => (
              <div key={r.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{r.facilityName}</span>
                  <div className="flex text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= r.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {r.comments && <p className="text-slate-600 leading-relaxed italic">"{r.comments}"</p>}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>Reviewed by: {r.user?.name || 'Verified Student'}</span>
                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Submit Facility Rating">
        <form onSubmit={handleSubmitRating} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Campus Facility *</label>
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white"
            >
              {FACILITIES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div className="text-center py-2">
            <span className="block text-xs font-semibold text-slate-700 mb-2">Overall Quality Rating</span>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setUserRating(s)}
                  className="p-1 focus:outline-none"
                >
                  <Star
                    className={`w-7 h-7 ${
                      s <= userRating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Review Comments</label>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="What are the highlights or areas that need maintenance attention?"
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
              {modalLoading ? 'Submitting...' : 'Post Rating'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
