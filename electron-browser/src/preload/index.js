const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Listen for menu events
  onMenuNewTab: (cb) => ipcRenderer.on('menu:new-tab', cb),
  onMenuCloseTab: (cb) => ipcRenderer.on('menu:close-tab', cb),
  onMenuGoBack: (cb) => ipcRenderer.on('menu:go-back', cb),
  onMenuGoForward: (cb) => ipcRenderer.on('menu:go-forward', cb),
  onMenuReload: (cb) => ipcRenderer.on('menu:reload', cb),
  onMenuFocusUrl: (cb) => ipcRenderer.on('menu:focus-url', cb),
  onOpenUrlInNewTab: (cb) => ipcRenderer.on('open-url-in-new-tab', (event, url) => cb(url)),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
