import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const [, , url, output] = process.argv;

if (!url || !output) {
  throw new Error("Usage: node scripts/capture-game-shot.mjs <url> <output>");
}

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9333 + Math.floor(Math.random() * 1000);
const userDataDir = `/private/tmp/heartstamp-shot-${port}`;

const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  "about:blank",
], { stdio: "ignore" });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getJson(path) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`);
  if (!res.ok) throw new Error(`Chrome debugging endpoint failed: ${res.status}`);
  return res.json();
}

async function putJson(path) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`, { method: "PUT" });
  if (!res.ok) throw new Error(`Chrome debugging endpoint failed: ${res.status}`);
  return res.json();
}

async function waitForChrome() {
  for (let i = 0; i < 80; i++) {
    try {
      await getJson("/json/version");
      return;
    } catch {
      await sleep(100);
    }
  }
  throw new Error("Chrome did not expose a debugging endpoint in time");
}

let seq = 0;
function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  });
  return new Promise((resolve, reject) => {
    ws.addEventListener("open", () => {
      resolve({
        send(method, params = {}) {
          const id = ++seq;
          ws.send(JSON.stringify({ id, method, params }));
          return new Promise((resolveCmd, rejectCmd) => {
            pending.set(id, { resolve: resolveCmd, reject: rejectCmd });
          });
        },
        close() {
          ws.close();
        },
      });
    });
    ws.addEventListener("error", reject);
  });
}

const clickStartScript = `
(() => {
  const words = ["start", "play", "begin", "match", "brew", "sort", "merge"];
  const buttons = [...document.querySelectorAll("button, a")];
  const visible = buttons.filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 20 && r.height > 20 && getComputedStyle(el).visibility !== "hidden";
  });
  const primary = visible.find((el) => {
    const txt = (el.textContent || "").toLowerCase();
    return words.some((w) => txt.includes(w)) && !txt.includes("how to play");
  });
  if (primary) {
    primary.click();
    return { clicked: true, text: primary.textContent };
  }
  return { clicked: false, count: visible.length };
})()
`;

try {
  await waitForChrome();
  const target = await putJson(`/json/new?${encodeURIComponent(url)}`);
  const client = await connect(target.webSocketDebuggerUrl);
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 1200,
    height: 750,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await client.send("Page.navigate", { url });
  await sleep(3200);
  await client.send("Runtime.evaluate", { expression: clickStartScript, awaitPromise: true });
  await sleep(3000);
  const shot = await client.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  await mkdir(dirname(fileURLToPath(new URL(output, `file://${process.cwd()}/`))), { recursive: true });
  await writeFile(output, Buffer.from(shot.data, "base64"));
  client.close();
} finally {
  chrome.kill("SIGTERM");
}
