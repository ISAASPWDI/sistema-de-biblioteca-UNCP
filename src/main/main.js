// main.js
require('dotenv').config();
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const sessionStore = require('./sessionStore.js');
const path = require('path');
const { setMenu } = require('./menu.js');
const { setupServer } = require('./app.js');
const sql = require('mssql');
const { getConnection,config } = require('./database.js');
require('dotenv').config({
    path: path.join(process.cwd(), '.env')
});

const createWindow = async () => {
    try {
        console.log('Variables de entorno cargadas:', {
            DB_SERVER: process.env.DB_SERVER,
            DB_NAME: process.env.DB_NAME,
            DB_USER: process.env.DB_USER
            // No imprimir DB_PASSWORD por seguridad
        });
        // Iniciar el servidor primero
        const port = await setupServer();
        console.log('Servidor iniciado en puerto:', port);

        // Crear la ventana principal
        const mainWindow = new BrowserWindow({
            width: 1500,
            height: 800,
            minWidth: 1500,
            minHeight: 800,
            webSecurity: false,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js')
            }
        });

        // Probar la conexión SQL sin bloquear el inicio
        getConnection(config).then(result => {
            if (!result.success) {
                dialog.showMessageBox(mainWindow, {
                    type: 'warning',
                    title: 'Advertencia de Conexión',
                    message: result.message,
                    detail: `Detalles técnicos: ${JSON.stringify(result.error, null, 2)}`,
                    buttons: ['Entendido']
                });
            }
        });

        mainWindow.webContents.on('will-navigate', (event, url) => {
            return true;
        });

        mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            mainWindow.loadURL(url);
            return { action: 'deny' };
        });

        mainWindow.loadFile('./src/renderer/views/index.html');
        setMenu(mainWindow);
        
        return mainWindow;
    } catch (error) {
        console.error('Error al crear la ventana:', error);
        throw error;
    }
};

app.whenReady().then(async () => {
    try {
        const mainWindow = await createWindow();

        ipcMain.handle('get-server-port', () => {
            const port = sessionStore.getPort();
            console.log('IPC get-server-port llamado, devolviendo:', port);
            return port;
        });

        ipcMain.handle('login', async (event, credentials) => {
            const port = sessionStore.getPort();
            try {
                // Verificar conexión SQL antes del login
                const sqlConnected = await getConnection();
                if (!sqlConnected) {
                    return { 
                        success: false, 
                        error: 'No hay conexión con la base de datos' 
                    };
                }

                const response = await fetch(`http://localhost:${port}/login`, {
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
                    return { success: false, error: 'Credenciales inválidas' };
                }
            } catch (error) {
                console.error('Error en login:', error);
                return { 
                    success: false, 
                    error: 'Error de conexión con el servidor' 
                };
            }
        });

        // Resto de los manejadores IPC...
        ipcMain.handle('logout', async () => {
            const port = sessionStore.getPort();
            try {
                const response = await fetch(`http://localhost:${port}/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                const data = await response.json();
                sessionStore.clearUser();
                return { success: true, url: data.url };
            } catch (error) {
                console.error('Error en logout:', error);
                return { success: false, error: 'Error de red' };
            }
        });

        ipcMain.handle('get-user', () => {
            return sessionStore.getUser();
        });

        ipcMain.handle('is-authenticated', () => {
            return sessionStore.isAuthenticated();
        });

    } catch (error) {
        console.error('Error al iniciar la aplicación:', error);
        app.quit();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
