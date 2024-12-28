const { app, BrowserWindow } = require('electron')
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
    // mainWindow.loadURL(isDev ? `http://localhost:${PORT}` : `file://${path.join(__dirname, '../build/index.html')}`)
    mainWindow.loadFile('./src/renderer/views/index.html')
    setMenu(mainWindow)
}

app.whenReady().then(async () => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit()
        }
    })
})
