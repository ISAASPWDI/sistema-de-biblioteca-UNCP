const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('myAPI', {
    toggleTheme: () => {
        ipcRenderer.on('toggle-theme', (event, isDark) => {
            const body = document.body
            isDark ? body.classList.add('dark-theme') : body.classList.remove('dark-theme')
        })
    }
})
