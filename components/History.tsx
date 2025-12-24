
import React from 'react';
import { ActivityEntry, ActivityType } from '../types';

interface HistoryProps {
  entries: ActivityEntry[];
  types: ActivityType[];
  onDelete: (id: string) => void;
}

const History: React.FC<HistoryProps> = ({ entries, types, onDelete }) => {
  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);

  // Group entries by date
  const groupedEntries: Record<string, ActivityEntry[]> = sortedEntries.reduce((groups, entry) => {
    const date = new Date(entry.timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(entry);
    return groups;
  }, {} as Record<string, ActivityEntry[]>);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">History</h2>
        <p className="text-slate-500">Every little step recorded.</p>
      </header>

      {Object.entries(groupedEntries).map(([date, items]) => (
        <div key={date} className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">{date}</h3>
          <div className="space-y-2">
            {items.map((entry) => {
              const type = types.find((t) => t.id === entry.typeId);
              return (
                <div key={entry.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 hover:shadow-md transition group">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${type?.color}`}>
                    <i className={`fa-solid ${type?.icon}`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-800">{type?.name}</p>
                      <p className="text-xs font-medium text-slate-400">
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {entry.note && <p className="text-sm text-slate-500 mt-1 italic">"{entry.note}"</p>}
                    {entry.value && (
                      <div className="mt-1 flex items-center space-x-1">
                        <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full text-slate-600 font-medium">
                          {entry.value} {type?.unit}
                        </span>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => onDelete(entry.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition"
                    title="Delete entry"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {entries.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
          <i className="fa-solid fa-calendar-xmark text-slate-200 text-6xl mb-4"></i>
          <h3 className="text-xl font-bold text-slate-400">No logs yet</h3>
          <p className="text-slate-300">Start logging your baby's activities to see them here.</p>
        </div>
      )}
    </div>
  );
};

export default History;
