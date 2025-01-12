const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('sessionAPI', {
    login: async (credentials) => {
        return await ipcRenderer.invoke('login', credentials);
    },
    logout: async () => {
        return await ipcRenderer.invoke('logout');
    },
    getUser: async () => {
        return await ipcRenderer.invoke('get-user');
    },
    isAuthenticated: async () => {
        return await ipcRenderer.invoke('is-authenticated');
    },
    // Agregar método para navegación
    navigate: (url) => {
        window.location.href = url;
    }
});