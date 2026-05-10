<!-- src/ui/TokenPanel.svelte -->
<script lang="ts">
  import { mount, unmount } from "svelte";
  import {
    filteredSelection,
    filterStore,
    activeEffectsStore,
    refreshActiveEffects,
  } from "@ui/tokenStore";
  import { getAllPresets, addCustomPreset, deleteCustomPreset, updatePreset } from "@core/presets";
  import { applyPreset, revertAll } from "@core/service";
  import { type Preset } from "@core/service";
  import PresetForm from "@ui/PresetForm.svelte";
  import log from "@utils/logger";

  $: presets = getAllPresets();
  $: sightPresets = presets.filter(p => p.scope === "sight" || p.scope === "both");
  $: lightPresets = presets.filter(p => p.scope === "light" || p.scope === "both");

  function openPresetForm(scope: "sight" | "light" | "both", existing: Preset | null = null): void {
    (game as any).shardsCore?.openWindow({
      id: "st-preset-form",
      title: existing
        ? game.i18n.localize("SHARDSTokens.Form.EditTitle")
        : game.i18n.localize("SHARDSTokens.Form.Title"),
      icon: "fa-solid fa-wand-magic-sparkles",
      initialW: 340,
      initialH: 480,
      render: (container: HTMLElement) => {
        const instance = mount(PresetForm, {
          target: container,
          props: {
            defaultScope: scope,
            existingPreset: existing,
            onSave: async (preset: Omit<Preset, "id" | "builtin">) => {
              if (existing) {
                await updatePreset({ ...preset, id: existing.id });
              } else {
                await addCustomPreset(preset);
              }
              presets = getAllPresets();
              (game as any).shardsCore?.closeWindow("st-preset-form");
            },
            onClose: () => (game as any).shardsCore?.closeWindow("st-preset-form"),
          },
        });
        return () => unmount(instance);
      },
    });
  }

  async function handleApplyPreset(preset: Preset): Promise<void> {
    const tokens = $filteredSelection;
    if (!tokens.length) {
      (ui as any).notifications?.warn("Aucun token sélectionné.");
      return;
    }
    for (const t of tokens) {
      await applyPreset(t.document, preset);
    }
    refreshActiveEffects();
  }

  async function handleRevertAll(tokenId: string): Promise<void> {
    const token = ((canvas as any)?.tokens?.get(tokenId))?.document;
    if (!token) return;
    await revertAll(token);
    refreshActiveEffects();
  }

  async function handleDeletePreset(id: string): Promise<void> {
    await deleteCustomPreset(id);
    presets = getAllPresets();
  }

  function removeFromSelection(tokenId: string): void {
    (canvas as any)?.tokens?.get(tokenId)?.release?.();
  }

  function toggleFilter(key: "pc" | "npc" | "hostile"): void {
    filterStore.update(f => ({ ...f, [key]: !f[key] }));
  }
</script>

<div class="st-panel">
  <!-- Header : sélection + filtres -->
  <div class="st-header">
    <span class="st-title">
      {game.i18n.localize("SHARDSTokens.Panel.Title") ?? "Tokens"} ({$filteredSelection.length})
    </span>
    <div class="st-filters">
      <button
        type="button"
        class="st-filter"
        class:is-active={$filterStore.pc}
        on:click={() => toggleFilter("pc")}
        aria-label="PC"
      >PC</button>
      <button
        type="button"
        class="st-filter"
        class:is-active={$filterStore.npc}
        on:click={() => toggleFilter("npc")}
        aria-label="NPC"
      >NPC</button>
      <button
        type="button"
        class="st-filter"
        class:is-active={$filterStore.hostile}
        on:click={() => toggleFilter("hostile")}
        aria-label="Hostile"
      >⚔</button>
    </div>
  </div>

  <!-- Tokens sélectionnés -->
  <div class="st-selection">
    {#if $filteredSelection.length === 0}
      <div class="st-empty">{game.i18n.localize("SHARDSTokens.Panel.Empty") ?? "No token selected."}</div>
    {:else}
      {#each $filteredSelection as token (token.id)}
        <div
          class="st-token"
          class:is-hostile={token.isHostile}
          title={`${token.name} — ${game.i18n.localize("SHARDSTokens.Panel.RightClickToRemove") ?? "Right-click to remove"}`}
          on:contextmenu|preventDefault={() => removeFromSelection(token.id)}
          role="presentation"
        >
          <img src={token.img} alt={token.name} class="st-token-img" />
          <span class="st-token-name">{token.name}</span>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Presets -->
<div class="st-section">
  <div class="st-section-title">
    <i class="fa-solid fa-wand-magic-sparkles"></i>
    Presets
  </div>
  <div class="st-presets">
    {#each presets as preset (preset.id)}
      <div class="st-chip" class:is-builtin={preset.builtin}>
        <button
          type="button"
          class="st-chip-btn"
          on:click={() => handleApplyPreset(preset)}
          title={preset.name}
        >
          <!-- Icône scope auto -->
          {#if preset.scope === "sight"}
            <i class="fa-solid fa-eye st-scope"></i>
          {:else if preset.scope === "light"}
            <i class="fa-solid fa-lightbulb st-scope"></i>
          {:else}
            <i class="fa-solid fa-eye st-scope"></i>
            <i class="fa-solid fa-lightbulb st-scope"></i>
          {/if}
          <span class="st-chip-name">{preset.name}</span>
        </button>

        <!-- Actions en overlay au hover -->
        <div class="st-chip-actions">
          <button
            type="button"
            class="st-chip-action"
            on:click|stopPropagation={() => openPresetForm(preset.scope, preset)}
            aria-label="Modifier"
          >
            <i class="fa-solid fa-pen"></i>
          </button>
          {#if !preset.builtin}
            <button
              type="button"
              class="st-chip-action is-danger"
              on:click|stopPropagation={() => handleDeletePreset(preset.id)}
              aria-label="Supprimer"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          {/if}
        </div>
      </div>
    {/each}

    <button type="button" class="st-add" on:click={() => openPresetForm("sight")} aria-label="create">
      <i class="fa-solid fa-plus"></i>
    </button>
  </div>
</div>

  <!-- Effets actifs -->
  {#if $activeEffectsStore.length > 0}
    <div class="st-section">
      <div class="st-section-title">
        <i class="fa-solid fa-wand-magic-sparkles"></i>
        {game.i18n.localize("SHARDSTokens.Panel.ActiveEffects") ?? "Active effects"}
      </div>
      <div class="st-effects">
        {#each $activeEffectsStore as effect (effect.tokenId)}
          <div class="st-effect">
            <img src={effect.tokenImg} alt={effect.tokenName} class="st-effect-img" />
            <div class="st-effect-info">
              <span class="st-effect-name">{effect.tokenName}</span>
              <span class="st-effect-preset">
                {#if effect.presetScope === "sight"}
                  <i class="fa-solid fa-eye"></i>
                {:else if effect.presetScope === "light"}
                  <i class="fa-solid fa-lightbulb"></i>
                {:else if effect.presetScope === "both"}
                  <i class="fa-solid fa-eye"></i>
                  <i class="fa-solid fa-lightbulb"></i>
                {/if}
                {effect.presetName}
              </span>
            </div>
            <button
              type="button"
              class="st-effect-revert"
              on:click={() => handleRevertAll(effect.tokenId)}
              title={game.i18n.localize("SHARDSTokens.Panel.Restore") ?? "Restore"}
            >
              <i class="fa-solid fa-rotate-left"></i>
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .st-panel {
    display: grid;
    gap: 8px;
    padding: 10px;
    width: 100%;
  }

  .st-panel button {
    height: auto !important;
  }

  .st-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .st-title {
    font-weight: 700;
    font-size: 0.95em;
  }

  .st-filters {
    display: flex;
    gap: 4px;
  }

  .st-filter {
    padding: 2px 8px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.04);
    cursor: pointer;
    font-size: 0.8em;
    color: inherit;
    opacity: 0.5;
    transition: opacity 120ms, background 120ms;
  }

  .st-filter.is-active {
    opacity: 1;
    background: rgba(255,255,255,0.12);
  }

  .st-selection {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    min-height: 40px;
  }

  .st-token {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    cursor: context-menu;
    opacity: 0.9;
    transition: opacity 120ms;
  }

  .st-token:hover { opacity: 1; }

  .st-token.is-hostile .st-token-img {
    border-color: rgba(220, 50, 50, 0.6);
  }

  .st-token-img {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255,255,255,0.2);
  }

  .st-token-name {
    font-size: 9px;
    max-width: 40px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
    opacity: 0.7;
  }

  .st-empty {
    opacity: 0.5;
    font-size: 0.85em;
    font-style: italic;
  }

  .st-section {
    display: grid;
    gap: 5px;
  }

  .st-section-title {
    font-size: 0.8em;
    font-weight: 600;
    opacity: 0.6;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .st-presets {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .st-add {
    width: 28px;
    height: 28px !important;
    border-radius: 8px;
    border: 1px dashed rgba(255,255,255,0.2);
    background: transparent;
    color: inherit;
    cursor: pointer;
    display: grid;
    place-items: center;
    font-size: 0.8em;
    opacity: 0.5;
    transition: opacity 120ms;
  }

  .st-add:hover { opacity: 1; }

  .st-effects {
    display: grid;
    gap: 5px;
  }

  .st-effect {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 8px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.03);
  }

  .st-effect-img {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .st-effect-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .st-effect-name {
    font-size: 0.85em;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .st-effect-preset {
    font-size: 0.75em;
    opacity: 0.6;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .st-effect-revert {
    width: 26px;
    height: 26px !important;
    border-radius: 7px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.05);
    color: inherit;
    cursor: pointer;
    display: grid;
    place-items: center;
    font-size: 0.8em;
    flex-shrink: 0;
    transition: background 120ms;
  }

  .st-effect-revert:hover {
    background: rgba(255,255,255,0.12);
  }

  .st-presets {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .st-chip {
    position: relative;
    display: inline-flex;
  }

  .st-chip-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.05);
    cursor: pointer;
    font-size: 0.82em;
    color: inherit;
    transition: background 120ms;
  }

  .st-chip-btn:hover {
    background: rgba(255,255,255,0.12);
  }

  .st-scope {
    font-size: 0.8em;
    opacity: 0.6;
  }

  .st-chip-name {
    max-width: 80px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Actions cachées par défaut, visibles au hover */
  .st-chip-actions {
    position: absolute;
    top: -6px;
    right: -6px;
    display: none;
    gap: 2px;
    z-index: 1;
  }

  .st-chip:hover .st-chip-actions {
    display: flex;
  }

  .st-chip-action {
    width: 18px !important;
    height: 18px !important;
    border-radius: 4px;
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(20,20,25,0.95);
    color: inherit;
    cursor: pointer;
    display: grid;
    place-items: center;
    font-size: 0.65em;
    transition: background 120ms;
  }

  .st-chip-action:hover {
    background: rgba(255,255,255,0.15);
  }

  .st-chip-action.is-danger:hover {
    background: rgba(220,50,50,0.3);
    color: rgba(220,50,50,0.9);
  }

  .st-add {
    width: 28px;
    height: 28px !important;
    border-radius: 8px;
    border: 1px dashed rgba(255,255,255,0.2);
    background: transparent;
    color: inherit;
    cursor: pointer;
    display: grid;
    place-items: center;
    font-size: 0.8em;
    opacity: 0.5;
    transition: opacity 120ms;
  }

  .st-add:hover { opacity: 1; }
</style>