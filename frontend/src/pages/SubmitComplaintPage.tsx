import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Upload,
  CheckCircle,
  HelpCircle,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../api/client';
import { Modal } from '../components/common/Modal';

const CATEGORIES = [
  'Electrical',
  'Plumbing',
  'Internet and IT',
  'Classroom',
  'Laboratory',
  'Library',
  'Furniture',
  'Cleanliness',
  'Security',
  'Parking',
  'Water Supply',
  'Other',
];

const LOCATIONS = [
  'Canteen',
  '0th Floor',
  '1st Floor',
  '2nd Floor',
  '3rd Floor',
  '4th Floor',
  'Gymkhana',
  'MPW Workshop',
  'Library',
];

export const SubmitComplaintPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    category: 'Electrical',
    location: '',
    roomNumber: '',
    description: '',
    isHazardous: false,
    affectsClassroom: false,
    isAnonymous: false,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Duplicate warning modal state
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // Suggested priority computation
  const computeSuggestedPriority = () => {
    if (formData.isHazardous || formData.category === 'Security') return 'Critical';
    if (formData.category === 'Water Supply' || formData.affectsClassroom || formData.category === 'Internet and IT')
      return 'High';
    if (['Electrical', 'Plumbing', 'Laboratory'].includes(formData.category)) return 'Medium';
    return 'Low';
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSizeBytes = 100 * 1024 * 1024; // 100 MB
      if (file.size > maxSizeBytes) {
        setError('Uploaded file exceeds the maximum limit of 100 MB. Please choose a smaller file.');
        setSelectedFile(null);
        return;
      }
      setError(null);
      setSelectedFile(file);
    }
  };

  // Step 1: Pre-submission duplicate check
  const handleSubmitClick = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title || !formData.description) {
      setError('Please provide a title and detailed description.');
      return;
    }

    setLoading(true);

    try {
      const dupRes = await api.post('/complaints/check-duplicate', {
        category: formData.category,
        location: formData.location || undefined,
        roomNumber: formData.roomNumber,
        title: formData.title,
        description: formData.description,
      });

      if (dupRes.success && dupRes.data?.duplicates?.length > 0) {
        setDuplicates(dupRes.data.duplicates);
        setShowDuplicateModal(true);
        setLoading(false);
        return;
      }

      // No duplicates found: proceed directly
      await executeSubmission();
    } catch {
      setError('Failed to submit complaint. Please check connection.');
      setLoading(false);
    }
  };

  // Step 2: Final submission
  const executeSubmission = async () => {
    setLoading(true);
    setShowDuplicateModal(false);

    try {
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('category', formData.category);
      if (formData.location) {
        payload.append('location', formData.location);
      }
      payload.append('roomNumber', formData.roomNumber);
      payload.append('description', formData.description);
      payload.append('isHazardous', String(formData.isHazardous));
      payload.append('affectsClassroom', String(formData.affectsClassroom));
      payload.append('isAnonymous', String(formData.isAnonymous));
      payload.append('priority', computeSuggestedPriority());

      if (selectedFile) {
        payload.append('image', selectedFile);
      }

      const res = await api.post('/complaints', payload);

      if (res.success && res.data?.id) {
        navigate(`/complaints/${res.data.id}`);
      } else {
        setError(res.error || 'Failed to submit complaint');
      }
    } catch {
      setError('An error occurred during submission.');
    } finally {
      setLoading(false);
    }
  };

  const prioritySuggestion = computeSuggestedPriority();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Report Campus Infrastructure Issue</h1>
        <p className="mt-1 text-xs text-slate-500">
          Submit facilities, electrical, IT, or safety defects for immediate automated dispatch.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-rose-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmitClick} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Issue Title / Subject *
          </label>
          <input
            type="text"
            required
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g. Broken water pipe leaking in 2nd floor restroom"
            className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-royal-600 focus:outline-none focus:ring-2 focus:ring-royal-500/20"
          />
        </div>

        {/* Category & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:border-royal-600 focus:outline-none focus:ring-2 focus:ring-royal-500/20"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Campus Location / Floor (Optional)</label>
            <select
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:border-royal-600 focus:outline-none focus:ring-2 focus:ring-royal-500/20"
            >
              <option value="">Select Location (Optional)</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Room / Area */}
        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Room Number / Specific Area (Optional)
          </label>
          <input
            type="text"
            name="roomNumber"
            value={formData.roomNumber}
            onChange={handleInputChange}
            placeholder="e.g. Room 005, Lab 210B, or Main Corridor"
            className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-royal-600 focus:outline-none focus:ring-2 focus:ring-royal-500/20"
          />
        </div>

        {/* Anonymous Submission Option */}
        <div className="p-4 rounded-xl bg-blue-50/60 border border-royal-200">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isAnonymous"
              checked={formData.isAnonymous}
              onChange={handleInputChange}
              className="mt-0.5 rounded text-royal-600 focus:ring-royal-500 w-4 h-4"
            />
            <div>
              <span className="text-xs font-bold text-royal-950">Submit Anonymously</span>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                When enabled, your name and contact info will be hidden as <strong>"Anonymous Student"</strong> from maintenance personnel and the public. Only campus administrators have audit access for safety investigations.
              </p>
            </div>
          </label>
        </div>

        {/* Detailed Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Detailed Problem Description *
          </label>
          <textarea
            required
            rows={4}
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Provide context on when the problem occurred, specific symptoms, and any safety concerns..."
            className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-royal-600 focus:outline-none focus:ring-2 focus:ring-royal-500/20"
          />
        </div>

        {/* Urgency & Priority Suggestion */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <span className="block text-xs font-bold text-slate-700">
            Urgency & Impact Factors
          </span>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isHazardous"
                checked={formData.isHazardous}
                onChange={handleInputChange}
                className="rounded text-royal-600 focus:ring-royal-500 w-4 h-4"
              />
              <span className="text-xs text-slate-700 font-medium">
                Presents an immediate safety, fire, or physical hazard (e.g., exposed sparking wire, gas leak)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="affectsClassroom"
                checked={formData.affectsClassroom}
                onChange={handleInputChange}
                className="rounded text-royal-600 focus:ring-royal-500 w-4 h-4"
              />
              <span className="text-xs text-slate-700 font-medium">
                Directly disrupts ongoing classroom lectures or scheduled laboratory sessions
              </span>
            </label>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">System Suggested Priority:</span>
            <span
              className={`font-bold px-2.5 py-0.5 rounded-full ${
                prioritySuggestion === 'Critical'
                  ? 'bg-rose-100 text-rose-800'
                  : prioritySuggestion === 'High'
                  ? 'bg-amber-100 text-amber-800'
                  : prioritySuggestion === 'Medium'
                  ? 'bg-blue-100 text-royal-800'
                  : 'bg-slate-200 text-slate-800'
              }`}
            >
              {prioritySuggestion} Priority
            </span>
          </div>
        </div>

        {/* Evidence Photo Upload */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Attach Evidence Photo (Optional, JPG, PNG, WebP up to 100 MB)
          </label>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition">
              <Upload className="w-4 h-4 text-royal-600" />
              {selectedFile ? 'Change File' : 'Choose Photo'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {selectedFile && (
              <span className="text-xs text-slate-600 truncate max-w-xs">
                {selectedFile.name} ({selectedFile.size > 1024 * 1024 ? (selectedFile.size / (1024 * 1024)).toFixed(1) + ' MB' : (selectedFile.size / 1024).toFixed(1) + ' KB'})
              </span>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-royal-600 hover:bg-royal-700 text-white text-xs font-bold shadow-md shadow-royal-600/25 transition disabled:opacity-50"
          >
            {loading ? 'Submitting Report...' : 'Submit Infrastructure Complaint'}
          </button>
        </div>
      </form>

      {/* Duplicate Warning Confirmation Modal */}
      <Modal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        title="Potential Similar Complaint Detected"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 leading-relaxed">
              We found similar existing open complaints in <strong>{formData.location}</strong>.
              Review them below to avoid creating duplicate work orders.
            </p>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {duplicates.map((dup) => (
              <div
                key={dup.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-royal-700">{dup.id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                      {dup.status}
                    </span>
                    <span className="text-[10px] text-amber-700 font-semibold">
                      {dup.similarityScore}% match
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 mt-1">{dup.title}</div>
                  {dup.roomNumber && (
                    <div className="text-[10px] text-slate-500">Area: {dup.roomNumber}</div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/complaints/${dup.id}`)}
                  className="px-3 py-1.5 text-xs font-semibold text-royal-600 hover:bg-royal-50 rounded-lg shrink-0"
                >
                  View Details &rarr;
                </button>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowDuplicateModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Modify My Report
            </button>
            <button
              type="button"
              onClick={executeSubmission}
              className="px-4 py-2 rounded-xl bg-royal-600 hover:bg-royal-700 text-white text-xs font-bold"
            >
              Proceed With Submission Anyway
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
