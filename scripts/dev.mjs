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
const parent = `http://localhost:${process.env.DEV_PORT || "8000"}`;
const args = ["run", "--allow-net", "--allow-read=public", "--allow-env", "server.ts"];
run("deno", args, {
  PORT: process.env.DEV_PORT || "8000",
  HOST: "127.0.0.1",
  RUNTIME_ENGINE: "",
  PUBLIC_APP_ORIGIN: "",
});
for (const engine of ENGINES) {
  run("deno", args, {
    PORT: String(engine.port),
    HOST: "127.0.0.1",
    RUNTIME_ENGINE: engine.id,
    PUBLIC_APP_ORIGIN: parent,
  });
}
run("node", ["relay/server.mjs"]);
console.log("ojjyProxy: http://localhost:8000 · owned local Wisp: ws://localhost:9000/wisp/");
