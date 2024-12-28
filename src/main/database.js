const mssql = require('mssql')
require('dotenv').config();
const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: true, // Use TLS1.2 encryption
        trustServerCertificate: true
    }
}
async function getConnection() {
    try {
      console.log('Intentando conectar a la base de datos...')
      const pool = await mssql.connect(config)
      console.log('Conexion exitosa')
      return pool
    } catch (error) {
      console.error('Error al conectar a la base de datos:', error)
      throw error
    }
  }

module.exports = {
    mssql,
    getConnection
}
