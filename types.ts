
export type ActivityCategory = 'FEEDING' | 'DIAPER' | 'SLEEP' | 'OTHER';

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
  value?: number; // Volume in ml, or duration in minutes
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
