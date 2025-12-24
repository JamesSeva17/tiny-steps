
import React, { useState } from 'react';
import { ActivityType, ActivityCategory, SyncData, ActivityEntry } from '../types';
import { syncService } from '../services/syncService';

interface SettingsProps {
  babyName: string;
  onUpdateBabyName: (name: string) => void;
  types: ActivityType[];
  entries: ActivityEntry[];
  onAddType: (type: ActivityType) => void;
  onRemoveType: (id: string) => void;
  onSyncData: (data: SyncData) => void;
}

const ICONS = ['fa-baby', 'fa-bottle-water', 'fa-cookie', 'fa-shower', 'fa-stethoscope', 'fa-syringe', 'fa-hand-holding-heart', 'fa-weight-scale', 'fa-thermometer', 'fa-pills'];
const COLORS = ['bg-emerald-100 text-emerald-600', 'bg-cyan-100 text-cyan-600', 'bg-violet-100 text-violet-600', 'bg-orange-100 text-orange-600', 'bg-teal-100 text-teal-600'];

const Settings: React.FC<SettingsProps> = ({ babyName, onUpdateBabyName, types, entries, onAddType, onRemoveType, onSyncData }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('OTHER');
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [unit, setUnit] = useState('');

  const [syncKey, setSyncKey] = useState(() => localStorage.getItem('tiny_steps_sync_key') || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleAddType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onAddType({
      id: name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
      name,
      category,
      icon,
      color,
      unit: unit || undefined
    });
    setName('');
    setUnit('');
  };

  const createCloudBin = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncStatus('idle');

    // JSONBin generates IDs on the server, so we do an initial push
    const newId = await syncService.push("", {
      entries,
      types,
      babyName,
      lastUpdated: Date.now()
    });

    if (newId) {
      setSyncKey(newId);
      localStorage.setItem('tiny_steps_sync_key', newId);
      localStorage.setItem('tiny_steps_last_sync', Date.now().toString());
      setSyncStatus('success');
    } else {
      setSyncStatus('error');
      alert("Failed to initialize cloud storage. Ensure your API Key is valid.");
    }
    setIsSyncing(false);
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  const copyKeyToClipboard = () => {
    if (!syncKey) return;
    navigator.clipboard.writeText(syncKey);
    alert("Sync Bin ID copied! Share this with your partner.");
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Activity', 'Value', 'Unit', 'Note'];
    const rows = entries.map(e => {
      const type = types.find(t => t.id === e.typeId);
      const date = new Date(e.timestamp);
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        type?.name || 'Unknown',
        e.value || '',
        type?.unit || '',
        `"${(e.note || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers, ...rows].map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${babyName || 'Baby'}_Activity_Log.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePush = async () => {
    if (!syncKey) {
      await createCloudBin();
      return;
    }
    setIsSyncing(true);
    setSyncStatus('idle');
    const resultId = await syncService.push(syncKey, { entries, types, babyName, lastUpdated: Date.now() });
    const success = !!resultId;
    setSyncStatus(success ? 'success' : 'error');
    setIsSyncing(false);
    if (success) {
      localStorage.setItem('tiny_steps_last_sync', Date.now().toString());
    } else {
      alert("Sync Push failed. Verify your internet connection and API status.");
    }
    setTimeout(() => setSyncStatus('idle'), 4000);
  };

  const handlePull = async () => {
    if (!syncKey) {
      alert("Please enter a Sync Bin ID first.");
      return;
    }
    if (!confirm("Overwrite local data with cloud data?")) return;
    setIsSyncing(true);
    setSyncStatus('idle');
    const data = await syncService.pull(syncKey);
    if (data) {
      onSyncData(data);
      setSyncStatus('success');
    } else {
      setSyncStatus('error');
      alert("No data found for this ID. Check the ID and try again.");
    }
    setIsSyncing(false);
    setTimeout(() => setSyncStatus('idle'), 4000);
  };

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
        <p className="text-slate-500">Profile and JSONBin.io Cloud Sync</p>
      </header>

      <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 flex items-center space-x-2">
          <i className="fa-solid fa-face-smile text-indigo-500"></i>
          <span>Baby Profile</span>
        </h3>
        <input
          type="text"
          value={babyName}
          onChange={(e) => onUpdateBabyName(e.target.value)}
          placeholder="Baby's Name"
          className="w-full max-w-md px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 font-bold"
        />
        <button
          onClick={exportToCSV}
          className="mt-4 text-xs font-bold text-indigo-600 flex items-center space-x-2 hover:underline"
        >
          <i className="fa-solid fa-file-csv text-lg"></i>
          <span>Export logs to CSV</span>
        </button>
      </section>

      <section className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <i className="fa-solid fa-cloud-arrow-up text-9xl"></i>
        </div>

        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 ${syncStatus === 'error' ? 'bg-rose-500' : syncStatus === 'success' ? 'bg-emerald-500' : 'bg-indigo-600'} rounded-2xl flex items-center justify-center transition-colors shadow-lg shadow-indigo-500/20`}>
              {isSyncing ? <i className="fa-solid fa-spinner fa-spin text-xl"></i> :
                syncStatus === 'success' ? <i className="fa-solid fa-check text-xl"></i> :
                  syncStatus === 'error' ? <i className="fa-solid fa-triangle-exclamation text-xl"></i> :
                    <i className="fa-solid fa-cloud text-xl"></i>}
            </div>
            <div>
              <h3 className="text-xl font-bold">Partner Sync</h3>
              <p className="text-slate-400 text-xs mt-1">Shared JSONBin.io storage.</p>
            </div>
          </div>
          <div className="flex space-x-2">
            {!syncKey && (
              <button
                onClick={createCloudBin}
                disabled={isSyncing}
                className="text-[10px] font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/10 uppercase tracking-widest transition-all disabled:opacity-50"
              >
                {isSyncing ? 'Creating...' : 'Setup Cloud'}
              </button>
            )}
            {syncKey && (
              <button
                onClick={copyKeyToClipboard}
                className="text-[10px] font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/10 uppercase tracking-widest transition-all"
              >
                <i className="fa-solid fa-copy mr-1.5"></i>
                ID
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          <div className="relative">
            <input
              type="text"
              value={syncKey}
              onChange={(e) => {
                const val = e.target.value.trim();
                setSyncKey(val);
                localStorage.setItem('tiny_steps_sync_key', val);
              }}
              placeholder="Paste Bin ID here"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 outline-none font-mono text-sm focus:bg-white/15 focus:border-indigo-400 transition-all text-indigo-200 placeholder:text-slate-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handlePush}
              disabled={isSyncing}
              className="bg-white text-slate-900 font-bold py-3 rounded-xl hover:bg-slate-100 transition shadow-lg active:scale-95 disabled:opacity-50"
            >
              Push to Cloud
            </button>
            <button
              onClick={handlePull}
              disabled={isSyncing}
              className="bg-slate-700 text-white font-bold py-3 rounded-xl hover:bg-slate-600 transition shadow-lg active:scale-95 disabled:opacity-50"
            >
              Fetch from Cloud
            </button>
          </div>
          <p className="text-[9px] text-slate-400 text-center opacity-60">Uses JSONBin.io with your Master Key</p>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-800">Custom Activities</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 no-scrollbar">
            {types.map((type) => (
              <div key={type.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-50 group bg-slate-50/30">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${type.color}`}>
                    <i className={`fa-solid ${type.icon} text-xs`}></i>
                  </div>
                  <span className="font-bold text-slate-700 text-sm">{type.name}</span>
                </div>
                <button onClick={() => onRemoveType(type.id)} className="text-slate-300 hover:text-rose-500 transition px-2">
                  <i className="fa-solid fa-trash-can text-sm"></i>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
          <h3 className="font-bold text-slate-800">Add New Activity</h3>
          <form onSubmit={handleAddType} className="space-y-4">
            <input type="text" placeholder="Activity Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            <div className="grid grid-cols-2 gap-4">
              <select value={category} onChange={(e) => setCategory(e.target.value as ActivityCategory)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none">
                <option value="FEEDING">Feeding</option>
                <option value="DIAPER">Diaper</option>
                <option value="SLEEP">Sleep</option>
                <option value="GROWTH">Growth</option>
                <option value="OTHER">Other</option>
              </select>
              <input type="text" placeholder="Unit (ml, min)" value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none" />
            </div>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(i => (
                <button key={i} type="button" onClick={() => setIcon(i)} className={`w-10 h-10 rounded-xl transition ${icon === i ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                  <i className={`fa-solid ${i}`}></i>
                </button>
              ))}
            </div>
            <button type="submit" className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all hover:bg-slate-900">Create Activity</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
