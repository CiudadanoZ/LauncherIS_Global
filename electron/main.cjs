const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { exec } = require('child_process');

// --- Configuración de rutas ---
const USER_DATA = app.getPath('userData');
const GAMES_DIR = path.join(USER_DATA, 'games');
const STATE_FILE = path.join(USER_DATA, 'state.json');

// --- Estado inicial ---
let state = loadState();
let mainWindow;

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {}
  return { installedGames: {}, settings: { gamesDir: GAMES_DIR } };
}

function saveState() {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// --- Fetch Configuración Dinámica ---
let cachedConfig = null;
const CONFIG_URL = 'https://raw.githubusercontent.com/CiudadanoZ/LauncherIS_Global/main/public/games.json';

function getGamesConfig() {
  return new Promise((resolve) => {
    https.get(CONFIG_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          cachedConfig = JSON.parse(data);
          resolve(cachedConfig);
        } catch (e) {
          resolveFallback();
        }
      });
    }).on('error', () => resolveFallback());

    function resolveFallback() {
      if (cachedConfig) return resolve(cachedConfig);
      try {
        const configPath = path.join(__dirname, 'games.json');
        cachedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        resolve(cachedConfig);
      } catch(e) {
        resolve({ games: [] });
      }
    }
  });
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// --- Crear ventana principal ---
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 760,
    minWidth: 1000,
    minHeight: 650,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    // icon: path.join(__dirname, '..', 'public', 'icon.png'),
  });

  if (app.isPackaged) {
    // En producción (cuando está compilado), carga los archivos locales empaquetados
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html')).catch(err => {
      console.error('Failed to load local HTML', err);
    });
  } else {
    // En desarrollo, carga Vite localhost
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  ensureDir(GAMES_DIR);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ============================================================
// IPC HANDLERS — comunicación con el frontend de React/Vite
// ============================================================

// Control de ventana
ipcMain.on('window:minimize', () => mainWindow.minimize());
ipcMain.on('window:maximize', () => {
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
});
ipcMain.on('window:close', () => mainWindow.close());

// Obtener configuración de juegos
ipcMain.handle('games:getConfig', async () => {
  const config = await getGamesConfig();
  
  // Enriquecer con estado local (instalado o no)
  config.games = config.games.map(game => {
    if (game.localDir) {
      return {
        ...game,
        installed: true,
        installedVersion: game.version || 'Local',
        installPath: game.localDir,
      };
    }
    return {
      ...game,
      installed: !!state.installedGames[game.id],
      installedVersion: state.installedGames[game.id]?.version || null,
      installPath: state.installedGames[game.id]?.path || null,
    };
  });
  return config;
});

// Verificar actualizaciones para un juego
ipcMain.handle('games:checkUpdate', async (_, gameId) => {
  const config = await getGamesConfig();
  const game = config.games.find(g => g.id === gameId);
  if (!game) return { hasUpdate: false };

  try {
    const latestVersion = await fetchLatestVersion(game);
    const installedVersion = state.installedGames[gameId]?.version;
    return {
      hasUpdate: installedVersion !== latestVersion,
      latestVersion,
      installedVersion,
    };
  } catch (e) {
    return { hasUpdate: false, error: e.message };
  }
});

// Descargar e instalar juego
ipcMain.handle('games:install', async (_, gameId) => {
  const config = await getGamesConfig();
  const game = config.games.find(g => g.id === gameId);
  if (!game) throw new Error('Juego no encontrado');

  const gamesDir = state.settings.gamesDir || GAMES_DIR;
  const gameDir = path.join(gamesDir, game.id);
  ensureDir(gameDir);

  const zipPath = path.join(gameDir, `${game.id}.zip`);

  try {
    // Obtener URL de descarga desde GitHub Releases
    const downloadUrl = await getDownloadUrl(game);

    // Descargar con progreso
    await downloadFile(downloadUrl, zipPath, (progress) => {
      mainWindow.webContents.send('games:downloadProgress', { gameId, progress });
    });

    // Descomprimir
    mainWindow.webContents.send('games:downloadProgress', { gameId, progress: 100, status: 'extracting' });
    await extractZip(zipPath, gameDir);

    // Limpiar zip
    fs.unlinkSync(zipPath);

    // Guardar estado
    const version = await fetchLatestVersion(game);
    state.installedGames[gameId] = { version, path: gameDir, installedAt: new Date().toISOString() };
    saveState();

    mainWindow.webContents.send('games:downloadProgress', { gameId, progress: 100, status: 'done' });
    return { success: true, path: gameDir };
  } catch (e) {
    // Limpiar en caso de error
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    throw e;
  }
});

// Lanzar juego
ipcMain.handle('games:launch', async (_, gameId) => {
  const config = await getGamesConfig();
  const game = config.games.find(g => g.id === gameId);

  let gameDir = null;

  if (game && game.localDir) {
    gameDir = game.localDir;
  } else {
    const installed = state.installedGames[gameId];
    if (!installed) throw new Error('El juego no está instalado');
    gameDir = installed.path;
  }

  // Buscar ejecutable
  const exeNames = ['Game.exe', 'game.exe', 'RPGVXAce.exe', 'RPG_RT.exe', `${gameId}.exe`];
  if (game.exeName) exeNames.unshift(game.exeName); // Prioridad al nombre personalizado

  let exePath = null;
  let isNodeProject = false;

  for (const name of exeNames) {
    const candidate = path.join(gameDir, name);
    if (fs.existsSync(candidate)) { exePath = candidate; break; }
    // Buscar en subcarpeta
    const files = fs.readdirSync(gameDir);
    for (const f of files) {
      const subDir = path.join(gameDir, f);
      if (fs.statSync(subDir).isDirectory()) {
        const sub = path.join(subDir, name);
        if (fs.existsSync(sub)) { exePath = sub; break; }
      }
    }
    if (exePath) break;
  }

  if (!exePath && fs.existsSync(path.join(gameDir, 'package.json'))) {
    isNodeProject = true;
    exePath = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  }

  if (!exePath) throw new Error('No se encontró el ejecutable del juego en ' + gameDir);

  if (isNodeProject) {
    exec(`"${exePath}" run dev`, { cwd: gameDir });
  } else if (process.platform === 'win32') {
    exec(`"${exePath}"`, { cwd: path.dirname(exePath) });
  } else if (process.platform === 'darwin') {
    exec(`open "${exePath}"`, { cwd: path.dirname(exePath) });
  } else {
    exec(`xdg-open "${exePath}"`, { cwd: path.dirname(exePath) });
  }

  return { success: true };
});

// Desinstalar juego
ipcMain.handle('games:uninstall', async (_, gameId) => {
  const installed = state.installedGames[gameId];
  if (!installed) return { success: true };

  const result = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    buttons: ['Cancelar', 'Desinstalar'],
    defaultId: 0,
    title: 'Desinstalar juego',
    message: '¿Seguro que quieres desinstalar este juego? Se eliminarán todos los archivos.',
  });

  if (result.response === 1) {
    fs.rmSync(installed.path, { recursive: true, force: true });
    delete state.installedGames[gameId];
    saveState();
    return { success: true };
  }
  return { cancelled: true };
});

// Cambiar directorio de instalación
ipcMain.handle('settings:changeGamesDir', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Seleccionar carpeta de juegos',
    properties: ['openDirectory'],
  });
  if (!result.canceled) {
    state.settings.gamesDir = result.filePaths[0];
    saveState();
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('settings:get', () => state.settings);

ipcMain.on('link:open', (_, url) => shell.openExternal(url));

// ============================================================
// FUNCIONES DE RED
// ============================================================

function fetchLatestVersion(game) {
  if (game.versionUrl) {
    return new Promise((resolve, reject) => {
      https.get(game.versionUrl, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(data).version); }
          catch (e) { reject(new Error('Error al leer versión')); }
        });
      }).on('error', reject);
    });
  }
  if (game.githubRepo) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${game.githubRepo}/releases/latest`,
        headers: { 'User-Agent': 'LauncherIS_Global/1.0' },
      };
      https.get(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(data).tag_name); }
          catch (e) { reject(new Error('Error al consultar GitHub')); }
        });
      }).on('error', reject);
    });
  }
  return Promise.resolve(game.version || '1.0.0');
}

function getDownloadUrl(game) {
  if (game.directDownloadUrl) return Promise.resolve(game.directDownloadUrl);
  if (game.githubRepo) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${game.githubRepo}/releases/latest`,
        headers: { 'User-Agent': 'LauncherIS_Global/1.0' },
      };
      https.get(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const release = JSON.parse(data);
            const asset = release.assets.find(a => a.name.endsWith('.zip'));
            if (asset) resolve(asset.browser_download_url);
            else reject(new Error('No se encontró archivo .zip en el release'));
          } catch (e) { reject(e); }
        });
      }).on('error', reject);
    });
  }
  return Promise.reject(new Error('No hay URL de descarga configurada'));
}

function downloadFile(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const request = (reqUrl) => {
      https.get(reqUrl, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          return request(res.headers.location);
        }
        const total = parseInt(res.headers['content-length'] || '0');
        let downloaded = 0;
        res.on('data', (chunk) => {
          downloaded += chunk.length;
          file.write(chunk);
          if (total > 0) onProgress(Math.round((downloaded / total) * 100));
        });
        res.on('end', () => { file.end(); resolve(); });
        res.on('error', reject);
      }).on('error', reject);
    };
    request(url);
  });
}

function extractZip(zipPath, destDir) {
  return new Promise((resolve, reject) => {
    try {
      const extractZipLib = require('extract-zip');
      extractZipLib(zipPath, { dir: destDir }).then(resolve).catch(reject);
    } catch (e) {
      if (process.platform === 'win32') {
        exec(`powershell -command "Expand-Archive -Force '${zipPath}' '${destDir}'"`, (err) => {
          if (err) reject(err); else resolve();
        });
      } else {
        exec(`unzip -o "${zipPath}" -d "${destDir}"`, (err) => {
          if (err) reject(err); else resolve();
        });
      }
    }
  });
}
