const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('favoritesAPI', {
    getFavorites: () => ipcRenderer.invoke('favorites:get'),
    addFavorite: (favorite) => ipcRenderer.invoke('favorites:add', favorite),
    removeFavorite: (id_libro) => ipcRenderer.invoke('favorites:remove', id_libro),
});
