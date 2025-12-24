
import React, { useState } from 'react';
import { ActivityType, ActivityCategory, SyncData } from '../types';
import { syncService } from '../services/syncService';

interface SettingsProps {
  babyName: string;
  onUpdateBabyName: (name: string) => void;
  types: ActivityType[];
  entries: any[];
  onAddType: (type: ActivityType) => void;
  onRemoveType: (id: string) => void;
  onSyncData: (data: SyncData) => void;
}

const ICONS = [
  'fa-baby', 'fa-bottle-water', 'fa-cookie', 'fa-shower', 'fa-stethoscope',
  'fa-syringe', 'fa-hand-holding-heart', 'fa-scale-balanced', 'fa-play', 'fa-walkie-talkie'
];

const COLORS = [
  'bg-emerald-100 text-emerald-600',
  'bg-cyan-100 text-cyan-600',
  'bg-violet-100 text-violet-600',
  'bg-orange-100 text-orange-600',
  'bg-teal-100 text-teal-600'
];

const Settings: React.FC<SettingsProps> = ({ 
  babyName, 
  onUpdateBabyName, 
  types, 
  entries, 
  onAddType, 
  onRemoveType, 
  onSyncData 
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('OTHER');
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [unit, setUnit] = useState('');

  // Sync states
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
  };

  const generateNewKey = () => {
    const key = syncService.generateKey();
    setSyncKey(key);
    localStorage.setItem('tiny_steps_sync_key', key);
  };

  const saveSyncKey = (val: string) => {
    setSyncKey(val);
    localStorage.setItem('tiny_steps_sync_key', val);
  };

  const handlePush = async () => {
    if (!syncKey) return;
    setIsSyncing(true);
    const success = await syncService.push(syncKey, {
      entries,
      types,
      babyName,
      lastUpdated: Date.now()
    });
    setSyncStatus(success ? 'success' : 'error');
    setIsSyncing(false);
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  const handlePull = async () => {
    if (!syncKey) return;
    if (!confirm("This will replace your local data with the cloud data. Continue?")) return;
    setIsSyncing(true);
    const data = await syncService.pull(syncKey);
    if (data) {
      onSyncData(data);
      setSyncStatus('success');
    } else {
      setSyncStatus('error');
    }
    setIsSyncing(false);
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
        <p className="text-slate-500">Manage your preferences and synchronization.</p>
      </header>

      {/* Baby Profile Section */}
      <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 flex items-center space-x-2">
          <i className="fa-solid fa-face-smile text-indigo-500"></i>
          <span>Baby Profile</span>
        </h3>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Baby's Name</label>
          <input 
            type="text" 
            value={babyName}
            onChange={(e) => onUpdateBabyName(e.target.value)}
            placeholder="Enter baby's name"
            className="w-full max-w-md px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 font-bold"
          />
        </div>
      </section>

      {/* Cloud Sync Section */}
      <section className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <i className="fa-solid fa-cloud-arrow-up text-2xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold">Cloud Sync</h3>
            <p className="text-indigo-100 text-sm">Synchronize with other devices.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-indigo-200 uppercase mb-2 tracking-wider">Sync Key (Keep Secret)</label>
            <div className="flex space-x-2">
              <input 
                type="text" 
                value={syncKey}
                onChange={(e) => saveSyncKey(e.target.value)}
                placeholder="Enter or generate a key"
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 outline-none focus:bg-white/20 transition font-mono text-sm"
              />
              <button 
                onClick={generateNewKey}
                className="bg-white/20 hover:bg-white/30 p-3 rounded-xl transition"
                title="Generate New Key"
              >
                <i className="fa-solid fa-arrows-rotate"></i>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              onClick={handlePush}
              disabled={!syncKey || isSyncing}
              className="bg-white text-indigo-600 font-bold py-3 rounded-xl hover:bg-indigo-50 transition active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSyncing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-cloud-arrow-up"></i>}
              <span>Save to Cloud</span>
            </button>
            <button
              onClick={handlePull}
              disabled={!syncKey || isSyncing}
              className="bg-indigo-500/30 text-white font-bold py-3 rounded-xl border border-white/20 hover:bg-indigo-500/40 transition active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSyncing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-cloud-arrow-down"></i>}
              <span>Load from Cloud</span>
            </button>
          </div>

          {syncStatus === 'success' && (
            <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-100 text-xs py-2 px-4 rounded-lg text-center">
              Sync complete!
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center justify-between">
            <span>Activity Types</span>
            <span className="text-xs font-normal text-slate-400">{types.length} total</span>
          </h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
            {types.map((type) => (
              <div key={type.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-50 group hover:border-indigo-100 hover:bg-indigo-50/30 transition">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${type.color}`}>
                    <i className={`fa-solid ${type.icon} text-xs`}></i>
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 text-sm">{type.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{type.category}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onRemoveType(type.id)}
                  className="text-slate-300 hover:text-rose-500 transition px-2"
                >
                  <i className="fa-solid fa-trash-can text-sm"></i>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-800">Add Custom Activity</h3>
          <form onSubmit={handleAddType} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Name</label>
              <input 
                type="text" 
                placeholder="e.g. Tummy Time"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ActivityCategory)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 appearance-none"
                >
                  <option value="FEEDING">Feeding</option>
                  <option value="DIAPER">Diaper</option>
                  <option value="SLEEP">Sleep</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Unit</label>
                <input 
                  type="text" 
                  placeholder="e.g. ml"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Icon</label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map(i => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(i)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${icon === i ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                  >
                    <i className={`fa-solid ${i}`}></i>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Theme Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-10 h-10 rounded-xl transition border-4 ${color === c ? 'border-indigo-600' : 'border-transparent'} ${c.split(' ')[0]}`}
                  ></button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl hover:bg-slate-900 transition mt-4 shadow-lg active:scale-95"
            >
              Create Activity
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
