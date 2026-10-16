export const MAX_PIXELS = 2400000;
export const MAX_DIMENSION = 2400;
export const MAX_QUEUE = 128;
export const MAX_BUFFER = 4 * 1024 * 1024;

export function bounded(value, fallback, min, max) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(min, Math.min(max, value))
    : fallback;
}

export function captureSize(message = {}) {
  let width = Math.round(bounded(message.width, 1280, 320, 2000));
  let height = Math.round(bounded(message.height, 720, 240, 1600));
  // Even the CSS viewport must fit the budget at scale 1.
  const fit = Math.min(1, Math.sqrt(MAX_PIXELS / (width * height)));
  width = Math.floor(width * fit);
  height = Math.floor(height * fit);
  const scale = Math.max(
    1,
    Math.min(
      bounded(message.dpr, 1, 1, 2),
      Math.sqrt((MAX_PIXELS - 10000) / (width * height)),
      (MAX_DIMENSION - 1) / width,
      (MAX_DIMENSION - 1) / height,
    ),
  );
  return {
    width,
    height,
    scale,
    pixelWidth: Math.floor(width * scale),
    pixelHeight: Math.floor(height * scale),
  };
}

export function jpegSize(bytes) {
  if (bytes[0] !== 255 || bytes[1] !== 216) return null;
  for (let i = 2; i + 8 < bytes.length;) {
    if (bytes[i++] !== 255) return null;
    const marker = bytes[i++];
    if (marker === 217 || marker === 218) return null;
    const length = bytes[i] * 256 + bytes[i + 1];
    if (length < 2 || i + length > bytes.length) return null;
    if ([192, 193, 194].includes(marker)) {
      return {
        width: bytes[i + 5] * 256 + bytes[i + 6],
        height: bytes[i + 3] * 256 + bytes[i + 4],
      };
    }
    i += length;
  }
  return null;
}

export function viewportPoint(clientX, clientY, rect, viewport) {
  return {
    x: bounded((clientX - rect.left) * viewport.width / rect.width, 0, 0, viewport.width - 1),
    y: bounded((clientY - rect.top) * viewport.height / rect.height, 0, 0, viewport.height - 1),
  };
}

// One decode in flight and only the newest pending frame. Never retain a bitmap.
export function frameDecoder(decode, paint) {
  let pending = null;
  let running = false;
  let generation = 0;
  async function drain() {
    running = true;
    while (pending) {
      const frame = pending;
      pending = null;
      const token = generation;
      let bitmap;
      try {
        bitmap = await decode(frame);
        if (token === generation) paint(bitmap);
      } catch {
        /* the next frame replaces invalid images */
      } finally {
        bitmap?.close();
      }
    }
    running = false;
  }
  return {
    push(frame) {
      pending = frame;
      if (!running) void drain();
    },
    reset() {
      generation++;
      pending = null;
    },
  };
}
