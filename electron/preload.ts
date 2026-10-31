/**
 * PARADOX - Electron Preload Script
 * Exposes a minimal, hardened API via contextBridge.
 * Follows security best practices: contextIsolation: true, nodeIntegration: false.
 */

import { contextBridge, ipcRenderer } from 'electron';

export interface ParadoxDesktopAPI {
  isElectron: boolean;
  platform: string;
  getVersion: () => Promise<string>;
  toggleFullscreen: () => Promise<boolean>;
  isFullscreen: () => Promise<boolean>;
  minimizeWindow: () => void;
  closeWindow: () => void;
}

const paradoxAPI: ParadoxDesktopAPI = {
  isElectron: true,
  platform: process.platform,
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  toggleFullscreen: () => ipcRenderer.invoke('app:toggle-fullscreen'),
  isFullscreen: () => ipcRenderer.invoke('app:is-fullscreen'),
  minimizeWindow: () => ipcRenderer.send('app:minimize'),
  closeWindow: () => ipcRenderer.send('app:close'),
};

contextBridge.exposeInMainWorld('paradoxDesktop', paradoxAPI);
