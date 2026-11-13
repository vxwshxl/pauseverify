import { API_URL, type BgMessage } from "@/utils/api";

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((msg: BgMessage, sender, sendResponse) => {
    if (msg.type === "api") {
      fetch(API_URL + msg.path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(msg.body) })
        .then(async (r) => {
          const data = await r.json().catch(() => ({}));
          sendResponse(r.ok ? { ok: true, data } : { ok: false, error: (data as { error?: string }).error || `Request failed (${r.status})` });
        })
        .catch(() => sendResponse({ ok: false, error: "Can’t reach Pause & Verify right now" }));
      return true; // keep the channel open for the async reply
    }
    if (msg.type === "capture") {
      const windowId = sender.tab?.windowId;
      browser.tabs
        .captureVisibleTab(windowId ?? browser.windows.WINDOW_ID_CURRENT, { format: "png" })
        .then((dataUrl) => sendResponse({ ok: true, dataUrl }))
        .catch((e) => sendResponse({ ok: false, error: String(e) }));
      return true;
    }
    if (msg.type === "fetchImage") {
      // Images on other sites can't be read from the page (CORS); the worker can fetch them.
      fetch(msg.url)
        .then(async (r) => {
          const blob = await r.blob();
          const bytes = new Uint8Array(await blob.arrayBuffer());
          let bin = "";
          for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
          sendResponse({ ok: true, dataUrl: `data:${blob.type || "image/png"};base64,${btoa(bin)}` });
        })
        .catch((e) => sendResponse({ ok: false, error: String(e) }));
      return true;
    }
  });

  // Right-click → "Check with Pause & Verify" on selected text, links and images.
  browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({ id: "pv-check", title: "Check with Pause & Verify", contexts: ["selection", "link", "image"] });
  });
  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== "pv-check" || !tab?.id) return;
    browser.tabs.sendMessage(tab.id, { type: "check", text: info.selectionText, link: info.linkUrl, image: info.srcUrl });
  });

  browser.commands.onCommand.addListener((command, tab) => {
    if (command === "look" && tab?.id) browser.tabs.sendMessage(tab.id, { type: "look" });
  });
});
