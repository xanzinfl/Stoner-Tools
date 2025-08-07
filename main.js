const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, autoUpdater, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');
const moment = require('moment-timezone');
const notifier = require('node-notifier');
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const RPC = require("discord-rpc");
const fs = require('fs');   
const { version } = require('./package.json');

const updateserver = 'https://update.electronjs.org';
const feed = `${updateserver}/${repository.owner}/${repository.name}/${process.platform}-${process.arch}/${app.getVersion()}`;

autoUpdater.setFeedURL(feed);

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
    const dialogOpts = {
        type: 'info',
        buttons: ['Restart', 'Later'],
        title: 'Application Update',
        message: process.platform === 'win32' ? releaseNotes : releaseName,
        detail: 'A new version has been downloaded. Restart the application to apply the updates.'
    };
    dialog.showMessageBox(dialogOpts).then((returnValue) => {
        if (returnValue.response === 0) {
            autoUpdater.quitAndInstall();
        }
    });
});

autoUpdater.on('error', (error) => {
    console.error('There was a problem updating the application');
    console.error(error);
});

let mainWindow;
let tray;
let rpc;
let activityInterval;
const store = new Store();

const expressApp = express();
const server = http.createServer(expressApp);
const io = new Server(server);
const PORT = 4200;

let next420Info = null;
let currentRipCount = 'N/A';

expressApp.use(express.static(path.join(__dirname, 'widgets')));
expressApp.get('/widgets/countdown', (req, res) => {res.sendFile(path.join(__dirname, 'widgets/countdown/index.html'));});
expressApp.get('/widgets/ripcounter', (req, res) => {res.sendFile(path.join(__dirname, 'widgets/ripcounter/index.html'))});

function updateAndBroadcastCountdown() {
    if (!next420Info) {
        next420Info = getNext420();
    }
    
    const next420Time = new Date(next420Info.next420TimeUtc);
    const timeUntil = next420Time - new Date();

    let data;

    if (timeUntil < -60000) {
        next420Info = null;
        updateAndBroadcastCountdown();
        return;
    }

    if (timeUntil > 0) {
        const hours = Math.floor(timeUntil / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeUntil % (1000 * 60)) / 1000);
        
        data = {
            is420: false,
            countdown: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
            ...next420Info
        };

    } else {
        data = {
            is420: true,
            countdown: "It's 4:20!",
            ...next420Info
        };

        if (!next420Info.notified) {
            const notificationText = store.get('notificationText', "It's 4:20 somewhere!");
            notifier.notify({
                title: "It's 4:20!",
                message: notificationText,
                icon: path.join(__dirname, 'assets/icon.png'),
                sound: true,
            });
            next420Info.notified = true;
        }
    }
    
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update', data);
    }
    io.emit('update', data);
}

function updateAndBroadcastRipCount() {
    const filePath = store.get('filePath');
    let newCount = 'N/A';

    if (filePath && fs.existsSync(filePath)) {
        try {
            newCount = fs.readFileSync(filePath, "utf-8").trim();
        } catch (err) {
            console.error("Error reading rip file:", err);
            newCount = 'Error';
        }
    }
    
    currentRipCount = newCount;
    io.emit('rip-update', currentRipCount);

    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('rip-update', currentRipCount);
    }
}

io.on('connection', (socket) => {
    console.log('Widget client connected');
    updateAndBroadcastCountdown(); 
    updateAndBroadcastRipCount();
});

function handleStartup() {
    if (process.platform !== 'darwin') {
        const settings = {
            openAtLogin: store.get('runOnStartup', false),
            path: app.getPath('exe'),
        };
        app.setLoginItemSettings(settings);
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 420,
        height: 420,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        frame: true,
        backgroundColor: '#050505',
        show: false,
        icon: path.join(__dirname, 'assets/icon.png')
    });

    mainWindow.loadFile('index.html');
    mainWindow.removeMenu();

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('close', (event) => {
        if (store.get('minimizeToTray', false) && !app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
            createTray();
        } else {
            app.isQuitting = true;
            if (rpc) rpc.destroy();
            app.quit();
        }
    });

    handleStartup();
}

function createTray() {
    if (tray) return;
    const iconPath = path.join(__dirname, 'assets/icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon);
    const contextMenu = Menu.buildFromTemplate([
        {
            label: `Stoner Tools v${version}`,
            enabled: false
        },
        { type: "separator" },
        {
            label: 'Show App',
            click: () => {
                mainWindow.show();
                if (tray) {
                    tray.destroy();
                    tray = null;
                }
            },
        },
        { type: "separator" },
        {
            label: "Start RPC",
            click: () => {
                const settings = store.get();
                if (settings.clientId) startRPC(settings);
            },
        },
        {
            label: "Stop RPC",
            click: () => stopRPC(),
        },
        { type: "separator" },
        {
            label: 'Quit',
            click: () => {
                app.isQuitting = true;
                if (rpc) rpc.destroy();
                app.quit();
            },
        },
    ]);
    tray.setToolTip(`Stoner Tools v${version}`);
    tray.setContextMenu(contextMenu);
}

function startRPC(settings) {
  if (rpc) {
    rpc.destroy(); 
  }
  if (!settings || !settings.clientId) return;

  rpc = new RPC.Client({ transport: "ipc" });

  rpc.on("ready", () => {
    mainWindow.webContents.send("rpc-status", true);
    updateActivity(settings);
    if (activityInterval) clearInterval(activityInterval);
    activityInterval = setInterval(() => updateActivity(settings), 15000);
  });

  rpc.login({ clientId: settings.clientId }).catch(err => {
      console.error("RPC Login Failed:", err);
      mainWindow.webContents.send("rpc-status", false);
  });

  rpc.on('error', err => {
    console.error('RPC Error:', err);
    stopRPC();
  });
}

async function stopRPC() {
  if (activityInterval) clearInterval(activityInterval);
  activityInterval = null;
  
  if (rpc) {
    try {
      await rpc.clearActivity();
      await rpc.destroy();
    } catch (err) {
      console.error("Error during RPC shutdown:", err.message);
    } finally {
      rpc = null;
    }
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("rpc-status", false);
  }
}

function updateActivity(settings) {
    if (!rpc) return;
    let rip = "0";
    try {
        if (fs.existsSync(settings.filePath)) {
            rip = fs.readFileSync(settings.filePath, "utf-8").trim();
        }
    } catch (err) {
        console.error("Error reading rip file:", err);
    }

    const presence = {
        state: settings.state,
        details: settings.details ? settings.details.replace("{rip}", rip) : undefined,
        startTimestamp: Date.now(),
        instance: false,
    };
    
    if (settings.largeImageKey) presence.largeImageKey = settings.largeImageKey;
    if (settings.largeImageText) presence.largeImageText = settings.largeImageText;
    if (settings.smallImageKey) presence.smallImageKey = settings.smallImageKey;
    if (settings.smallImageText) presence.smallImageText = settings.smallImageText;

    const buttons = [];
    if (settings.button1Label && settings.button1Url) {
        buttons.push({ label: settings.button1Label, url: settings.button1Url });
    }
    if (settings.button2Label && settings.button2Url) {
        buttons.push({ label: settings.button2Label, url: settings.button2Url });
    }
    if (buttons.length > 0) presence.buttons = buttons;

    rpc.setActivity(presence).catch(console.error);
};

app.on('ready', () => {
    app.setAppUserModelId('com.xanzinfl.stonertools');
    createWindow();
    
    server.listen(PORT, () => {
        console.log(`OBS source server running. Countdown: http://localhost:${PORT}/widgets/countdown | Rip Counter: http://localhost:${PORT}/widgets/ripcounter`);
    });

    setInterval(updateAndBroadcastCountdown, 1000);
    setInterval(updateAndBroadcastRipCount, 5000); 
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    } else {
        mainWindow.show();
    }
});

ipcMain.on("start-rpc", (event, settings) => startRPC(settings));
ipcMain.on("stop-rpc", stopRPC);

function getNext420() {
    const now = moment.utc();
    const timezones = moment.tz.names();
    let newNext420Info = {};
    let minTimeUntil = null;
    const systemTz = moment.tz.guess();

    for (const tzName of timezones) {
        const localizedNow = now.clone().tz(tzName);
        let next420Time;

        const am420 = localizedNow.clone().hour(4).minute(20).second(0);
        const pm420 = localizedNow.clone().hour(16).minute(20).second(0);

        if (localizedNow.isBefore(am420)) {
            next420Time = am420;
        } else if (localizedNow.isBefore(pm420)) {
            next420Time = pm420;
        } else {
            next420Time = localizedNow.clone().add(1, 'day').hour(4).minute(20).second(0);
        }

        const timeUntil = next420Time.diff(now);
        const location = tzName.split('/').pop().replace(/_/g, ' ');

        if (minTimeUntil === null || timeUntil < minTimeUntil) {
            minTimeUntil = timeUntil;
            newNext420Info = {
                next420TimeUtc: next420Time.clone().utc().toISOString(),
                timezone: location,
                localTime: next420Time.clone().tz(systemTz).format('h:mm A'),
                notified: false
            };
        }
    }
    return newNext420Info;
}

ipcMain.on('notify-420', (event, notificationText) => {
    notifier.notify({
        title: "It's 4:20!",
        message: notificationText || "It's 4:20 somewhere!",
        icon: path.join(__dirname, 'assets/icon.png'),
        sound: true,
    });
});

ipcMain.handle('get-settings', () => {
    return {
        notificationText: store.get('notificationText', "It's 4:20 somewhere!"),
        clientId: store.get('clientId', "1360824994149568562"),
        state: store.get('state', ""),
        details: store.get('details', "Rip Count: {rip}"),
        filePath: store.get('filePath', ""),
        button1Url: store.get('button1Url', ""),
        button1Label: store.get('button1Label', ""),
        button2Url: store.get('button2Url', ""),
        button2Label: store.get('button2Label', ""),
        largeImageKey: store.get('largeImageKey', ""),
        largeImageText: store.get('largeImageText', ""),
        smallImageKey: store.get('smallImageKey', ""),
        smallImageText: store.get('smallImageText', ""),
        minimizeToTray: store.get('minimizeToTray', false),
        runOnStartup: store.get('runOnStartup', false),
    };
});

ipcMain.on('save-settings', (event, settings) => {
    for (const key in settings) {
        store.set(key, settings[key]);
    }
    handleStartup();
    if (rpc) {
        stopRPC();
        startRPC(settings);
    }
});

ipcMain.handle('adjust-rip-count', (event, action) => {
    const filePath = store.get('filePath');
    if (!filePath) return 'N/A';
    
    let count = 0;
    try {
        if(fs.existsSync(filePath)) {
            count = parseInt(fs.readFileSync(filePath, "utf-8").trim(), 10) || 0;
        }
    } catch {}

    if (action === "inc") count++;
    if (action === "dec" && count > 0) count--;
    if (action === "reset") count = 0;

    try {
        fs.writeFileSync(filePath, count.toString(), "utf-8");
        updateAndBroadcastRipCount(); 
        return count;
    } catch (err) {
        console.error("Error writing to rip file:", err);
        return "Error";
    }
});