//IMPORTACIONES
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const { mssql, getConnection } = require('./database.js');
const sessionStore = require('./sessionStore.js');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const moment = require('moment');
// Iniciar servidor en un puerto aleatorio disponible
const http = require('http');
require('dotenv').config();
async function setupServer() {
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
const app = express();
//CORS

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net'],
                styleSrc: [
                    "'self'",
                    'cdn.jsdelivr.net',
                    'cdnjs.cloudflare.com',
                    'fonts.googleapis.com',
                    "'unsafe-inline'"
                ],
                fontSrc: [
                    "'self'",
                    'cdnjs.cloudflare.com',
                    'fonts.gstatic.com',
                    'cdn.jsdelivr.net',
                    'data:'
                ],
                imgSrc: ["'self'", "data:", "blob:"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
                baseUri: ["'self'"],
                frameAncestors: ["'none'"]
            },
        },
        crossOriginEmbedderPolicy: false,
    })
);
//MIDDLEWARES

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, '..', 'renderer')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'renderer', 'uploads')))

// //PUERTO A ESCUCHAR
// const PORT = process.env.PORT || 3000

//RUTAS (modificar MVC)

//Login del sistema (modificar username)
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('email', mssql.NVarChar, email)
            .query('SELECT * FROM Usuarios WHERE email = @email');
        
        // Verificar si el usuario existe
        if (result.recordset.length === 0) {
            return res.status(400).json({ message: 'Credenciales incorrectas' });
        }

        const user = result.recordset[0];

        // Validar si el usuario está activo
        if (user.esta_activo === false) {
            return res.status(403).json({ message: 'El usuario está inactivo. Contacte al administrador.' });
        }

        // Verificar la contraseña
        const storedPassword = user.contrasena_hash;
        const passwordMatch = storedPassword.startsWith('$2a$')
            ? await bcrypt.compare(password, storedPassword)
            : password === storedPassword;

        if (!passwordMatch) {
            return res.status(400).json({ message: 'Credenciales incorrectas' });
        }

        // Hashear contraseña si no está hasheada
        if (!storedPassword.startsWith('$2a$')) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            await pool.request()
                .input('email', mssql.NVarChar, email)
                .input('contrasena_hash', mssql.NVarChar, hashedPassword)
                .query('UPDATE Usuarios SET contrasena_hash = @contrasena_hash WHERE email = @email');
        }

        // Preparar datos del usuario para la sesión
        const userData = {
            id: user.id_usuario,
            email: user.email,
            rol: user.rol,
            nombre: user.nombre
        };

        const redirectUrl = user.rol === 'admin'
            ? `http://localhost:${sessionStore.getPort()}/interfazAdmin.html`
            : `http://localhost:${sessionStore.getPort()}/interfazStudent.html`;

        res.json({
            success: true,
            url: redirectUrl,
            user: userData // Enviamos los datos del usuario
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
    try {
        // Simplemente devolvemos la URL de redirección
        res.json({
            success: true,
            url: `http://localhost:${sessionStore.getPort()}/views/index.html`
        });
    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cerrar sesión'
        });
    }
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
        const id_usuario = req.headers['x-user-id'];
        const page = parseInt(req.query.page) || 1;
        const pageSize = 25;
        const offset = (page - 1) * pageSize;
        const searchTerm = req.query.search ? req.query.search.trim() : '';

        if (!id_usuario) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        const pool = await getConnection();

        // Build WHERE clause
        let whereClause = 'WHERE f.id_usuario = @id_usuario';
        if (searchTerm) {
            whereClause += ` AND (
                l.titulo LIKE @searchTerm OR 
                l.autor LIKE @searchTerm OR 
                JSON_VALUE(l.genero, '$.genero') LIKE @searchTerm
            )`;
        }

        // Get total count
        const countQuery = `
            SELECT COUNT(*) AS total 
            FROM Libros l
            INNER JOIN Favoritos f ON l.id_libro = f.id_libro
            ${whereClause}
        `;

        const countRequest = pool.request()
            .input('id_usuario', mssql.Int, id_usuario);
        if (searchTerm) {
            countRequest.input('searchTerm', `%${searchTerm}%`);
        }

        const totalCountResult = await countRequest.query(countQuery);
        const totalFavorites = totalCountResult.recordset[0].total;
        const totalPages = Math.ceil(totalFavorites / pageSize);

        // Get paginated favorites
        const query = `
            SELECT * FROM (
                SELECT 
                    l.id_libro,
                    l.titulo,
                    l.autor,
                    l.imagen,
                    l.genero,
                    l.url,
                    f.created_at,
                    ROW_NUMBER() OVER (ORDER BY f.created_at DESC) AS RowNum
                FROM Libros l
                INNER JOIN Favoritos f ON l.id_libro = f.id_libro
                ${whereClause}
            ) AS SubQuery
            WHERE RowNum > @offset AND RowNum <= (@offset + @pageSize)
        `;

        const request = pool.request()
            .input('id_usuario', mssql.Int, id_usuario)
            .input('offset', offset)
            .input('pageSize', pageSize);
        if (searchTerm) {
            request.input('searchTerm', `%${searchTerm}%`);
        }

        const result = await request.query(query);

        res.json({
            favorites: result.recordset,
            currentPage: page,
            totalPages: totalPages,
            totalFavorites: totalFavorites
        });
    } catch (error) {
        console.error('Error en GET /favoritos:', error);
        res.status(500).json({ error: 'Error al obtener favoritos' });
    }
});


// eliminar un favorito
app.delete('/favoritos/:id', async (req, res) => {
    try {
        const id_libro = req.params.id;
        const id_usuario = req.headers['x-user-id'];

        if (!id_usuario) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        const pool = await getConnection();
        await pool.request()
            .input('id_usuario', mssql.Int, id_usuario)
            .input('id_libro', mssql.Int, id_libro)
            .query('DELETE FROM Favoritos WHERE id_usuario = @id_usuario AND id_libro = @id_libro');

        res.json({ message: 'Favorito eliminado exitosamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al eliminar favorito' });
    }
});
// Agregar Libros Favoritos
app.post('/favoritos', async (req, res) => {
    try {
        const { id_libro } = req.body;
        const id_usuario = req.headers['x-user-id'];
        console.log('ID del libro:', id_libro, 'ID del usuario:', id_usuario);

        if (!id_usuario) {
            console.log('No se recibió ID de usuario');
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        const pool = await getConnection();

        // Verificar si ya está en favoritos
        const checkResult = await pool.request()
            .input('id_usuario', mssql.Int, id_usuario)
            .input('id_libro', mssql.Int, id_libro)
            .query('SELECT * FROM Favoritos WHERE id_usuario = @id_usuario AND id_libro = @id_libro');

        if (checkResult.recordset.length > 0) {
            console.log('Libro ya en favoritos');
            return res.status(400).json({ error: 'El libro ya está en favoritos' });
        }

        // Agregar a favoritos
        await pool.request()
            .input('id_usuario', mssql.Int, id_usuario)
            .input('id_libro', mssql.Int, id_libro)
            .query('INSERT INTO Favoritos (id_usuario, id_libro) VALUES (@id_usuario, @id_libro)');

        // Verificar que se insertó correctamente
        const verifyInsert = await pool.request()
            .input('id_usuario', mssql.Int, id_usuario)
            .input('id_libro', mssql.Int, id_libro)
            .query('SELECT * FROM Favoritos WHERE id_usuario = @id_usuario AND id_libro = @id_libro');

        console.log('Verificación después de insertar:', verifyInsert.recordset);

        res.json({ message: 'Libro agregado a favoritos exitosamente' });
    } catch (err) {
        console.error('Error detallado al agregar a favoritos:', err);
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
        const result = await pool.request()
            .input('id_libro', mssql.Int, parseInt(id_libro_info))
            .query('SELECT * FROM Libros WHERE id_libro = @id_libro');
        console.log(result.recordset);

        res.json({ message: 'Libro editado con éxito', result: result.recordset });

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
// Endpoint para obtener estadísticas
app.get('/api/admin/stats', async (req, res) => {
    try {
        const pool = await getConnection();

        const result = await pool.request().query(`
            SELECT 
                (SELECT COUNT(*) FROM Usuarios WHERE rol = 'estudiante' AND deleted_at IS NULL) as totalEstudiantes,
                (SELECT COUNT(*) FROM Usuarios WHERE rol = 'admin' AND deleted_at IS NULL) as totalAdmins,
                (SELECT COUNT(*) FROM Libros WHERE deleted_at IS NULL) as totalLibros
        `);

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para generar reporte PDF
app.get('/api/admin/generate-report', async (req, res) => {
    try {
        const pool = await getConnection();

        // Obtener estadísticas generales
        const statsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM Usuarios WHERE rol = 'estudiante' AND deleted_at IS NULL) as totalEstudiantes,
                (SELECT COUNT(*) FROM Usuarios WHERE rol = 'admin' AND deleted_at IS NULL) as totalAdmins,
                (SELECT COUNT(*) FROM Libros WHERE deleted_at IS NULL) as totalLibros
        `;

        // Obtener todos los libros
        const booksQuery = `
            SELECT 
                id_libro,
                titulo,
                autor,
                JSON_VALUE(genero, '$.genero') as genero,
                imagen,
                cantidad,
                created_at
            FROM Libros
            WHERE deleted_at IS NULL
            ORDER BY titulo
        `;

        // Obtener todos los usuarios
        const usersQuery = `
            SELECT 
                id_usuario,
                nombre,
                email,
                rol,
                esta_activo,
                created_at
            FROM Usuarios
            WHERE deleted_at IS NULL
            ORDER BY nombre
        `;

        // Ejecutar queries
        const stats = await pool.request().query(statsQuery);
        const books = await pool.request().query(booksQuery);
        const users = await pool.request().query(usersQuery);

        let quantityLibro = 1,
            quantityUser = 1;

        // Crear PDF
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50
        });
        moment.locale('es');
        doc.registerFont('LilitaOne', path.join(__dirname, '..', 'renderer', 'assets', 'fonts', 'LilitaOne-Regular.ttf'));
        // Configurar respuesta
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=reporte-biblioteca.pdf');

        // Pipe al response
        doc.pipe(res);

        // Título y fecha
        const insigniaPath = path.join(__dirname, '..', 'renderer', 'assets', 'img', 'insignia.jpg');
        const imageWidth = 145; // Ancho de la imagen
        const pageWidth = doc.page.width; // Ancho de la página
        const x = (pageWidth - imageWidth) / 2; // Calcular la posición x para centrar

        doc.image(insigniaPath, x, doc.y, {
            fit: [imageWidth, 180],
        })
        doc.moveDown(15);
        doc.font('LilitaOne').fillColor('#761e22').fontSize(24).text('Reporte de Biblioteca Tomas Gutarra Solis', { align: 'center' });
        doc.moveDown();
        doc.fillColor('black').fontSize(12).text(`Generado el: ${moment().format('dddd, DD/MM/YYYY HH:mm')}`, { align: 'center' });
        doc.moveDown(2);

        // Estadísticas generales
        doc.fillColor('#761e22').fontSize(16).text('Estadísticas Generales', { underline: true });
        doc.moveDown(2);

        doc.fillColor('#4b4b4b')
            .fontSize(14)
            .text('Total de Estudiantes: ', {
                continued: true,
                baseline: 6 // Ajusta la línea base para alinear con el número más grande
            })
            .fillColor('#7f00b2')
            .fontSize(20)
            .text(`${stats.recordset[0].totalEstudiantes}`, { continued: false })
            .fontSize(14)
            .fillColor('#4b4b4b')
            .text('Total de Administradores: ', {
                continued: true,
                baseline: 6
            })
            .fillColor('#7f00b2')
            .fontSize(20)
            .text(`${stats.recordset[0].totalAdmins}`, { continued: false })
            .fontSize(14)
            .fillColor('#4b4b4b')
            .text('Total de Libros: ', {
                continued: true,
                baseline: 6
            })
            .fillColor('#7f00b2')
            .fontSize(20)
            .text(`${stats.recordset[0].totalLibros}`, { continued: false });

        doc.moveDown();


        // Sección de Libros
        doc.fillColor('#761e22').fontSize(16).text('Inventario de Libros', { underline: true });
        doc.moveDown();

        const columnWidth = 250; // Ancho de cada columna
        const textWidth = 200; // Ancho máximo para el texto
        const startX = doc.x; // Posición inicial en X
        let currentY = doc.y; // Posición inicial en Y
        const marginBottom = 20; // Espacio entre el texto y la imagen
        const imageWidthBook = 100; // Ancho fijo de la imagen
        const imageHeight = 100; // Alto fijo de la imagen
        const spacingBetweenRows = 250; // Espacio deseado entre filas
        const pageHeight = doc.page.height - 50; // Altura de página con margen

        books.recordset.forEach((book, index) => {
            const isLeftColumn = index % 2 === 0;
            const currentX = startX + (isLeftColumn ? 0 : columnWidth);

            if (isLeftColumn && index > 0) {
                // Calcular la siguiente posición Y
                const nextY = currentY + spacingBetweenRows;

                // Verificar si la siguiente fila excederá el límite de la página
                if (nextY + imageHeight + 80 > pageHeight) {
                    // Agregar nueva página
                    doc.addPage();
                    currentY = 50; // Reiniciar Y en la nueva página
                } else {
                    currentY = nextY;
                }
            }

            // Asegurar que ambas columnas usen la misma posición Y
            doc.x = currentX;
            doc.y = currentY;

            // Dibujar el contenido del libro
            doc.fillColor('#0A7075').fontSize(16).text(`Libro: ${index + 1}`, {
                underline: true,
                width: textWidth, // Aplicar ancho máximo
                align: 'left'
            });
            doc.moveDown();

            // Función helper para texto con wrapping
            const addWrappedText = (label, content, color) => {
                doc.fontSize(12)
                    .fillColor(color)
                    .text(`${label}: ${content}`, {
                        width: textWidth,
                        align: 'left',
                        continued: false
                    });
            };

            // Agregar contenido con wrapping
            addWrappedText('Título', book.titulo, '#0266ff');
            addWrappedText('Autor', book.autor, '#4b4b4b');
            addWrappedText('Género', book.genero, '#4b4b4b');
            addWrappedText('Cantidad', book.cantidad, '#ea5422');

            const imageY = doc.y + marginBottom;

            // Agregar imagen si existe
            if (book.imagen) {
                try {
                    const imagePath = path.join(__dirname, '..', 'renderer', book.imagen);
                    doc.image(imagePath, currentX, imageY, {
                        width: imageWidthBook,
                        height: imageHeight,
                        align: 'center',
                        valign: 'top',
                    });
                } catch (err) {
                    console.error(`Error cargando imagen para el libro ${book.titulo}:`, err);
                    doc.y = imageY;
                    doc.text('[Imagen no disponible]', {
                        width: textWidth,
                        align: 'left'
                    });
                }
            } else {
                doc.y = imageY;
                doc.text('[Imagen no disponible]', {
                    width: textWidth,
                    align: 'left'
                });
            }
        });


        // Sección de Usuarios
        doc.addPage();
        doc.fillColor('#761e22').fontSize(16).text('Lista de Usuarios', { underline: true });
        doc.moveDown();

        const userColumnWidth = 250;
        const userStartX = doc.x;
        let userCurrentY = doc.y;
        const userSpacing = 150;
        const userPageHeight = doc.page.height - 50;

        users.recordset.forEach((user, index) => {
            const isUserLeftColumn = index % 2 === 0;
            const userCurrentX = userStartX + (isUserLeftColumn ? 0 : userColumnWidth);

            if (isUserLeftColumn && index > 0) {
                const nextUserY = userCurrentY + userSpacing;

                if (nextUserY + 100 > userPageHeight) {
                    doc.addPage();
                    userCurrentY = 50;
                } else {
                    userCurrentY = nextUserY;
                }
            }

            doc.x = userCurrentX;
            doc.y = userCurrentY;

            doc.fillColor('#0AE7DAC').fontSize(16).text(`Usuario: ${quantityUser}`, { underline: true });
            quantityUser++;
            doc.moveDown();
            doc.fillColor('#4b4b4b').fontSize(12)
                .text('Nombre: ', { continued: true })
                .fillColor('#05a649')
                .text(`${user.nombre}`, { continued: false })
                .fillColor('#4b4b4b')
                .text(`Email: ${user.email}`)
                .text('Rol: ', { continued: true })
                .fillColor('#ea5422')
                .text(`${user.rol}`, { continued: false })
                .fillColor('#4b4b4b')
                .text(`Estado: ${user.esta_activo ? 'Activo' : 'Inactivo'}`)
                .moveDown();
        });

        doc.end();

    } catch (error) {
        console.error('Error generando reporte:', error);
        res.status(500).json({ error: 'Error generando reporte' });
    }
});


const server_instance = http.createServer(app);
return new Promise((resolve) => {
    server_instance.listen(0, 'localhost', () => {
        const port = server_instance.address().port;
        console.log('Servidor Express iniciado en puerto:', port);
        sessionStore.setPort(port);
        resolve(port);
    });
});

}

// Servidor en desarollo 
// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`)
// })

//Exportaciones
module.exports = {
    setupServer,
}