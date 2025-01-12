const { app, BrowserWindow, ipcMain } = require('electron')
const sessionStore = require('./sessionStore.js');
const path = require('path')
const { setMenu } = require('./menu.js')
const { PORT } = require('./app.js')
const { getUsers } = require('./database.js')

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 1500,
        height: 800,
        minWidth: 1500, // Establece el ancho mínimo
        minHeight: 800, // Puedes ajustar el alto mínimo si lo deseas
        webSecurity: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false, // Permitir Node.js en la ventana
            contextIsolation: true, // Deshabilitar aislamiento del contexto si necesitas usar Node.js directamente en el renderizador
            enableRemoteModule: false
        }
    })
    // Manejar la navegación dentro de la ventana
    mainWindow.webContents.on('will-navigate', (event, url) => {
        // Permitir todas las navegaciones
        return true;
    });

    // Configurar el manejador de nuevas ventanas
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        // Permitir que la URL se abra en la misma ventana
        mainWindow.loadURL(url);
        return { action: 'deny' };
    });

    // mainWindow.loadURL(isDev ? `http://localhost:${PORT}` : `file://${path.join(__dirname, '../build/index.html')}`)
    mainWindow.loadFile('./src/renderer/views/index.html')
    setMenu(mainWindow)
    return mainWindow;
}

app.whenReady().then(async () => {
    createWindow()

    ipcMain.handle('login', async (event, credentials) => {
        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();

            if (response.ok) {
                sessionStore.setUser(data.user);
                return { success: true, url: data.url };
            } else {
                return { success: false, error: 'Invalid credentials' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error' };
        }
    });

    ipcMain.handle('logout', async () => {
        try {
            const response = await fetch('http://localhost:3000/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            sessionStore.clearUser();
            return { success: true, url: data.url };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: 'Network error' };
        }
    });

    ipcMain.handle('get-user', () => {
        return sessionStore.getUser();
    });

    ipcMain.handle('is-authenticated', () => {
        return sessionStore.isAuthenticated();
    });
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit()
        }
    })
})



