"use strict";

const {
  app,
  BrowserWindow,
  shell,
} = require("electron");
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");
const { spawn } = require("node:child_process");

const isPackaged = app.isPackaged;
const repoRoot = path.resolve(__dirname, "..");
const resourceRoot = isPackaged
  ? path.join(process.resourcesPath, "backend")
  : repoRoot;
const pythonRoot = isPackaged
  ? path.join(process.resourcesPath, "python")
  : path.join(repoRoot, ".a0-build", "python");
const nodeRoot = isPackaged
  ? path.join(process.resourcesPath, "node")
  : path.join(repoRoot, ".a0-build", "node");
const playwrightRoot = isPackaged
  ? path.join(process.resourcesPath, "playwright")
  : path.join(repoRoot, ".a0-build", "playwright");
const chromiumExecutable = isPackaged
  ? path.join(process.resourcesPath, "chromium", "chrome-win64", "chrome.exe")
  : path.join(repoRoot, ".a0-build", "chromium", "chrome-win64", "chrome.exe");
const userRoot = process.env.A0_USER_DIR || (isPackaged
  ? path.join(app.getPath("userData"), "usr")
  : path.join(repoRoot, ".a0-dev-data", "usr"));
const logRoot = path.join(app.getPath("userData"), "logs");

let mainWindow;
let backendProcess;
let backendLogFd;
let stopping = false;

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function ensureUserLayout() {
  for (const relative of [
    "agents",
    "extensions",
    "plugins",
    "projects",
    "tmp",
    "workdir",
  ]) {
    ensureDirectory(path.join(userRoot, relative));
  }
}

function firstExisting(paths) {
  return paths.find((candidate) => candidate && fs.existsSync(candidate));
}

function findPython() {
  const bundled = path.join(pythonRoot, "python.exe");
  const development = path.join(repoRoot, ".venv", "Scripts", "python.exe");
  return (
    process.env.A0_PYTHON_EXECUTABLE ||
    firstExisting([bundled, development]) ||
    "python.exe"
  );
}

function findNode() {
  const bundled = path.join(nodeRoot, "node.exe");
  return process.env.A0_NODE_EXECUTABLE || firstExisting([bundled]) || "node.exe";
}

function reserveLoopbackPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

function waitForHttp(url, timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      if (Date.now() > deadline) {
        reject(new Error(`Agent Zero did not become ready: ${url}`));
        return;
      }
      const request = http.get(url, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode < 500) {
          resolve();
        } else {
          setTimeout(attempt, 500);
        }
      });
      request.on("error", () => setTimeout(attempt, 500));
      request.setTimeout(1500, () => request.destroy());
    };
    attempt();
  });
}

function buildBackendEnvironment(port) {
  ensureDirectory(userRoot);
  ensureUserLayout();
  ensureDirectory(logRoot);
  const nodeExecutable = findNode();
  const env = {
    ...process.env,
    A0_BASE_DIR: resourceRoot,
    A0_USER_DIR: userRoot,
    A0_NATIVE_WINDOWS: "1",
    A0_PYTHON_EXECUTABLE: findPython(),
    A0_NODE_EXECUTABLE: nodeExecutable,
    A0_NODE_EVAL_SCRIPT: path.join(resourceRoot, "windows-native", "node_eval.cjs"),
    A0_BROWSER_EXECUTABLE_PATH: chromiumExecutable,
    PLAYWRIGHT_BROWSERS_PATH: playwrightRoot,
    WEB_UI_HOST: "127.0.0.1",
    WEB_UI_PORT: String(port),
    A0_SET_workdir_path: path.join(userRoot, "workdir"),
    A0_SET_rfc_auto_docker: "false",
    A0_SET_update_check_enabled: "false",
    A0_SET_uvicorn_access_logs_enabled: "false",
    PYTHONNOUSERSITE: "1",
    PYTHONUTF8: "1",
  };
  env.PATH = [
    path.dirname(env.A0_PYTHON_EXECUTABLE),
    nodeRoot,
    process.env.PATH || "",
  ].join(path.delimiter);
  return env;
}

function writeBackendLog(message) {
  if (typeof backendLogFd !== "number") return;
  try {
    fs.writeSync(backendLogFd, message);
  } catch {
    // Logging must never prevent shutdown or surface the backend UI.
  }
}

function closeBackendLog() {
  if (typeof backendLogFd !== "number") return;
  try {
    fs.closeSync(backendLogFd);
  } catch {
    // The descriptor may already be closed after a spawn failure.
  }
  backendLogFd = undefined;
}

function startBackend(port) {
  const python = findPython();
  const script = path.join(resourceRoot, "run_ui.py");
  const env = buildBackendEnvironment(port);
  const logPath = path.join(logRoot, "agent-zero-backend.log");
  backendLogFd = fs.openSync(logPath, "a");
  writeBackendLog(`\n[${new Date().toISOString()}] starting native backend\n`);
  writeBackendLog(`python=${python}\nroot=${resourceRoot}\nuser=${userRoot}\n`);
  try {
    backendProcess = spawn(
      python,
      [script, `--host=127.0.0.1`, `--port=${port}`],
      {
        cwd: resourceRoot,
        env,
        shell: false,
        windowsHide: true,
        stdio: ["ignore", backendLogFd, backendLogFd],
      },
    );
    writeBackendLog(`pid=${backendProcess.pid}\n`);
  } catch (error) {
    writeBackendLog(`[spawn-throw] ${error?.stack || error}\n`);
    closeBackendLog();
    throw error;
  }
  backendProcess.on("error", (error) => {
    writeBackendLog(`[spawn-error] ${error.stack || error}\n`);
  });
  backendProcess.on("exit", (code, signal) => {
    writeBackendLog(`[exit] code=${code} signal=${signal}\n`);
    if (!stopping && mainWindow && !mainWindow.isDestroyed()) {
      showRuntimeError(
        new Error(`Agent Zero backend stopped (code=${code}, signal=${signal})`),
      );
    }
  });
}

function showRuntimeError(error) {
  const message = String(error?.stack || error).replaceAll("&", "&amp;").replaceAll("<", "&lt;");
  const html = `<!doctype html><meta charset="utf-8"><title>Agent Zero Windows</title><style>body{font:15px system-ui;background:#111827;color:#f9fafb;padding:32px}pre{white-space:pre-wrap;background:#1f2937;padding:16px;border-radius:8px}code{color:#fca5a5}</style><h1>Agent Zero no pudo iniciar</h1><p>El backend nativo no está listo. Revisa el log local.</p><pre>${message}</pre><p>Log: <code>${path.join(logRoot, "agent-zero-backend.log")}</code></p>`;
  mainWindow?.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  if (mainWindow && !mainWindow.isVisible()) mainWindow.show();
}

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#111827",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    if (/^https?:\/\//i.test(target)) shell.openExternal(target);
    return { action: "deny" };
  });
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("closed", () => {
    mainWindow = undefined;
  });
  mainWindow.loadURL(url).catch(showRuntimeError);
}

function stopBackend() {
  stopping = true;
  if (!backendProcess) {
    closeBackendLog();
    return Promise.resolve();
  }
  const child = backendProcess;
  let finished = false;
  return new Promise((resolve) => {
    const finish = () => {
      if (finished) return;
      finished = true;
      closeBackendLog();
      backendProcess = undefined;
      resolve();
    };
    const timer = setTimeout(() => {
      const killer = spawn(
        "taskkill.exe",
        ["/PID", String(child.pid), "/T", "/F"],
        { windowsHide: true, shell: false, stdio: "ignore" },
      );
      killer.once("exit", finish);
      killer.once("error", finish);
    }, 5000);
    child.once("exit", () => {
      clearTimeout(timer);
      finish();
    });
    child.kill();
  });
}

async function boot() {
  const port = await reserveLoopbackPort();
  startBackend(port);
  const url = `http://127.0.0.1:${port}`;
  try {
    await waitForHttp(`${url}/api/health`);
    createWindow(url);
  } catch (error) {
    createWindow("data:text/html;charset=utf-8,<h1>Starting Agent Zero...</h1>");
    showRuntimeError(error);
  }
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  app.whenReady().then(boot).catch((error) => {
    if (!mainWindow) createWindow("data:text/html;charset=utf-8,<h1>Agent Zero startup error</h1>");
    showRuntimeError(error);
  });
  app.on("before-quit", (event) => {
    if (backendProcess && !stopping) {
      event.preventDefault();
      stopBackend().finally(() => app.quit());
    }
  });
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
