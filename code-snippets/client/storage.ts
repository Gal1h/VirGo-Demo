// VirGO Mobile Client - MMKV Storage Layer
// File: RemoteApp/src/constants/storage.ts (excerpt)

import { MMKV } from "react-native-mmkv";

/**
 * MMKV Instance - Fast, synchronous key-value storage
 * Uses JSI for direct native access (no bridge overhead)
 */
export const storage = new MMKV({
  id: "virgo-storage",
  encryptionKey: "virgo-secure-key", // Optional encryption
});

/**
 * Current Config - Ephemeral storage for active editor session
 * Cleared on app restart or explicit clear
 */
export const currentConfig = new MMKV({
  id: "virgo-current-config",
});

/**
 * Storage Keys & Helpers
 */
export const STORAGE_KEYS = {
  THEME: "theme",
  LAST_CONFIG: "last_config",
} as const;

/**
 * Save controller profile
 */
export const saveProfile = (profile: ControllerProfile): string => {
  const id = profile.id || generateId();
  const data = JSON.stringify({ ...profile, id, updatedAt: Date.now() });
  storage.set(id, data);
  return id;
};

/**
 * Load controller profile by ID
 */
export const loadProfile = (id: string): ControllerProfile | null => {
  const data = storage.getString(id);
  if (!data) return null;
  try { return JSON.parse(data); } catch { return null; }
};

/**
 * Get all saved profile IDs
 */
export const getAllProfiles = (): string[] => {
  return storage.getAllKeys().filter(k => k !== STORAGE_KEYS.THEME && k !== STORAGE_KEYS.LAST_CONFIG);
};

/**
 * Delete profile
 */
export const deleteProfile = (id: string): void => {
  storage.delete(id);
};

/**
 * Export all profiles as JSON (for backup/share)
 */
export const exportProfiles = (): string => {
  const profiles = getAllProfiles().map(id => {
    const data = storage.getString(id);
    return data ? JSON.parse(data) : null;
  }).filter(Boolean);
  return JSON.stringify(profiles, null, 2);
};

/**
 * Import profiles from JSON
 * Returns array of imported profile IDs
 */
export const importProfiles = (json: string): string[] => {
  try {
    const profiles = JSON.parse(json) as ControllerProfile[];
    const importedIds: string[] = [];
    profiles.forEach(p => {
      if (p.id && p.name && p.buttons) {
        const id = saveProfile(p);
        importedIds.push(id);
      }
    });
    return importedIds;
  } catch {
    return [];
  }
};

/**
 * Theme persistence
 */
export const saveTheme = (theme: Theme): void => {
  storage.set(STORAGE_KEYS.THEME, JSON.stringify(theme));
};

export const loadTheme = (): Theme | null => {
  const data = storage.getString(STORAGE_KEYS.THEME);
  return data ? JSON.parse(data) : null;
};

/**
 * Last used config ID (for auto-load on startup)
 */
export const setLastConfig = (id: string): void => {
  storage.set(STORAGE_KEYS.LAST_CONFIG, id);
};

export const getLastConfig = (): string | null => {
  return storage.getString(STORAGE_KEYS.LAST_CONFIG);
};

/**
 * Type Definitions
 */
export interface ControllerProfile {
  id: string;
  name: string;
  buttons: ButtonData[];
  createdAt?: number;
  updatedAt?: number;
}

export interface ButtonData {
  id: string;
  input: string;
  name?: string;
  type: "key" | "mouse" | "joystick";
  x: number;
  y: number;
  option: ButtonOptions;
}

export interface ButtonOptions {
  width: number;
  height: number;
  borderWidth?: number;
  borderRadius: number;
  borderColor: string;
  opacity?: number;
}

export interface Theme {
  darkmode: boolean;
  buttoncolor: string;
  bordercolor: string;
  backgroundcolor: string;
}

/**
 * Utility: Generate unique ID
 */
const generateId = (): string => {
  // nanoid alternative without dependency
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
};