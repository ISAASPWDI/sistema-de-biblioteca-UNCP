const { ipcMain } = require('electron');
const fetch = require('node-fetch'); // Ensure you have node-fetch installed
const sessionStore = require('./sessionStore.js');
ipcMain.on('login-attempt', async (event, { email, password }) => {
    try {
        const response = await fetch(`https://192.168.1.244:${sessionStore.getPort()}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // Send success response back to renderer
            event.reply('login-response', { success: true, url: data.url });
        } else {
            // Send error message back to renderer
            event.reply('login-response', { success: false, message: data.message || 'Credenciales incorrectas' });
        }
    } catch (error) {
        console.error('Error al realizar la solicitud de inicio de sesión:', error);
        event.reply('login-response', { success: false, message: 'Error en el servidor' });
    }
});