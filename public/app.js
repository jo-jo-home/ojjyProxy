import { ENGINES, toUrl, validateWisp } from "./shared.js";
const $ = (id) => document.getElementById(id);
const KEY = "ojjyproxy-app-v1";
const defaults = {
  engine: "sj-1.1.0",
  search: "duckduckgo",
  style: "pill",
  theme: "default",
  transport: "epoxy",
  wisp: "",
  title: "",
  icon: "",
  notifications: true,
  performance: false,
  history: true,
  autocomplete: true,
  restore: true,
  captureWindows: true,
  blocked: "",
};
let saved = {};
try {
  saved = JSON.parse(localStorage.getItem(KEY) || "{}");
} catch { /* Recover from corrupt local data. */ }
let settings = { ...defaults, ...saved.settings };
if (!ENGINES.some((engine) => engine.id === settings.engine)) settings.engine = defaults.engine;
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
function setTheme() {
  document.body.dataset.theme = settings.theme;
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
  $("error-message").textContent = tab.error;
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
  area.replaceChildren();
  for (const tab of tabs) {
    const group = document.createElement("div");
    group.className = "tab" + (tab.id === activeId ? " active" : "");
    const select = button("", () => selectTab(tab.id), "tab-select");
    select.setAttribute("role", "tab");
    select.setAttribute("aria-selected", String(tab.id === activeId));
    select.title = tab.url || "New tab";
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
    area.append(group);
  }
}
function destroyRuntime(tab) {
  clearTimeout(tab.timer);
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
function editBookmark(item = null) {
  const form = $("bookmark-form");
  form.reset();
  form.dataset.editId = item?.id || "";
  form.elements.name.value = item?.name || (active()?.url ? active().title : "");
  form.elements.url.value = item?.url || active()?.url || "";
  form.elements.favorite.checked = item?.favorite ?? true;
  $("bookmark-error").textContent = "";
  $("bookmark-dialog").showModal();
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
      favorite: form.elements.favorite.checked,
      added: Date.now(),
    };
    const index = bookmarks.findIndex((entry) => entry.id === id || entry.url === item.url);
    if (index >= 0) bookmarks[index] = item;
    else bookmarks.push(item);
    persist();
    renderShortcuts();
    if ($("library").open) renderLibrary();
    $("bookmark-dialog").close();
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
    about: "About ojjyProxy",
  }[type];
  $("library-filter").value = "";
  $("library-filter").hidden = !["bookmarks", "history"].includes(type);
  $("library-add").hidden = type !== "bookmarks";
  renderLibrary();
  $("library").showModal();
}
function renderLibrary() {
  const container = $("library-content");
  container.replaceChildren();
  const filter = $("library-filter").value.toLowerCase();
  if (libraryType === "about") {
    const copy = document.createElement("div");
    copy.className = "about-copy";
    copy.innerHTML =
      '<h3>one browser. your connection.</h3><p>ojjyProxy is a standalone project by Jonas Lee, matching ojjy’s game hub blue. It combines four pinned Scramjet releases and Ultraviolet with an operator-owned Wisp relay.</p><p>Primary integration reference: Proxy2. Engines and transports: Mercury Workshop and Titanium Network. Tabs, bookmarks, settings and history are saved on this browser.</p><p><a href="https://github.com/jo-jo-home/ojjyProxy" target="_blank" rel="noopener noreferrer">project source & full blueprint ↗</a> · <a href="/asset-manifest.json" target="_blank" rel="noopener noreferrer">asset versions & hashes ↗</a></p><p>Changing a tab title is cosmetic. Disabling local history does not erase browser history, relay metadata, or website cookies. Older alpha releases are compatibility experiments.</p>';
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
  const items = (libraryType === "bookmarks" ? bookmarks : visits).filter((item) =>
    `${item.name || item.title} ${item.url}`.toLowerCase().includes(filter)
  );
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "library-empty";
    empty.textContent = libraryType === "bookmarks"
      ? "no saved sites here yet."
      : "no local visits here yet.";
    container.append(empty);
  }
  for (const item of items) {
    const row = document.createElement("div");
    row.className = "library-row";
    const open = button("", () => {
      $("library").close();
      navigate(item.url);
    }, "row-open");
    const title = document.createElement("strong");
    title.textContent = item.name || item.title;
    const domain = document.createElement("small");
    domain.textContent = item.url + (item.time ? ` · ${new Date(item.time).toLocaleString()}` : "");
    open.append(title, domain);
    row.append(open);
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
function openSettings() {
  const form = $("settings-form");
  for (const [key, value] of Object.entries(settings)) {
    const field = form.elements.namedItem(key);
    if (!field) continue;
    if (field.type === "checkbox") field.checked = !!value;
    else field.value = value;
  }
  $("settings-message").textContent = "changes apply when saved";
  $("settings").showModal();
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
  const domains = result.blocked.split(/\s+/).filter(Boolean);
  if (
    domains.some((host) =>
      !/^(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)*[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(host)
    )
  ) throw new Error("Blocked domains must be hostnames, without paths or URLs.");
  result.blocked = domains.map((host) => host.toLowerCase()).join("\n");
  return result;
}
$("settings-form").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    settings = readSettings();
    persist();
    setTheme();
    $("settings").close();
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
      $("settings").close();
      return notify("Default engine updated for new tabs.");
    }
    const target = tab.url;
    tab.engine = settings.engine;
    destroyRuntime(tab);
    tab.error = "";
    $("settings").close();
    navigate(target, tab);
  } catch (error) {
    $("settings-message").textContent = error.message;
  }
});
async function testRelay() {
  const result = $("relay-result");
  let socket, timer;
  try {
    const endpoint = validateWisp(
      $("settings-form").elements.wisp.value,
      location.protocol === "https:",
    );
    result.textContent = "connecting…";
    await new Promise((resolve, reject) => {
      socket = new WebSocket(endpoint);
      timer = setTimeout(() => reject(new Error("Connection timed out.")), 8000);
      socket.onopen = resolve;
      socket.onerror = () => reject(new Error("Could not open the WebSocket."));
    });
    result.textContent = "WebSocket reachable — destination access is tested when browsing.";
    log("relay", `WebSocket reachable: ${endpoint}`);
  } catch (error) {
    result.textContent = error.message;
    log("relay error", error.message);
  } finally {
    clearTimeout(timer);
    socket?.close();
  }
}
function showControls(show) {
  $("browser-controls").hidden = !show;
  $("show-controls").hidden = show;
  $("browser").classList.toggle("controls-hidden", !show);
}
for (const engine of ENGINES) {
  const option = document.createElement("option");
  option.value = engine.id;
  option.textContent = engine.label;
  $("engine-select").append(option);
}
document.querySelectorAll("[data-close]").forEach((node) =>
  node.addEventListener("click", () => node.closest("dialog").close())
);
document.querySelectorAll("[data-panel]").forEach((node) =>
  node.addEventListener("click", () => openLibrary(node.dataset.panel))
);
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
    "connection",
  ]
) $(id).addEventListener("click", openSettings);
$("new-tab").addEventListener("click", () => newTab());
$("reopen-tab").addEventListener("click", reopenTab);
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
$("test-relay").addEventListener("click", testRelay);
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
$("home-input").addEventListener("input", () => {
  const area = $("suggestions"), query = $("home-input").value.trim().toLowerCase();
  area.replaceChildren();
  if (!settings.autocomplete || query.length < 2) {
    area.hidden = true;
    return;
  }
  const matches = [...bookmarks, ...visits].filter((item, index, all) =>
    all.findIndex((entry) => entry.url === item.url) === index
  )
    .filter((item) => `${item.name || item.title} ${item.url}`.toLowerCase().includes(query)).slice(
      0,
      5,
    );
  for (const item of matches) {
    area.append(button(`${item.name || item.title} · ${new URL(item.url).hostname}`, () => {
      navigate(item.url);
      area.hidden = true;
    }));
  }
  area.hidden = !matches.length;
});
document.addEventListener("keydown", (event) => {
  if (document.querySelector("dialog[open]")) return;
  const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
  if (event.key === "/" && !typing) {
    event.preventDefault();
    (active().url ? $("address") : $("home-input")).focus();
  }
  if (event.key === "Escape") {
    $("suggestions").hidden = true;
    if (active().url) showControls(true);
  }
  if (event.altKey && event.key.toLowerCase() === "t" && !typing) {
    event.preventDefault();
    if (event.shiftKey) reopenTab();
    else newTab();
  }
});
async function boot() {
  try {
    const response = await fetch("/api/config");
    if (!response.ok) throw new Error("Server settings could not be loaded.");
    configuration = await response.json();
    registry = configuration.runtimes;
    if (!settings.wisp) settings.wisp = configuration.wisp;
    const missing = ENGINES.filter((engine) => !registry[engine.id]);
    if (!settings.wisp || missing.length) {
      $("setup-banner").hidden = false;
      $("setup-banner").textContent =
        "Setup needed: configure your owned WISP_URL and five RUNTIME_ORIGINS on Deno. The interface is ready; browsing starts when those services are configured.";
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
boot();
