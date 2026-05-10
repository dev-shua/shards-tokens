import { writable, derived } from "svelte/store";
import { getAllPresets } from "@core/presets";
import { getActivePresetId, hasSnapshot } from "@core/service";

export type SelectionToken = {
  id: string;
  name: string;
  img: string;
  isPC: boolean;
  isHostile: boolean;
  document: any;
};

export type ActiveEffect = {
  tokenId: string;
  tokenName: string;
  tokenImg: string;
  presetId: string;
  presetName: string;
  presetScope: "sight" | "light" | "both" | null;
};

function getControlled(): SelectionToken[] {
  return ((canvas as any)?.tokens?.controlled ?? []).map((t: any) => {
    const doc = t.document;
    const actor = doc?.actor;
    const isPC = !!(actor && actor.type === "character" && actor.hasPlayerOwner);
    const disposition = doc?.disposition;
    const HOSTILE = (globalThis as any).CONST?.TOKEN_DISPOSITIONS?.HOSTILE ?? -1;
    const isHostile = disposition === HOSTILE;

    return {
      id: t.id as string,
      name: String(t.name ?? "—"),
      img: doc?.texture?.src ?? "",
      isPC,
      isHostile,
      document: doc,
    };
  });
}

function getActiveEffects(): ActiveEffect[] {
  const allTokens = ((canvas as any)?.tokens?.placeables ?? []) as any[];
  const presets = getAllPresets();
  const effects: ActiveEffect[] = [];

  for (const t of allTokens) {
    const doc = t.document;
    if (!hasSnapshot(doc)) continue;

    const presetId = getActivePresetId(doc);
    const preset = presets.find(p => p.id === presetId);

    effects.push({
      tokenId: t.id,
      tokenName: String(t.name ?? "—"),
      tokenImg: doc?.texture?.src ?? "",
      presetId: presetId ?? "",
      presetName: preset?.name ?? "Effect unknown",
      presetScope: preset?.scope ?? null,
    });
  }

  return effects;
}

// Stores
export const selectionStore = writable<SelectionToken[]>([]);
export const activeEffectsStore = writable<ActiveEffect[]>([]);

// Filtre actif
export const filterStore = writable({ pc: true, npc: true, hostile: true });

// Sélection filtrée
export const filteredSelection = derived(
  [selectionStore, filterStore],
  ([$selection, $filter]) => {
    return $selection.filter(t => {
      if (!$filter.pc && t.isPC) return false;
      if (!$filter.npc && !t.isPC) return false;
      if (!$filter.hostile && t.isHostile) return false;
      return true;
    });
  }
);

export function refreshSelection(): void {
  selectionStore.set(getControlled());
}

export function refreshActiveEffects(): void {
  activeEffectsStore.set(getActiveEffects());
}

export function refreshAll(): void {
  refreshSelection();
  refreshActiveEffects();
}

let _hookId: number | null = null;
let _raf = 0;

export function initTokenStore(): void {
  refreshAll();

  const scheduleRefresh = () => {
    if (_raf) return;
    _raf = requestAnimationFrame(() => {
      _raf = 0;
      refreshAll();
    });
  };

  _hookId = Hooks.on("controlToken", scheduleRefresh);
  Hooks.on("updateToken", scheduleRefresh);
  Hooks.on("canvasReady", scheduleRefresh);
}

export function destroyTokenStore(): void {
  if (_hookId !== null) {
    Hooks.off("controlToken", _hookId);
    _hookId = null;
  }
}