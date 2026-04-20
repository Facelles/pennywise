const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  getOpacity: () => ipcRenderer.sendSync("opacity.get"),
  setOpacity: (opacity) => ipcRenderer.send("opacity.set", opacity),

  // Get command line arguments from main process
  getArgv: () => ipcRenderer.sendSync("argv.get"),

  // Add any other IPC methods you need here
  openDevTools: () => ipcRenderer.send("open-dev-tools"),
  minimize: () => ipcRenderer.send("minimize"),
  close: () => ipcRenderer.send("close"),

  // IPC listeners
  on: (channel, callback) => ipcRenderer.on(channel, callback),
  removeEventListener: (channel, callback) =>
    ipcRenderer.removeListener(channel, callback),
  send: (channel, data) => ipcRenderer.send(channel, data),
  sendSync: (channel, data) => ipcRenderer.sendSync(channel, data),
});
