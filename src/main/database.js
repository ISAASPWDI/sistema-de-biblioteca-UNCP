const mssql = require('mssql')

const config = {
    server: 'DESKTOP-7NAGFGR',
    database: 'bibliotecauncp',
    user: 'prueba1',
    password: '12345',
    options: {
        encrypt: true, // Use TLS1.2 encryption
        trustServerCertificate: true
    }
}
async function getConnection() {
    try {
      console.log('Intentando conectar a la base de datos...')
      const pool = await mssql.connect(config)
      console.log('Conexión exitosa')
      return pool
    } catch (error) {
      console.error('Error al conectar a la base de datos:', error)
      throw error
    }
  }
//   const insertUser = async () => {
//     let pool;
//     try {
//       pool = await getConnection();
//       const result = await pool.request()
//         .input('nombre', mssql.NVarChar, 'Ejemplo Usuario')
//         .input('email', mssql.NVarChar, 'ejemplo@email.com')
//         .input('rol', mssql.NVarChar, 'estudiante')
//         .input('contraseña_hash', mssql.NVarChar, 'hash_de_contraseña_aquí')
//         .query(`
//           INSERT INTO dbo.Usuarios (nombre, email, rol, contraseña_hash)
//           VALUES (@nombre, @email, @rol, @contraseña_hash)
//         `);
//       console.log('Usuario insertado:', result);
//     } catch (error) {
//       console.error('Error al insertar usuario:', error);
//     } finally {
//       if (pool) await pool.close();
//     }
//   };
  
//   insertUser();
const getUsers = async () => {
    try {
        const pool = await getConnection()
        const result = await pool.request().query('SELECT * from Usuarios')
        console.log(result);

    } catch (error) {
        console.error(error)
    }
}
getUsers()


module.exports = {
    getUsers,
    mssql,
    getConnection
}
// const deleteUser = async () => {
//     try {
//         const pool = await getConnection()
//         const res = await pool.request().query('DELETE FROM Usuarios WHERE id_usuario = 1')
//         console.log(res);
        
//     } catch (error) {
//         console.error(error)
//     }

// }
// deleteUser()
