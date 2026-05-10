// src/core/settings.ts
import { MODULE_ID } from "@utils/constants";

export const SETTINGS_KEYS = {
  CUSTOM_PRESETS: "custom-presets",
} as const;

type SettingsKey = typeof SETTINGS_KEYS[keyof typeof SETTINGS_KEYS];

export function registerSettings(): void {
  game.settings.register(MODULE_ID, SETTINGS_KEYS.CUSTOM_PRESETS, {
    scope: "world",
    config: false,
    type: Array,
    default: [],
  });
}

export function getSetting<T>(key: SettingsKey): T {
  return game.settings.get(MODULE_ID, key) as T;
}

export async function setSetting<T>(key: SettingsKey, value: T): Promise<void> {
  await game.settings.set(MODULE_ID, key, value);
}