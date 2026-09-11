const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const main = fs.readFileSync(path.join(root, "electron", "main.cjs"), "utf8");
const preload = fs.readFileSync(path.join(root, "electron", "preload.cjs"), "utf8");
const builder = fs.readFileSync(
  path.join(root, "electron", "electron-builder.yml"),
  "utf8",
);

test("Electron backend spawn is hidden, loopback-only, and shell-free", () => {
  assert.match(main, /windowsHide:\s*true/);
  assert.match(main, /shell:\s*false/);
  assert.match(main, /127\.0\.0\.1/);
  assert.match(main, /listen\(0,\s*["']127\.0\.0\.1["']/);
  assert.match(main, /requestSingleInstanceLock/);
  assert.match(main, /A0_BROWSER_EXECUTABLE_PATH/);
  assert.match(main, /A0_USER_DIR \|\|/);
  assert.match(main, /ensureUserLayout/);
  assert.match(main, /fs\.openSync/);
  assert.match(main, /stdio: \["ignore", backendLogFd, backendLogFd\]/);
  assert.doesNotMatch(main, /shell:\s*true/);
});

test("renderer keeps Electron isolation and displays native warning", () => {
  assert.match(main, /contextIsolation:\s*true/);
  assert.match(main, /nodeIntegration:\s*false/);
  assert.match(main, /sandbox:\s*true/);
  assert.match(preload, /no Docker sandbox/i);
  assert.match(preload, /Agent commands can access this computer/i);
});

test("Windows installer and portable targets are declared", () => {
  assert.match(builder, /- nsis/);
  assert.match(builder, /- portable/);
  assert.match(builder, /staging\/python/);
  assert.match(builder, /staging\/node/);
  assert.match(builder, /staging\/chromium/);
});
