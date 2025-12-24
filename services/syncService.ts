
import { SyncData } from "../types";

/**
 * kvdb.io requires a valid bucket ID. 
 * If you get 404s, it usually means the bucket is invalid or has expired.
 * We'll use a standard public bucket prefix.
 */
const BUCKET_ID = "TSteps_" + "v1_public_bucket"; // Prefixed to be safer
const KV_API_BASE = `https://kvdb.io/${BUCKET_ID}`;

export const syncService = {
  /**
   * Pushes local data to the cloud bucket using the unique key.
   * kvdb.io uses PUT to create or update a key.
   */
  async push(key: string, data: SyncData): Promise<boolean> {
    if (!key) return false;
    try {
      const response = await fetch(`${KV_API_BASE}/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Cloud push failed with status ${response.status}: ${errorText}`);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Cloud push failed:", error);
      return false;
    }
  },

  /**
   * Pulls data from the cloud bucket using the unique key.
   */
  async pull(key: string): Promise<SyncData | null> {
    if (!key) return null;
    try {
      const response = await fetch(`${KV_API_BASE}/${key}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.log("Key not found in cloud - this is normal for first-time sync.");
        } else {
          console.error(`Cloud pull failed with status ${response.status}`);
        }
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
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
};
