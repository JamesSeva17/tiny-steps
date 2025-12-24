
export type ActivityCategory = 'FEEDING' | 'DIAPER' | 'SLEEP' | 'GROWTH' | 'OTHER';

export interface ActivityType {
  id: string;
  name: string;
  category: ActivityCategory;
  icon: string;
  unit?: string;
  color: string;
}

export interface ActivityEntry {
  id: string;
  typeId: string;
  timestamp: number;
  value?: number; // Volume in ml, duration in minutes, weight in kg, etc.
  note?: string;
}

export interface AIInsight {
  summary: string;
  suggestions: string[];
}

export interface SyncData {
  entries: ActivityEntry[];
  types: ActivityType[];
  babyName: string;
  lastUpdated: number;
}
