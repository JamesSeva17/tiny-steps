
import { SyncData } from "../types";

/**
 * KeyValue.xyz is a reliable, anonymous KV store.
 * It does not require account creation or bucket provisioning.
 * We use a unique "app prefix" to avoid key collisions.
 */
const APP_PREFIX = "tinysteps_v1_";
const API_BASE = "https://keyvalue.xyz/8f1e5c2a"; // Our dedicated anonymous endpoint

export const syncService = {
  /**
   * Pushes local data to the cloud using the unique key.
   */
  async push(key: string, data: SyncData): Promise<boolean> {
    if (!key) return false;
    try {
      // KeyValue.xyz uses POST/PUT to set values
      const response = await fetch(`${API_BASE}/${APP_PREFIX}${key}`, {
        method: 'POST', // KeyValue.xyz accepts POST for updates
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      return response.ok;
    } catch (error) {
      console.error("Cloud push failed:", error);
      return false;
    }
  },

  /**
   * Pulls data from the cloud using the unique key.
   */
  async pull(key: string): Promise<SyncData | null> {
    if (!key) return null;
    try {
      const response = await fetch(`${API_BASE}/${APP_PREFIX}${key}`);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("Cloud pull failed:", error);
      return null;
    }
  },

  /**
   * Generates a random unique key for the user.
   */
  generateKey(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
};
