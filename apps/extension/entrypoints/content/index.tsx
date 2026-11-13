import "@pv/island/island.css";
import { createRoot, type Root } from "react-dom/client";
import { API_URL } from "@/utils/api";
import { App } from "./App";

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",
  async main(ctx) {
    // Our own website already shows its island; don't stack a second one on top.
    if (location.origin === new URL(API_URL).origin) return;

    // Fonts must be declared on the page (shadow roots inherit @font-face, not define it).
    const font = document.createElement("style");
    font.textContent = `@font-face { font-family: "Instrument Sans"; src: url("${browser.runtime.getURL("/fonts/InstrumentSans-Variable.woff2")}") format("woff2"); font-weight: 400 700; font-display: swap; }
      @font-face { font-family: "Noto Sans Meetei Mayek"; src: url("${browser.runtime.getURL("/fonts/NotoSansMeeteiMayek.woff2")}") format("woff2"); font-weight: 400 700; unicode-range: U+ABC0-ABFF, U+AAE0-AAFF; }`;
    document.head.append(font);

    const ui = await createShadowRootUi<Root>(ctx, {
      name: "pause-verify",
      position: "inline",
      anchor: "body",
      append: "last",
      // Typing in the island's chat must not trigger the site's keyboard shortcuts (Gmail, WhatsApp…).
      isolateEvents: true,
      onMount(container, _shadow, host) {
        const root = createRoot(container);
        root.render(<App host={host} />);
        return root;
      },
      onRemove(root) {
        root?.unmount();
      },
    });
    ui.mount();
  },
});
