import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  PhoneCall,
  CheckCircle,
  Clock,
  MapPin,
  Send,
  Info,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { SOSAlert } from '../types';

export const SOSPage: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [alertType, setAlertType] = useState('Medical Emergency');
  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get<SOSAlert[]>('/sos');
      if (res.success && res.data) {
        setAlerts(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleSubmitAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(null);

    try {
      const res = await api.post('/sos', {
        alertType,
        location,
        details,
      });

      if (res.success) {
        setSuccessMsg('Emergency alert transmitted to campus security and administrators.');
        setLocation('');
        setDetails('');
        fetchAlerts();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    const res = await api.patch(`/sos/${id}/acknowledge`);
    if (res.success) fetchAlerts();
  };

  const handleResolve = async (id: string) => {
    const res = await api.patch(`/sos/${id}/resolve`);
    if (res.success) fetchAlerts();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-red-600" />
          Campus SOS Emergency Alert Dispatcher
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Immediate internal response notification network for critical campus emergencies
        </p>
      </div>

      {/* Mandatory Emergency Service Warning */}
      <div className="p-5 rounded-2xl bg-red-50 border-2 border-red-200 text-red-950 space-y-2">
        <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>CRITICAL NOTICE: NOT A REPLACEMENT FOR EMERGENCY SERVICES</span>
        </div>
        <p className="text-xs leading-relaxed text-red-900">
          This feature provides an internal campus alert to security personnel and facility administrators.
          <strong> It does NOT automatically dial 911, 112, or local police/fire/ambulance dispatch.</strong>
          If someone is in immediate danger or requires urgent medical triage, call local emergency services directly.
        </p>
        <div className="flex flex-wrap gap-4 pt-1 text-xs font-semibold text-red-800">
          <span>📞 National Emergency: <strong>112 / 911</strong></span>
          <span>📞 Campus Health Clinic: <strong>555-0199</strong></span>
          <span>📞 Campus Security Control: <strong>555-0106</strong></span>
        </div>
      </div>

      {/* Alert Submission Form */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-slate-900">Trigger Campus Alert</h2>

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmitAlert} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Emergency Type *
              </label>
              <select
                value={alertType}
                onChange={(e) => setAlertType(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="Medical Emergency">Medical Emergency</option>
                <option value="Security / Physical Threat">Security / Physical Threat</option>
                <option value="Fire / Chemical Hazard">Fire / Chemical Hazard</option>
                <option value="Severe Infrastructure Failure">Severe Infrastructure Failure</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Exact Location / Building / Room *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Academic Block A, 3rd Floor Restroom"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Incident Context & Urgent Details
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe symptoms, visible hazards, or specific assistance required..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-md shadow-red-600/30 transition disabled:opacity-50 flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              {submitting ? 'Transmitting Alert...' : 'Dispatch Internal SOS Alert'}
            </button>
          </div>
        </form>
      </div>

      {/* Alerts Log View (For Admin triage & Student history) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          {user?.role === 'ADMIN' ? 'Emergency Dispatch Queue' : 'My Dispatched Alerts'}
        </h2>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Checking alert logs...</div>
        ) : alerts.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No active or historical SOS records.</p>
        ) : (
          <div className="space-y-3">
            {alerts.map((alt) => (
              <div
                key={alt.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs ${
                  alt.status === 'ACTIVE'
                    ? 'bg-red-50/60 border-red-200 ring-1 ring-red-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        alt.status === 'ACTIVE'
                          ? 'bg-red-600 text-white animate-pulse'
                          : alt.status === 'ACKNOWLEDGED'
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {alt.status}
                    </span>
                    <span className="font-bold text-slate-900">{alt.alertType}</span>
                  </div>

                  <div className="text-slate-600 font-medium">📍 Location: {alt.location}</div>
                  {alt.details && <p className="text-slate-500 italic">"{alt.details}"</p>}

                  <div className="text-[10px] text-slate-400 flex flex-wrap gap-3 pt-1">
                    <span>Dispatched: {new Date(alt.createdAt).toLocaleString()}</span>
                    <span>Reporter: {alt.reporter?.name} ({alt.reporter?.phone || 'No phone'})</span>
                    {alt.acknowledgedBy && (
                      <span className="text-amber-800 font-medium">
                        Acknowledged by: {alt.acknowledgedBy.name}
                      </span>
                    )}
                  </div>
                </div>

                {user?.role === 'ADMIN' && (
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {alt.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleAcknowledge(alt.id)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs"
                      >
                        Acknowledge
                      </button>
                    )}
                    {alt.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleResolve(alt.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                      >
                        Resolve Alert
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
