const { contextBridge, ipcRenderer } = require('electron');

// 在渲染进程中暴露安全的 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 可以在这里添加需要暴露给前端的 API
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});
