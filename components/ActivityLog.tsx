
import React, { useState, useEffect } from 'react';
import { ActivityEntry, ActivityType } from '../types';

interface ActivityLogProps {
  types: ActivityType[];
  onAdd: (entry: ActivityEntry) => void;
}

const ActivityLog: React.FC<ActivityLogProps> = ({ types, onAdd }) => {
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
  const [isConfiguring, setIsConfiguring] = useState(false);
  
  // State for the batch of activities
  const [batchData, setBatchData] = useState<Record<string, { value: string; note: string }>>({});

  // Helper to get local ISO string for datetime-local input (YYYY-MM-DDTHH:mm)
  const getLocalNow = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000; 
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  };

  const [sharedTimestamp, setSharedTimestamp] = useState<string>(getLocalNow());

  const toggleType = (id: string) => {
    setSelectedTypeIds(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const startConfiguring = () => {
    if (selectedTypeIds.length === 0) return;
    
    // Initialize batch data for selected items
    const initialData: Record<string, { value: string; note: string }> = {};
    selectedTypeIds.forEach(id => {
      initialData[id] = { value: '', note: '' };
    });
    setBatchData(initialData);
    setSharedTimestamp(getLocalNow());
    setIsConfiguring(true);
  };

  const updateBatchItem = (id: string, field: 'value' | 'note', val: string) => {
    setBatchData(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: val }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ts = new Date(sharedTimestamp).getTime();

    selectedTypeIds.forEach(typeId => {
      const data = batchData[typeId];
      const newEntry: ActivityEntry = {
        id: Math.random().toString(36).substr(2, 9),
        typeId: typeId,
        timestamp: ts,
        value: data.value ? parseFloat(data.value) : undefined,
        note: data.note.trim() || undefined,
      };
      onAdd(newEntry);
    });

    // Reset everything
    setSelectedTypeIds([]);
    setIsConfiguring(false);
    setBatchData({});
  };

  if (!isConfiguring) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Log Activity</h2>
            <p className="text-slate-500">Select one or more to record</p>
          </div>
          {selectedTypeIds.length > 0 && (
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full animate-pulse">
              {selectedTypeIds.length} Selected
            </span>
          )}
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-24">
          {types.map((type) => {
            const isSelected = selectedTypeIds.includes(type.id);
            return (
              <button
                key={type.id}
                onClick={() => toggleType(type.id)}
                className={`group relative bg-white p-6 rounded-2xl border-2 transition-all text-center flex flex-col items-center space-y-4 ${
                  isSelected 
                  ? 'border-indigo-500 shadow-lg scale-[1.02]' 
                  : 'border-slate-100 shadow-sm hover:border-slate-200'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-sm">
                    <i className="fa-solid fa-check"></i>
                  </div>
                )}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110 ${type.color}`}>
                  <i className={`fa-solid ${type.icon}`}></i>
                </div>
                <span className={`font-bold transition-colors ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                  {type.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Floating Action Button */}
        {selectedTypeIds.length > 0 && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md px-4 md:left-auto md:right-8 md:translate-x-0">
            <button
              onClick={startConfiguring}
              className="w-full bg-slate-800 text-white font-bold py-4 rounded-2xl shadow-2xl hover:bg-slate-900 active:scale-95 transition-all flex items-center justify-center space-x-3"
            >
              <span>Continue with {selectedTypeIds.length} {selectedTypeIds.length === 1 ? 'Activity' : 'Activities'}</span>
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <header className="flex items-center space-x-4">
        <button 
          onClick={() => setIsConfiguring(false)}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm"
        >
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Batch Details</h2>
          <p className="text-slate-500">Add specifics for your logs</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Global Time Selector */}
        <div className="bg-indigo-600 p-6 rounded-3xl shadow-xl shadow-indigo-100">
          <label className="block text-xs font-bold text-indigo-100 uppercase mb-2 tracking-wider">Common Timestamp</label>
          <input
            type="datetime-local"
            value={sharedTimestamp}
            onChange={(e) => setSharedTimestamp(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:bg-white/20 outline-none transition"
            required
          />
        </div>

        {/* Individual Activity Cards */}
        <div className="space-y-4">
          {selectedTypeIds.map(id => {
            const type = types.find(t => t.id === id)!;
            const data = batchData[id] || { value: '', note: '' };
            return (
              <div key={id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center space-x-3 pb-2 border-b border-slate-50">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${type.color}`}>
                    <i className={`fa-solid ${type.icon}`}></i>
                  </div>
                  <h3 className="font-bold text-slate-800">{type.name}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {type.unit && (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Amount ({type.unit})</label>
                      <input
                        type="number"
                        placeholder="--"
                        value={data.value}
                        onChange={(e) => updateBatchItem(id, 'value', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 font-medium"
                      />
                    </div>
                  )}
                  <div className={type.unit ? "" : "md:col-span-2"}>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Observation</label>
                    <input
                      type="text"
                      placeholder="Optional note..."
                      value={data.note}
                      onChange={(e) => updateBatchItem(id, 'note', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all text-lg"
        >
          Log {selectedTypeIds.length} {selectedTypeIds.length === 1 ? 'Activity' : 'Activities'}
        </button>
      </form>
    </div>
  );
};

export default ActivityLog;
