import { spawn } from "node:child_process";
import { ENGINES } from "../public/shared.js";
const children = [];
const run = (command, args, env = {}) => {
  const child = spawn(command, args, { stdio: "inherit", env: { ...process.env, ...env } });
  children.push(child);
  child.on("error", (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on("exit", (code) => {
    if (code && !stopping) stop(code);
  });
};
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  setTimeout(() => process.exit(code), 300).unref();
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
// Runtimes validate the parent origin; in dev they must be told which port
// the shell runs on (server.ts only assumes 8000 when this is unset).
const devPort = process.env.DEV_PORT || "8000";
const parent = `http://localhost:${devPort}`;
const args = ["run", "--allow-net", "--allow-read=public", "--allow-env", "server.ts"];
run("deno", args, {
  PORT: devPort,
  HOST: "127.0.0.1",
  RUNTIME_ENGINE: "",
  PUBLIC_APP_ORIGIN: "",
});
for (const engine of ENGINES) {
  // The headless engine's runtime page is served by its own Node service
  // (headless/server.mjs), not by a Deno runtime.
  if (engine.id === "headless") continue;
  run("deno", args, {
    PORT: String(engine.port),
    HOST: "127.0.0.1",
    RUNTIME_ENGINE: engine.id,
    PUBLIC_APP_ORIGIN: parent,
  });
}
if (process.env.HEADLESS_SERVICE === "1") {
  run("node", ["headless/server.mjs"], {
    HEADLESS_PORT: "9100",
    HEADLESS_PARENT: parent,
    HEADLESS_SELF: "http://localhost:9100",
    HEADLESS_ORIGINS: "http://localhost:9100",
    // Dev only: let the remote browser reach the local test fixture.
    HEADLESS_ALLOW_PRIVATE: "1",
  });
}
run("node", ["relay/server.mjs"]);
console.log("ojjyProxy: http://localhost:8000 · owned local Wisp: ws://localhost:9000/wisp/");
