const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getSongs: () => ipcRenderer.invoke('get-songs'),
    deleteSong: (filename) => ipcRenderer.invoke('delete-song', filename),
    downloadSong: (searchTerm) => ipcRenderer.invoke('download-song', searchTerm),
    setNowPlaying: (songTitle) => ipcRenderer.send('now-playing', songTitle),
    openSavesFolder: () => ipcRenderer.invoke('open-saves-folder')
});
