
import { SyncData } from "../types";

const KV_API_BASE = "https://kvdb.io/An7D7mYmGv1H8f5v4q2G1y"; // Public bucket for TinySteps

export const syncService = {
  /**
   * Pushes local data to the cloud bucket using the unique key.
   */
  async push(key: string, data: SyncData): Promise<boolean> {
    try {
      const response = await fetch(`${KV_API_BASE}/${key}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch (error) {
      console.error("Cloud push failed:", error);
      return false;
    }
  },

  /**
   * Pulls data from the cloud bucket using the unique key.
   */
  async pull(key: string): Promise<SyncData | null> {
    try {
      const response = await fetch(`${KV_API_BASE}/${key}`);
      if (!response.ok) return null;
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
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
};
