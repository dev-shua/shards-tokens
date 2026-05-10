// src/core/presets.ts
import { MODULE_ID } from "@utils/constants";
import { type Preset } from "@core/service";

const SETTINGS_KEY = "custom-presets";

// Presets intégrés — pas supprimables
export const BUILTIN_PRESETS: Preset[] = [
  {
    id: "builtin:darkvision-18",
    name: "Darkvision 18m",
    scope: "sight",
    builtin: true,
    sight: {
      visionMode: "darkvision",
      range: 18,
      angle: 360,
    },
  },
  {
    id: "builtin:blindness",
    name: "Cécité",
    scope: "sight",
    builtin: true,
    sight: {
      visionMode: "basic",
      range: 0,
    },
  },
  {
    id: "builtin:torch",
    name: "Torche",
    scope: "light",
    builtin: true,
    light: {
      dim: 12,
      bright: 6,
      color: "#ff9b48",
      alpha: 0.25,
      animation: {
        type: "torch",
        speed: 2,
        intensity: 5,
      },
    },
  },
  {
    id: "builtin:no-light",
    name: "Sans lumière",
    scope: "light",
    builtin: true,
    light: {
      dim: 0,
      bright: 0,
      color: null,
      alpha: 0.5,
      animation: { type: "", speed: 5, intensity: 5 },
    },
  },
];

export function getCustomPresets(): Preset[] {
  try {
    return (game as any).settings.get(MODULE_ID, SETTINGS_KEY) as Preset[] ?? [];
  } catch {
    return [];
  }
}

export async function saveCustomPresets(presets: Preset[]): Promise<void> {
  await (game as any).settings.set(MODULE_ID, SETTINGS_KEY, presets);
}

export async function addCustomPreset(preset: Omit<Preset, "id" | "builtin">): Promise<Preset> {
  const customs = getCustomPresets();
  const id = `custom:${Date.now()}`;
  const newPreset: Preset = { ...preset, id, builtin: false };
  customs.push(newPreset);
  await saveCustomPresets(customs);
  return newPreset;
}

export async function deleteCustomPreset(id: string): Promise<void> {
  const customs = getCustomPresets().filter(p => p.id !== id);
  await saveCustomPresets(customs);
}

export async function updatePreset(preset: Preset): Promise<void> {
  const customs = getCustomPresets().filter(p => p.id !== preset.id);
  customs.push({ ...preset, builtin: false });
  await saveCustomPresets(customs);
}

export function getAllPresets(): Preset[] {
  const customs = getCustomPresets();
  const customIds = new Set(customs.map(p => p.id));
  // Les customs overrident les builtins du même id
  const builtins = BUILTIN_PRESETS.filter(p => !customIds.has(p.id));
  return [...builtins, ...customs];
}