import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";

test(
  "documented Deno start task serves shell configuration and workspace assets with restricted permissions",
  { timeout: 20000 },
  async () => {
    const socket = net.createServer();
    await new Promise((resolve) => socket.listen(0, "127.0.0.1", resolve));
    const port = socket.address().port;
    await new Promise((resolve) => socket.close(resolve));
    const child = spawn("deno", ["task", "start"], {
      cwd: new URL("../", import.meta.url),
      detached: true,
      env: {
        ...process.env,
        DENO_NO_PROMPT: "1",
        PORT: String(port),
        HOST: "127.0.0.1",
        RUNTIME_ENGINE: "sj-1.1.0",
        SINGLE_RUNTIME: "1",
        RUNTIME_ORIGINS: "",
        PUBLIC_APP_ORIGIN: "",
        WISP_URL: "",
        SITE_PASSWORD: "",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const exited = new Promise((resolve) => child.once("close", resolve));
    let timer, output = "";
    try {
      await new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`Deno startup timed out: ${output}`)), 15000);
        const receive = (data) => {
          output += data;
          if (output.includes("Listening on")) resolve();
        };
        child.stdout.on("data", receive);
        child.stderr.on("data", receive);
        child.once("error", reject);
        child.once("exit", (code) => reject(new Error(`Deno exited ${code}: ${output}`)));
      });
      const base = `http://127.0.0.1:${port}`;
      const configResponse = await fetch(base + "/api/config");
      assert.equal(configResponse.status, 200, output);
      const config = await configResponse.json();
      assert.equal(config.compact, true);
      assert.equal(config.runtimes["sj-1.1.0"], base);
      const home = await fetch(base + "/");
      assert.match(await home.text(), /workspace.css/);
      for (const asset of ["/studio.js", "/workspace.js", "/workspace.css"]) {
        const response = await fetch(base + asset);
        assert.equal(response.status, 200, asset);
        await response.arrayBuffer();
      }
    } finally {
      clearTimeout(timer);
      if (child.pid) {
        try {
          process.kill(-child.pid, "SIGTERM");
        } catch {
          child.kill("SIGTERM");
        }
      }
      await exited;
    }
  },
);
