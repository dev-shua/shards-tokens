import { registerSettings } from "@core/settings";
import { initTokenStore } from "@ui/tokenStore";
import { mount } from "svelte";
import TokenPanel from "@ui/TokenPanel.svelte";
import log from "@utils/logger";

Hooks.once("init", () => {
  log.i`init`;
  registerSettings();

  Hooks.once("shards-core:ready", () => {
    log.i`shards-core ready — registering tokens panel`;
    (game as any).shardsCore?.registerTool({
      id: "tokens",
      icon: "fa-solid fa-chess-pawn",
      title: game.i18n.localize("SHARDSTokens.Panel.Title"),
      order: 1,
      render: (container: HTMLElement) => {
        mount(TokenPanel, { target: container });
      },
    });
  });
});

Hooks.once("ready", () => {
  log.i`ready`;
  if (!game.user?.isGM) return;
  initTokenStore();
});