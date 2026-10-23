import React, { useEffect, useState } from 'react';
import { Award, Shield, TrendingUp, CheckCircle, Flame } from 'lucide-react';
import { api } from '../api/client';
import { HealthScoreData } from '../types';

export const LeaderboardPage: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState<HealthScoreData | null>(null);
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/community/leaderboard'),
      api.get('/community/health-score'),
      api.get('/community/trends'),
    ]).then(([lbRes, hsRes, trRes]) => {
      if (lbRes.success && lbRes.data) setLeaderboard(lbRes.data);
      if (hsRes.success && hsRes.data) setHealthScore(hsRes.data);
      if (trRes.success && trRes.data) setTrends(trRes.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-royal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Calculating campus engagement data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Community Campus Improvement</h1>
        <p className="mt-1 text-xs text-slate-500">
          Recognizing student civic participation, transparent campus health indicators, and maintenance trends
        </p>
      </div>

      {/* Campus Health Score Formula Banner */}
      {healthScore && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-royal-600" />
                <h2 className="text-base font-bold text-slate-900">Campus Health Index Formula</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Application-generated operational health metric calculated from live database records
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-3xl font-extrabold text-royal-700">{healthScore.score}</span>
              <span className="text-xs font-bold text-slate-400">/ 100</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 ml-2">
                {healthScore.grade}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
            <div className="font-bold text-slate-800">Formula Definition:</div>
            <p className="font-mono text-[11px] text-royal-900 bg-white p-2.5 rounded-lg border border-slate-200">
              Score = 100 - (Active × 2) - (Critical × 6) - (Overdue &gt; 72h × 4) + (Resolved / Total × 15)
            </p>
            <p className="text-[11px] text-slate-500 italic">
              {healthScore.formulaDescription}
            </p>
          </div>
        </div>
      )}

      {/* Grid: Leaderboard & Maintenance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard Table (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">Civic Leaderboard</h2>
            </div>
            <span className="text-xs text-slate-400">Privacy-protected names</span>
          </div>

          <p className="text-xs text-slate-500">
            Points are earned for verified issue reports (+10 pts), resolution feedback (+5 pts), and community confirmations (+2 pts).
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-center">Rank</th>
                  <th className="py-2.5 px-3">Participant</th>
                  <th className="py-2.5 px-3">Student ID</th>
                  <th className="py-2.5 px-3 text-right">Points Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboard.length > 0 ? (
                  leaderboard.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-center font-bold">
                        {item.rank === 1 ? (
                          <span className="text-amber-500 text-sm">🥇</span>
                        ) : item.rank === 2 ? (
                          <span className="text-slate-400 text-sm">🥈</span>
                        ) : item.rank === 3 ? (
                          <span className="text-amber-700 text-sm">🥉</span>
                        ) : (
                          `#${item.rank}`
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {item.displayName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {item.maskedStudentId || 'Hidden'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-700 font-mono">
                        {item.points} pts
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No points recorded yet. Be the first to report an issue!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Maintenance Trends (1 col) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-royal-600" />
            <h2 className="text-base font-bold text-slate-900">Historical Trends</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-700 mb-2">Most Reported Defect Types</h3>
              {trends?.topCategories && trends.topCategories.length > 0 ? (
                <div className="space-y-2">
                  {trends.topCategories.map((c: any) => (
                    <div
                      key={c.name}
                      className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50"
                    >
                      <span className="font-medium text-slate-800">{c.name}</span>
                      <span className="font-mono font-bold text-royal-700">{c.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No trend data available.</p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-700 mb-2">High Incident Locations</h3>
              {trends?.topLocations && trends.topLocations.length > 0 ? (
                <div className="space-y-2">
                  {trends.topLocations.map((l: any) => (
                    <div
                      key={l.name}
                      className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50"
                    >
                      <span className="font-medium text-slate-800 line-clamp-1">📍 {l.name}</span>
                      <span className="font-mono font-bold text-royal-700">{l.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No trend data available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
