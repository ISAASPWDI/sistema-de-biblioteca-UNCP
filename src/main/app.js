//IMPORTACIONES
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const path = require('path')
const bcrypt = require('bcryptjs');
const { mssql, getConnection } = require('./database.js')
const multer = require('multer')

require('dotenv').config();

//MULTER
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
//CREAR SERVIDOR
const app = express()
//CORS

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

//MIDDLEWARES

app.use(express.static(path.join(__dirname, '..', 'renderer')));
console.log(path.join(__dirname, '..', 'renderer'));
app.use('/uploads', express.static(path.join(__dirname, '..', 'renderer', 'uploads')))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//PUERTO A ESCUCHAR
const PORT = process.env.PORT || 3000

//RUTAS (modificar MVC)

//Login del sistema (modificar username)
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Conexión a la base de datos
        const pool = await getConnection();

        // Consulta para verificar si el usuario existe
        const result = await pool.request()
            .input('email', mssql.NVarChar, email)
            .query('SELECT * FROM Usuarios WHERE email = @email');

        if (result.recordset.length === 0) {
            return res.status(400).json({ message: 'Credenciales incorrectas' });
        }

        const user = result.recordset[0];
        const storedPassword = user.contrasena_hash;

        // Verificar la contraseña
        const passwordMatch = storedPassword.startsWith('$2a$')
            ? await bcrypt.compare(password, storedPassword)
            : password === storedPassword;

        if (!passwordMatch) {
            return res.status(400).json({ message: 'Credenciales incorrectas' });
        }

        // Si la contraseña no está hasheada, hashearla y actualizarla
        if (!storedPassword.startsWith('$2a$')) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            await pool.request()
                .input('email', mssql.NVarChar, email)
                .input('contrasena_hash', mssql.NVarChar, hashedPassword)
                .query('UPDATE Usuarios SET contrasena_hash = @contrasena_hash WHERE email = @email');

            console.log('Contraseña actualizada y hasheada para el usuario:', user.nombre);
        }

        // Enviar respuesta con la URL correspondiente al rol del usuario
        const redirectUrl = user.rol === 'admin'
            ? 'http://localhost:3000/interfazAdmin.html'
            : 'http://localhost:3000/interfazStudent.html';

        res.json({
            url: redirectUrl,
        });
    } catch (error) {
        console.error('Error durante el login:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

//dashboard
app.get('/dashboard', async (req, res) => {
    try {
        const pool = await getConnection();
        
        const query = `
            WITH UltimosLibros AS (
                SELECT TOP 3 titulo, autor, cantidad, imagen, created_at
                FROM Libros 
                ORDER BY created_at DESC
            ),
            UltimosUsuarios AS (
                SELECT TOP 3 nombre, email, rol, esta_activo, created_at
                FROM Usuarios 
                ORDER BY created_at DESC
            ),
            LibrosFavoritos AS (
                SELECT TOP 3 
                    l.titulo,
                    l.autor,
                    l.imagen,
                    u.nombre as nombre_usuario
                FROM Favoritos f
                INNER JOIN Libros l ON f.id_libro = l.id_libro
                INNER JOIN Usuarios u ON f.id_usuario = u.id_usuario
                WHERE u.rol = 'estudiante'
                ORDER BY f.created_at DESC
            )
            SELECT 
                (SELECT COUNT(*) FROM Usuarios WHERE rol = 'admin') numAdmins,
                (SELECT COUNT(*) FROM Usuarios WHERE rol = 'estudiante') numEstudiantes,
                (SELECT COUNT(*) FROM Libros) numTotalLibros,
                (SELECT COUNT(*) FROM Favoritos) numTotalLibrosFavoritos,
                (SELECT * FROM UltimosLibros FOR JSON AUTO) ultimosLibros,
                (SELECT * FROM UltimosUsuarios FOR JSON AUTO) ultimosUsuarios,
                (SELECT * FROM LibrosFavoritos FOR JSON AUTO) librosFavoritos
        `;

        const result = await pool.request().query(query);
        
        const dashboard = {
            numAdmins: result.recordset[0].numAdmins,
            numEstudiantes: result.recordset[0].numEstudiantes,
            numTotalLibros: result.recordset[0].numTotalLibros,
            numTotalLibrosFavoritos: result.recordset[0].numTotalLibrosFavoritos,
            ultimosLibros: JSON.parse(result.recordset[0].ultimosLibros || '[]'),
            ultimosUsuarios: JSON.parse(result.recordset[0].ultimosUsuarios || '[]'),
            librosFavoritos: JSON.parse(result.recordset[0].librosFavoritos || '[]')
        };
        console.log(dashboard.ultimosUsuarios);
        
        res.json(dashboard);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al obtener datos del dashboard',
            error: error.message 
        });
    }
});

// Cerrar sesión
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Error al cerrar sesión' });
        }
        res.json({ url: 'http://localhost:3000/views/index.html' });
    });
});
//Mostrar Libro (modificar)

app.get('/libros', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = 25;
        const offset = (page - 1) * pageSize;

        // Obtener término de búsqueda
        const searchTerm = req.query.search ? req.query.search.trim() : '';

        const pool = await getConnection();

        // Construir cláusula WHERE dinámica
        let whereClause = 'WHERE 1=1';
        const queryParams = {};

        if (searchTerm) {
            whereClause += ` AND (
                titulo LIKE @searchTerm OR 
                autor LIKE @searchTerm OR 
                JSON_VALUE(genero, '$.genero') LIKE @searchTerm
            )`;
            queryParams.searchTerm = `%${searchTerm}%`;
        }

        // Consulta para contar el total de libros
        const totalCountQuery = `
            SELECT COUNT(*) AS total 
            FROM Libros 
            ${whereClause}
        `;

        const totalCountRequest = pool.request();
        if (searchTerm) totalCountRequest.input('searchTerm', queryParams.searchTerm);

        const totalCountResult = await totalCountRequest.query(totalCountQuery);
        const totalBooks = totalCountResult.recordset[0].total;
        const totalPages = Math.ceil(totalBooks / pageSize);

        // Consulta para obtener los libros paginados
        const query = `
            SELECT * FROM (
                SELECT *, 
                ROW_NUMBER() OVER (ORDER BY id_libro) AS RowNum
                FROM Libros 
                ${whereClause}
            ) AS SubQuery
            WHERE RowNum > @offset AND RowNum <= (@offset + @pageSize)
        `;

        const request = pool.request()
            .input('offset', offset)
            .input('pageSize', pageSize);
        if (searchTerm) request.input('searchTerm', queryParams.searchTerm);

        const result = await request.query(query);

        res.json({
            books: result.recordset,
            currentPage: page,
            totalPages: totalPages,
            totalBooks: totalBooks
        });
    } catch (error) {
        console.error('Error al obtener libros:', error);
        res.status(500).json({ error: 'Error al obtener libros' });
    }
});
// obtener favoritos del usuario
app.get('/favoritos', async (req, res) => {
    try {
        const id_usuario = req.session.userId;
        const pool = await getConnection();

        const result = await pool.request()
            .input('id_usuario', mssql.Int, id_usuario)
            .query(`
                SELECT l.* 
                FROM Libros l
                INNER JOIN Favoritos f ON l.id_libro = f.id_libro
                WHERE f.id_usuario = @id_usuario
                ORDER BY f.created_at DESC
            `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener favoritos' });
    }
});

// eliminar un favorito
app.delete('/favoritos/:id', async (req, res) => {
    try {
        const id_libro = req.params.id;
        const id_usuario = req.session.userId;
        const pool = await getConnection();

        await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('id_libro', sql.Int, id_libro)
            .query('DELETE FROM Favoritos WHERE id_usuario = @id_usuario AND id_libro = @id_libro');

        res.json({ message: 'Favorito eliminado exitosamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al eliminar favorito' });
    }
});
// Agregar Libros Favoritos
app.post('/favoritos', async (req, res) => {
    console.log('Datos de la sesión:', req.session);
    try {
        const { id_libro } = req.body;

        // Obtener el id_usuario desde la sesión

        if (!id_usuario) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        const pool = await getConnection();

        // Verificar si el libro ya está en favoritos
        const checkResult = await pool.request()
            .input('id_usuario', mssql.Int, id_usuario)
            .input('id_libro', mssql.Int, id_libro)
            .query('SELECT * FROM Favoritos WHERE id_usuario = @id_usuario AND id_libro = @id_libro');

        if (checkResult.recordset.length > 0) {
            return res.status(400).json({ error: 'El libro ya está en favoritos' });
        }

        // Agregar a favoritos
        await pool.request()
            .input('id_usuario', mssql.Int, id_usuario)
            .input('id_libro', mssql.Int, id_libro)
            .query('INSERT INTO Favoritos (id_usuario, id_libro) VALUES (@id_usuario, @id_libro)');

        res.json({ message: 'Libro agregado a favoritos exitosamente' });
    } catch (err) {
        console.error('Error al agregar a favoritos:', err);
        res.status(500).json({ error: 'Error al agregar a favoritos' });
    }
});


//Agregando libro
app.post('/libros', upload.single('imagen'), async (req, res) => {
    const { titulo, autor, genero, url, cantidad } = req.body
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
            .input('cantidad', mssql.Int, cantidad)
            .query(`
                EXEC AgregarLibro 
                        @titulo,
                        @autor,
                        @genero,
                        @url,
                        @imagen,
                        @cantidad;
            `);
        res.json({ message: 'Libro agregado con éxito' });

    } catch (error) {
        console.error('Error al insertar libro:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
})
//Editando Libro
app.put('/libros', upload.single('imagen'), async (req, res) => {
    const { id_libro_info, titulo, autor, genero, url, cantidad } = req.body;
    const imagen = req.file ? `/uploads/${req.file.filename}` : null;

    console.log('Datos recibidos:', req.body);
    console.log('Archivo recibido:', req.file);

    try {
        const pool = await getConnection();
        await pool.request()
            .input('id_libro', mssql.Int, parseInt(id_libro_info))
            .input('titulo', mssql.NVarChar, titulo)
            .input('autor', mssql.NVarChar, autor)
            .input('genero', mssql.NVarChar, genero)
            .input('imagen', mssql.NVarChar, imagen)
            .input('url', mssql.NVarChar, url)
            .input('cantidad', mssql.Int, cantidad)
            .query(`
                EXEC EditarLibro
                        @id_libro,
                        @titulo,
                        @autor,
                        @genero,
                        @url,
                        @imagen,
                        @cantidad;
            `);

        res.json({ message: 'Libro editado con éxito' });

    } catch (error) {
        console.error('Error al editar libro:', error);
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
});
//Eliminar Libro
app.delete('/libros/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Conexión a la base de datos
        const pool = await getConnection();

        // Ejecutar el procedimiento almacenado para eliminar el libro
        const result = await pool.request()
            .input('id_libro', mssql.Int, id) // Pasar el id_libro al procedimiento
            .execute('EliminarLibro');

        if (result.rowsAffected[0] > 0) {
            res.status(204).send(); // No content (el libro fue eliminado)
        } else {
            res.status(404).send({ error: 'Libro no encontrado' });
        }
    } catch (error) {
        console.error('Error al eliminar el libro:', error);
        res.status(500).send({ error: 'Error al eliminar el libro' });
    }
});
//Mostrar usuario
app.get('/usuarios', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = 25;
        const offset = (page - 1) * pageSize;
        const searchTerm = req.query.search || '';

        const pool = await getConnection();

        // Consulta para obtener el total de usuarios con filtro
        const totalResult = await pool.request()
            .input('searchTerm', `%${searchTerm}%`)
            .query(`
                SELECT COUNT(*) as total 
                FROM Usuarios 
                WHERE (
                    nombre LIKE @searchTerm OR 
                    email LIKE @searchTerm
                )
            `);

        const totalUsers = totalResult.recordset[0].total;
        const totalPages = Math.ceil(totalUsers / pageSize);

        // Consulta paginada de usuarios con filtro
        const result = await pool.request()
            .input('searchTerm', `%${searchTerm}%`)
            .input('offset', offset)
            .input('pageSize', pageSize)
            .query(`
                SELECT * FROM (
                    SELECT 
                        id_usuario AS IdUsuario,
                        nombre AS Nombre, 
                        email AS Correo, 
                        rol AS Rol, 
                        esta_activo AS Estado,
                        ROW_NUMBER() OVER (ORDER BY id_usuario) as RowNum 
                    FROM Usuarios
                    WHERE (
                        nombre LIKE @searchTerm OR 
                        email LIKE @searchTerm
                    )
                ) as SubQuery
                WHERE RowNum > @offset AND RowNum <= @offset + @pageSize
            `);
        // Si no hay usuarios, devolver una respuesta vacía sin error
        if (!result.recordset.length) {
            return res.json({
                users: [],
                currentPage: page,
                totalPages: totalPages,
                totalUsers: totalUsers
            });
        }
        res.json({
            users: result.recordset,
            currentPage: page,
            totalPages: totalPages,
            totalUsers: totalUsers
        });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});
//Agregar Usuario
app.post('/usuarios', async (req, res) => {
    try {
        const { nombre, email, rol, esta_activo, contrasena_hash } = req.body;
        const pool0 = await getConnection();
        const result = await pool0.request()
            .input('email', mssql.NVarChar, email)
            .query('SELECT * FROM Usuarios WHERE email = @email');

        if (!result.recordset[0]) {
            if (!nombre || !email || !contrasena_hash) {
                return res.status(400).json({ message: 'Complete los espacios en blanco' })
            }
            const pool = await getConnection();
            await pool.request()
                .input('nombre', nombre)
                .input('email', email)
                .input('rol', rol)
                .input('esta_activo', esta_activo)
                .input('contrasena_hash', contrasena_hash)
                .query(`
                INSERT INTO Usuarios (nombre, email, rol, esta_activo, contrasena_hash)
                VALUES (@nombre, @email, @rol, @esta_activo, @contrasena_hash)
            `);

            res.status(201).json({ message: 'Usuario creado exitosamente' });
        } else {
            return res.status(400).json({ message: 'El correo ya existe' })
        }


    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});
// Editar usuario
app.put('/usuarios/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { nombre, email, rol, contrasena_hash } = req.body;
        const pool = await getConnection();

        // Verificar email existente
        const getEmail = await pool.request()
            .input('email', mssql.NVarChar, email)
            .query('SELECT * FROM Usuarios WHERE email = @email');
        
        const emailExistente = getEmail.recordset[0];

        // Procesar contraseña si es necesario
        let hashedPassword = contrasena_hash;
        if (contrasena_hash && !contrasena_hash.startsWith('$2a$')) {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(contrasena_hash, salt);
        }

        // Crear request base con parámetros comunes
        const request = pool.request()
            .input('id_usuario', userId)
            .input('nombre', nombre || null)
            .input('email', email || null)
            .input('rol', rol || null);

        if (hashedPassword) {
            request.input('contrasena_hash', hashedPassword);
        }

        if (!emailExistente || 
            (emailExistente.nombre !== nombre || 
             emailExistente.contrasena_hash !== contrasena_hash || 
             emailExistente.rol !== rol)) {
            
            await request.execute('EditarUsuario');
            res.json({ message: 'Usuario actualizado exitosamente' });
        } else {
            res.status(400).json({ message: 'El correo ya existe' });
        }

    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor al actualizar usuario' });
    }
});

// Eliminar usuario
app.delete('/usuarios/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        const pool = await getConnection();
        await pool.request()
            .input('id_usuario', userId)
            .execute('EliminarUsuario');

        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);

        // Manejar errores específicos de SQL Server
        if (error.message.includes('El usuario ya ha sido eliminado')) {
            return res.status(400).json({ error: 'El usuario ya ha sido eliminado' });
        }

        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});
//Modificar estado de usuario (mala practica creo xd)
app.put('/usuarios/:id/status', async (req, res) => {
    try {
        const userId = req.params.id;
        const { esta_activo } = req.body;

        const pool = await getConnection();
        await pool.request()
            .input('id_usuario', userId)
            .input('esta_activo', esta_activo)
            .query(`
                UPDATE Usuarios
                SET esta_activo = @esta_activo
                WHERE id_usuario = @id_usuario
            `);

        res.json({ message: 'Estado de usuario actualizado' });
    } catch (error) {
        console.error('Error al actualizar el estado del usuario:', error);
        res.status(500).json({ error: 'Error al actualizar el estado del usuario' });
    }
});
//Interfaz admin
app.get('/interfazAdmin.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'renderer', 'views', 'interfazAdmin', 'interfazAdmin.html'))

})
//Interfaz estudiante
app.get('/interfazStudent.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'renderer', 'views', 'interfazStudent', 'PanelDeActividad.html'))
})

//Servidor
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})

//Exportaciones
module.exports = {
    app,
    PORT
}