
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
  'bg-cyan-100 text-cyan-600': '#0891b2',
  'bg-violet-100 text-violet-600': '#7c3aed',
  'bg-orange-100 text-orange-600': '#ea580c',
  'bg-teal-100 text-teal-600': '#0d9488',
};

const Dashboard: React.FC<DashboardProps> = ({ babyName, entries, types, onSyncNow, isSyncing }) => {
  const navigate = useNavigate();
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [syncKey] = useState(() => localStorage.getItem('tiny_steps_sync_key') || '');
  const [lastSyncTime] = useState(() => localStorage.getItem('tiny_steps_last_sync') || '');

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);

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
    return types.map(t => ({
      ...t,
      count: filteredEntries.filter(e => e.typeId === t.id).length,
      lastTime: entries.filter(e => e.typeId === t.id).sort((a, b) => b.timestamp - a.timestamp)[0]?.timestamp
    }));
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

  const toggleActivityFilter = (id: string) => {
    setSelectedActivityIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (entries.length >= 5 && !insight) {
      setLoadingInsight(true);
      getBabyInsights(entries, types).then(res => {
        setInsight(res);
        setLoadingInsight(false);
      });
    }
  }, [entries]);

  const handleSyncClick = () => {
    if (syncKey) {
      onSyncNow?.();
    } else {
      navigate('/settings');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {babyName ? `${babyName}'s Dashboard` : "Baby's Dashboard"} 👋
          </h2>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-slate-500 text-sm">Summary for your little one.</p>
            {syncKey && (
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tight flex items-center">
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
                {isSyncing ? 'Syncing...' : lastSyncTime ? `Last Sync: ${new Date(parseInt(lastSyncTime)).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` : 'Not synced'}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleSyncClick}
            disabled={isSyncing}
            className={`px-4 py-2 rounded-xl transition flex items-center space-x-2 text-sm font-bold shadow-lg shadow-indigo-100 active:scale-95 ${
              isSyncing 
              ? 'bg-slate-100 text-slate-400' 
              : syncKey 
                ? 'bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50' 
                : 'bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            <i className={`fa-solid ${isSyncing ? 'fa-spinner fa-spin' : syncKey ? 'fa-arrows-rotate' : 'fa-cloud-arrow-up'}`}></i>
            <span>{isSyncing ? 'Syncing...' : syncKey ? 'Sync Now' : 'Set Up Sync'}</span>
          </button>
          <button 
            onClick={() => {
              setLoadingInsight(true);
              getBabyInsights(entries, types).then(res => {
                setInsight(res);
                setLoadingInsight(false);
              });
            }}
            disabled={loadingInsight}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition flex items-center space-x-2 text-sm shadow-lg shadow-indigo-100 active:scale-95"
          >
            {loadingInsight ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
            <span>AI Expert</span>
          </button>
        </div>
      </header>

      {/* Insight Card */}
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

      {/* Filter Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-slate-400">
            <i className="fa-solid fa-filter text-xs"></i>
            <span className="text-xs font-bold uppercase tracking-widest">Filters</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
              {(['today', 'last_24h', 'last_7d'] as TimeFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setTimeFilter(f)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize whitespace-nowrap ${
                    timeFilter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Filter by Activity Type</p>
          <div className="flex flex-wrap gap-2 overflow-x-auto no-scrollbar">
            {types.map((type) => {
              const isSelected = selectedActivityIds.includes(type.id);
              return (
                <button
                  key={type.id}
                  onClick={() => toggleActivityFilter(type.id)}
                  className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border flex items-center space-x-2 whitespace-nowrap ${
                    isSelected 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                    : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'
                  }`}
                >
                  <i className={`fa-solid ${type.icon}`}></i>
                  <span>{type.name}</span>
                </button>
              );
            })}
            {selectedActivityIds.length > 0 && (
              <button 
                onClick={() => setSelectedActivityIds([])}
                className="px-3 py-2 rounded-xl text-[10px] font-bold text-rose-500 hover:bg-rose-50 transition"
              >
                Reset All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.filter(s => selectedActivityIds.length === 0 || selectedActivityIds.includes(s.id)).map((stat) => (
          <div key={stat.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition group">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${stat.color}`}>
              <i className={`fa-solid ${stat.icon} text-xl`}></i>
            </div>
            <div className="text-3xl font-bold text-slate-800">{stat.count}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.name}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800">Weekly Activity Trend</h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Units: Count</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                {types.filter(t => selectedActivityIds.length === 0 || selectedActivityIds.includes(t.id)).map((t) => (
                  <Bar key={t.id} dataKey={t.name} stackId="a" fill={colorMap[t.color] || '#cbd5e1'} radius={[4, 4, 4, 4]} barSize={20} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Recent Log</h3>
          <div className="space-y-4">
            {filteredEntries.slice(-6).reverse().map(entry => {
              const type = types.find(t => t.id === entry.typeId);
              return (
                <div key={entry.id} className="flex items-center space-x-4 p-3 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type?.color}`}>
                    <i className={`fa-solid ${type?.icon} text-sm`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{type?.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                  {entry.value && <div className="text-xs font-bold text-indigo-600">{entry.value}{type?.unit}</div>}
                </div>
              );
            })}
            {filteredEntries.length === 0 && (
              <div className="text-center py-10">
                <p className="text-slate-300 text-sm font-bold">No data matches filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
