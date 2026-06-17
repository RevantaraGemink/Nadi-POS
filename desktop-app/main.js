const { app, BrowserWindow } = require('electron');
const { fork } = require('child_process');
const path = require('path');
const fs = require('fs');

let serverProcess;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false
    }
  });

  // Polling to wait for server to start
  const tryLoad = () => {
    mainWindow.loadURL('http://localhost:3000').catch(() => {
      setTimeout(tryLoad, 500);
    });
  };
  tryLoad();
}

app.whenReady().then(() => {
  // Setup database path
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'sqlite.db');

  // Skrip Migrasi Otomatis Database Lama
  // Jika database baru belum ada, kita salin database lama dari letak asalnya.
  // Jika Nadi POS dijalankan dari .exe, oldDbPath bisa ditaruh di folder yang sama dengan installer/exe
  const exeDir = path.dirname(app.getPath('exe'));
  const oldDbPath = path.join(exeDir, 'sqlite.db');
  
  if (!fs.existsSync(dbPath) && fs.existsSync(oldDbPath)) {
    try {
      fs.copyFileSync(oldDbPath, dbPath);
      console.log('Migrasi database lama berhasil!');
    } catch (e) {
      console.error('Gagal menyalin database lama:', e);
    }
  }

  // Path to bundled backend
  const serverPath = path.join(__dirname, 'server', 'index.js');
  
  serverProcess = fork(serverPath, [], {
    env: { ...process.env, DB_PATH: dbPath, PORT: 3000 }
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') app.quit();
});
