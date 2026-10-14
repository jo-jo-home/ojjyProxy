import { expect, test } from "@playwright/test";
import http from "node:http";
import { WebSocketServer } from "ws";
import { spawn } from "node:child_process";
import { BACKUP_WISP, ENGINES } from "../../public/shared.js";
let fixture, sockets, socketHost;
test.beforeAll(async () => {
  fixture = http.createServer((request, response) => {
    // Route by pathname: proxy hooks append query parameters (for example
    // "?dest=worker"), and exact-match URLs fell through to the HTML handler.
    // Firefox refuses worker scripts served as text/html, so this also fixes
    // the Firefox dedicated-worker checks.
    const pathname = new URL(request.url, "http://localhost").pathname;
    if (process.env.PROXY_DIAGNOSTICS) {
      console.log("fixture request", request.method, request.url, JSON.stringify(request.headers));
    }
    if (pathname === "/worker.js") {
      response.writeHead(200, { "content-type": "text/javascript" });
      response.end(`postMessage('worker ready');`);
      return;
    }
    if (pathname === "/api/echo") {
      let body = "";
      request.on("data", (part) => {
        body += part.toString();
      });
      request.on("end", () => {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify({ method: request.method, body }));
      });
      return;
    }
    if (pathname === "/redirect") {
      response.writeHead(302, { location: "/next?from=redirect#spot" });
      response.end();
      return;
    }
    if (pathname === "/api/ping") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: true, cookies: request.headers.cookie || "" }));
      return;
    }
    response.writeHead(200, {
      "content-type": "text/html",
      "set-cookie": "servercookie=two; Path=/",
    });
    response.end(
      `<!doctype html><html><head><title>ojjyProxy fixture</title></head><body><h1>${
        pathname.startsWith("/next") ? "next fixture page" : "owned relay works"
      }</h1><a href="/next">next page</a><a href="/next" target="_blank">new window</a><script>document.body.dataset.script="rewritten-script-ran";document.cookie="clientcookie=one; path=/";setTimeout(()=>fetch('/api/ping').then(r=>r.json()).then(data=>{document.body.dataset.fetched=String(data.ok);document.body.dataset.cookies=data.cookies}),100);</script>${
        pathname === "/deep"
          ? `<script>fetch('/api/echo',{method:'POST',body:'payload=ojjy',headers:{'content-type':'application/x-www-form-urlencoded'}}).then(r=>r.json()).then(data=>document.body.dataset.post=data.method+':'+data.body);const worker=new Worker('/worker.js');worker.onmessage=e=>{document.body.dataset.worker=e.data;worker.terminate()};worker.onerror=e=>document.body.dataset.workerError=String(e.message)+'@'+String(e.lineno);const socket=new WebSocket('ws://localhost:8898/socket');self.fixtureSocket=socket;socket.onopen=()=>{document.body.dataset.socketOpened='yes';socket.send('hello')};socket.onmessage=e=>{document.body.dataset.socket=e.data;socket.close()};socket.onerror=()=>document.body.dataset.socketError='connection failed';socket.onclose=e=>document.body.dataset.socketClose=String(e.code);</script>`
          : ""
      }</body></html>`,
    );
  });
  socketHost = http.createServer((request, response) => {
    response.writeHead(404);
    response.end();
  });
  sockets = new WebSocketServer({ server: socketHost });
  sockets.on("connection", (socket) => {
    if (process.env.PROXY_DIAGNOSTICS) console.log("fixture WebSocket connected");
    socket.on("message", (message) => {
      if (process.env.PROXY_DIAGNOSTICS) console.log("fixture received", message.toString());
      socket.send("echo:" + message.toString());
    });
  });
  await new Promise((resolve) => fixture.listen(8899, resolve));
  await new Promise((resolve) => socketHost.listen(8898, resolve));
});
test.afterAll(async () => {
  for (const client of sockets.clients) client.terminate();
  sockets.close();
  await new Promise((resolve) => socketHost.close(resolve));
  await new Promise((resolve) => fixture.close(resolve));
});
test.afterEach(async ({ page }, info) => {
  if (info.status !== info.expectedStatus && page.__runtimeDiagnostics) {
    for (
      const frame of page.frames().filter((frame) => frame.url().includes("/runtime/index.html"))
    ) {
      try {
        console.error(
          "Client state",
          await frame.evaluate(() => {
            const child = document.getElementById("website").contentWindow;
            const client = child[Symbol.for("scramjet client global")];
            return {
              url: child.location.href,
              epoxy: typeof client?.epoxy,
              ownerClient: typeof self[Symbol.for("scramjet client global")],
              socketConstructor: child.WebSocket.name,
              socket: child.fixtureSocket &&
                {
                  name: child.fixtureSocket.constructor.name,
                  state: child.fixtureSocket.readyState,
                  onopen: typeof child.fixtureSocket.onopen,
                  fields: Object.keys(child.fixtureSocket),
                },
              bridged: child.__ojjySocketBridgeInstalled,
              ownerBridge: typeof self.__ojjyInstallSocketBridge,
              fields: Object.keys(client || {}),
            };
          }),
        );
      } catch {}
    }
    console.error(JSON.stringify(page.__runtimeDiagnostics, null, 2));
  }
});
test("blue home, full selector, bookmarks and responsive settings", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "ojjyProxy", exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/home-desktop.png", animations: "disabled" });
  await page.getByRole("button", { name: "customize", exact: true }).click();
  await expect(page.locator("#engine-select")).toHaveValue("sj-1.1.0");
  await expect(page.locator("#engine-select option")).toHaveCount(5);
  // The quick relay buttons fill the form without saving.
  await page.getByRole("button", { name: "use backup relay" }).click();
  await expect(page.locator("#settings-form [name=wisp]")).toHaveValue(BACKUP_WISP);
  await page.getByRole("button", { name: "use default" }).click();
  await expect(page.locator("#settings-form [name=wisp]")).toHaveValue("ws://localhost:9000/wisp/");
  await page.locator("#settings [data-close]").first().click();
  await page.getByRole("button", { name: /add a shortcut/ }).click();
  await page.locator("#bookmark-form [name=name]").fill("My fixture");
  await page.locator("#bookmark-form [name=url]").fill("http://localhost:8899/");
  await page.locator("#bookmark-form [name=folder]").fill("School");
  await page.getByRole("button", { name: "save bookmark", exact: true }).click();
  await expect(page.locator("#shortcut-grid")).toContainText("My fixture");
  await page.reload();
  await expect(page.locator("#shortcut-grid")).toContainText("My fixture");
  // Bookmark folders group the library without touching the home grid.
  await page.getByRole("button", { name: "bookmarks", exact: true }).click();
  await expect(page.locator("#library-content .library-day")).toHaveText("School");
  await page.locator("#library [data-close]").first().click();
  // Address-bar suggestions come from saved bookmarks; middle-click closes a tab.
  await page.getByRole("button", { name: /My fixture/ }).click();
  await expect(
    page.frameLocator(".runtime-frame:not([hidden])").frameLocator("#website").getByRole(
      "heading",
      { name: "owned relay works" },
    ),
  ).toBeVisible({ timeout: 25000 });
  await page.locator("#address").fill("my f");
  await expect(page.locator("#address-suggestions")).toBeVisible();
  await expect(page.locator("#address-suggestions")).toContainText("My fixture");
  await page.locator("#address").press("ArrowDown");
  await page.locator("#address").press("Enter");
  await expect(page.locator("#address")).toHaveValue("http://localhost:8899/");
  await page.locator("#new-tab").click();
  await expect(page.locator("#tabs .tab")).toHaveCount(2);
  await page.locator("#tabs .tab").first().click({ button: "middle" });
  await expect(page.locator("#tabs .tab")).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "customize", exact: true }).click();
  await expect(page.getByRole("button", { name: "save settings", exact: true })).toBeVisible();
  // Discreet input masks the address bar for shared screens.
  await page.locator("#settings-form [name=discreet]").check();
  await expect(page.locator("#home-input")).toHaveAttribute("type", "password");
  await page.locator("#settings-form [name=discreet]").uncheck();
  await expect(page.locator("#home-input")).toHaveAttribute("type", "text");
  await page.screenshot({ path: "test-results/settings-mobile.png" });
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(390);
  // Panic exit: recorded key plus cover site leave immediately, and the cover
  // site is configurable so this test stays on the local fixture. The settings
  // dialog is still open from the responsive check above, so use it directly.
  await page.locator("#settings-form [name=panicKey]").click();
  await page.keyboard.press("F9");
  await expect(page.locator("#settings-form [name=panicKey]")).toHaveValue("F9");
  await page.locator("#settings-form [name=panicUrl]").fill("http://localhost:8899/next");
  await page.getByRole("button", { name: "save settings", exact: true }).click();
  await page.keyboard.press("F9");
  await expect(page).toHaveURL(/localhost:8899\/next/);
  await expect(page.getByRole("heading", { name: "next fixture page" })).toBeVisible();
});
for (const engine of ENGINES) {
  test(`${engine.id} loads through the owned Wisp relay`, async ({ page }) => {
    const browserName = test.info().project.name;
    test.skip(
      browserName === "webkit" && engine.id === "sj-2.0.67-alpha.2",
      "alpha67 on WebKit: the wasm rewriter emits arrow-comment chains WebKit refuses to parse, and the controller RPC hits DataCloneError; tracked in ROADMAP Phase 3",
    );
    const errors = [];
    const diagnostics = [];
    page.__runtimeDiagnostics = { errors, diagnostics };
    if (process.env.PROXY_DIAGNOSTICS) {
      page.on("console", (message) => console.log("browser", message.type(), message.text()));
    }
    page.on("websocket", (socket) => {
      diagnostics.push({ websocket: socket.url() });
      if (process.env.PROXY_DIAGNOSTICS) {
        socket.on(
          "framesent",
          (event) =>
            console.log("wire sent", Buffer.from(event.payload).subarray(0, 100).toString("hex")),
        );
        socket.on(
          "framereceived",
          (event) =>
            console.log(
              "wire received",
              Buffer.from(event.payload).subarray(0, 100).toString("hex"),
            ),
        );
      }
    });
    page.on("console", (message) => {
      if (message.type() === "error") diagnostics.push(message.text());
    });
    page.on(
      "requestfailed",
      (request) => diagnostics.push(`${request.url()} ${request.failure()?.errorText}`),
    );
    page.on("response", async (response) => {
      if (diagnostics.length < 80 && response.url().includes("/runtime/network/")) {
        const entry = {
          url: response.url(),
          headers: response.headers(),
          status: response.status(),
        };
        if (
          response.status() >= 400 ||
          response.request().resourceType() === "document" ||
          (Number(response.headers()["content-length"] ?? Infinity) < 100)
        ) {
          try {
            entry.body = (await response.text()).slice(0, 12000);
          } catch {}
        }
        diagnostics.push(entry);
      }
    });
    page.on(
      "pageerror",
      (error) => errors.push(`${error.message} @ ${(error.stack || "").split("\n")[1] || ""}`),
    );
    await page.goto("/");
    await page.getByRole("button", { name: "customize", exact: true }).click();
    await page.locator("#engine-select").selectOption(engine.id);
    if (process.env.PROXY_TEST_TRANSPORT) {
      await page.locator("#settings-form [name=transport]").selectOption(
        process.env.PROXY_TEST_TRANSPORT,
      );
    }
    await page.getByRole("button", { name: "save settings", exact: true }).click();
    // The existing blank tab retains its selected engine until explicitly switched.
    await page.locator("#new-tab").click();
    await page.locator("#home-input").fill("http://localhost:8899/");
    await page.locator("#home-form").evaluate((form) => form.requestSubmit());
    const runtime = page.frameLocator(".runtime-frame:not([hidden])");
    const website = runtime.frameLocator("#website");
    if (engine.id === "sj-1.1.0") {
      await page.screenshot({ path: "test-results/browser-chromium.png", animations: "disabled" });
    }
    try {
      // CI runners cold-start the whole stack (relay, workers, wasm) on the
      // first engine; allow more time than local hardware needs.
      await expect(website.getByRole("heading", { name: "owned relay works" })).toBeVisible({
        timeout: 25000,
      });
    } catch (error) {
      console.error(
        JSON.stringify(
          {
            diagnostics,
            errors,
            frames: page.frames().map((frame) => frame.url()),
          },
          null,
          2,
        ),
      );
      await test.info().attach("runtime-diagnostics", {
        body: JSON.stringify(
          {
            diagnostics,
            errors,
            frames: page.frames().map((frame) => frame.url()),
          },
          null,
          2,
        ),
        contentType: "application/json",
      });
      throw error;
    }
    expect(errors).toEqual([]);
    await expect(website.locator("body")).toHaveAttribute("data-script", "rewritten-script-ran");
    await expect(website.locator("body")).toHaveAttribute("data-fetched", "true");
    await expect(website.locator("body")).toHaveAttribute("data-cookies", /clientcookie=one/);
    await expect(website.locator("body")).toHaveAttribute("data-cookies", /servercookie=two/);
    await expect(page.locator("#browser-error")).toBeHidden();
    expect(errors).toEqual([]);
    await page.locator("#nav-collapse").click();
    await expect(page.locator("#show-controls")).toBeVisible();
    await page.locator("#show-controls").click();
    await page.locator("#nav-bookmark").click();
    await expect(page.locator("#bookmark-form [name=url]")).toHaveValue("http://localhost:8899/");
    await page.locator("#bookmark-dialog [data-close]").click();
    await website.getByRole("link", { name: "next page", exact: true }).click();
    await expect(website.getByRole("heading", { name: "next fixture page" })).toBeVisible();
    await expect(page.locator("#address")).toHaveValue("http://localhost:8899/next");
    await page.locator("#nav-back").click();
    await expect(website.getByRole("heading", { name: "owned relay works" })).toBeVisible();
    if (process.env.DEEP_PROXY_TESTS === "1") {
      // UV on WebKit buffers request bodies but its wasm transport never
      // delivers the POST payload; the whole deep block is skipped there and
      // recorded instead of asserted.
      const deepVerified = browserName !== "webkit" || engine.id !== "uv-3.2.10";
      if (deepVerified) {
        await page.locator("#address").fill("http://localhost:8899/deep");
        await page.locator("#address-form").evaluate((form) => form.requestSubmit());
        await expect(website.locator("body")).toHaveAttribute("data-post", "POST:payload=ojjy");
        // Firefox runs the rewritten dedicated-worker bootstrap silently without
        // delivering its first message on every release except alpha2, whose
        // workers become inline data URLs. Record the gap instead of asserting it.
        const workerVerified = browserName !== "firefox" || engine.id === "sj-2.0.2-alpha";
        if (workerVerified) {
          await expect(website.locator("body")).toHaveAttribute("data-worker", "worker ready");
        } else {
          test.info().annotations.push({
            type: "known-gap",
            description: `${engine.id}: dedicated workers await Firefox support`,
          });
        }
        await expect(website.locator("body")).toHaveAttribute("data-socket", "echo:hello");
        // Both client-set and server-set cookies must survive a full reload.
        await page.locator("#nav-reload").click();
        await expect(website.locator("body")).toHaveAttribute("data-fetched", "true");
        await expect(website.locator("body")).toHaveAttribute("data-cookies", /clientcookie=one/);
        await expect(website.locator("body")).toHaveAttribute("data-cookies", /servercookie=two/);
        await page.locator("#address").fill("http://localhost:8899/redirect");
        await page.locator("#address-form").evaluate((form) => form.requestSubmit());
        await expect(website.getByRole("heading", { name: "next fixture page" })).toBeVisible();
        await expect(page.locator("#address")).toHaveValue(
          "http://localhost:8899/next?from=redirect#spot",
        );
      } else {
        test.info().annotations.push({
          type: "known-gap",
          description: `${engine.id}: deep checks await WebKit transport support`,
        });
      }
    }
    await page.locator("#nav-settings").click();
    await page.locator("#settings-form [name=blocked]").fill("localhost");
    await page.locator("#switch-engine").click();
    await expect(
      website.getByText("This domain is blocked by your ojjyProxy domain filter.", { exact: true }),
    ).toBeVisible();
  });
}
test("two engines keep live tabs side by side", async ({ page }) => {
  const selectEngine = async (id) => {
    // The tabstrip settings button is reachable from both home and browsing.
    await page.locator("#global-settings").click();
    await page.locator("#engine-select").selectOption(id);
    await page.getByRole("button", { name: "save settings", exact: true }).click();
  };
  const open = async () => {
    await page.locator("#new-tab").click();
    await page.locator("#home-input").fill("http://localhost:8899/");
    await page.locator("#home-form").evaluate((form) => form.requestSubmit());
  };
  const frame = () => page.frameLocator(".runtime-frame:not([hidden])").frameLocator("#website");
  await page.goto("/");
  await selectEngine("sj-1.1.0");
  await open();
  await expect(frame().getByRole("heading", { name: "owned relay works" })).toBeVisible({
    timeout: 20000,
  });
  await expect(frame().locator("body")).toHaveAttribute("data-cookies", /clientcookie=one/);
  // Drop the initial blank tab so both remaining tabs carry live pages.
  await page.getByRole("button", { name: "Close new tab" }).click();
  // Keep the stable tab alive while Ultraviolet runs beside it.
  await selectEngine("uv-3.2.10");
  await open();
  await expect(frame().getByRole("heading", { name: "owned relay works" })).toBeVisible({
    timeout: 20000,
  });
  await expect(frame().locator("body")).toHaveAttribute("data-cookies", /clientcookie=one/);
  await expect(page.locator("#tabs .tab")).toHaveCount(2);
  // Switching back must show the first tab still loaded, not restarted.
  await page.locator("#tabs .tab").first().click();
  await expect(frame().locator("body")).toHaveAttribute("data-script", "rewritten-script-ran");
  await expect(frame().locator("body")).toHaveAttribute("data-cookies", /clientcookie=one/);
  await expect(page.locator("#address")).toHaveValue("http://localhost:8899/");
});
test("tabs reorder by drag and duplicate from the tab menu", async ({ page }) => {
  await page.goto("/");
  const open = async (target) => {
    await page.locator("#new-tab").click();
    await page.locator("#home-input").fill(target);
    await page.locator("#home-form").evaluate((form) => form.requestSubmit());
  };
  await open("http://localhost:8899/");
  const first = page.frameLocator(".runtime-frame:not([hidden])").frameLocator("#website");
  await expect(first.getByRole("heading", { name: "owned relay works" })).toBeVisible({
    timeout: 20000,
  });
  await open("http://localhost:8899/next");
  const second = page.frameLocator(".runtime-frame:not([hidden])").frameLocator("#website");
  await expect(second.getByRole("heading", { name: "next fixture page" })).toBeVisible({
    timeout: 20000,
  });
  await page.getByRole("button", { name: "Close new tab" }).click();
  await expect(page.locator("#tabs .tab")).toHaveCount(2);
  // Drag the second tab onto the first: it lands before it.
  await page.locator("#tabs .tab").nth(1).dragTo(page.locator("#tabs .tab").nth(0));
  await page.locator("#tabs .tab").first().click();
  await expect(page.locator("#address")).toHaveValue("http://localhost:8899/next");
  // The right-click menu duplicates the tab and activates the copy.
  await page.locator("#tabs .tab").first().click({ button: "right" });
  await page.screenshot({ path: "test-results/tab-menu.png", animations: "disabled" });
  await page.locator("#cm-duplicate").click();
  await expect(page.locator("#tabs .tab")).toHaveCount(3);
  await expect(page.locator("#address")).toHaveValue("http://localhost:8899/next");
  await expect(
    page.frameLocator(".runtime-frame:not([hidden])").frameLocator("#website").getByRole(
      "heading",
      { name: "next fixture page" },
    ),
  ).toBeVisible({ timeout: 20000 });
});
if (process.env.LIVE_PROXY_TESTS === "1") {
  for (const id of ["sj-1.1.0", "sj-2.0.67-alpha.2"]) {
    test(`${id} HTTPS destination through owned Wisp`, async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button", { name: "customize", exact: true }).click();
      await page.locator("#engine-select").selectOption(id);
      await page.getByRole("button", { name: "save settings", exact: true }).click();
      await page.locator("#new-tab").click();
      await page.locator("#home-input").fill("https://example.com/");
      await page.locator("#home-form").evaluate((form) => form.requestSubmit());
      await expect(
        page.frameLocator(".runtime-frame:not([hidden])").frameLocator("#website").locator("body"),
      ).toContainText("This domain", { timeout: 45000 });
    });
  }
}
test("site password gate serves a login page and unlocks with the right password", async ({ page }) => {
  // A second server instance with SITE_PASSWORD set exercises the real login
  // flow end to end, without affecting the shared dev stack on port 8000.
  const child = spawn(
    "deno",
    ["run", "--allow-net", "--allow-read=public", "--allow-env", "server.ts"],
    {
      env: {
        ...process.env,
        PORT: "8600",
        HOST: "127.0.0.1",
        SITE_PASSWORD: "e2e-gate-password",
      },
      stdio: "ignore",
    },
  );
  try {
    let ready = false;
    for (let attempt = 0; attempt < 80 && !ready; attempt++) {
      try {
        const probe = await fetch("http://127.0.0.1:8600/");
        if (probe.ok) ready = true;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
    expect(ready).toBe(true);
    await page.goto("http://127.0.0.1:8600/");
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator("#engine-select")).toHaveCount(0);
    await page.locator('input[name="password"]').fill("not-the-password");
    await page.locator("button[type=submit]").click();
    await expect(page.locator("#again")).toBeVisible();
    await page.locator('input[name="password"]').fill("e2e-gate-password");
    await page.locator("button[type=submit]").click();
    await expect(page.getByRole("heading", { name: "ojjyProxy", exact: true })).toBeVisible();
    // The cookie keeps the shell unlocked across reloads.
    await page.reload();
    await expect(page.getByRole("heading", { name: "ojjyProxy", exact: true })).toBeVisible();
  } finally {
    child.kill("SIGTERM");
  }
});
