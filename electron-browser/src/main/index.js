const { app, BrowserWindow, ipcMain, session, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,    // enable <webview> elements
      webSecurity: false   // allow cross-origin loading inside webviews
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 20 },
    show: false,
    backgroundColor: '#f6fbf5'
  });

  mainWindow.loadFile(path.join(__dirname, '../../public/index.html'));

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.on('closed', () => { mainWindow = null; });

  // Permission handler for webviews
  session.defaultSession.setPermissionRequestHandler((wc, permission, callback) => {
    const allowed = ['media', 'camera', 'microphone', 'notifications'];
    callback(allowed.includes(permission));
  });

  // new-window events from webviews are handled in the renderer process

  // Build application menu
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Tab',
          accelerator: 'CmdOrCtrl+T',
          click: () => mainWindow && mainWindow.webContents.send('menu:new-tab')
        },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => mainWindow && mainWindow.webContents.send('menu:close-tab')
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Navigate',
      submenu: [
        { label: 'Go Back',    accelerator: 'CmdOrCtrl+[', click: () => mainWindow && mainWindow.webContents.send('menu:go-back') },
        { label: 'Go Forward', accelerator: 'CmdOrCtrl+]', click: () => mainWindow && mainWindow.webContents.send('menu:go-forward') },
        { label: 'Reload',     accelerator: 'CmdOrCtrl+R', click: () => mainWindow && mainWindow.webContents.send('menu:reload') },
        { type: 'separator' },
        { label: 'Focus URL Bar', accelerator: 'CmdOrCtrl+L', click: () => mainWindow && mainWindow.webContents.send('menu:focus-url') }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    { role: 'windowMenu' }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC
ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('open-external', async (_event, url) => {
  const { shell } = require('electron');
  await shell.openExternal(url);
});
