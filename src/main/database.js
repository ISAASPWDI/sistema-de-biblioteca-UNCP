// database2.js
const mssql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER || 'prueba1',
    password: process.env.DB_PASSWORD || '12345',
    server: process.env.DB_SERVER || 'ISAASPWDI',  // Asegúrate que este es el nombre correcto del servidor
    database: process.env.DB_NAME || 'bibliotecauncp',
    options: {
        encrypt: false, // Para conexiones locales
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

let pool;

async function getConnection(config) {
    try {
        if (!pool) {
            console.log('Intentando conectar a la base de datos...');
            
            // Agregamos listener para eventos de error
            pool = new mssql.ConnectionPool(config);
            pool.on('error', err => {
                console.error('Error de Pool SQL:', err);
            });

            // Intentamos conectar con timeout
            await Promise.race([
                pool.connect(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout de conexión')), 5000)
                )
            ]);

            console.log('Conexion exitosa');
        }
        return pool;
    } catch (error) {
        const errorInfo = {
            message: error.message,
            code: error.code,
            state: error.state,
            class: error.class,
            serverName: error.serverName,
            procName: error.procName
        };
        
        console.error('Error detallado de conexión:', errorInfo);
        
        let userMessage = 'Error de conexión a la base de datos: ';
        
        switch(error.code) {
            case 'ESOCKET':
                userMessage += 'No se puede alcanzar el servidor SQL. Verifica el nombre del servidor y el firewall.';
                break;
            case 'ELOGIN':
                userMessage += 'Credenciales incorrectas.';
                break;
            case 'EALREADY':
                userMessage += 'Ya existe una conexión activa.';
                break;
            default:
                userMessage += error.message;
        }

        throw new Error(userMessage);
    }
}

module.exports = {
    mssql,
    getConnection,
    config
};