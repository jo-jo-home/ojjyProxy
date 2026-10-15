import { COLOR_TOKENS, THEMES } from "./shared.js";
import {
  APPEARANCE_KEYS,
  appearancePatch,
  BACKGROUNDS,
  prepareWallpaper,
  PRESETS,
  wallpaperStore,
} from "./workspace.js";

export function createStudio(api) {
  const $ = (id) => document.getElementById(id);
  const form = $("settings-form");
  const section = document.createElement("section");
  section.className = "studio-section";
  section.innerHTML =
    `<div class="studio-heading"><div><h3>Make it yours</h3><p class="field-note">Preview changes. Save to keep them, or close to cancel.</p></div><button type="button" id="reset-appearance">reset appearance</button></div>
    <h4>Workspace presets</h4><div id="preset-grid" class="preset-grid"></div>
    <h4>Color palettes</h4><div id="palette-grid" class="palette-grid"></div>
    <h4>Home dashboard</h4><div class="settings-grid toggles">
      <label><span>Welcome heading<small>the original ojjy greeting</small></span><input name="showWelcome" type="checkbox" role="switch"></label>
      <label><span>Launchpad<small>your saved shortcut cards</small></span><input name="showShortcuts" type="checkbox" role="switch"></label>
      <label><span>Recent visits<small>six local visits; requires local history</small></span><input name="showRecent" type="checkbox" role="switch"></label>
      <label><span>Saved collections<small>named sets of website tabs, not login profiles</small></span><input name="showCollections" type="checkbox" role="switch"></label>
    </div><div class="settings-grid">
      <label>Shortcut density<select name="shortcutDensity"><option value="comfortable">Comfortable cards</option><option value="compact">Compact cards</option><option value="list">Readable list</option></select></label>
      <label>Bookmarks bar<select name="bookmarksBar"><option value="hidden">Hidden</option><option value="home">Home only</option><option value="always">Always</option></select></label>
    </div><h4>Local wallpaper</h4><p class="field-note">PNG, JPEG or WebP · up to 3 MB and 16 million pixels. Resized locally; no image upload or remote requests. Stored on this browser, not a cloud backup or part of exports.</p>
    <div class="inline-actions"><label class="file-label">choose image<input id="wallpaper-file" type="file" accept="image/png,image/jpeg,image/webp"></label><button type="button" id="wallpaper-remove">remove wallpaper</button></div>
    <div id="wallpaper-preview" class="wallpaper-preview" hidden></div><p id="wallpaper-message" class="field-note" role="status">No wallpaper selected.</p>
    <div class="settings-grid"><label>Wallpaper dimming<input name="wallpaperDim" type="range" min="20" max="85" step="5"><span class="field-note">More dimming keeps the home page quieter.</span></label><label>Wallpaper fit<select name="wallpaperFit"><option value="cover">Fill</option><option value="contain">Fit entire image</option></select></label></div>`;
  form.prepend(section);
  // Keep dashboard/wallpaper controls separate from palette editing rather than
  // recreate the original long, unstructured customization page.
  const homeSection = document.createElement("section");
  homeSection.className = "studio-section";
  const homeHeading = [...section.querySelectorAll("h4")].find((node) =>
    node.textContent === "Home dashboard"
  );
  const title = document.createElement("h3");
  title.textContent = "Home dashboard";
  homeSection.append(title);
  while (homeHeading.nextSibling) homeSection.append(homeHeading.nextSibling);
  homeHeading.remove();
  section.after(homeSection);
  for (
    const [id, name, count] of [["preset-grid", "Workspace presets", 6], [
      "palette-grid",
      "Color palettes",
      18,
    ]]
  ) {
    const grid = $(id);
    grid.previousElementSibling.remove();
    const details = document.createElement("details");
    details.className = "studio-disclosure";
    details.id = id + "-disclosure";
    const summary = document.createElement("summary");
    const label = document.createElement("span");
    label.textContent = name;
    const badge = document.createElement("small");
    badge.textContent = `${count} choices`;
    summary.append(label, badge);
    grid.before(details);
    details.append(summary, grid);
  }
  const connectionSection = document.createElement("section");
  connectionSection.innerHTML = '<h3>Browsing & connection</h3><div class="settings-grid"></div>';
  for (const name of ["search", "engine", "transport"]) {
    connectionSection.querySelector(".settings-grid").append(
      form.elements.namedItem(name).closest("label"),
    );
  }
  homeSection.after(connectionSection);
  const sourceLabel = document.createElement("label");
  sourceLabel.innerHTML =
    'Background source<select name="backgroundSource"><option value="image">My image (when uploaded)</option><option value="theme">Background theme</option></select><span class="field-note">Your image stays saved when you switch to a theme.</span>';
  const backgroundTitle = document.createElement("h4");
  backgroundTitle.textContent = "Background themes";
  const backgroundGrid = document.createElement("div");
  backgroundGrid.id = "background-grid";
  backgroundGrid.className = "background-grid";
  const backgroundNote = document.createElement("p");
  backgroundNote.className = "field-note";
  backgroundNote.textContent =
    "Lightweight, static backgrounds that follow your palette. No downloads, video, or continuous animation.";
  homeSection.querySelector("h3").after(
    sourceLabel,
    backgroundTitle,
    backgroundNote,
    backgroundGrid,
  );
  const patternSelect = form.elements.namedItem("pattern");
  patternSelect.replaceChildren();
  for (const background of BACKGROUNDS) {
    const option = document.createElement("option");
    option.value = background.id;
    option.textContent = background.label;
    patternSelect.append(option);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "background-card";
    card.dataset.background = background.id;
    const image = document.createElement("span");
    image.className = "background-preview";
    image.dataset.scene = background.id;
    image.setAttribute("aria-hidden", "true");
    const name = document.createElement("strong");
    name.textContent = background.label;
    const description = document.createElement("small");
    description.textContent = background.detail;
    card.append(image, name, description);
    card.addEventListener(
      "click",
      () => fill({ pattern: background.id, backgroundSource: "theme" }),
    );
    backgroundGrid.append(card);
  }

  const toolbar = document.createElement("div");
  toolbar.className = "settings-toolbar";
  toolbar.innerHTML =
    `<label class="settings-search">Find a setting<input id="settings-search" type="search" placeholder="theme, tabs, relay, wallpaper…" autocomplete="off"></label><nav id="settings-categories" aria-label="Settings categories"></nav><p id="settings-empty" class="field-note" role="status" hidden>No matching settings. Try a different search.</p>`;
  form.before(toolbar);
  const categories = ["All", "Appearance", "Home", "Connection", "Privacy", "Data"];
  let category = "All";
  const sectionCategory = (node) => {
    const heading = node.querySelector("h3")?.textContent;
    if (["Your Wisp server", "Browsing & connection"].includes(heading)) return "Connection";
    if (heading === "Home dashboard") return "Home";
    if (["Tab appearance", "More options", "Domain filtering", "Panic exit"].includes(heading)) {
      return "Privacy";
    }
    if (heading === "Cache & data") return "Data";
    return "Appearance";
  };
  function filter() {
    const query = $("settings-search").value.trim().toLowerCase();
    let count = 0;
    for (const item of form.querySelectorAll(":scope > section")) {
      const keywords = `${item.textContent} ${
        [...item.querySelectorAll("[name]")].map((field) => field.name).join(" ")
      }`.toLowerCase();
      item.hidden = query
        ? !keywords.includes(query)
        : category !== "All" && sectionCategory(item) !== category;
      if (!item.hidden) count++;
    }
    $("settings-empty").hidden = count > 0;
    if (query) {
      for (const details of form.querySelectorAll(".studio-disclosure")) {
        if (
          details.textContent.toLowerCase().includes(query) ||
          (details.id.startsWith("palette") && /theme|color|palette/.test(query)) ||
          (details.id.startsWith("preset") && /workspace|preset|layout/.test(query))
        ) details.open = true;
      }
    }
    for (const button of $("settings-categories").children) {
      button.setAttribute("aria-pressed", String(!query && button.textContent === category));
    }
  }
  for (const name of categories) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = name;
    button.addEventListener("click", () => {
      category = name;
      $("settings-search").value = "";
      filter();
      form.scrollTop = 0;
    });
    $("settings-categories").append(button);
  }
  $("settings-search").addEventListener("input", filter);
  function inputsPatch() {
    const patch = {};
    for (const key of APPEARANCE_KEYS) {
      const field = form.elements.namedItem(key);
      if (field) patch[key] = field.type === "checkbox" ? field.checked : field.value;
    }
    if (patch.theme === "custom") {
      patch.customColors = Object.fromEntries(
        COLOR_TOKENS.map((token) => [token, form.elements.namedItem(`color-${token}`).value]),
      );
    }
    return patch;
  }
  function updateSelected() {
    for (const card of $("background-grid").children) {
      card.setAttribute(
        "aria-pressed",
        String(
          form.elements.backgroundSource.value === "theme" &&
            card.dataset.background === form.elements.pattern.value,
        ),
      );
    }
    for (const button of $("palette-grid").children) {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.theme === form.elements.theme.value),
      );
    }
    for (const button of $("preset-grid").children) {
      const preset = PRESETS.find((item) => item.id === button.dataset.preset);
      button.setAttribute(
        "aria-pressed",
        String(
          Object.entries(appearancePatch(preset)).every(([key, value]) => {
            const field = form.elements.namedItem(key);
            return !field || (field.type === "checkbox" ? field.checked : field.value) === value;
          }),
        ),
      );
    }
  }
  function preview() {
    api.preview(inputsPatch());
    updateSelected();
  }
  function fill(patch) {
    for (const [key, value] of Object.entries(appearancePatch(patch))) {
      const field = form.elements.namedItem(key);
      if (field) {
        if (field.type === "checkbox") field.checked = value;
        else field.value = value;
      }
    }
    api.sync();
    preview();
  }
  for (const preset of PRESETS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preset-card";
    button.dataset.preset = preset.id;
    const swatch = THEMES.find((theme) => theme.id === preset.theme);
    button.style.setProperty("--preview-bg", swatch.colors.bg);
    button.style.setProperty("--preview-surface", swatch.colors.bg3);
    button.style.setProperty("--preview-accent", swatch.colors.accent);
    const mock = document.createElement("span");
    mock.className = `workspace-mini mini-${preset.layout}`;
    mock.setAttribute("aria-hidden", "true");
    mock.innerHTML = "<i></i><i></i><i></i>";
    const title = document.createElement("strong");
    title.textContent = preset.name;
    const description = document.createElement("small");
    description.textContent = preset.detail;
    button.append(mock, title, description);
    button.addEventListener("click", () => fill(preset));
    $("preset-grid").append(button);
  }
  for (const theme of THEMES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "palette-card";
    button.dataset.theme = theme.id;
    const swatch = document.createElement("span");
    swatch.className = "palette-swatch";
    swatch.setAttribute("aria-hidden", "true");
    swatch.style.background =
      `linear-gradient(90deg,${theme.colors.bg} 0 33%,${theme.colors.bg3} 33% 66%,${theme.colors.accent} 66%)`;
    button.append(swatch, document.createTextNode(theme.label));
    button.addEventListener("click", () => fill({ theme: theme.id, accentOverride: false }));
    $("palette-grid").append(button);
  }
  form.addEventListener("change", (event) => {
    if (APPEARANCE_KEYS.includes(event.target.name) || event.target.name?.startsWith("color-")) {
      preview();
    }
  });
  $("reset-appearance").addEventListener("click", () => fill(api.defaults));
  let committed = null, pending, objectUrl = "", busy = false;
  function showImage(blob) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = blob ? URL.createObjectURL(blob) : "";
    $("home").style.setProperty("--wallpaper", objectUrl ? `url("${objectUrl}")` : "none");
    $("home").classList.toggle("has-wallpaper", !!blob);
    $("wallpaper-preview").style.backgroundImage = objectUrl ? `url("${objectUrl}")` : "none";
    $("wallpaper-preview").hidden = !blob;
  }
  const ready = wallpaperStore("get").then((blob) => {
    committed = blob instanceof Blob ? blob : null;
    if (pending === undefined) {
      showImage(committed);
      $("wallpaper-message").textContent = committed
        ? "Local wallpaper loaded."
        : "No wallpaper selected.";
    }
  }).catch(() => {
    $("wallpaper-message").textContent =
      "Wallpaper storage unavailable. Your other settings still work.";
  });
  let generation = 0;
  $("wallpaper-file").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    const version = ++generation;
    busy = true;
    try {
      await ready;
      const blob = await prepareWallpaper(file);
      if (version !== generation) return;
      pending = blob;
      showImage(blob);
      fill({ backgroundSource: "image" });
      $("wallpaper-message").textContent =
        "Image ready locally. Save settings to keep it, or close to cancel.";
    } catch (error) {
      if (version === generation) $("wallpaper-message").textContent = error.message;
    } finally {
      if (version === generation) busy = false;
    }
  });
  $("wallpaper-remove").addEventListener("click", () => {
    generation++;
    busy = false;
    pending = null;
    showImage(null);
    fill({ backgroundSource: "theme" });
    $("wallpaper-message").textContent = "Removal staged. Save settings to keep this change.";
  });
  return {
    showCategory(name) {
      category = categories.includes(name) ? name : "All";
      $("settings-search").value = "";
      filter();
      form.scrollTop = 0;
    },
    open() {
      form.querySelectorAll(".studio-disclosure").forEach((node) => {
        node.open = false;
      });
      category = "All";
      $("settings-search").value = "";
      filter();
      updateSelected();
    },
    cancel() {
      generation++;
      busy = false;
      pending = undefined;
      showImage(committed);
      $("wallpaper-message").textContent = committed
        ? "Local wallpaper loaded."
        : "No wallpaper selected.";
    },
    async commit() {
      if (busy) throw new Error("Wait for the wallpaper to finish preparing.");
      if (pending === undefined) return;
      await ready;
      await wallpaperStore(pending ? "put" : "delete", pending);
      committed = pending;
      pending = undefined;
      $("wallpaper-message").textContent = committed
        ? "Wallpaper saved on this browser."
        : "Wallpaper removed.";
    },
  };
}
