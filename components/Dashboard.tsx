
import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { ActivityEntry, ActivityType, AIInsight } from '../types';
import { getBabyInsights } from '../services/geminiService';

interface DashboardProps {
  babyName: string;
  entries: ActivityEntry[];
  types: ActivityType[];
  onSyncNow?: () => Promise<void>;
  isSyncing?: boolean;
}

type TimeFilter = 'today' | 'last_24h' | 'last_7d';

const colorMap: Record<string, string> = {
  'bg-yellow-100 text-yellow-600': '#eab308',
  'bg-amber-100 text-amber-700': '#b45309',
  'bg-rose-100 text-rose-600': '#e11d48',
  'bg-blue-100 text-blue-600': '#2563eb',
  'bg-indigo-100 text-indigo-600': '#4f46e5',
  'bg-emerald-100 text-emerald-600': '#059669',
};

const formatTimeSince = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) return `${Math.floor(hours / 24)}d ago`;
  if (hours > 0) return `${hours}h ${mins}m ago`;
  return `${mins}m ago`;
};

const Dashboard: React.FC<DashboardProps> = ({ babyName, entries, types, onSyncNow, isSyncing }) => {
  const navigate = useNavigate();
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [syncKey] = useState(() => localStorage.getItem('tiny_steps_sync_key') || '');
  const [lastSyncTime] = useState(() => {
    const saved = localStorage.getItem('tiny_steps_last_sync');
    if (!saved) return '';
    const date = new Date(parseInt(saved));
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);

  // Real-time update for "Time Since" counters
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const filteredEntries = useMemo(() => {
    const now = Date.now();
    let startTime = 0;

    switch (timeFilter) {
      case 'today': startTime = new Date().setHours(0, 0, 0, 0); break;
      case 'last_24h': startTime = now - 24 * 60 * 60 * 1000; break;
      case 'last_7d': startTime = now - 7 * 24 * 60 * 60 * 1000; break;
    }

    return entries.filter(e => {
      const timeMatch = e.timestamp >= startTime;
      const typeMatch = selectedActivityIds.length === 0 || selectedActivityIds.includes(e.typeId);
      return timeMatch && typeMatch;
    });
  }, [entries, timeFilter, selectedActivityIds]);

  const stats = useMemo(() => {
    return types.map(t => {
      const typeEntries = entries.filter(e => e.typeId === t.id).sort((a, b) => b.timestamp - a.timestamp);
      return {
        ...t,
        count: filteredEntries.filter(e => e.typeId === t.id).length,
        lastEntry: typeEntries[0]
      };
    });
  }, [filteredEntries, types, entries]);

  const chartData = useMemo(() => {
    const daysToShow = 7;
    const data = [];
    for (let i = 0; i < daysToShow; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (daysToShow - 1 - i));
      const dayStart = new Date(d).setHours(0, 0, 0, 0);
      const dayEnd = new Date(d).setHours(23, 59, 59, 999);
      const dayEntries = entries.filter(e => e.timestamp >= dayStart && e.timestamp <= dayEnd);

      const dayObj: any = { name: d.toLocaleDateString('en-US', { weekday: 'short' }) };
      types.forEach(t => {
        if (selectedActivityIds.length === 0 || selectedActivityIds.includes(t.id)) {
          dayObj[t.name] = dayEntries.filter(e => e.typeId === t.id).length;
        }
      });
      data.push(dayObj);
    }
    return data;
  }, [entries, types, selectedActivityIds]);

  useEffect(() => {
    if (entries.length >= 5 && !insight) {
      setLoadingInsight(true);
      getBabyInsights(entries, types).then(res => {
        setInsight(res);
        setLoadingInsight(false);
      });
    }
  }, [entries]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {babyName ? `${babyName}'s Dashboard` : "Baby's Dashboard"} 👋
          </h2>
          <div className="flex items-center space-x-2 mt-1">
            {syncKey && (
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tight flex items-center">
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
                {isSyncing ? 'Syncing...' : lastSyncTime ? `Synced at ${lastSyncTime}` : 'Cloud Ready'}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {syncKey && onSyncNow && (
            <button
              onClick={() => onSyncNow()}
              disabled={isSyncing}
              className="bg-white border border-slate-200 text-slate-600 p-2.5 rounded-xl hover:bg-slate-50 transition active:scale-95 disabled:opacity-50 shadow-sm"
              title="Sync now"
            >
              <i className={`fa-solid fa-arrows-rotate ${isSyncing ? 'fa-spin text-indigo-500' : ''}`}></i>
            </button>
          )}
          <button
            onClick={() => {
              setLoadingInsight(true);
              getBabyInsights(entries, types).then(res => {
                setInsight(res);
                setLoadingInsight(false);
              });
            }}
            disabled={loadingInsight}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition flex items-center space-x-2 text-sm font-bold shadow-lg shadow-indigo-100 active:scale-95"
          >
            {loadingInsight ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
            <span>Health Insights</span>
          </button>
        </div>
      </header>

      {/* Quick Summary Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.filter(s => ['breast_feed', 'cup_feed', 'poop', 'pee'].includes(s.id)).map(stat => (
          <div key={stat.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${stat.color}`}>
                <i className={`fa-solid ${stat.icon}`}></i>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{stat.name}</span>
            </div>
            <div>
              <div className="text-lg font-bold text-slate-800">
                {stat.lastEntry ? formatTimeSince(stat.lastEntry.timestamp) : 'No data'}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                {stat.count} recorded {timeFilter.replace('_', ' ')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {insight && (
        <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <i className="fa-solid fa-robot text-8xl -rotate-12"></i>
          </div>
          <div className="relative z-10">
            <h3 className="font-bold mb-2 flex items-center space-x-2">
              <i className="fa-solid fa-sparkles"></i>
              <span>Smart Health Insight</span>
            </h3>
            <p className="text-indigo-50 text-sm leading-relaxed mb-4">{insight.summary}</p>
            <div className="flex flex-wrap gap-2">
              {insight.suggestions.map((s, i) => (
                <span key={i} className="bg-white/20 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-[10px] font-bold">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Charts & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h3 className="font-bold text-slate-800">Activity Trends</h3>
            <div className="flex bg-slate-50 p-1 rounded-xl">
              {(['today', 'last_24h', 'last_7d'] as TimeFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setTimeFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all capitalize ${timeFilter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'
                    }`}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                {types.map((t) => (
                  <Bar key={t.id} dataKey={t.name} stackId="a" fill={colorMap[t.color] || '#cbd5e1'} radius={[4, 4, 4, 4]} barSize={15} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center justify-between">
            <span>Recent Log</span>
            <button onClick={() => navigate('/history')} className="text-[10px] text-indigo-600 font-bold hover:underline">View All</button>
          </h3>
          <div className="space-y-4">
            {entries.slice(-5).reverse().map(entry => {
              const type = types.find(t => t.id === entry.typeId);
              return (
                <div key={entry.id} className="flex items-center space-x-3 p-2 rounded-xl border border-slate-50">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${type?.color}`}>
                    <i className={`fa-solid ${type?.icon} text-[10px]`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{type?.name}</p>
                    <p className="text-[10px] text-slate-400">{formatTimeSince(entry.timestamp)}</p>
                  </div>
                  {entry.value && <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{entry.value}{type?.unit}</div>}
                </div>
              );
            })}
            {entries.length === 0 && (
              <div className="text-center py-10 opacity-40">
                <i className="fa-solid fa-feather-pointed text-2xl mb-2"></i>
                <p className="text-[10px] font-bold">No logs yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
