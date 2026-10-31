/**
 * PARADOX - Electron Main Process Entry
 * Manages native desktop window lifecycle, security hardening, and IPC handlers.
 */

import { app, BrowserWindow, ipcMain, shell, Menu } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow(): BrowserWindow {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    title: 'PARADOX',
    backgroundColor: '#000000',
    show: false, // Avoid white flash on startup
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: isDev,
    },
  });

  // Remove default menu for immersive game experience
  Menu.setApplicationMenu(null);

  // Show window smoothly when WebGL canvas is ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  // Load the compiled Vite app
  const indexPath = path.join(__dirname, '../dist/index.html');
  mainWindow.loadFile(indexPath).catch((err) => {
    console.error('Failed to load PARADOX application:', err);
  });

  // Guard navigation: open external links in default OS browser, never inside the app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow?.webContents.getURL()) {
      event.preventDefault();
      if (url.startsWith('https:') || url.startsWith('http:')) {
        shell.openExternal(url);
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

// IPC Handlers for desktop integration
ipcMain.handle('app:get-version', () => app.getVersion());

ipcMain.handle('app:toggle-fullscreen', () => {
  if (!mainWindow) return false;
  const isFullScreen = !mainWindow.isFullScreen();
  mainWindow.setFullScreen(isFullScreen);
  return isFullScreen;
});

ipcMain.handle('app:is-fullscreen', () => {
  return mainWindow?.isFullScreen() ?? false;
});

ipcMain.on('app:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('app:close', () => {
  mainWindow?.close();
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
