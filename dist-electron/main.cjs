var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/main.ts
var import_electron = require("electron");
var path = __toESM(require("path"), 1);
var mainWindow = null;
function createWindow() {
  const isDev = process.env.NODE_ENV === "development" || !import_electron.app.isPackaged;
  mainWindow = new import_electron.BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    title: "PARADOX",
    backgroundColor: "#000000",
    show: false,
    // Avoid white flash on startup
    icon: path.join(__dirname, "../build/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: isDev
    }
  });
  import_electron.Menu.setApplicationMenu(null);
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
  const indexPath = path.join(__dirname, "../dist/index.html");
  mainWindow.loadFile(indexPath).catch((err) => {
    console.error("Failed to load PARADOX application:", err);
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:") || url.startsWith("http:")) {
      import_electron.shell.openExternal(url);
    }
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (url !== mainWindow?.webContents.getURL()) {
      event.preventDefault();
      if (url.startsWith("https:") || url.startsWith("http:")) {
        import_electron.shell.openExternal(url);
      }
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  return mainWindow;
}
import_electron.ipcMain.handle("app:get-version", () => import_electron.app.getVersion());
import_electron.ipcMain.handle("app:toggle-fullscreen", () => {
  if (!mainWindow) return false;
  const isFullScreen = !mainWindow.isFullScreen();
  mainWindow.setFullScreen(isFullScreen);
  return isFullScreen;
});
import_electron.ipcMain.handle("app:is-fullscreen", () => {
  return mainWindow?.isFullScreen() ?? false;
});
import_electron.ipcMain.on("app:minimize", () => {
  mainWindow?.minimize();
});
import_electron.ipcMain.on("app:close", () => {
  mainWindow?.close();
});
import_electron.app.whenReady().then(() => {
  createWindow();
  import_electron.app.on("activate", () => {
    if (import_electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
import_electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron.app.quit();
  }
});
