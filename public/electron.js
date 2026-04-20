const { app, BrowserWindow, ipcMain, globalShortcut } = require("electron");
const { autoUpdater } = require("electron-updater");
const pdfWindow = require("electron-pdf-window");
const path = require("path");
const argv = require("yargs").parse(process.argv.slice(1));

const http = require("http");
const fs = require("fs");
const os = require("os");

const { setMainMenu } = require("./menu");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// Allow videos to autoplay without user gesture (fixes YouTube Error 152 from autoplay constraints)
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

// Performance: enable hardware video decoding and prevent background throttling
app.commandLine.appendSwitch("enable-features", "VaapiVideoDecoder,VaapiVideoEncoder");
app.commandLine.appendSwitch("disable-renderer-backgrounding"); // Keep video running when window is not focused
app.commandLine.appendSwitch("disable-background-timer-throttling"); // Prevent JS timers from slowing down
app.commandLine.appendSwitch("enable-gpu-rasterization"); // GPU-accelerated rendering

// Add flash support. If $USER_HOME/.pennywise-flash exists as plugin directory or symlink uses that.
const flashPath = path.join(os.homedir(), ".pennywise-flash");
if (flashPath && fs.existsSync(flashPath)) {
  try {
    app.commandLine.appendSwitch(
      "ppapi-flash-path",
      fs.realpathSync(flashPath)
    );
    console.log("Attempting to load flash at " + flashPath);
  } catch (e) {
    console.log("Error finding flash at " + flashPath + ": " + e.message);
  }
}

function createWindow() {
  // Modern user agent to ensure compatibility with YouTube and other sites
  const modernUserAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  mainWindow = new BrowserWindow({
    title: "Pennywise",
    width: 700,
    height: 600,
    autoHideMenuBar: true,
    backgroundColor: "#16171a",
    show: false,
    frame: argv.frameless ? false : true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      webviewTag: true,
      allowRunningInsecureContent: false,
      backgroundThrottling: false,     // Keep rendering even when window is behind other apps
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Set modern user agent for YouTube compatibility
  mainWindow.webContents.setUserAgent(modernUserAgent);

  pdfWindow.addSupport(mainWindow);

  bindIpc(); // Bind IPC before loading the URL to prevent "channel without listeners" errors

  const isDev = !!process.env.APP_URL;
  if (process.env.APP_URL) {
    mainWindow.loadURL(process.env.APP_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../build/index.html"));
  }

  // Show the window once the content has been loaded
  mainWindow.on("ready-to-show", () => {
    // Hide the dock icon before showing and
    // show it once the app has been displayed
    // @link https://github.com/electron/electron/issues/10078
    // @fixme hack to make it show on full-screen windows
    app.dock && app.dock.hide();
    mainWindow.show();
    app.dock && app.dock.show();

    // Set the window to be always on top - like native PiP
    mainWindow.setAlwaysOnTop(true, "screen-saver", 1);
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    mainWindow.setFullScreenable(false);
  });

  mainWindow.on("closed", function () {
    mainWindow = null;
  });

  // Open the dev tools only for dev and when the flag is not set
  if (isDev && !process.env.DEV_TOOLS) {
    mainWindow.webContents.openDevTools();
  }

  setMainMenu(mainWindow);

  // Global shortcut: Cmd+Shift+X — toggle click-through (ghost/detach mode)
  // The window becomes transparent to mouse clicks so you can interact with apps behind it
  globalShortcut.unregisterAll();
  let isClickThrough = false;
  globalShortcut.register("CommandOrControl+Shift+X", () => {
    if (!mainWindow) return;
    isClickThrough = !isClickThrough;
    mainWindow.setIgnoreMouseEvents(isClickThrough, { forward: true });
    // Visual indicator: slightly reduce opacity when in click-through mode
    mainWindow.setOpacity(isClickThrough ? 0.85 : 1.0);
    app.dock && app.dock.setBadge(isClickThrough ? "👻" : "");
  });
}

// Binds the methods for renderer/electron communication
function bindIpc() {
  // Remove existing listeners to prevent duplicates on window recreation
  ipcMain.removeAllListeners("opacity.get");
  ipcMain.removeAllListeners("opacity.set");
  ipcMain.removeAllListeners("argv.get");

  // Binds the opacity getter functionality
  ipcMain.on("opacity.get", (event) => {
    // Multiplying by 100 – browser range is 0 to 100
    if (mainWindow) event.returnValue = mainWindow.getOpacity() * 100;
    else event.returnValue = 100;
  });

  ipcMain.on("opacity.set", (event, opacity) => {
    // Divide by 100 – window range is 0.1 to 1.0
    if (mainWindow) mainWindow.setOpacity(opacity / 100);
  });

  // Provide command line arguments to renderer
  ipcMain.on("argv.get", (event) => {
    event.returnValue = argv;
  });
}

// Makes the app start receiving the mouse interactions again
function disableDetachedMode() {
  app.dock && app.dock.setBadge("");
  mainWindow && mainWindow.setIgnoreMouseEvents(false);
}

function checkAndDownloadUpdate() {
  // Only check for updates in packaged production builds
  if (!app.isPackaged) return;
  try {
    autoUpdater.checkForUpdatesAndNotify();
  } catch (e) {
    console.log(e.message);
  }
}

/**
 * Starts the server on 127.0.0.1:6280 that accepts the URL and loads
 * that URL in the application
 */
function listenUrlLoader() {
  const server = http.createServer((request, response) => {
    let target_url = new URL(request.url, "http://localhost").searchParams.getAll("url").pop();

    if (target_url) {
      mainWindow.webContents.send("url.requested", target_url);
    }

    response.writeHeader(200);
    response.end();
  });

  server.listen(6280, "0.0.0.0");
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", function () {
  // Configure session for better web compatibility
  const { session } = require("electron");
  const ses = session.defaultSession;

  // Set user agent and referer for all requests
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders["User-Agent"] =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    
    // Add a Referer to bypass YouTube embed block (Error 153/152)
    if (details.url.includes("youtube") || details.url.includes("youtu.be") || details.url.includes("googlevideo.com")) {
      details.requestHeaders["Referer"] = "https://www.youtube.com/";
    }
    
    callback({ requestHeaders: details.requestHeaders });
  });

  // Enable media devices for YouTube
  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = [
      "media",
      "geolocation",
      "notifications",
      "fullscreen",
    ];
    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
  });

  createWindow();
  checkAndDownloadUpdate();
  listenUrlLoader();
});

// Make the window start receiving mouse events on focus/activate
app.on("browser-window-focus", disableDetachedMode);
// Note: do NOT call disableDetachedMode on activate – it would cancel the Cmd+Shift+X ghost mode

// Quit when all windows are closed.
app.on("window-all-closed", function () {
  app.quit();
});

app.on("activate", function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// Unregister all shortcuts when the app quits to avoid leaks
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
