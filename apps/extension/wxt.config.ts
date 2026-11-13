import { defineConfig } from "wxt";

// See https://wxt.dev/api/reference/wxt/interfaces/inlineconfig.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Pause & Verify",
    description: "A calm second opinion on suspicious messages — spots scam warning signs right where they appear, and shows you how to check safely.",
    // <all_urls>: read messages on any site, screenshot the tab for "Look", and call our API.
    permissions: ["storage", "contextMenus", "activeTab"],
    host_permissions: ["<all_urls>"],
    web_accessible_resources: [{ resources: ["fonts/*"], matches: ["<all_urls>"] }],
    action: { default_title: "Pause & Verify" },
    commands: {
      look: { suggested_key: { default: "Alt+Shift+L" }, description: "Look at part of the screen" },
    },
  },
});
