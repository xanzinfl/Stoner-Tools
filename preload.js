const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.send('save-settings', settings),
    getRipCount: () => ipcRenderer.invoke('get-rip-count'),
    adjustRipCount: (action) => ipcRenderer.invoke('adjust-rip-count', action),
    startRPC: (settings) => ipcRenderer.send('start-rpc', settings),
    stopRPC: () => ipcRenderer.send('stop-rpc'),
    onRpcStatus: (callback) => ipcRenderer.on('rpc-status', (_event, value) => callback(value)),
    onUpdate: (callback) => ipcRenderer.on('update', (_event, value) => callback(value)),
    onRipUpdate: (callback) => ipcRenderer.on('rip-update', (_event, value) => callback(value))
});