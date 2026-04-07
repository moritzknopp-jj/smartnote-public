const { app, BrowserWindow } = require('electron');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer', 'false');
app.on('ready', () => {
  const win = new BrowserWindow({ width: 400, height: 300, alwaysOnTop: true });
  win.loadURL('data:text/html,<h1>Hello from Electron!</h1>');
});
