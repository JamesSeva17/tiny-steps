
import { ActivityType } from './types';

export const DEFAULT_ACTIVITY_TYPES: ActivityType[] = [
  { id: 'pee', name: 'Pee', category: 'DIAPER', icon: 'fa-droplet', color: 'bg-yellow-100 text-yellow-600' },
  { id: 'poop', name: 'Poop', category: 'DIAPER', icon: 'fa-poop', color: 'bg-amber-100 text-amber-700' },
  { id: 'breast_feed', name: 'Breast Feed', category: 'FEEDING', icon: 'fa-person-breastfeeding', unit: 'min', color: 'bg-rose-100 text-rose-600' },
  { id: 'cup_feed', name: 'Cup Feed', category: 'FEEDING', icon: 'fa-glass-water', unit: 'ml', color: 'bg-blue-100 text-blue-600' },
  { id: 'sleep', name: 'Sleep', category: 'SLEEP', icon: 'fa-moon', unit: 'min', color: 'bg-indigo-100 text-indigo-600' },
  { id: 'weight', name: 'Weight', category: 'GROWTH', icon: 'fa-weight-scale', unit: 'kg', color: 'bg-emerald-100 text-emerald-600' },
];

export const CATEGORY_COLORS: Record<string, string> = {
  FEEDING: 'bg-pink-50 border-pink-200 text-pink-700',
  DIAPER: 'bg-amber-50 border-amber-200 text-amber-700',
  SLEEP: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  GROWTH: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  OTHER: 'bg-slate-50 border-slate-200 text-slate-700',
};
