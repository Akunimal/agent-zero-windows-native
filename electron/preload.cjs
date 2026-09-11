"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("agentZeroWindows", {
  nativeWindows: true,
  sandboxWarning: "Native Windows mode has no Docker sandbox.",
  chooseProjectFolder: () => ipcRenderer.invoke("agent-zero:choose-folder"),
});

window.addEventListener("DOMContentLoaded", () => {
  const banner = document.createElement("div");
  banner.id = "agent-zero-native-warning";
  banner.textContent =
    "⚠ Native Windows mode: no Docker sandbox. Agent commands can access this computer.";
  Object.assign(banner.style, {
    position: "fixed",
    top: "0",
    left: "0",
    right: "0",
    zIndex: "2147483647",
    padding: "6px 12px",
    background: "#7f1d1d",
    color: "#fff",
    font: "12px/1.35 system-ui, sans-serif",
    textAlign: "center",
    boxSizing: "border-box",
    pointerEvents: "none",
  });
  document.body.appendChild(banner);
  document.body.style.paddingTop = "28px";
});
