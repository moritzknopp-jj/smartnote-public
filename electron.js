const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let mainWindow;
let nextServerProcess = null;

const DEV_URL = 'http://localhost:3000';
const PROD_PORT = process.env.PORT || '3000';
const PROD_URL = `http://127.0.0.1:${PROD_PORT}`;

function waitForServer(url, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;

    function check() {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });

      req.on('error', () => {
        if (Date.now() > deadline) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }
        setTimeout(check, 400);
      });
    }

    check();
  });
}

async function startProductionServer() {
  if (nextServerProcess) {
    return;
  }

  const serverScriptPath = path.join(__dirname, '.next', 'standalone', 'server.js');
  nextServerProcess = spawn(process.execPath, [serverScriptPath], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: PROD_PORT,
      HOSTNAME: '127.0.0.1',
      ELECTRON_RUN_AS_NODE: '1',
    },
    stdio: 'pipe',
    windowsHide: true,
  });

  nextServerProcess.stdout.on('data', (chunk) => {
    console.log(`[next] ${String(chunk).trim()}`);
  });

  nextServerProcess.stderr.on('data', (chunk) => {
    console.error(`[next] ${String(chunk).trim()}`);
  });

  nextServerProcess.on('exit', (code, signal) => {
    console.log(`Next server exited (code=${code}, signal=${signal})`);
    nextServerProcess = null;
  });

  await waitForServer(PROD_URL);
}

async function createWindow() {
  console.log('Attempting to create Electron window...');
  const isDev = !app.isPackaged;

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    x: 100,
    y: 100,
    show: false,
    alwaysOnTop: false,
    icon: path.join(__dirname, 'public', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    console.log(`Loading URL: ${DEV_URL}`);
    await mainWindow.loadURL(DEV_URL);
  } else {
    console.log('Starting bundled Next.js production server...');
    await startProductionServer();
    console.log(`Loading URL: ${PROD_URL}`);
    await mainWindow.loadURL(PROD_URL);
  }

  mainWindow.once('ready-to-show', () => {
    console.log('Window ready-to-show, showing now.');
    mainWindow.show();
    mainWindow.focus();
  });
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window did-finish-load.');
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });
  mainWindow.webContents.on('did-fail-load', (_event, code, description, validatedURL) => {
    console.error(`Window did-fail-load: code=${code}, description=${description}, url=${validatedURL}`);
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}


app.whenReady().then(() => {
  console.log('App is ready. Creating window...');
  createWindow().catch((error) => {
    console.error('Failed to create main window:', error);
    app.quit();
  });
});

app.on('activate', () => {
  if (mainWindow === null) {
    console.log('App activated. Creating window...');
    createWindow().catch((error) => {
      console.error('Failed to recreate main window:', error);
    });
  }
});

app.on('window-all-closed', () => {
  if (nextServerProcess) {
    nextServerProcess.kill();
    nextServerProcess = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});