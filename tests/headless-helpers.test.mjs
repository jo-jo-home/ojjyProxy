import test from "node:test";
import assert from "node:assert/strict";
import {
  bounded,
  captureSize,
  frameDecoder,
  jpegSize,
  MAX_DIMENSION,
  MAX_PIXELS,
  viewportPoint,
} from "../headless/helpers.mjs";

test("capture budgets apply to DPR and to oversized CSS viewports", () => {
  for (const width of [320, 1280, 2000, 1e10, NaN, Infinity, "2000"]) {
    for (const height of [240, 720, 1600, 1e10, NaN]) {
      for (const dpr of [0, 1, 1.25, 2, 10, Infinity, NaN]) {
        const size = captureSize({ width, height, dpr });
        assert.ok(size.scale >= 1 && size.scale <= 2);
        assert.ok(size.pixelWidth * size.pixelHeight <= MAX_PIXELS);
        assert.ok(size.pixelWidth <= MAX_DIMENSION && size.pixelHeight <= MAX_DIMENSION);
        assert.ok(size.width * size.height <= MAX_PIXELS);
      }
    }
  }
  assert.equal(captureSize({ width: 800, height: 600, dpr: 2 }).scale, 2);
  assert.equal(bounded(Infinity, 78, 0, 100), 78);
  assert.equal(bounded(0, 78, 0, 100), 0);
});

test("JPEG confirmation reads baseline/progressive dimensions and rejects broken data", () => {
  for (const marker of [192, 193, 194]) {
    const bytes = Uint8Array.from([255, 216, 255, marker, 0, 11, 8, 2, 88, 3, 32, 1, 1, 17, 0]);
    assert.deepEqual(jpegSize(bytes), { width: 800, height: 600 });
  }
  assert.equal(jpegSize(new Uint8Array()), null);
  assert.equal(jpegSize(Uint8Array.from([255, 216, 255, 224, 255, 255, 0, 0, 0, 0, 0])), null);
});

test("coordinate mapping uses transformed bounds, scroll offset and remote CSS dimensions", () => {
  for (const zoom of [0.5, 1, 1.2, 2, 3]) {
    const rect = { left: -123, top: -45, width: 800 * zoom, height: 600 * zoom };
    const viewport = { width: 1000, height: 750 };
    assert.deepEqual(
      viewportPoint(rect.left + rect.width / 2, rect.top + rect.height / 2, rect, viewport),
      { x: 500, y: 375 },
    );
    assert.deepEqual(viewportPoint(-1000, -1000, rect, viewport), { x: 0, y: 0 });
    assert.deepEqual(viewportPoint(10000, 10000, rect, viewport), { x: 999, y: 749 });
  }
});

test("decoder serializes, coalesces and closes every bitmap including stale generations", async () => {
  const starts = [];
  const paints = [];
  const closes = [];
  const resolvers = [];
  const decoder = frameDecoder((id) => {
    starts.push(id);
    return new Promise((resolve) =>
      resolvers.push(() => resolve({ id, close: () => closes.push(id) }))
    );
  }, (bitmap) => paints.push(bitmap.id));
  decoder.push(1);
  decoder.push(2);
  decoder.push(3);
  assert.deepEqual(starts, [1]);
  resolvers.shift()();
  await Promise.resolve();
  assert.deepEqual(starts, [1, 3]);
  decoder.reset();
  decoder.push(4);
  resolvers.shift()();
  await Promise.resolve();
  assert.deepEqual(starts, [1, 3, 4]);
  resolvers.shift()();
  await Promise.resolve();
  assert.deepEqual(paints, [1, 4]);
  assert.deepEqual(closes, [1, 3, 4]);
});

test("decoder recovers after failed decode and closes after paint failures", async () => {
  const closed = [];
  const decoder = frameDecoder(async (id) => {
    if (id === 1) throw new Error("bad JPEG");
    return { close: () => closed.push(id) };
  }, () => {
    throw new Error("detached canvas");
  });
  decoder.push(1);
  decoder.push(2);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(closed, [2]);
});
