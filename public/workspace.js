import { ENGINES } from "./shared.js";

export const LAYOUTS = ["top", "sidebar", "rail", "classic", "bottom", "focus"];
export const BACKGROUNDS = [
  { id: "plain", label: "Clean", detail: "Just your palette" },
  { id: "aurora", label: "Aurora", detail: "Soft northern light" },
  { id: "dusk", label: "Dusk", detail: "A warm horizon" },
  { id: "mesh", label: "Mesh", detail: "Layered color fields" },
  { id: "stars", label: "Night sky", detail: "A quiet constellation" },
  { id: "coast", label: "Coast", detail: "Cool, open water" },
  { id: "grid", label: "Blueprint", detail: "A fine geometric grid" },
  { id: "dots", label: "Dot paper", detail: "An understated texture" },
];
export const HOME_DEFAULTS = {
  showWelcome: true,
  showShortcuts: true,
  showRecent: false,
  showCollections: false,
  shortcutDensity: "comfortable",
  bookmarksBar: "hidden",
  wallpaperDim: "65",
  wallpaperFit: "cover",
  backgroundSource: "image",
};
export const APPEARANCE_KEYS = [
  "theme",
  "layout",
  "style",
  "font",
  "radius",
  "motion",
  "glass",
  "pattern",
  "accentColor",
  "accentOverride",
  "customColors",
  ...Object.keys(HOME_DEFAULTS),
];
export const PRESETS = [
  {
    id: "original",
    name: "Original",
    detail: "Familiar blue · floating controls",
    theme: "default",
    layout: "top",
    style: "pill",
  },
  {
    id: "study",
    name: "Study sidebar",
    detail: "Readable tabs · warm paper",
    theme: "paper",
    layout: "sidebar",
    style: "docked",
  },
  {
    id: "night",
    name: "Compact night",
    detail: "Icon rail · OLED black",
    theme: "oled",
    layout: "rail",
    style: "docked",
  },
  {
    id: "desk",
    name: "Classic desk",
    detail: "Top controls · cool slate",
    theme: "slate",
    layout: "classic",
    style: "docked",
  },
  {
    id: "dock",
    name: "Bottom dock",
    detail: "Controls below · mint light",
    theme: "mint",
    layout: "bottom",
    style: "docked",
  },
  {
    id: "quiet",
    name: "Focus",
    detail: "Less chrome · mauve night",
    theme: "mocha",
    layout: "focus",
    style: "pill",
  },
].map((item) => ({
  ...item,
  radius: "medium",
  font: "system",
  motion: item.id === "original" ? "full" : "subtle",
  glass: "none",
  pattern: "plain",
  accentOverride: false,
  accentColor: "",
  shortcutDensity: item.id === "night" ? "compact" : "comfortable",
}));

export function appearancePatch(value) {
  return Object.fromEntries(
    APPEARANCE_KEYS.filter((key) => Object.hasOwn(value, key)).map((key) => [key, value[key]]),
  );
}

export function sanitizeCollections(value) {
  if (!Array.isArray(value)) return [];
  const used = new Set();
  return value.slice(0, 12).flatMap((item) => {
    if (!item || typeof item.name !== "string" || !item.name.trim() || !Array.isArray(item.tabs)) {
      return [];
    }
    const tabs = item.tabs.slice(0, 20).flatMap((tab) => {
      try {
        if (!tab || !ENGINES.some((engine) => engine.id === tab.engine)) return [];
        const url = new URL(tab.url);
        if (
          !["http:", "https:"].includes(url.protocol) || url.username || url.password ||
          url.href.length > 8192
        ) return [];
        return [{
          url: url.href,
          engine: tab.engine,
          title: String(tab.title || url.hostname).slice(0, 120),
        }];
      } catch {
        return [];
      }
    });
    if (!tabs.length) return [];
    const id = typeof item.id === "string" && /^[\w-]{1,80}$/.test(item.id) && !used.has(item.id)
      ? item.id
      : crypto.randomUUID();
    used.add(id);
    return [{ id, name: item.name.trim().slice(0, 60), tabs }];
  });
}

export const WALLPAPER_LIMIT = 3 * 1024 * 1024;

// Separate from engine databases. A write is successful only once committed.
export async function wallpaperStore(operation, blob) {
  // Some WebKit configurations cannot commit Blob values to IndexedDB. Keep
  // the same bytes in a plain structured-clone record instead. Do the await
  // before opening a transaction so it cannot become inactive mid-write.
  const value = operation === "put" ? { bytes: await blob.arrayBuffer(), type: blob.type } : null;
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open("ojjyproxy-appearance-v1", 1);
    let blocked = false;
    request.onupgradeneeded = () => request.result.createObjectStore("images");
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      blocked = true;
      reject(new Error("Close other workspace tabs to update wallpaper storage."));
    };
    request.onsuccess = () => {
      const connection = request.result;
      if (blocked) {
        connection.close();
        return;
      }
      connection.onversionchange = () => connection.close();
      resolve(connection);
    };
  });
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("images", operation === "get" ? "readonly" : "readwrite");
      const store = tx.objectStore("images");
      const request = operation === "get"
        ? store.get("home")
        : operation === "delete"
        ? store.delete("home")
        : store.put(value, "home");
      tx.oncomplete = () => {
        const record = request.result;
        resolve(
          operation === "get" && record?.bytes instanceof ArrayBuffer
            ? new Blob([record.bytes], { type: record.type })
            : record,
        );
      };
      tx.onabort = tx.onerror = () =>
        reject(tx.error || new Error("Wallpaper storage is unavailable."));
    });
  } finally {
    db.close();
  }
}

export async function prepareWallpaper(file) {
  if (!file || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    throw new Error("Choose a PNG, JPEG, or WebP image.");
  }
  if (!file.size || file.size > WALLPAPER_LIMIT) {
    throw new Error("Choose an image smaller than 3 MB.");
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
    } catch {
      throw new Error(
        "This file could not be decoded as an image. Choose another PNG, JPEG, or WebP.",
      );
    }
    if (!image.naturalWidth || image.naturalWidth * image.naturalHeight > 16000000) {
      throw new Error("Choose an image with at most 16 million pixels.");
    }
    const ratio = Math.min(1, 1920 / image.naturalWidth, 1080 / image.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", .85));
    if (!blob || blob.size > WALLPAPER_LIMIT) {
      throw new Error("This image could not be prepared within the storage limit.");
    }
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
