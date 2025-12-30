
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ActivityEntry, ActivityType, SyncData } from './types';
import { DEFAULT_ACTIVITY_TYPES } from './constants';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ActivityLog from './components/ActivityLog';
import History from './components/History';
import Settings from './components/Settings';
import { syncService } from './services/syncService';

const App: React.FC = () => {
  const [babyName, setBabyName] = useState<string>(() => {
    return localStorage.getItem('tiny_steps_baby_name') || '';
  });

  const [entries, setEntries] = useState<ActivityEntry[]>(() => {
    const saved = localStorage.getItem('tiny_steps_entries');
    return saved ? JSON.parse(saved) : [];
  });

  const [types, setTypes] = useState<ActivityType[]>(() => {
    const saved = localStorage.getItem('tiny_steps_types');
    return saved ? JSON.parse(saved) : DEFAULT_ACTIVITY_TYPES;
  });

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    localStorage.setItem('tiny_steps_baby_name', babyName);
  }, [babyName]);

  useEffect(() => {
    localStorage.setItem('tiny_steps_entries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('tiny_steps_types', JSON.stringify(types));
  }, [types]);

  const addEntry = (entry: ActivityEntry) => {
    setEntries(prev => [...prev, entry]);
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const addType = (type: ActivityType) => {
    setTypes(prev => [...prev, type]);
  };

  const removeType = (id: string) => {
    if (DEFAULT_ACTIVITY_TYPES.some(t => t.id === id)) {
      alert("Cannot remove default activity types.");
      return;
    }
    setTypes(prev => prev.filter(t => t.id !== id));
  };

  const handleSyncData = (data: SyncData) => {
    if (data.babyName) setBabyName(data.babyName);
    setTypes(data.types);
    setEntries(prev => {
      const entryMap = new Map();
      prev.forEach(e => entryMap.set(e.id, e));
      data.entries.forEach(e => entryMap.set(e.id, e));
      return Array.from(entryMap.values()).sort((a, b) => b.timestamp - a.timestamp);
    });
    localStorage.setItem('tiny_steps_last_sync', Date.now().toString());
  };

  const performSync = useCallback(async () => {
    const key = localStorage.getItem('tiny_steps_sync_key');
    if (!key) return;

    setIsSyncing(true);
    try {
      // 1. Pull latest from cloud
      const cloudData = await syncService.pull(key);
      if (cloudData) {
        handleSyncData(cloudData);
      }

      // 2. Push current (now merged) state back to cloud
      await syncService.push(key, {
        entries,
        types,
        babyName,
        lastUpdated: Date.now()
      });
      localStorage.setItem('tiny_steps_last_sync', Date.now().toString());
    } catch (e) {
      console.error("Sync failed", e);
    } finally {
      setIsSyncing(false);
    }
  }, [entries, types, babyName]);


  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={
            <Dashboard
              babyName={babyName}
              entries={entries}
              types={types}
              onSyncNow={performSync}
              isSyncing={isSyncing}
            />
          } />
          <Route path="/log" element={<ActivityLog types={types} onAdd={addEntry} />} />
          <Route path="/history" element={<History entries={entries} types={types} onDelete={deleteEntry} />} />
          <Route path="/settings" element={
            <Settings
              babyName={babyName}
              onUpdateBabyName={setBabyName}
              types={types}
              entries={entries}
              onAddType={addType}
              onRemoveType={removeType}
              onSyncData={handleSyncData}
            />
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
