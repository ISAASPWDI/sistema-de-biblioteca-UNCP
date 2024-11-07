const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const path = require('path')
const bcrypt = require('bcryptjs');
const { mssql, getConnection } = require('./database.js')
const multer = require('multer')

// Configurar multer para almacenar las imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Crear una carpeta 'uploads' en tu proyecto si no existe
        const uploadDir = path.join(__dirname, '..', 'renderer', 'uploads')
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        // Generar un nombre único para el archivo
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
})
// Configurar el filtro de archivos para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true)
    } else {
        cb(new Error('No es una imagen válida'), false)
    }
}
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Límite de 5MB
    }
})
// Resto de tu código...
const app = express()
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"], // Carga solo desde el mismo origen
                scriptSrc: ["'self'", 'cdn.jsdelivr.net'], // Evita 'unsafe-inline' y 'unsafe-eval'
                styleSrc: ["'self'", 'cdn.jsdelivr.net', 'fonts.googleapis.com'], // Solo estilos permitidos
                fontSrc: ["'self'", 'fonts.gstatic.com', 'cdn.jsdelivr.net'], // Fuentes específicas
                connectSrc: ["'self'", 'http://localhost:3000'], // Backend permitido
                objectSrc: ["'none'"], // Bloquea objetos inseguros
                mediaSrc: ["'none'"], // Bloquea medios inseguros
                frameSrc: ["'none'"], // Bloquea iframes inseguros
                // Agrega 'self' a script-src para evitar advertencias de Electron
                baseUri: ["'self'"], // Limita el <base> URI
                frameAncestors: ["'none'"], // Previene que se embeza en otros sitios
                imgSrc: ["'self'", "data:", "blob:"], // Permitir imágenes locales
                mediaSrc: ["'self'"], // Permitir media local
            },
        },
        crossOriginEmbedderPolicy: true, // Evita riesgos al incrustar recursos de diferentes orígenes
    })
)


app.use(express.static(path.join(__dirname, '..', 'renderer')));
console.log(path.join(__dirname, '..', 'renderer'));
app.use('/uploads', express.static(path.join(__dirname, '..', 'renderer', 'uploads')))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

const PORT = process.env.PORT || 3000

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const pool = await getConnection()
        const result = await pool.request()
            .input('email', mssql.NVarChar, email)
            .query('SELECT * FROM Usuarios WHERE email = @email');

        // Validar si existe un usuario con el correo proporcionado
        if (result.recordset.length === 0) {
            console.log('CREDENCIALES');
            return res.status(400).json({ message: 'Credenciales incorrectas' });
        }

        const user = result.recordset[0]; // Obtener el único usuario

        // Verificar si la contraseña está hasheada
        const storedPassword = user.contraseña_hash;
        const isHashed = storedPassword.startsWith('$2a$');

        const passwordMatch = isHashed
            ? await bcrypt.compare(password, storedPassword) // Si está hasheada, usar bcrypt
            : password === storedPassword;

        if (!user) {
            console.log('CREDENCIALES');
            return res.status(200).json({ success: false, message: 'Credenciales incorrectas' });
        }


        // Si la contraseña no está hasheada, hashearla y actualizarla
        if (!user.contraseña_hash.startsWith('$2a$')) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

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

        // Redireccionar según el rol del usuario
        if (user.rol === 'admin') {
            res.json({ url: 'http://localhost:3000/interfazAdmin.html' });
        } else if (user.rol === 'estudiante') {
            res.json({ url: 'http://localhost:3000/interfazStudent.html' });
        }

    } catch (error) {
        console.error('Error durante el login:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

app.post('/logout', (req, res) => {
    // Here you would typically destroy the session
    // For now, we'll just send a success response
    res.json({ url: 'http://localhost:3000/views/index.html' })
})
//Mostrar Libro

app.get('/libros', async(req,res)=>{
    try {
        const pool = await getConnection();
        const result = await pool.request()
        .query(`SELECT * FROM Libros`)
        res.json(result.recordset);
    } catch (error) {
        console.error('Error al obtener libros:', error);
    }
})
//Agregando libro
app.post('/libros', upload.single('imagen'), async (req, res) => {
    const { titulo, autor, genero, url } = req.body
    const imagen = req.file ? `/uploads/${req.file.filename}` : null
    const generoJSON = JSON.stringify({ genero: genero });
    try {
        const pool = await getConnection();
        await pool.request()
            .input('titulo', mssql.NVarChar, titulo)
            .input('autor', mssql.NVarChar, autor) // Asegúrate de que el tipo coincida con la base de datos
            .input('genero', mssql.NVarChar, generoJSON)
            .input('imagen', mssql.NVarChar, imagen)
            .input('url', mssql.NVarChar, url)
            .query(`
                INSERT INTO Libros (titulo, autor, genero, url, imagen) 
                VALUES (@titulo, @autor, @genero, @url, @imagen)
            `);
        res.json({ message: 'Libro agregado con éxito' });

    } catch (error) {
        console.error('Error al insertar libro:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});


app.get('/interfazAdmin.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'renderer', 'views', 'interfazAdmin', 'interfazAdmin.html'))

})
app.get('/interfazStudent.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'renderer', 'views', 'interfazStudent', 'interfazStudent.html'))
})
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})


module.exports = {
    app,
    PORT
}