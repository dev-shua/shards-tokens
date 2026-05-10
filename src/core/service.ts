import { MODULE_ID } from "@utils/constants";

export type SightPatch = Partial<{
  enabled: boolean;
  range: number | null;
  angle: number;
  visionMode: string;
}>;

export type LightPatch = Partial<{
  dim: number;
  bright: number;
  color: string | null;
  alpha: number;
  angle: number;
  animation: {
    type: string;
    speed: number;
    intensity: number;
    reverse?: boolean;
  };
}>;

export type PresetScope = "sight" | "light" | "both";

export type Preset = {
  id: string;
  name: string;
  scope: PresetScope;
  sight?: SightPatch;
  light?: LightPatch;
  builtin?: boolean; // true = pas supprimable
};

type Snapshot = {
  sight?: SightPatch;
  light?: LightPatch;
  detectionModes?: any;
  presetId?: string; // preset actif
};

type TokenDoc = {
  id: string;
  sight: any;
  light: any;
  detectionModes: any;
  update(d: any): Promise<unknown>;
  getFlag(s: string, k: string): unknown;
  setFlag(s: string, k: string, v: unknown): Promise<unknown>;
  unsetFlag(s: string, k: string): Promise<unknown>;
};

const clone = <T>(o: T): T => (foundry as any).utils.deepClone(o);

const getSnap = (t: TokenDoc): Snapshot =>
  (t.getFlag(MODULE_ID, "snapshot") ?? {}) as Snapshot;

const setSnap = (t: TokenDoc, s: Snapshot): Promise<unknown> =>
  t.setFlag(MODULE_ID, "snapshot", s);

const clearSnap = (t: TokenDoc): Promise<unknown> =>
  t.unsetFlag(MODULE_ID, "snapshot");

export function getActivePresetId(token: TokenDoc): string | null {
  return getSnap(token).presetId ?? null;
}

export function hasSnapshot(token: TokenDoc): boolean {
  const snap = getSnap(token);
  return !!(snap.sight || snap.light);
}

export async function applyPreset(token: TokenDoc, preset: Preset): Promise<void> {
  const snap = getSnap(token);

  // Snapshot avant application
  if (preset.sight && !snap.sight) {
    snap.sight = clone(token.sight);
    snap.detectionModes = clone(token.detectionModes);
  }
  if (preset.light && !snap.light) {
    snap.light = clone(token.light);
  }

  snap.presetId = preset.id;
  await setSnap(token, snap);

  const patch: any = {};
  if (preset.sight) patch.sight = preset.sight;
  if (preset.light) patch.light = preset.light;
  await token.update(patch);
}

export async function revertScope(token: TokenDoc, scope: "sight" | "light"): Promise<void> {
  const snap = getSnap(token);
  if (!snap[scope]) return;

  const patch: any = { [scope]: snap[scope] };
  if (scope === "sight" && snap.detectionModes) {
    patch.detectionModes = snap.detectionModes;
  }
  await token.update(patch);

  if (scope === "sight") {
    delete snap.sight;
    delete snap.detectionModes;
  } else {
    delete snap.light;
  }

  // Si plus de snapshot, on nettoie tout
  if (!snap.sight && !snap.light) {
    await clearSnap(token);
  } else {
    delete snap.presetId;
    await setSnap(token, snap);
  }
}

export async function revertAll(token: TokenDoc): Promise<void> {
  const snap = getSnap(token);
  const patch: any = {};

  if (snap.sight) patch.sight = snap.sight;
  if (snap.detectionModes) patch.detectionModes = snap.detectionModes;
  if (snap.light) patch.light = snap.light;

  if (Object.keys(patch).length) await token.update(patch);
  await clearSnap(token);
}