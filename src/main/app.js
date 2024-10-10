const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const path = require('path')
const bcrypt = require('bcryptjs');
const { mssql, getConnection } = require('./database.js')


// Resto de tu código...
const app = express()
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"], // Solo permite cargar recursos desde el mismo origen
                scriptSrc: ["'self'", 'cdn.jsdelivr.net', "'unsafe-inline'"], // Permite cargar scripts desde cdn.jsdelivr.net y inline
                styleSrc: ["'self'", 'cdn.jsdelivr.net', 'fonts.googleapis.com', "'unsafe-inline'"], // Permite cargar estilos desde cdn.jsdelivr.net, fonts.googleapis.com y inline
                fontSrc: ["'self'", 'fonts.gstatic.com', 'cdn.jsdelivr.net'], // Permite cargar fuentes desde fonts.gstatic.com y cdn.jsdelivr.net
                connectSrc: ["'self'", 'http://localhost:3000'],
                objectSrc: ["'none'"], // Bloquea la carga de objetos como Flash
                mediaSrc: ["'none'"], // Bloquea la carga de medios
                frameSrc: ["'none'"], // Bloquea la carga de frames o iframes
                styleSrcElem: ["'self'", 'cdn.jsdelivr.net', "'unsafe-inline'"], // Permite estilos en elementos
                scriptSrcElem: ["'self'", 'cdn.jsdelivr.net', "'unsafe-inline'"], // Permite scripts en elementos
            },
        },
        crossOriginEmbedderPolicy: true, // Refuerza la política de seguridad para recursos incrustados
    })
)

console.log(path.join(__dirname, '..', 'renderer', 'views', 'interfazAdmin.html'));


app.use(express.json())
app.use(express.urlencoded({ extended: false }))

const PORT = process.env.PORT || 3000

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('email', mssql.NVarChar, email)
            .query('SELECT * FROM Usuarios WHERE email = @email');

        //Cuando no hay ningun usuario een la base de datos
        if (result.recordset.length === 0) {
            return res.status(400).json({ message: 'Usuario no encontrado' });
        }

        //enceuntra al usuario
        const user = result.recordset[0];
        //guarda la contraseña del usuario
        const storedPassword = user.contraseña_hash;

        // Verifica si la contraseña almacenada está hasheada
        const isHashed = storedPassword.startsWith('$2a$'); // Las contraseñas hasheadas con bcrypt comienzan con $2a$

        if (isHashed) {
            // Comparar la contraseña hasheada
            const validPassword = await bcrypt.compare(password, storedPassword);
            if (!validPassword) {
                return res.status(400).json({ message: 'Contraseña incorrecta' });
            }
        } else {
            // La contraseña está en texto plano, se compara directamente
            if (password !== storedPassword) {
                return res.status(400).json({ message: 'Contraseña incorrecta' });
            }

            // Hashear la contraseña ahora que ha sido validada
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(storedPassword, salt);

            // Actualizar la contraseña hasheada en la base de datos
            await pool.request()
                .input('email', mssql.NVarChar, email)
                .input('contraseña_hash', mssql.NVarChar, hashedPassword)
                .query(`
                    UPDATE Usuarios
                    SET contraseña_hash = @contraseña_hash
                    WHERE email = @email
                `);

            console.log('Contraseña actualizada y hasheada para el usuario:', user.nombre);
        }

        // Dependiendo del rol del usuario, redirigir a diferentes páginas
        if (user.rol === 'admin') {
            res.json({ url: 'http://localhost:3000/interfazAdmin.html' });
        } else if (user.rol === 'estudiante') {
            res.json({ url: '/interfazStudent.html' });
        }

    } catch (error) {
        console.error('Error durante el login:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

app.get('/interfazAdmin.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'renderer', 'views', 'interfazAdmin.html'))
  });
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
});


module.exports = {
    app,
    PORT
}