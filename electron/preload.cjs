const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('launcher', {
  // Ventana
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  // Juegos
  getConfig: () => ipcRenderer.invoke('games:getConfig'),
  checkUpdate: (gameId) => ipcRenderer.invoke('games:checkUpdate', gameId),
  install: (gameId) => ipcRenderer.invoke('games:install', gameId),
  launch: (gameId) => ipcRenderer.invoke('games:launch', gameId),
  uninstall: (gameId) => ipcRenderer.invoke('games:uninstall', gameId),

  // Progreso de descarga (listener)
  onDownloadProgress: (callback) => {
    ipcRenderer.on('games:downloadProgress', (_, data) => callback(data));
  },
  removeDownloadListeners: () => {
    ipcRenderer.removeAllListeners('games:downloadProgress');
  },

  // Ajustes
  getSettings: () => ipcRenderer.invoke('settings:get'),
  changeGamesDir: () => ipcRenderer.invoke('settings:changeGamesDir'),

  // Links externos
  openLink: (url) => ipcRenderer.send('link:open', url),
});
