import {
  BACKUP_WISP, COLOR_TOKENS, ENGINES, THEMES, hexLuminance, readableInk, toUrl, validateWisp,
} from "./shared.js";
const $ = (id) => document.getElementById(id);
const KEY = "ojjyproxy-app-v1";
const defaults = {
  engine: "sj-1.1.0",
  search: "duckduckgo",
  style: "pill",
  theme: "default",
  transport: "epoxy",
  wisp: "",
  layout: "top",
  cursor: "system",
  font: "system",
  accentColor: "",
  accentOverride: false,
  radius: "medium",
  motion: "full",
  glass: "none",
  pattern: "plain",
  panicKey: "",
  panicUrl: "",
  title: "",
  icon: "",
  notifications: true,
  performance: false,
  history: true,
  autocomplete: true,
  restore: true,
  captureWindows: true,
  discreet: false,
  blocked: "",
};
let saved = {};
try {
  saved = JSON.parse(localStorage.getItem(KEY) || "{}");
} catch { /* Recover from corrupt local data. */ }
let settings = { ...defaults, ...saved.settings };
if (!ENGINES.some((engine) => engine.id === settings.engine)) settings.engine = defaults.engine;
if (!THEMES.some((theme) => theme.id === settings.theme) && settings.theme !== "custom") {
  settings.theme = defaults.theme;
}
if (typeof settings.discreet !== "boolean") settings.discreet = false;
let bookmarks = Array.isArray(saved.bookmarks)
  ? saved.bookmarks.filter((item) => item && /^https?:\/\//.test(item.url))
  : [
    {
      id: crypto.randomUUID(),
      name: "Wikipedia",
      url: "https://www.wikipedia.org/",
      favorite: true,
      added: Date.now(),
    },
    {
      id: crypto.randomUUID(),
      name: "DuckDuckGo",
      url: "https://duckduckgo.com/",
      favorite: true,
      added: Date.now(),
    },
    {
      id: crypto.randomUUID(),
      name: "GitHub",
      url: "https://github.com/",
      favorite: false,
      added: Date.now(),
    },
  ];
let visits = Array.isArray(saved.visits) ? saved.visits.slice(0, 500) : [];
let registry = {}, configuration, activeId, sort = "favorite", libraryType, toastTimer;
const tabs = [], logs = [];
function persist() {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        settings,
        bookmarks,
        visits,
        tabs: settings.restore
          ? tabs.map(({ id, title, url, engine }) => ({ id, title, url, engine }))
          : [],
        activeId,
      }),
    );
  } catch {
    notify("This browser could not save local data.");
  }
}
function notify(text) {
  $("toast").textContent = text;
  $("toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    $("toast").hidden = true;
  }, 4200);
}
function log(type, message) {
  logs.unshift({
    time: new Date().toLocaleTimeString(),
    type,
    message: String(message).slice(0, 1000),
  });
  logs.length = Math.min(logs.length, 120);
  if ($("library").open && libraryType === "tools") renderLibrary();
}
function active() {
  return tabs.find((tab) => tab.id === activeId);
}
function label(engine) {
  return ENGINES.find((item) => item.id === engine)?.short || engine;
}
function button(text, handler, className = "") {
  const node = document.createElement("button");
  node.type = "button";
  node.textContent = text;
  node.className = className;
  node.addEventListener("click", handler);
  return node;
}
const HUB_BLUE = THEMES[0].colors;
const FONT_STACKS = {
  system: "",
  segoe: "'Segoe UI',system-ui,-apple-system,sans-serif",
  arial: "Arial,Helvetica,sans-serif",
  verdana: "Verdana,Geneva,sans-serif",
  georgia: "Georgia,'Times New Roman',serif",
  times: "'Times New Roman',Times,serif",
  mono: "ui-monospace,'Cascadia Mono',Menlo,Consolas,monospace",
  rounded: "'Comic Sans MS','Comic Sans','Chalkboard SE',cursive",
  palatino: "'Palatino Linotype','Iowan Old Style',Palatino,'Book Antiqua',Georgia,serif",
  avenir: "'Avenir Next','Avenir','Futura','Century Gothic','Segoe UI',sans-serif",
  handwriting: "'Segoe Script','Bradley Hand','Brush Script MT',cursive",
  courier: "'Courier New',Courier,'Nimbus Mono PS',monospace",
};
const RADIUS_MAP = { sharp: "0px", soft: "8px", medium: "12px", round: "16px", extra: "22px" };
const MOTION_LEVELS = ["full", "subtle", "off"];
const GLASS_LEVELS = ["none", "subtle", "full"];
const PATTERN_LEVELS = ["plain", "dots", "grid", "aurora"];
// Accent-tinted cursor shapes, drawn as SVG data URIs with the live palette.
const CURSOR_SHAPES = {
  dot: {
    hotspot: [9, 9],
    svg: (accent, ink) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><circle cx="9" cy="9" r="5.5" fill="none" stroke="${accent}" stroke-width="2"/><circle cx="9" cy="9" r="1.7" fill="${accent}"/></svg>`,
  },
  lunar: {
    hotspot: [3, 3],
    svg: (accent) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M14 2a8.5 8.5 0 1 0 4 15.9A7 7 0 0 1 14 2z" fill="${accent}"/></svg>`,
  },
  ring: {
    hotspot: [9, 9],
    svg: (accent, ink) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><circle cx="9" cy="9" r="6" fill="none" stroke="${accent}" stroke-width="2.5"/><circle cx="9" cy="9" r="1.4" fill="${ink}"/></svg>`,
  },
  diamond: {
    hotspot: [10, 10],
    svg: (accent, ink) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M10 1 19 10 10 19 1 10z" fill="${accent}"/><path d="M10 7 13 10 10 13 7 10z" fill="${ink}"/></svg>`,
  },
  star: {
    hotspot: [10, 10],
    svg: (accent, ink) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M10 1.5 12.4 7.2 18.5 7.8 14 12l1.4 6L10 15l-5.4 3L6 12 1.5 7.8 7.6 7.2z" fill="${accent}"/><circle cx="10" cy="10" r="1.5" fill="${ink}"/></svg>`,
  },
};
function liveColor(name, fallback) {
  const value = getComputedStyle(document.body).getPropertyValue(name).trim();
  return /^#[\da-f]{6}$/i.test(value) ? value : fallback;
}
function applyPalette() {
  const root = document.documentElement;
  const theme = THEMES.find((item) => item.id === settings.theme);
  const colors = settings.theme === "custom"
    ? { ...HUB_BLUE, ...(settings.customColors || {}) }
    : theme?.colors || HUB_BLUE;
  for (const token of COLOR_TOKENS) {
    if (/^#[\da-f]{6}$/i.test(colors[token] || "")) root.style.setProperty("--" + token, colors[token]);
  }
  root.style.setProperty(
    "--glow",
    theme ? theme.glow : "color-mix(in srgb, var(--text) 8%, var(--bg))",
  );
  document.body.dataset.theme = settings.theme;
  document.body.dataset.scheme = settings.theme === "custom"
    ? (hexLuminance(colors.bg) > 0.4 ? "light" : "dark")
    : theme?.scheme || "dark";
  document.querySelector('meta[name="theme-color"]').content = colors.bg;
}
function applyAccent() {
  const root = document.documentElement;
  if (settings.accentOverride && /^#[\da-f]{6}$/i.test(settings.accentColor || "")) {
    root.style.setProperty("--accent", settings.accentColor);
  }
  const accent = liveColor("--accent", HUB_BLUE.accent);
  root.style.setProperty("--accent-ink", readableInk(accent));
  applyCursor();
}
function cursorSelector(value) {
  return `body[data-cursor=${settings.cursor}],body[data-cursor=${settings.cursor}] button,body[data-cursor=${settings.cursor}] a,body[data-cursor=${settings.cursor}] label,body[data-cursor=${settings.cursor}] select,body[data-cursor=${settings.cursor}] summary{cursor:${value}}`;
}
function applyCursor() {
  document.body.dataset.cursor = settings.cursor;
  const style = document.getElementById("cursor-style");
  const shape = CURSOR_SHAPES[settings.cursor];
  if (settings.cursor === "system") {
    style?.remove();
    return;
  }
  let css = "";
  if (settings.cursor === "custom") {
    if (!settings.customCursor) {
      style?.remove();
      return;
    }
    css = cursorSelector(`url("${settings.customCursor.replace(/"/g, "")}") 0 0,auto`);
  } else if (settings.cursor === "crosshair") css = cursorSelector("crosshair");
  else if (shape) {
    const svg = shape.svg(liveColor("--accent", HUB_BLUE.accent), liveColor("--accent-ink", "#ffffff"));
    css = cursorSelector(
      `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${shape.hotspot.join(" ")},auto`,
    );
  } else {
    style?.remove();
    return;
  }
  const node = style || document.createElement("style");
  node.id = "cursor-style";
  node.textContent = css;
  if (!style) document.head.append(node);
}
function applyFont() {
  const root = document.documentElement;
  const stack = FONT_STACKS[settings.font] || "";
  if (stack) root.style.setProperty("--app-font", stack);
  else root.style.removeProperty("--app-font");
}
function applyRadius() {
  document.documentElement.style.setProperty("--radius", RADIUS_MAP[settings.radius] || RADIUS_MAP.medium);
}
function applyMotion() {
  document.body.dataset.motion = MOTION_LEVELS.includes(settings.motion) ? settings.motion : "full";
}
function applyGlass() {
  document.body.dataset.glass = GLASS_LEVELS.includes(settings.glass) ? settings.glass : "none";
}
function applyPattern() {
  document.body.dataset.pattern = PATTERN_LEVELS.includes(settings.pattern)
    ? settings.pattern
    : "plain";
}
function panicExit() {
  // Immediate exit: replace() keeps the proxy out of the tab's history.
  window.location.replace(settings.panicUrl || "https://www.google.com/");
}
function syncCustomColorsVisibility() {
  $("custom-colors").hidden = $("settings-form").elements.namedItem("theme").value !== "custom";
}
function syncCursorVisibility() {
  $("cursor-url-row").hidden = $("settings-form").elements.namedItem("cursor").value !== "custom";
}
function setTheme() {
  applyPalette();
  applyAccent();
  applyFont();
  applyRadius();
  applyMotion();
  applyGlass();
  applyPattern();
  document.body.dataset.layout = settings.layout === "sidebar" ? "sidebar" : "top";
  document.body.classList.toggle("performance", settings.performance);
  $("browser").classList.toggle("docked", settings.style === "docked");
  document.title = settings.title || "ojjyProxy";
  const icon = document.querySelector("link[rel=icon]");
  try {
    icon.href = settings.icon && ["https:", "http:"].includes(new URL(settings.icon).protocol)
      ? settings.icon
      : "/icon.svg";
  } catch {
    icon.href = "/icon.svg";
  }
  $("default-engine").textContent = ENGINES.find((engine) => engine.id === settings.engine).label;
  // Discreet input masks what you type so shared-screen monitoring only sees dots.
  for (const id of ["address", "home-input"]) {
    $(id).type = settings.discreet ? "password" : "text";
  }
}
function newTab(url = "", engine = settings.engine, select = true, restore = null) {
  if (tabs.length >= 20) return notify("Close a tab before opening more (20-tab limit).");
  const tab = {
    id: restore?.id || crypto.randomUUID(),
    title: restore?.title || "new tab",
    url,
    engine,
    iframe: null,
    token: null,
    ready: false,
    state: "home",
    pending: "",
    error: "",
    recordedUrl: "",
  };
  tabs.push(tab);
  if (select) selectTab(tab.id);
  else renderTabs();
  persist();
  return tab;
}
function selectTab(id) {
  const tab = tabs.find((item) => item.id === id);
  if (!tab) return;
  activeId = id;
  for (const item of tabs) if (item.iframe) item.iframe.hidden = item.id !== id || !tab.url;
  $("home").hidden = !!tab.url;
  $("browser").hidden = !tab.url;
  $("address").value = tab.url;
  $("browser-error").hidden = !tab.error;
  $("error-backup").hidden = !tab.error || settings.wisp === BACKUP_WISP;
  $("error-message").textContent = tab.error;
  $("stall-notice").hidden = !tab.stalled;
  $("address-suggestions").hidden = true;
  $("error-context").textContent = tab.url ? `${label(tab.engine)} · ${tab.url}` : "";
  $("browser-status").textContent = `${label(tab.engine)} · ${
    tab.state === "home" ? "ready to browse" : tab.state
  }`;
  $("nav-bookmark").classList.toggle("starred", bookmarks.some((item) => item.url === tab.url));
  $("address-form").classList.toggle(
    "loading",
    !!tab.url && (tab.state === "loading" || tab.state === "starting"),
  );
  if (tab.url && !tab.iframe) startRuntime(tab, tab.url);
  renderTabs();
  persist();
}
function renderTabs() {
  const area = $("tabs");
  const grew = tabs.length > renderedTabs;
  renderedTabs = tabs.length;
  area.replaceChildren();
  for (const tab of tabs) {
    const group = document.createElement("div");
    group.className = "tab" + (tab.id === activeId ? " active" : "");
    const select = button("", () => selectTab(tab.id), "tab-select");
    select.setAttribute("role", "tab");
    select.setAttribute("aria-selected", String(tab.id === activeId));
    select.title = tab.url ? `${label(tab.engine)} · ${tab.title}` : "New tab";
    const mark = document.createElement("span");
    mark.className = "dot";
    if (tab.state === "loaded") mark.style.background = "var(--accent)";
    const title = document.createElement("span");
    title.className = "tab-title";
    title.textContent = tab.url ? tab.title : "new tab";
    select.append(mark, title);
    const close = button("", () => closeTab(tab.id), "tab-close");
    close.setAttribute("aria-label", `Close ${tab.title}`);
    close.title = "Close tab";
    close.innerHTML = '<svg aria-hidden="true"><use href="#i-x"/></svg>';
    group.append(select, close);
    attachTabDrag(group, tab.id);
    group.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      showTabMenu(event, tab.id);
    });
    group.addEventListener("auxclick", (event) => {
      // Middle-click closes a tab, like a native browser.
      if (event.button === 1) {
        event.preventDefault();
        closeTab(tab.id);
      }
    });
    area.append(group);
  }
  // Only genuinely new tabs get the pop-in; re-renders of the same set stay still.
  if (grew && area.lastElementChild) area.lastElementChild.classList.add("tab-in");
  updateTabsList();
}
let renderedTabs = 0;
function updateTabsList() {
  $("tabs-list").hidden = tabs.length < 8;
}
function showTabsMenu() {
  const menu = $("tabs-overflow");
  if (!menu.hidden) {
    menu.hidden = true;
    return;
  }
  menu.replaceChildren();
  for (const tab of tabs) {
    const item = button("", () => {
      hideTabsMenu();
      selectTab(tab.id);
    });
    item.textContent = tab.url ? `${label(tab.engine)} · ${tab.title}` : "new tab";
    menu.append(item);
  }
  const anchor = $("tabs-list").getBoundingClientRect();
  menu.hidden = false;
  menu.style.left = `${Math.max(8, Math.min(anchor.left, window.innerWidth - 248))}px`;
  menu.style.top = `${Math.max(8, Math.min(anchor.bottom + 6, window.innerHeight - 248))}px`;
}
function hideTabsMenu() {
  $("tabs-overflow").hidden = true;
}
function attachTabDrag(group, id) {
  // Desktop tab reordering. A short press still selects; only a real drag moves.
  group.draggable = true;
  group.addEventListener("dragstart", (event) => {
    dragId = id;
    event.dataTransfer.effectAllowed = "move";
    group.classList.add("dragging");
  });
  group.addEventListener("dragover", (event) => {
    if (!dragId || dragId === id) return;
    event.preventDefault();
    group.classList.add("drag-over");
  });
  group.addEventListener("dragleave", () => group.classList.remove("drag-over"));
  group.addEventListener("drop", (event) => {
    event.preventDefault();
    group.classList.remove("drag-over");
    if (dragId && dragId !== id) reorderTab(dragId, id);
    dragId = null;
  });
  group.addEventListener("dragend", () => {
    group.classList.remove("dragging", "drag-over");
    dragId = null;
  });
}
let dragId = null;
function reorderTab(fromId, beforeId) {
  const from = tabs.findIndex((item) => item.id === fromId);
  const before = tabs.findIndex((item) => item.id === beforeId);
  if (from < 0 || before < 0 || from === before) return;
  const [moved] = tabs.splice(from, 1);
  tabs.splice(before, 0, moved);
  renderTabs();
  persist();
}
function duplicateTab(id) {
  const source = tabs.find((item) => item.id === id);
  if (!source?.url) return;
  const opened = newTab("", source.engine);
  if (opened) navigate(source.url, opened);
}
function showTabMenu(event, id) {
  const menu = $("context-menu");
  menu.dataset.tabId = id;
  menu.hidden = false;
  const spacing = 8;
  const width = 180;
  const left = Math.min(event.clientX, window.innerWidth - width - spacing);
  menu.style.left = `${left}px`;
  menu.style.top = `${Math.min(event.clientY, window.innerHeight - 150)}px`;
}
function hideTabMenu() {
  $("context-menu").hidden = true;
}
function menuAction(handler) {
  return () => {
    hideTabMenu();
    handler($("context-menu").dataset.tabId);
  };
}
function destroyRuntime(tab) {
  clearTimeout(tab.timer);
  clearTimeout(tab.stallTimer);
  tab.stalled = false;
  tab.iframe?.remove();
  tab.iframe = null;
  tab.ready = false;
  tab.token = null;
}
function closeTab(id) {
  const index = tabs.findIndex((item) => item.id === id);
  if (index < 0) return;
  const closed = tabs[index];
  destroyRuntime(closed);
  tabs.splice(index, 1);
  // Remember the address so a slip of the mouse is recoverable.
  if (closed.url) {
    closedTabs.unshift({ title: closed.title, url: closed.url, engine: closed.engine });
    closedTabs.length = Math.min(closedTabs.length, 10);
  }
  updateReopen();
  if (!tabs.length) newTab();
  else if (activeId === id) selectTab(tabs[Math.min(index, tabs.length - 1)].id);
  else renderTabs();
  persist();
}
const closedTabs = [];
function updateReopen() {
  $("reopen-tab").hidden = !closedTabs.length;
}
function reopenTab() {
  const saved = closedTabs.shift();
  updateReopen();
  if (!saved) return;
  const opened = newTab("", saved.engine);
  if (opened) navigate(saved.url, opened);
}
function errorTab(tab, message) {
  clearTimeout(tab.timer);
  clearTimeout(tab.stallTimer);
  tab.stalled = false;
  tab.state = "error";
  tab.error = message;
  log("error", `${tab.engine}: ${message}`);
  if (settings.notifications) notify(`${label(tab.engine)}: ${message}`);
  if (tab.id === activeId) selectTab(tab.id);
  else renderTabs();
}
function command(tab, action, data = {}) {
  if (!tab?.ready || !tab.iframe) return;
  tab.iframe.contentWindow.postMessage(
    { source: "ojjy-shell", token: tab.token, action, ...data },
    registry[tab.engine],
  );
}
function startRuntime(tab, target) {
  const origin = registry[tab.engine];
  if (!origin) {
    return errorTab(
      tab,
      `The ${
        label(tab.engine)
      } runtime origin has not been configured. Set RUNTIME_ORIGINS on your Deno website.`,
    );
  }
  if (!settings.wisp) {
    return errorTab(tab, "Set your own Wisp relay address in Settings before browsing.");
  }
  try {
    validateWisp(settings.wisp, location.protocol === "https:");
  } catch (error) {
    return errorTab(tab, error.message);
  }
  destroyRuntime(tab);
  tab.state = "starting";
  tab.error = "";
  tab.pending = target;
  tab.token = crypto.randomUUID();
  const url = new URL("/runtime/index.html", origin);
  url.searchParams.set("parent", location.origin);
  url.searchParams.set("token", tab.token);
  url.searchParams.set("wisp", settings.wisp);
  url.searchParams.set("transport", settings.transport);
  url.searchParams.set("capture", String(settings.captureWindows));
  url.searchParams.set("blocked", settings.blocked);
  const iframe = document.createElement("iframe");
  iframe.className = "runtime-frame";
  iframe.title = `${label(tab.engine)} runtime`;
  iframe.setAttribute(
    "allow",
    "fullscreen; clipboard-read; clipboard-write",
  );
  iframe.allowFullscreen = true;
  iframe.src = url.href;
  iframe.hidden = tab.id !== activeId;
  tab.iframe = iframe;
  $("runtime-frames").append(iframe);
  tab.timer = setTimeout(
    () =>
      errorTab(
        tab,
        "Runtime startup timed out. Check its domain, headers, service worker, and your relay settings.",
      ),
    30000,
  );
  log("startup", `${tab.engine} · ${origin}`);
}
function navigate(input, tab = active()) {
  let url;
  try {
    url = toUrl(input, settings.search);
  } catch (error) {
    return notify(error.message);
  }
  tab.url = url;
  tab.title = new URL(url).hostname;
  tab.error = "";
  tab.state = "loading";
  clearTimeout(tab.stallTimer);
  tab.stalled = false;
  tab.stallTimer = setTimeout(() => {
    // A slow page stays "loading"; this notice offers a real choice instead of
    // pretending the navigation finished or failed.
    if (tab.state === "loading") {
      tab.stalled = true;
      $("stall-context").textContent = `${label(tab.engine)} · ${tab.url}`;
      if (tab.id === activeId) $("stall-notice").hidden = false;
    }
  }, 15000);
  if (!tab.iframe) startRuntime(tab, url);
  else if (tab.ready) command(tab, "navigate", { url });
  else tab.pending = url;
  selectTab(tab.id);
  showControls(true);
  log("navigate", url);
  persist();
}
window.addEventListener("message", (event) => {
  const data = event.data;
  if (data?.source !== "ojjy-runtime") return;
  const tab = tabs.find((item) =>
    item.iframe?.contentWindow === event.source && item.token === data.token &&
    registry[item.engine] === event.origin
  );
  if (!tab) return;
  if (data.type === "ready") {
    clearTimeout(tab.timer);
    tab.ready = true;
    tab.state = "ready";
    log("ready", `${tab.engine} · crossOriginIsolated=${data.isolated}`);
    if (tab.pending) {
      command(tab, "navigate", { url: tab.pending });
      tab.pending = "";
    }
  } else if (data.type === "error") errorTab(tab, data.message);
  else if (data.type === "loading") {
    tab.state = "loading";
    tab.error = "";
  } else if (data.type === "popup") {
    if (settings.captureWindows && /^https?:\/\//.test(data.url)) {
      const opened = newTab("", tab.engine);
      if (opened) navigate(data.url, opened);
    }
  } else if (data.type === "loaded" || data.type === "navigation") {
    try {
      if (!["http:", "https:"].includes(new URL(data.url).protocol)) return;
    } catch {
      return;
    }
    clearTimeout(tab.stallTimer);
    tab.stalled = false;
    const changed = tab.url !== data.url || tab.title !== data.title;
    tab.url = data.url;
    tab.title = String(data.title || new URL(data.url).hostname).slice(0, 160);
    if (data.type === "loaded") {
      tab.state = "loaded";
      log("loaded", `${tab.engine} · ${tab.url}`);
      // Track real most-recently-opened order for bookmark sorting.
      const saved = bookmarks.find((item) => item.url === tab.url);
      if (saved && saved.lastOpenedAt !== Date.now()) {
        saved.lastOpenedAt = Date.now();
        persist();
      }
    }
    if (settings.history && tab.state === "loaded" && tab.recordedUrl !== tab.url) {
      visits.unshift({
        id: crypto.randomUUID(),
        url: tab.url,
        title: tab.title,
        engine: tab.engine,
        time: Date.now(),
      });
      visits = visits.slice(0, 500);
      tab.recordedUrl = tab.url;
      persist();
    }
    if (changed) {
      renderTabs();
      persist();
    }
    if (tab.id === activeId && document.activeElement !== $("address")) {
      $("address").value = tab.url;
    }
  } else if (data.type === "cache-cleared") {
    notify("Active runtime cache cleared. Website cookies are unchanged.");
  }
  if (tab.id === activeId) {
    $("browser-status").textContent = `${label(tab.engine)} · ${tab.state}`;
    $("nav-bookmark").classList.toggle("starred", bookmarks.some((item) => item.url === tab.url));
    $("browser-error").hidden = !tab.error;
    $("error-backup").hidden = !tab.error || settings.wisp === BACKUP_WISP;
    $("stall-notice").hidden = !tab.stalled;
    $("address-form").classList.toggle(
      "loading",
      tab.url && (tab.state === "loading" || tab.state === "starting"),
    );
  }
});
function renderShortcuts() {
  const grid = $("shortcut-grid");
  grid.replaceChildren();
  const items = [...bookmarks];
  if (sort === "az") items.sort((a, b) => a.name.localeCompare(b.name));
  // "Recent" means most recently opened, falling back to when it was added.
  else if (sort === "recent") {
    items.sort((a, b) => (b.lastOpenedAt ?? b.added ?? 0) - (a.lastOpenedAt ?? a.added ?? 0));
  } else items.sort((a, b) => Number(b.favorite) - Number(a.favorite));
  for (const item of items) {
    const card = button("", () => navigate(item.url), "shortcut-card");
    const icon = document.createElement("span");
    icon.className = "site-icon";
    icon.textContent = (item.name || "?").slice(0, 1).toUpperCase();
    const name = document.createElement("span");
    name.className = "site-name";
    name.textContent = item.name;
    const domain = document.createElement("small");
    domain.textContent = new URL(item.url).hostname;
    card.append(icon, name, domain);
    if (item.favorite) {
      const star = document.createElement("span");
      star.className = "card-star";
      star.innerHTML = '<svg aria-hidden="true"><use href="#i-star"/></svg>';
      card.append(star);
    }
    grid.append(card);
  }
  const add = button("", () => editBookmark(), "shortcut-card add-card");
  const plus = document.createElement("span");
  plus.className = "site-icon";
  plus.innerHTML = '<svg aria-hidden="true"><use href="#i-plus"/></svg>';
  const text = document.createElement("span");
  text.className = "site-name";
  text.textContent = "add a shortcut";
  const sub = document.createElement("small");
  sub.textContent = "a place worth coming back to";
  add.append(plus, text, sub);
  grid.append(add);
}
function dayLabel(time) {
  const date = new Date(time);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "today";
  if (date.toDateString() === yesterday.toDateString()) return "yesterday";
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}
function editBookmark(item = null) {
  const form = $("bookmark-form");
  form.reset();
  form.dataset.editId = item?.id || "";
  form.elements.name.value = item?.name || (active()?.url ? active().title : "");
  form.elements.url.value = item?.url || active()?.url || "";
  form.elements.favorite.checked = item?.favorite ?? true;
  form.elements.folder.value = item?.folder || "";
  $("bookmark-error").textContent = "";
  openDialog($("bookmark-dialog"));
}
$("bookmark-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target;
  try {
    const url = new URL(form.elements.url.value);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Use an HTTP or HTTPS address.");
    }
    const id = form.dataset.editId || crypto.randomUUID();
    const item = {
      id,
      name: form.elements.name.value.trim() || url.hostname,
      url: url.href,
      folder: form.elements.folder.value.trim().slice(0, 40),
      favorite: form.elements.favorite.checked,
      added: Date.now(),
    };
    const index = bookmarks.findIndex((entry) => entry.id === id || entry.url === item.url);
    if (index >= 0) bookmarks[index] = item;
    else bookmarks.push(item);
    persist();
    renderShortcuts();
    if ($("library").open) renderLibrary();
    closeDialog($("bookmark-dialog"));
    notify("Bookmark saved.");
  } catch (error) {
    $("bookmark-error").textContent = error.message;
  }
});
function openLibrary(type) {
  libraryType = type;
  $("library-title").textContent = {
    bookmarks: "Bookmarks",
    history: "History",
    tools: "Connection log",
    status: "Connection status",
    about: "About ojjyProxy",
  }[type];
  $("library-filter").value = "";
  $("library-filter").hidden = !["bookmarks", "history"].includes(type);
  $("library-add").hidden = type !== "bookmarks";
  renderLibrary();
  openDialog($("library"));
}
function renderLibrary() {
  const container = $("library-content");
  container.replaceChildren();
  const filter = $("library-filter").value.toLowerCase();
  if (libraryType === "about") {
    const copy = document.createElement("div");
    copy.className = "about-copy";
    copy.innerHTML =
      '<h3>one browser. your connection.</h3><p>ojjyProxy is a standalone project by Jonas Lee, matching ojjy’s game hub blue. It combines four pinned Scramjet releases and Ultraviolet with an operator-owned Wisp relay.</p><p>Primary integration reference: Proxy2, shared by The Fool, who also helped with the UI. Engines and transports: Mercury Workshop and Titanium Network. Tabs, bookmarks, settings and history are saved on this browser.</p><p><strong>massive credits to The Fool</strong> — without him any of this wouldn’t be possible. he walked me through the whole process and made this project come to life. ❤️</p><p><a href="https://github.com/jo-jo-home/ojjyProxy" target="_blank" rel="noopener noreferrer">project source & full blueprint ↗</a> · <a href="/asset-manifest.json" target="_blank" rel="noopener noreferrer">asset versions & hashes ↗</a></p><p>Changing a tab title is cosmetic. Disabling local history does not erase browser history, relay metadata, or website cookies. Older alpha releases are compatibility experiments.</p>';
    container.append(copy);
    return;
  }
  if (libraryType === "tools") {
    const note = document.createElement("p");
    note.className = "field-note";
    note.textContent =
      "Bounded, in-memory shell events (120 maximum). This is not a complete website request inspector.";
    container.append(note);
    for (const item of logs) {
      const row = document.createElement("div");
      row.className = "log-line";
      row.textContent = `${item.time} [${item.type}] ${item.message}`;
      container.append(row);
    }
    if (!logs.length) container.append(button("no connection events yet", () => {}));
    return;
  }
  if (libraryType === "status") {
    // Live checks run when the panel opens; nothing here contacts destinations.
    const relayRow = document.createElement("div");
    relayRow.className = "status-row";
    const relayName = document.createElement("span");
    relayName.textContent = "owned relay";
    const relayState = document.createElement("span");
    relayState.textContent = settings.wisp || configuration?.wisp || "not configured";
    relayRow.append(
      relayName,
      relayState,
      button("check now", async () => {
        relayState.className = "";
        relayState.textContent = "connecting…";
        try {
          relayState.textContent = await probeRelay(settings.wisp || configuration?.wisp || "");
          relayState.className = "ok";
        } catch (error) {
          relayState.textContent = error.message;
          relayState.className = "bad";
        }
      }),
    );
    container.append(relayRow);
    for (const engine of ENGINES) {
      const origin = registry[engine.id];
      const row = document.createElement("div");
      row.className = "status-row";
      const name = document.createElement("span");
      name.textContent = engine.short;
      const state = document.createElement("span");
      if (!origin) {
        state.textContent = "not configured";
        state.className = "bad";
      } else {
        state.textContent = "checking…";
        fetch(new URL("/health", origin).href, { signal: AbortSignal.timeout(6000) })
          .then((response) => response.json())
          .then((data) => {
            state.textContent = `reachable · ${data.role}`;
            state.className = "ok";
          })
          .catch(() => {
            state.textContent = "unreachable";
            state.className = "bad";
          });
      }
      row.append(name, state);
      container.append(row);
    }
    const errors = logs.filter((entry) => entry.type === "error").slice(0, 5);
    if (errors.length) {
      const heading = document.createElement("div");
      heading.className = "library-day";
      heading.textContent = "recent errors";
      container.append(heading);
      for (const entry of errors) {
        const line = document.createElement("div");
        line.className = "log-line";
        line.textContent = `${entry.time} ${entry.message}`;
        container.append(line);
      }
    }
    return;
  }
  const items = (libraryType === "bookmarks" ? bookmarks : visits).filter((item) =>
    `${item.name || item.title} ${item.url} ${item.folder || ""}`.toLowerCase().includes(filter)
  );
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "library-empty";
    const icon = document.createElement("span");
    icon.className = "empty-icon";
    icon.innerHTML = `<svg aria-hidden="true"><use href="#i-${
      libraryType === "bookmarks" ? "star" : "clock"
    }"/></svg>`;
    const message = document.createElement("p");
    message.textContent = libraryType === "bookmarks"
      ? "no saved sites here yet."
      : "no local visits here yet.";
    empty.append(icon, message);
    container.append(empty);
  }
  let lastDay = "";
  let lastFolder = "";
  const grouped = libraryType === "bookmarks";
  const folders = new Map();
  if (grouped) {
    for (const item of items) {
      const folder = item.folder?.trim() || "";
      if (!folders.has(folder)) folders.set(folder, []);
      folders.get(folder).push(item);
    }
  }
  const folderNames = grouped
    ? [...folders.keys()].sort((a, b) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b)))
    : [];
  for (const folder of grouped ? folderNames : [""]) {
    if (grouped && folder && folder !== lastFolder) {
      lastFolder = folder;
      const folderHeading = document.createElement("div");
      folderHeading.className = "library-day";
      folderHeading.textContent = folder;
      container.append(folderHeading);
    }
    for (const item of grouped ? folders.get(folder) : items) {
      if (libraryType === "history") {
        const day = dayLabel(item.time);
        if (day !== lastDay) {
          lastDay = day;
          const heading = document.createElement("div");
          heading.className = "library-day";
          const dayName = document.createElement("span");
          dayName.textContent = day;
          heading.append(
            dayName,
            button("clear day", () => {
              visits = visits.filter((entry) => dayLabel(entry.time) !== day);
              persist();
              renderLibrary();
            }, "day-clear"),
          );
          container.append(heading);
        }
      }
      const row = document.createElement("div");
      row.className = "library-row";
      const open = button("", () => {
        closeDialog($("library"));
        navigate(item.url);
      }, "row-open");
      const title = document.createElement("strong");
      title.textContent = item.name || item.title;
      const domain = document.createElement("small");
      domain.textContent = item.url +
        (item.time ? ` · ${new Date(item.time).toLocaleTimeString()}` : "");
      open.append(title, domain);
      row.append(open);
      if (libraryType === "history" && item.engine) {
        const chip = document.createElement("span");
        chip.className = "engine-chip";
        chip.textContent = label(item.engine);
        row.append(chip);
      }
      if (libraryType === "bookmarks") {
        const favorite = button("", () => {
          item.favorite = !item.favorite;
          persist();
          renderLibrary();
          renderShortcuts();
        }, "star-btn" + (item.favorite ? " starred" : ""));
        favorite.title = item.favorite ? "Remove from favourites" : "Add to favourites";
        favorite.innerHTML = '<svg aria-hidden="true"><use href="#i-star"/></svg>';
        row.append(favorite);
        row.append(button("edit", () => editBookmark(item)));
      }
      row.append(button("remove", () => {
        if (libraryType === "bookmarks") {
          bookmarks = bookmarks.filter((entry) => entry.id !== item.id);
        } else visits = visits.filter((entry) => entry.id !== item.id);
        persist();
        renderLibrary();
        renderShortcuts();
      }, "danger"));
      container.append(row);
    }
  }
}
function openSettings() {
  const form = $("settings-form");
  for (const [key, value] of Object.entries(settings)) {
    const field = form.elements.namedItem(key);
    if (!field) continue;
    if (field.type === "checkbox") field.checked = !!value;
    else field.value = value;
  }
  // Prefill the color editor with the active palette so switching to Custom
  // starts from what is on screen, and prefill the cursor URL field.
  const computed = getComputedStyle(document.body);
  for (const token of COLOR_TOKENS) {
    form.elements.namedItem("color-" + token).value = settings.customColors?.[token] ||
      computed.getPropertyValue("--" + token).trim() || HUB_BLUE[token];
  }
  form.elements.namedItem("customCursor").value = settings.customCursor || "";
  form.elements.namedItem("accentColor").value = settings.accentOverride && settings.accentColor
    ? settings.accentColor
    : liveColor("--accent", HUB_BLUE.accent);
  form.elements.namedItem("themeCode").value = "";
  syncCustomColorsVisibility();
  syncCursorVisibility();
  $("settings-message").textContent = "changes apply when saved";
  openDialog($("settings"));
}
function readSettings() {
  const form = $("settings-form");
  const result = { ...settings };
  for (const key of Object.keys(defaults)) {
    const field = form.elements.namedItem(key);
    result[key] = field.type === "checkbox" ? field.checked : field.value.trim();
  }
  if (result.wisp) result.wisp = validateWisp(result.wisp, location.protocol === "https:");
  if (result.icon && !["http:", "https:"].includes(new URL(result.icon).protocol)) {
    throw new Error("Icon URL must use HTTP or HTTPS.");
  }
  result.customCursor = form.elements.namedItem("customCursor").value.trim();
  if (result.cursor === "custom") {
    if (!result.customCursor) throw new Error("Enter a cursor image URL for the custom cursor.");
    const cursorUrl = new URL(result.customCursor);
    if (!["http:", "https:"].includes(cursorUrl.protocol)) {
      throw new Error("Cursor image URL must use HTTP or HTTPS.");
    }
    result.customCursor = cursorUrl.href;
  } else delete result.customCursor;
  if (result.theme === "custom") {
    result.customColors = {};
    for (const token of COLOR_TOKENS) {
      const value = form.elements.namedItem("color-" + token).value;
      if (!/^#[\da-f]{6}$/i.test(value)) throw new Error("Choose a color for every custom slot.");
      result.customColors[token] = value;
    }
  } else delete result.customColors;
  if (result.panicUrl && !["http:", "https:"].includes(new URL(result.panicUrl).protocol)) {
    throw new Error("Panic cover site must be an HTTP or HTTPS address.");
  }
  const domains = result.blocked.split(/\s+/).filter(Boolean);
  if (
    domains.some((host) =>
      !/^(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)*[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(host)
    )
  ) throw new Error("Blocked domains must be hostnames, without paths or URLs.");
  result.blocked = domains.map((host) => host.toLowerCase()).join("\n");
  result.accentColor = result.accentOverride ? (result.accentColor || "") : "";
  if (result.accentOverride && !/^#[\da-f]{6}$/i.test(result.accentColor)) {
    throw new Error("Choose a valid accent color, or turn the override off.");
  }
  if (!Object.keys(RADIUS_MAP).includes(result.radius)) result.radius = defaults.radius;
  if (!MOTION_LEVELS.includes(result.motion)) result.motion = defaults.motion;
  if (!GLASS_LEVELS.includes(result.glass)) result.glass = defaults.glass;
  if (!PATTERN_LEVELS.includes(result.pattern)) result.pattern = defaults.pattern;
  return result;
}
$("settings-form").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    settings = readSettings();
    persist();
    setTheme();
    closeDialog($("settings"));
    notify("Settings saved. Runtime changes apply when a tab is reopened.");
  } catch (error) {
    $("settings-message").textContent = error.message;
  }
});
$("switch-engine").addEventListener("click", () => {
  try {
    settings = readSettings();
    persist();
    setTheme();
    const tab = active();
    if (!tab.url) {
      closeDialog($("settings"));
      return notify("Default engine updated for new tabs.");
    }
    const target = tab.url;
    tab.engine = settings.engine;
    destroyRuntime(tab);
    tab.error = "";
    closeDialog($("settings"));
    navigate(target, tab);
  } catch (error) {
    $("settings-message").textContent = error.message;
  }
});
async function probeRelay(endpoint) {
  const target = validateWisp(endpoint, location.protocol === "https:");
  let socket, timer;
  try {
    await new Promise((resolve, reject) => {
      socket = new WebSocket(target);
      timer = setTimeout(() => reject(new Error("Connection timed out.")), 8000);
      socket.onopen = resolve;
      socket.onerror = () => reject(new Error("Could not open the WebSocket."));
    });
    return "WebSocket reachable — destination access is tested when browsing.";
  } finally {
    clearTimeout(timer);
    socket?.close();
  }
}
async function testRelay() {
  const result = $("relay-result");
  result.textContent = "connecting…";
  try {
    const message = await probeRelay($("settings-form").elements.wisp.value);
    result.textContent = message;
    log("relay", `WebSocket reachable: ${$("settings-form").elements.wisp.value}`);
  } catch (error) {
    result.textContent = error.message;
    log("relay error", error.message);
  }
}
function showControls(show) {
  $("browser-controls").hidden = !show;
  $("show-controls").hidden = show;
  $("browser").classList.toggle("controls-hidden", !show);
}
function populateEngineOptions(available) {
  const select = $("engine-select");
  const previous = settings.engine;
  select.replaceChildren();
  for (const engine of available) {
    const option = document.createElement("option");
    option.value = engine.id;
    option.textContent = engine.label;
    select.append(option);
  }
  if (available.some((engine) => engine.id === previous)) select.value = previous;
}
function populateThemeOptions() {
  const select = $("settings-form").elements.namedItem("theme");
  select.replaceChildren();
  for (const theme of [...THEMES, { id: "custom", label: "Custom colors" }]) {
    const option = document.createElement("option");
    option.value = theme.id;
    option.textContent = theme.label;
    select.append(option);
  }
  select.value = settings.theme;
}
// Live preview: the address bar masks as soon as the toggle flips.
$("settings-form").elements.namedItem("discreet").addEventListener("change", (event) => {
  for (const id of ["address", "home-input"]) {
    $(id).type = event.target.checked ? "password" : "text";
  }
});
function openDialog(node) {
  // A dialog that is mid-exit must come back fully: drop the closing state.
  node.classList.remove("dialog-closing");
  node.removeAttribute("aria-hidden");
  node.inert = false;
  node.showModal();
}
function closeDialog(node) {
  if (!node?.open) return;
  const still = node.classList.contains("dialog-closing");
  node.classList.remove("dialog-closing");
  if (
    still || settings.performance || settings.motion === "off" ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    node.inert = false;
    node.removeAttribute("aria-hidden");
    node.close();
    return;
  }
  // The exiting dialog keeps its visuals but stops being clickable, focusable
  // or exposed to assistive technology, so nothing can match or use it mid-fade.
  node.inert = true;
  node.setAttribute("aria-hidden", "true");
  node.classList.add("dialog-closing");
  const finish = () => {
    node.classList.remove("dialog-closing");
    node.removeEventListener("animationend", finish);
    node.inert = false;
    node.removeAttribute("aria-hidden");
    node.close();
  };
  node.addEventListener("animationend", finish);
  // Safety net: if the animation is skipped or interrupted, still close.
  setTimeout(() => {
    if (node.open && node.classList.contains("dialog-closing")) finish();
  }, 400);
}
document.querySelectorAll("dialog").forEach((node) =>
  node.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog(node);
  })
);
document.querySelectorAll("[data-close]").forEach((node) =>
  node.addEventListener("click", () => closeDialog(node.closest("dialog")))
);
document.querySelectorAll("[data-panel]").forEach((node) =>
  node.addEventListener("click", () => openLibrary(node.dataset.panel))
);
$("open-help").addEventListener("click", () => openDialog($("help")));
document.querySelectorAll("[data-sort]").forEach((node) =>
  node.addEventListener("click", () => {
    sort = node.dataset.sort;
    document.querySelectorAll("[data-sort]").forEach((button) =>
      button.setAttribute("aria-pressed", String(button === node))
    );
    renderShortcuts();
  })
);
for (
  const id of [
    "global-settings",
    "home-settings",
    "choose-engine",
    "nav-settings",
    "error-settings",
  ]
) $(id).addEventListener("click", openSettings);
$("connection").addEventListener("click", () => openLibrary("status"));
$("tabs-list").addEventListener("click", showTabsMenu);
$("panic").addEventListener("click", panicExit);
$("settings-form").elements.namedItem("theme").addEventListener("change", syncCustomColorsVisibility);
$("settings-form").elements.namedItem("cursor").addEventListener("change", syncCursorVisibility);
$("reset-colors").addEventListener("click", () => {
  const form = $("settings-form");
  for (const token of COLOR_TOKENS) {
    form.elements.namedItem("color-" + token).value = HUB_BLUE[token];
  }
  $("settings-message").textContent = "Colors reset to hub blue. Save settings to apply.";
});
$("match-theme").addEventListener("click", () => {
  const form = $("settings-form");
  form.elements.namedItem("accentColor").value = liveColor("--accent", HUB_BLUE.accent);
  form.elements.namedItem("accentOverride").checked = false;
  $("settings-message").textContent = "Accent follows the theme again. Save settings to apply.";
});
$("shuffle-theme").addEventListener("click", () => {
  const form = $("settings-form");
  const current = form.elements.namedItem("theme").value;
  const pool = THEMES.filter((theme) => theme.id !== current);
  const pick = pool[Math.floor(Math.random() * pool.length)];
  form.elements.namedItem("theme").value = pick.id;
  syncCustomColorsVisibility();
  $("settings-message").textContent = `Theme rolled: ${pick.label}. Save settings to apply.`;
});
function themeCodeFromInputs() {
  const form = $("settings-form");
  const colors = {};
  for (const token of COLOR_TOKENS) colors[token] = form.elements.namedItem("color-" + token).value;
  return btoa(JSON.stringify({ v: 1, colors }));
}
$("export-theme").addEventListener("click", async () => {
  const code = themeCodeFromInputs();
  const field = $("settings-form").elements.namedItem("themeCode");
  field.value = code;
  field.focus();
  field.select();
  try {
    await navigator.clipboard.writeText(code);
    $("settings-message").textContent = "Theme code is in the box and copied. Share it freely.";
  } catch {
    $("settings-message").textContent = "Theme code is in the box — copy it from there.";
  }
});
$("apply-theme").addEventListener("click", () => {
  const form = $("settings-form");
  try {
    const parsed = JSON.parse(atob(form.elements.namedItem("themeCode").value.trim()));
    if (parsed?.v !== 1 || typeof parsed.colors !== "object" || !parsed.colors) {
      throw new Error("bad code");
    }
    const colors = {};
    for (const token of COLOR_TOKENS) {
      const value = String(parsed.colors[token] || "");
      if (!/^#[\da-f]{6}$/i.test(value)) throw new Error("bad code");
      colors[token] = value.toLowerCase();
    }
    form.elements.namedItem("theme").value = "custom";
    syncCustomColorsVisibility();
    for (const token of COLOR_TOKENS) {
      form.elements.namedItem("color-" + token).value = colors[token];
    }
    $("settings-message").textContent = "Theme code applied to the editor. Save settings to apply.";
  } catch {
    $("settings-message").textContent = "That theme code is not valid.";
  }
});
$("settings-form").elements.namedItem("panicKey").addEventListener("keydown", (event) => {
  // Record one non-typing key so the panic trigger never fights normal typing.
  event.preventDefault();
  const key = event.key;
  const acceptable = key === "Backquote" || (/^F(1[0]?|[2-9])$/.test(key) && key !== "F11");
  const field = $("settings-form").elements.namedItem("panicKey");
  field.value = acceptable ? key : "";
  $("settings-message").textContent = acceptable
    ? `Panic key set to ${key}. Save settings to apply.`
    : "Pick a non-typing key: ` (backquote) or F1–F10 (not F11).";
});
$("new-tab").addEventListener("click", () => newTab());
$("reopen-tab").addEventListener("click", reopenTab);
$("cm-duplicate").addEventListener("click", menuAction(duplicateTab));
$("cm-close-others").addEventListener(
  "click",
  menuAction((id) => {
    for (const other of tabs.filter((item) => item.id !== id).map((item) => item.id)) {
      closeTab(other);
    }
    selectTab(id);
    notify("Other tabs closed.");
  }),
);
$("cm-reopen").addEventListener("click", menuAction(() => reopenTab()));
$("cm-close").addEventListener("click", menuAction(closeTab));
document.addEventListener("click", (event) => {
  if (!event.target.closest("#context-menu")) hideTabMenu();
  if (!event.target.closest("#tabs-overflow") && !event.target.closest("#tabs-list")) hideTabsMenu();
});
document.addEventListener("contextmenu", (event) => {
  if (!event.target.closest(".tab")) hideTabMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !$("context-menu").hidden) hideTabMenu();
  if (event.key === "Escape" && !$("tabs-overflow").hidden) hideTabsMenu();
});
$("fullscreen").addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    notify("Fullscreen is not available in this browser.");
  }
});
$("home-form").addEventListener("submit", (event) => {
  event.preventDefault();
  navigate($("home-input").value);
  $("suggestions").hidden = true;
});
$("address-form").addEventListener("submit", (event) => {
  event.preventDefault();
  $("address").blur();
  $("address-suggestions").hidden = true;
  navigate($("address").value);
});
$("nav-home").addEventListener("click", () => {
  const tab = active();
  tab.url = "";
  tab.title = "new tab";
  destroyRuntime(tab);
  tab.error = "";
  tab.state = "home";
  selectTab(tab.id);
});
$("error-home").addEventListener("click", () => $("nav-home").click());
for (const action of ["back", "forward", "reload"]) {
  $("nav-" + action).addEventListener("click", () => command(active(), action));
}
$("nav-bookmark").addEventListener(
  "click",
  () => editBookmark(bookmarks.find((item) => item.url === active().url)),
);
$("nav-collapse").addEventListener("click", () => showControls(false));
$("show-controls").addEventListener("click", () => showControls(true));
$("retry").addEventListener("click", () => {
  const tab = active();
  destroyRuntime(tab);
  navigate(tab.url, tab);
});
$("stall-wait").addEventListener("click", () => {
  $("stall-notice").hidden = true;
});
$("stall-retry").addEventListener("click", () => {
  const tab = active();
  $("stall-notice").hidden = true;
  destroyRuntime(tab);
  navigate(tab.url, tab);
});
$("error-backup").addEventListener("click", () => {
  const tab = active();
  if (!tab?.url) return;
  settings.wisp = BACKUP_WISP;
  persist();
  destroyRuntime(tab);
  tab.error = "";
  navigate(tab.url, tab);
  notify("Switched to the backup relay and retried.");
});
$("test-relay").addEventListener("click", testRelay);
$("use-default-wisp").addEventListener("click", () => {
  if (!configuration?.wisp) {
    $("settings-message").textContent = "This website has no default relay configured.";
    return;
  }
  $("settings-form").elements.wisp.value = configuration.wisp;
  $("settings-message").textContent = "Default endpoint filled in. Save settings to apply.";
});
$("use-backup-wisp").addEventListener("click", () => {
  $("settings-form").elements.wisp.value = BACKUP_WISP;
  $("settings-message").textContent = "Backup relay filled in. Save settings to apply.";
});
$("library-filter").addEventListener("input", renderLibrary);
$("library-add").addEventListener("click", () => editBookmark());
$("clear-cache").addEventListener("click", () => {
  if (active()?.ready) command(active(), "clear-cache");
  else notify("Open a website first to clear its runtime cache.");
});
$("clear-history").addEventListener("click", () => {
  visits = [];
  persist();
  notify("Local app history cleared.");
});
$("export-data").addEventListener("click", () => {
  const blob = new Blob(
    [JSON.stringify({ format: "ojjyproxy-v1", settings, bookmarks }, null, 2)],
    { type: "application/json" },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ojjyproxy-data.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$("import-data").addEventListener("change", async (event) => {
  try {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) throw new Error("Choose a data file smaller than 1 MB.");
    const data = JSON.parse(await file.text());
    if (data.format !== "ojjyproxy-v1" || !Array.isArray(data.bookmarks)) {
      throw new Error("This is not an ojjyProxy export.");
    }
    const imported = data.bookmarks.slice(0, 1000).map((item) => {
      const url = new URL(item.url);
      if (!["https:", "http:"].includes(url.protocol)) throw new Error("Invalid bookmark URL.");
      return {
        id: crypto.randomUUID(),
        name: String(item.name).slice(0, 80),
        url: url.href,
        folder: String(item.folder || "").slice(0, 40),
        favorite: !!item.favorite,
        added: Date.now(),
      };
    });
    // Merge bookmarks; imported connection settings do not silently redirect traffic.
    for (const item of imported) {
      if (!bookmarks.some((entry) => entry.url === item.url)) bookmarks.push(item);
    }
    persist();
    renderShortcuts();
    notify("Bookmarks imported. Review connection settings separately.");
  } catch (error) {
    notify(error.message);
  } finally {
    event.target.value = "";
  }
});
let suggestionIndex = -1;
function suggestionMatches(raw) {
  const query = raw.trim().toLowerCase();
  if (!settings.autocomplete || query.length < 2) return [];
  return [...bookmarks, ...visits].filter((item, index, all) =>
    all.findIndex((entry) => entry.url === item.url) === index
  )
    .filter((item) => `${item.name || item.title} ${item.url}`.toLowerCase().includes(query))
    .slice(0, 5);
}
function renderSuggestions() {
  const area = $("suggestions");
  area.replaceChildren();
  suggestionIndex = -1;
  const matches = suggestionMatches($("home-input").value);
  matches.forEach((item, index) => {
    const option = button(`${item.name || item.title} · ${new URL(item.url).hostname}`, () => {
      navigate(item.url);
      area.hidden = true;
    });
    option.dataset.index = String(index);
    area.append(option);
  });
  area.hidden = !matches.length;
  return matches;
}
function highlightSuggestion(count, step) {
  const area = $("suggestions");
  if (area.hidden || !area.children.length) return false;
  suggestionIndex = (suggestionIndex + step + count) % count;
  for (const option of area.children) {
    option.classList.toggle("active", Number(option.dataset.index) === suggestionIndex);
  }
  return true;
}
function chooseSuggestion() {
  const area = $("suggestions");
  const option = [...area.children].find((item) => item.classList.contains("active"));
  if (option) {
    option.click();
    return true;
  }
  return false;
}
$("home-input").addEventListener("input", renderSuggestions);
$("home-input").addEventListener("keydown", (event) => {
  const area = $("suggestions");
  const count = area.hidden ? 0 : area.children.length;
  if (event.key === "ArrowDown" && count) {
    event.preventDefault();
    highlightSuggestion(count, 1);
  } else if (event.key === "ArrowUp" && count) {
    event.preventDefault();
    highlightSuggestion(count, -1);
  } else if (event.key === "Enter" && chooseSuggestion()) {
    event.preventDefault();
  } else if (event.key === "Escape") {
    area.hidden = true;
  }
});
let addressSuggestionIndex = -1;
function renderAddressSuggestions() {
  const area = $("address-suggestions");
  area.replaceChildren();
  addressSuggestionIndex = -1;
  const matches = suggestionMatches($("address").value);
  matches.forEach((item, index) => {
    const option = button(`${item.name || item.title} · ${new URL(item.url).hostname}`, () => {
      navigate(item.url);
      area.hidden = true;
    });
    option.dataset.index = String(index);
    area.append(option);
  });
  area.hidden = !matches.length;
}
function highlightAddressSuggestion(count, step) {
  const area = $("address-suggestions");
  if (area.hidden || !area.children.length) return false;
  addressSuggestionIndex = (addressSuggestionIndex + step + count) % count;
  for (const option of area.children) {
    option.classList.toggle("active", Number(option.dataset.index) === addressSuggestionIndex);
  }
  return true;
}
function chooseAddressSuggestion() {
  const area = $("address-suggestions");
  const option = [...area.children].find((item) => item.classList.contains("active"));
  if (option) {
    option.click();
    return true;
  }
  return false;
}
$("address").addEventListener("input", renderAddressSuggestions);
$("address").addEventListener("keydown", (event) => {
  const area = $("address-suggestions");
  const count = area.hidden ? 0 : area.children.length;
  if (event.key === "ArrowDown" && count) {
    event.preventDefault();
    highlightAddressSuggestion(count, 1);
  } else if (event.key === "ArrowUp" && count) {
    event.preventDefault();
    highlightAddressSuggestion(count, -1);
  } else if (event.key === "Enter" && chooseAddressSuggestion()) {
    event.preventDefault();
  } else if (event.key === "Escape") {
    area.hidden = true;
  }
});
document.addEventListener("keydown", (event) => {
  // Panic first: it must fire even while typing in shell inputs or dialogs.
  if (
    settings.panicKey && event.key === settings.panicKey && !event.ctrlKey && !event.metaKey &&
    !event.altKey
  ) {
    panicExit();
    return;
  }
  if (document.querySelector("dialog[open]")) return;
  const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
  if (event.key === "/" && !typing) {
    event.preventDefault();
    (active().url ? $("address") : $("home-input")).focus();
  }
  if (event.key === "Escape") {
    $("suggestions").hidden = true;
    $("address-suggestions").hidden = true;
    if (active().url) showControls(true);
  }
  if (event.altKey && event.key.toLowerCase() === "t" && !typing) {
    event.preventDefault();
    if (event.shiftKey) reopenTab();
    else newTab();
  }
});
function warmDefaultEngine() {
  // Prefetch the default engine's biggest pinned bundles while the user is
  // still on home, so the first navigation starts with warm caches.
  const engine = ENGINES.find((item) => item.id === settings.engine);
  const origin = engine && registry[engine.id];
  if (!origin || !engine.warm) return;
  for (const file of engine.warm) {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = new URL(file, origin).href;
    document.head.append(link);
  }
}
async function boot() {
  try {
    const response = await fetch("/api/config");
    if (!response.ok) throw new Error("Server settings could not be loaded.");
    configuration = await response.json();
    registry = configuration.runtimes;
    warmDefaultEngine();
    // Offer only engines this deployment can actually run. Compact mode and
    // partially configured multi-origin setups stay honest in the selector.
    const available = Object.keys(registry).length
      ? ENGINES.filter((engine) => registry[engine.id])
      : ENGINES;
    populateEngineOptions(available);
    if (!available.some((engine) => engine.id === settings.engine)) {
      settings.engine = (available[0] || ENGINES[0]).id;
    }
    if (!settings.wisp) settings.wisp = configuration.wisp;
    const missing = available.filter((engine) => !registry[engine.id]);
    if (!settings.wisp || missing.length) {
      $("setup-banner").hidden = false;
      $("setup-banner").textContent = !settings.wisp && missing.length
        ? "Setup needed: configure your owned WISP_URL and the remaining runtime origins. The interface is ready; browsing starts when those services are configured."
        : "Setup needed: configure your owned WISP_URL. The interface is ready; browsing starts when the relay is reachable.";
      $("connection-label").textContent = "setup needed";
    } else $("connection-label").textContent = "owned relay configured";
  } catch (error) {
    notify(error.message);
    log("configuration", error.message);
  }
  setTheme();
  renderShortcuts();
  const restore = settings.restore && Array.isArray(saved.tabs) ? saved.tabs.slice(0, 20) : [];
  for (const tab of restore) {
    if (
      ENGINES.some((engine) => engine.id === tab.engine) &&
      (!tab.url || /^https?:\/\//.test(tab.url))
    ) newTab(tab.url, tab.engine, false, tab);
  }
  if (!tabs.length) newTab();
  else selectTab(tabs.some((tab) => tab.id === saved.activeId) ? saved.activeId : tabs[0].id);
}
// The theme picker needs its options before boot()'s config fetch resolves,
// in case settings is opened on a slow network.
populateThemeOptions();
boot();
