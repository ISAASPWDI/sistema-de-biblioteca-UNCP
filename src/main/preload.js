const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('sessionAPI', {
    login: async (credentials) => {
        try {
            return await ipcRenderer.invoke('login', credentials);
        } catch (error) {
            console.error('Error en login (preload):', error);
            throw error;
        }
    },
    logout: async () => {
        try {
            return await ipcRenderer.invoke('logout');
        } catch (error) {
            console.error('Error en logout (preload):', error);
            throw error;
        }
    },
    getPort: async () => {
        return await ipcRenderer.invoke('get-server-port');

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