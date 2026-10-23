import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  AlertTriangle,
  Filter,
  Layers,
  ArrowRight,
  Info,
  CheckCircle,
  Activity,
} from 'lucide-react';
import { api } from '../api/client';
import { CampusHotspot } from '../types';

export const HotspotsMapPage: React.FC = () => {
  const [hotspots, setHotspots] = useState<CampusHotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [selectedBuilding, setSelectedBuilding] = useState<CampusHotspot | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  const fetchHotspots = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(category !== 'all' ? { category } : {}),
        ...(status !== 'all' ? { status } : {}),
      });

      const res = await api.get<CampusHotspot[]>(`/community/hotspots?${params.toString()}`);
      if (res.success && res.data) {
        setHotspots(res.data);
        if (selectedBuilding) {
          const updated = res.data.find((h) => h.id === selectedBuilding.id);
          if (updated) setSelectedBuilding(updated);
        } else if (res.data.length > 0) {
          setSelectedBuilding(res.data[0]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotspots();
  }, [category, status]);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-amber-500 text-white';
      case 'medium':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-emerald-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campus Infrastructure Hotspots</h1>
          <p className="mt-1 text-xs text-slate-500">
            Interactive facility schematic and defect density overview across campus buildings
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-200/70 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'map' ? 'bg-white text-royal-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            Schematic Map View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'list' ? 'bg-white text-royal-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            List Breakdown
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-slate-600">
          <Filter className="w-3.5 h-3.5" /> Filter by:
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium"
        >
          <option value="all">All Categories</option>
          <option value="Electrical">Electrical</option>
          <option value="Plumbing">Plumbing</option>
          <option value="Internet and IT">Internet and IT</option>
          <option value="Water Supply">Water Supply</option>
          <option value="Furniture">Furniture</option>
          <option value="Security">Security</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium"
        >
          <option value="all">All Statuses</option>
          <option value="Submitted">Submitted Only</option>
          <option value="In Progress">In Progress Only</option>
          <option value="Resolved">Resolved Only</option>
        </select>

        {/* Legend */}
        <div className="ml-auto hidden md:flex items-center gap-3 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Optimal (0)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Low (1-3)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Medium (4-7)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" /> Critical / High Density
          </span>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Interactive Campus Map Canvas (2 cols) */}
          <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-6 sm:p-8 relative min-h-[460px] flex flex-col justify-between overflow-hidden shadow-xl border border-slate-800">
            {/* Campus Schematic Grid Background */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]" />

            <div className="relative z-10 flex items-center justify-between text-white mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-royal-400" />
                <span className="font-bold text-sm tracking-wide">Campus Ground Schematic</span>
              </div>
              <span className="text-[10px] bg-slate-800 px-2.5 py-1 rounded-full text-slate-300 font-mono">
                Interactive Building Pins
              </span>
            </div>

            {/* Schematic Buildings Layout */}
            <div className="relative z-10 w-full h-[360px] rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4">
              {hotspots.map((spot) => {
                const isSelected = selectedBuilding?.id === spot.id;
                return (
                  <button
                    key={spot.id}
                    onClick={() => setSelectedBuilding(spot)}
                    style={{
                      left: `${spot.x}%`,
                      top: `${spot.y}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-transform ${
                      isSelected ? 'scale-125 z-30' : 'z-20 hover:scale-110'
                    }`}
                  >
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-lg transition-all ${
                          spot.severity === 'critical'
                            ? 'bg-rose-600 text-white ring-4 ring-rose-500/40 animate-pulse'
                            : spot.severity === 'high'
                            ? 'bg-amber-500 text-white ring-2 ring-amber-400/40'
                            : spot.severity === 'medium'
                            ? 'bg-royal-600 text-white ring-2 ring-royal-400/40'
                            : 'bg-emerald-600 text-white'
                        } ${isSelected ? 'ring-4 ring-white' : ''}`}
                      >
                        {spot.activeComplaints}
                      </div>
                      <span className="mt-1 px-2 py-0.5 rounded bg-slate-900/90 text-[10px] font-bold text-slate-200 whitespace-nowrap shadow-md pointer-events-none">
                        {spot.code}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="relative z-10 text-[11px] text-slate-400 pt-3 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-royal-400 shrink-0" />
              <span>
                Click any building indicator to inspect active defect breakdown and report issues for that facility.
              </span>
            </div>
          </div>

          {/* Selected Building Details Card (1 col) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
            {selectedBuilding ? (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-royal-100 text-royal-800">
                      {selectedBuilding.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getSeverityBadge(
                        selectedBuilding.severity
                      )}`}
                    >
                      {selectedBuilding.severity.toUpperCase()} RISK
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{selectedBuilding.name}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Facility Location Identifier</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Active Issues</span>
                      <span className="text-xl font-bold text-slate-900">
                        {selectedBuilding.activeComplaints}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Critical Severity</span>
                      <span className="text-xl font-bold text-rose-600">
                        {selectedBuilding.criticalComplaints}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Lifetime Total</span>
                      <span className="font-semibold text-slate-700">
                        {selectedBuilding.totalComplaints}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Coordinate Pos</span>
                      <span className="font-mono text-slate-600">
                        X:{selectedBuilding.x} Y:{selectedBuilding.y}
                      </span>
                    </div>
                  </div>

                  {/* Category Breakdown in Building */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 mb-2">Category Breakdown</h3>
                    {Object.keys(selectedBuilding.categoryBreakdown).length > 0 ? (
                      <div className="space-y-1.5">
                        {Object.entries(selectedBuilding.categoryBreakdown).map(([cat, count]) => (
                          <div
                            key={cat}
                            className="flex items-center justify-between text-xs py-1 border-b border-slate-100"
                          >
                            <span className="text-slate-600">{cat}</span>
                            <span className="font-mono font-bold text-slate-800">{count}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No defects currently logged.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <Link
                    to={`/complaints?location=${encodeURIComponent(selectedBuilding.name)}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-royal-600 hover:bg-royal-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    View Complaints for this Facility <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to="/complaints/submit"
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition"
                  >
                    Report Issue in this Location
                  </Link>
                </div>
              </>
            ) : (
              <div className="py-20 text-center text-slate-400 text-xs">
                Select a campus building on the schematic map.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* List Breakdown View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Facility / Location Name</th>
                  <th className="py-3 px-4 text-center">Active Defect Count</th>
                  <th className="py-3 px-4 text-center">Critical Count</th>
                  <th className="py-3 px-4 text-center">Lifetime Total</th>
                  <th className="py-3 px-4 text-center">Severity Risk</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hotspots.map((spot) => (
                  <tr key={spot.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-royal-700">{spot.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{spot.name}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                      {spot.activeComplaints}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-rose-600">
                      {spot.criticalComplaints}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500">
                      {spot.totalComplaints}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getSeverityBadge(
                          spot.severity
                        )}`}
                      >
                        {spot.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/complaints?location=${encodeURIComponent(spot.name)}`}
                        className="text-royal-600 font-semibold hover:underline"
                      >
                        Inspect &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
