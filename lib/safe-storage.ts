// ============================================
// MEREO - Safe Storage Wrapper
// Graceful handling of localStorage errors
// ============================================

import { StateStorage } from "zustand/middleware";

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a safe storage adapter that gracefully handles errors
 */
export function createSafeStorage(): StateStorage {
  const isAvailable = isLocalStorageAvailable();

  if (!isAvailable) {
    console.warn(
      "[MEREO] localStorage is not available. Data will not persist between sessions."
    );
  }

  return {
    getItem: (name: string): string | null => {
      if (!isAvailable) return null;

      try {
        return localStorage.getItem(name);
      } catch (error) {
        console.warn(`[MEREO] Failed to read from localStorage: ${name}`, error);
        return null;
      }
    },

    setItem: (name: string, value: string): void => {
      if (!isAvailable) return;

      try {
        localStorage.setItem(name, value);
      } catch (error) {
        // Check if it's a quota exceeded error
        if (
          error instanceof DOMException &&
          (error.code === 22 || // Legacy code for QuotaExceededError
            error.code === 1014 || // Firefox-specific
            error.name === "QuotaExceededError" ||
            error.name === "NS_ERROR_DOM_QUOTA_REACHED")
        ) {
          console.error(
            "[MEREO] localStorage quota exceeded. Consider clearing old data.",
            error
          );
        } else {
          console.warn(`[MEREO] Failed to write to localStorage: ${name}`, error);
        }
      }
    },

    removeItem: (name: string): void => {
      if (!isAvailable) return;

      try {
        localStorage.removeItem(name);
      } catch (error) {
        console.warn(`[MEREO] Failed to remove from localStorage: ${name}`, error);
      }
    },
  };
}

/**
 * Get localStorage usage stats
 */
export function getStorageStats(): { used: number; total: number; percentage: number } | null {
  if (!isLocalStorageAvailable()) return null;

  try {
    let totalSize = 0;
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }

    // Most browsers have a 5MB limit
    const totalLimit = 5 * 1024 * 1024;

    return {
      used: totalSize,
      total: totalLimit,
      percentage: Math.round((totalSize / totalLimit) * 100),
    };
  } catch {
    return null;
  }
}
