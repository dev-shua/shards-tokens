<script lang="ts">
  import { type Preset, type SightPatch, type LightPatch } from "@core/service";

  export let defaultScope: "sight" | "light" | "both" = "sight";
  export let existingPreset: Preset | null = null;
  export let onSave: (preset: Omit<Preset, "id" | "builtin">) => Promise<void> = async () => {};
  export let onClose: () => void = () => {};

  let name = existingPreset?.name ?? "";
  let scope: "sight" | "light" | "both" = existingPreset?.scope ?? defaultScope;
  let visionMode = existingPreset?.sight?.visionMode ?? "darkvision";
  let visionRange = existingPreset?.sight?.range ?? 18;
  let visionAngle = existingPreset?.sight?.angle ?? 360;
  let lightDim = existingPreset?.light?.dim ?? 12;
  let lightBright = existingPreset?.light?.bright ?? 6;
  let lightColor = existingPreset?.light?.color ?? "#ff9b48";
  let lightAlpha = existingPreset?.light?.alpha ?? 0.25;
  let lightAnimType = existingPreset?.light?.animation?.type ?? "";
  let lightAnimSpeed = existingPreset?.light?.animation?.speed ?? 5;
  let lightAnimIntensity = existingPreset?.light?.animation?.intensity ?? 5;

  const VISION_MODES = [
    { id: "basic", label: "Basic" },
    { id: "darkvision", label: "Darkvision" },
    { id: "tremorsense", label: "Tremorsense" },
    { id: "blindsight", label: "Blindsight" },
    { id: "truesight", label: "Truesight" },
  ];

  const ANIM_TYPES = [
    { id: "", label: "Aucune" },
    { id: "torch", label: "Torche" },
    { id: "pulse", label: "Pulsation" },
    { id: "chroma", label: "Chroma" },
    { id: "wave", label: "Vague" },
    { id: "fog", label: "Brume" },
    { id: "sunburst", label: "Soleil" },
    { id: "dome", label: "Dôme" },
  ];

  let saving = false;
  let error = "";

  async function save(): Promise<void> {
    if (!name.trim()) {
      error = game.i18n.localize("SHARDSTokens.Form.ErrorNameRequired");
      return;
    }
    saving = true;
    error = "";
    const sight: SightPatch | undefined =
      scope === "sight" || scope === "both"
        ? { visionMode, range: visionRange, angle: visionAngle }
        : undefined;
    const light: LightPatch | undefined =
      scope === "light" || scope === "both"
        ? {
            dim: lightDim,
            bright: lightBright,
            color: lightColor,
            alpha: lightAlpha,
            animation: lightAnimType
              ? { type: lightAnimType, speed: lightAnimSpeed, intensity: lightAnimIntensity }
              : { type: "", speed: 5, intensity: 5 },
          }
        : undefined;
    await onSave({ name: name.trim(), scope, sight, light });
    saving = false;
  }
</script>

<div class="stf-body">
  <div class="stf-row">
    <label class="stf-label" for="name">{game.i18n.localize("SHARDSTokens.Form.Name")}</label>
    <input type="text" id="name" class="stf-input" bind:value={name}
      placeholder={game.i18n.localize("SHARDSTokens.Form.NamePlaceholder")} />
  </div>

  <div class="stf-row">
    <label class="stf-label" for="scope-type">{game.i18n.localize("SHARDSTokens.Form.Type")}</label>
    <div class="stf-scope-btns">
      <button type="button" class="stf-scope-btn" class:is-active={scope === "sight"} on:click={() => scope = "sight"}>
        <i class="fa-solid fa-eye"></i> {game.i18n.localize("SHARDSTokens.Form.TypeSight")}
      </button>
      <button type="button" class="stf-scope-btn" class:is-active={scope === "light"} on:click={() => scope = "light"}>
        <i class="fa-solid fa-lightbulb"></i> {game.i18n.localize("SHARDSTokens.Form.TypeLight")}
      </button>
      <button type="button" class="stf-scope-btn" class:is-active={scope === "both"} on:click={() => scope = "both"}>
        <i class="fa-solid fa-wand-magic-sparkles"></i> {game.i18n.localize("SHARDSTokens.Form.TypeBoth")}
      </button>
    </div>
  </div>

  {#if scope === "sight" || scope === "both"}
    <div class="stf-section-title">
      <i class="fa-solid fa-eye"></i> {game.i18n.localize("SHARDSTokens.Form.Vision")}
    </div>
    <div class="stf-row">
      <label class="stf-label" for="sight-mode">{game.i18n.localize("SHARDSTokens.Form.VisionMode")}</label>
      <select class="stf-input" id="sight-mode" bind:value={visionMode}>
        {#each VISION_MODES as m}<option value={m.id}>{m.label}</option>{/each}
      </select>
    </div>
    <div class="stf-row2">
      <div class="stf-row">
        <label class="stf-label" for="sight-range">{game.i18n.localize("SHARDSTokens.Form.VisionRange")}</label>
        <input type="number" id="sight-range" class="stf-input" bind:value={visionRange} min="0" />
      </div>
      <div class="stf-row">
        <label class="stf-label" for="sight-angle">{game.i18n.localize("SHARDSTokens.Form.VisionAngle")}</label>
        <input type="number" id="sight-angle" class="stf-input" bind:value={visionAngle} min="0" max="360" />
      </div>
    </div>
  {/if}

  {#if scope === "light" || scope === "both"}
    <div class="stf-section-title">
      <i class="fa-solid fa-lightbulb"></i> {game.i18n.localize("SHARDSTokens.Form.Light")}
    </div>
    <div class="stf-row2">
      <div class="stf-row">
        <label class="stf-label" for="light-strong">{game.i18n.localize("SHARDSTokens.Form.LightBright")}</label>
        <input type="number" id="light-strong" class="stf-input" bind:value={lightBright} min="0" />
      </div>
      <div class="stf-row">
        <label class="stf-label" for="light-soft">{game.i18n.localize("SHARDSTokens.Form.LightDim")}</label>
        <input type="number" class="stf-input" bind:value={lightDim} min="0" />
      </div>
    </div>
    <div class="stf-row2">
      <div class="stf-row">
        <label class="stf-label" for="light-color">{game.i18n.localize("SHARDSTokens.Form.LightColor")}</label>
        <input type="color" id="light-color" class="stf-input stf-color" bind:value={lightColor} />
      </div>
      <div class="stf-row">
        <label class="stf-label" for="light-alpha">{game.i18n.localize("SHARDSTokens.Form.LightAlpha")}</label>
        <input type="number" id="light-alpha" class="stf-input" bind:value={lightAlpha} min="0" max="1" step="0.05" />
      </div>
    </div>
    <div class="stf-row">
      <label class="stf-label" for="light-animation">{game.i18n.localize("SHARDSTokens.Form.Animation")}</label>
      <select class="stf-input" id="light-animation" bind:value={lightAnimType}>
        {#each ANIM_TYPES as a}<option value={a.id}>{a.label}</option>{/each}
      </select>
    </div>
    {#if lightAnimType}
      <div class="stf-row2">
        <div class="stf-row">
          <label class="stf-label" for="anim-speed">{game.i18n.localize("SHARDSTokens.Form.AnimSpeed")}</label>
          <input type="number" id="anim-speed" class="stf-input" bind:value={lightAnimSpeed} min="1" max="10" />
        </div>
        <div class="stf-row">
          <label class="stf-label" for="anim-intensity">{game.i18n.localize("SHARDSTokens.Form.AnimIntensity")}</label>
          <input type="number" id="anim-intensity" class="stf-input" bind:value={lightAnimIntensity} min="1" max="10" />
        </div>
      </div>
    {/if}
  {/if}

  {#if error}
    <div class="stf-error">{error}</div>
  {/if}
</div>

<div class="stf-footer">
  <button type="button" class="stf-cancel" on:click={onClose}>
    {game.i18n.localize("SHARDSTokens.Form.Cancel")}
  </button>
  <button type="button" class="stf-save" on:click={save} disabled={saving}>
    {#if saving}
      <i class="fa-solid fa-spinner fa-spin"></i>
    {:else}
      <i class="fa-solid fa-check"></i>
    {/if}
    {game.i18n.localize("SHARDSTokens.Form.Save")}
  </button>
</div>

<style>
  .stf-body {
    display: grid;
    gap: 8px;
    padding: 12px;
    overflow-y: auto;
    flex: 1;
  }

  .stf-section-title {
    font-size: 0.8em;
    font-weight: 600;
    opacity: 0.6;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: 5px;
    padding-top: 4px;
    border-top: 1px solid rgba(255, 255, 255, 0.07);
  }

  .stf-row { display: grid; gap: 4px; }
  .stf-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .stf-label { font-size: 0.8em; opacity: 0.6; }

  .stf-input {
    width: 100%;
    padding: 5px 8px;
    border-radius: 7px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(0, 0, 0, 0.2);
    color: inherit;
    font-size: 0.85em;
    box-sizing: border-box;
  }

  .stf-color { padding: 2px; height: 32px; cursor: pointer; }

  .stf-scope-btns { display: flex; gap: 4px; }

  .stf-scope-btn {
    flex: 1;
    padding: 5px 4px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.04);
    cursor: pointer;
    font-size: 0.78em;
    color: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    opacity: 0.6;
    transition: all 120ms;
  }

  .stf-scope-btn.is-active {
    opacity: 1;
    border-color: color-mix(in srgb, var(--sc-primary) 50%, transparent);
    background: color-mix(in srgb, var(--sc-primary) 12%, transparent);
  }

  .stf-error {
    color: rgba(220, 50, 50, 0.9);
    font-size: 0.85em;
    padding: 6px 8px;
    border-radius: 7px;
    background: rgba(220, 50, 50, 0.1);
    border: 1px solid rgba(220, 50, 50, 0.2);
  }

  .stf-footer {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    padding: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
  }

  .stf-cancel {
    padding: 0 12px;
    height: 32px !important;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.04);
    color: inherit;
    cursor: pointer;
    font-size: 0.85em;
  }

  .stf-save {
    padding: 0 12px;
    height: 32px !important;
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--sc-success) 40%, transparent);
    background: color-mix(in srgb, var(--sc-success) 15%, transparent);
    color: inherit;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.85em;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background 120ms;
  }

  .stf-save:hover:not(:disabled) {
    background: color-mix(in srgb, var(--sc-success) 28%, transparent);
  }

  .stf-save:disabled { opacity: 0.5; cursor: not-allowed; }

  select.stf-input {
    background: rgba(20, 20, 25, 0.97) !important;
    color: #fff !important;
  }

  select.stf-input option {
    background: rgba(20, 20, 25, 0.97);
    color: #fff;
  }
</style>