CREATE DATABASE bibliotecauncp;
drop database bibliotecauncp;
GO
select * from Usuarios;
select * from Libros;
USE bibliotecauncp;
use master;
GO

-- Tabla de usuarios
CREATE TABLE Usuarios (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(150) NOT NULL,
    email NVARCHAR(255) UNIQUE NOT NULL,
    rol NVARCHAR(50) NOT NULL,
    esta_activo BIT NOT NULL DEFAULT 1,
    contrasena_hash NVARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    deleted_at DATETIME NULL,
    CONSTRAINT chk_rol CHECK (rol IN ('admin', 'estudiante'))
);
GO

-- �ndices para la tabla Usuarios
CREATE INDEX idx_nombre ON Usuarios(nombre);
CREATE INDEX idx_email ON Usuarios(email);
CREATE INDEX idx_esta_activo ON Usuarios(esta_activo);
GO

-- Tabla de libros con el campo cantidad
CREATE TABLE Libros (
    id_libro INT IDENTITY(1,1) PRIMARY KEY,
    titulo NVARCHAR(255) NOT NULL,
    autor NVARCHAR(255) NOT NULL,
    genero NVARCHAR(255) NOT NULL,
    url NVARCHAR(2083) NOT NULL,
    imagen NVARCHAR(2083) NOT NULL,
    cantidad INT NOT NULL DEFAULT 1, -- Nueva columna para cantidad
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    deleted_at DATETIME NULL,
    genero_genre AS (JSON_VALUE(genero, '$.genero')), -- Columna calculada
    CONSTRAINT chk_genero CHECK (
        ISJSON(genero) = 1 AND 
        JSON_VALUE(genero, '$.genero') IS NOT NULL
    ),
    CONSTRAINT uq_titulo_autor UNIQUE (titulo, autor) -- Evita duplicados por t�tulo y autor
);
GO

-- �ndices para la tabla Libros
CREATE INDEX idx_genero ON Libros(genero_genre);
CREATE INDEX idx_titulo ON Libros(titulo);
GO

-- Tabla de favoritos (relaci�n muchos a muchos entre usuarios y libros)
CREATE TABLE Favoritos (
    id_usuario INT,
    id_libro INT,
    created_at DATETIME DEFAULT GETDATE(),
    PRIMARY KEY (id_usuario, id_libro),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_libro) REFERENCES Libros(id_libro) ON DELETE CASCADE
);
GO
CREATE INDEX idx_favoritos_usuario_libro ON Favoritos(id_usuario, id_libro);
GO


-- Insertar datos en Usuarios
INSERT INTO Usuarios (nombre, email, rol, esta_activo, contrasena_hash)
VALUES ('stivens', 'stivensaa@outlook.es', 'admin', 1, '17032004');

-- Funci�n para agregar libros sin repetir
CREATE PROCEDURE AgregarLibro (
    @titulo NVARCHAR(255),
    @autor NVARCHAR(255),
    @genero NVARCHAR(255),
    @url NVARCHAR(2083),
    @imagen NVARCHAR(2083),
    @cantidad INT
)
AS
BEGIN
    IF EXISTS (SELECT 1 FROM Libros WHERE titulo = @titulo AND autor = @autor)
    BEGIN
        -- Si el libro ya existe, actualiza la cantidad
        UPDATE Libros
        SET cantidad = cantidad + @cantidad, updated_at = GETDATE()
        WHERE titulo = @titulo AND autor = @autor;
    END
    ELSE
    BEGIN
        -- Si no existe, lo inserta como nuevo
        INSERT INTO Libros (titulo, autor, genero, url, imagen, cantidad)
        VALUES (@titulo, @autor, @genero, @url, @imagen, @cantidad);
    END
END;
GO

CREATE PROCEDURE EditarLibro (
    @id_libro INT,
    @titulo NVARCHAR(255) = NULL,
    @autor NVARCHAR(255) = NULL,
    @genero NVARCHAR(255) = NULL,
    @url NVARCHAR(2083) = NULL,
    @imagen NVARCHAR(2083) = NULL,
    @cantidad INT = NULL
)
AS
BEGIN
-- If genero is provided, ensure it's a valid JSON
    IF @genero IS NOT NULL AND ISJSON(@genero) = 0
    BEGIN
        -- If not JSON, wrap it in a JSON object
        SET @genero = JSON_QUERY('{"genero":"' + @genero + '"}')
    END
    -- Validación: Si la cantidad es negativa, lanzar un error
    IF @cantidad IS NOT NULL AND @cantidad < 0
    BEGIN
        RAISERROR('La cantidad no puede ser negativa', 16, 1);
        RETURN;
    END;

    -- Actualización de los datos
    UPDATE Libros
    SET titulo = COALESCE(@titulo, titulo),
        autor = COALESCE(@autor, autor),
        genero = COALESCE(@genero, genero),
        url = COALESCE(@url, url),
        cantidad = COALESCE(@cantidad, cantidad), -- Actualiza directamente la cantidad
        updated_at = GETDATE(),
        imagen = COALESCE(@imagen, imagen)
    WHERE id_libro = @id_libro;
END;

-- Procedimiento para Eliminar Libro (Hard Delete)
CREATE PROCEDURE EliminarLibro (
    @id_libro INT
)
AS
BEGIN
    -- Verificar si el libro existe
    IF NOT EXISTS (
        SELECT 1 FROM Libros WHERE id_libro = @id_libro
    )
    BEGIN
        RAISERROR('Libro no encontrado.', 16, 1);
        RETURN;
    END

    -- Eliminar el libro
    DELETE FROM Libros
    WHERE id_libro = @id_libro;

    -- Verificar si se eliminó algún registro
    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Error al eliminar el libro.', 16, 1);
        RETURN;
    END
END;
GO


-- Procedimiento para Editar Usuario
CREATE PROCEDURE EditarUsuario (
    @id_usuario INT,
    @nombre NVARCHAR(150) = NULL,
    @email NVARCHAR(255) = NULL,
    @rol NVARCHAR(10) = NULL,
    @contrasena_hash NVARCHAR(255) = NULL
)
AS
BEGIN
    -- Validar el rol si se proporciona
    IF @rol IS NOT NULL AND @rol NOT IN ('admin', 'estudiante')
    BEGIN
        RAISERROR('Rol inválido. Debe ser "admin" o "estudiante".', 16, 1);
        RETURN;
    END

    -- Verificar si el correo electrónico ya existe (excluyendo el usuario actual)
    IF @email IS NOT NULL AND EXISTS (
        SELECT 1 FROM Usuarios 
        WHERE email = @email AND id_usuario != @id_usuario AND deleted_at IS NULL
    )
    BEGIN
        RAISERROR('El correo electrónico ya está en uso por otro usuario.', 16, 1);
        RETURN;
    END

    -- Actualizar el usuario
    UPDATE Usuarios
    SET 
        nombre = COALESCE(@nombre, nombre),
        email = COALESCE(@email, email),
        rol = COALESCE(@rol, rol),
        contrasena_hash = COALESCE(@contrasena_hash, contrasena_hash),
        updated_at = GETDATE()
    WHERE id_usuario = @id_usuario AND deleted_at IS NULL;

    -- Verificar si se actualizó algún registro
    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Usuario no encontrado o ya eliminado.', 16, 1);
        RETURN;
    END
END;
GO

CREATE PROCEDURE EliminarUsuario (
    @id_usuario INT
)
AS
BEGIN
    SET NOCOUNT ON;

    -- Verificar si el usuario existe
    IF NOT EXISTS (
        SELECT 1 FROM Usuarios 
        WHERE id_usuario = @id_usuario
    )
    BEGIN
        RAISERROR('Usuario no encontrado.', 16, 1);
        RETURN;
    END

    -- Eliminar registros relacionados si existen (ejemplo: Favoritos)
    DELETE FROM Favoritos 
    WHERE id_usuario = @id_usuario;

    -- Realizar hard delete: Eliminar el usuario completamente
    DELETE FROM Usuarios
    WHERE id_usuario = @id_usuario;

    -- Confirmación opcional
    PRINT 'Usuario eliminado correctamente.';
END;
GO

--(247-298)
INSERT INTO Libros (titulo, autor, genero, url, imagen, cantidad)
VALUES 
('Historia Marítima del Perú Tomo I Volumen 1', 'Gaulke, Martínez', '{"genero": "Historia"}', 'https://articulo.mercadolibre.com.pe/MPE-447046001-historia-maritima-del-peru-12-tomos-coleccion-completa-_JM', '247 Historia_Marítima_del_Perú_Tomo_I_Volumen_1.jpeg', 1),
('Historia Marítima del Perú Tomo I Volumen 2', 'Romero, Vidal', '{"genero": "Historia"}', 'https://articulo.mercadolibre.com.pe/MPE-447046001-historia-maritima-del-peru-12-tomos-coleccion-completa-_JM', '248 Historia_Marítima_del_Perú_Tomo_I_Volumen_2.jpeg', 1),
('Historia Marítima del Perú Tomo II Volumen 1', 'Hermann Buse', '{"genero": "Historia"}', 'https://articulo.mercadolibre.com.pe/MPE-447046001-historia-maritima-del-peru-12-tomos-coleccion-completa-_JM', '249 Historia_Marítima_del_Perú_Tomo_II_Volumen_1.jpeg', 1),
('Historia Marítima del Perú Tomo II Volumen 2', 'Hermann Buse', '{"genero": "Historia"}', 'https://articulo.mercadolibre.com.pe/MPE-447046001-historia-maritima-del-peru-12-tomos-coleccion-completa-_JM', '250 Historia_Marítima_del_Perú_Tomo_II_Volumen_2.jpeg', 1),
('Historia Marítima del Perú Tomo III Volumen 1', 'José A. del Busto Duthurburu', '{"genero": "Historia"}', 'https://articulo.mercadolibre.com.pe/MPE-447046001-historia-maritima-del-peru-12-tomos-coleccion-completa-_JM', '251 Historia_Marítima_del_Perú_Tomo_III_Volumen_1.jpeg', 1),
('Historia Marítima del Perú Tomo III Volumen 2', 'José A. del Busto Duthurburu', '{"genero": "Historia"}', 'https://articulo.mercadolibre.com.pe/MPE-447046001-historia-maritima-del-peru-12-tomos-coleccion-completa-_JM', '252 Historia_Marítima_del_Perú_Tomo_III_Volumen_2.jpeg', 1),
('Historia Marítima del Perú Tomo IV', 'Guillermo Lohmann Villena', '{"genero": "Historia"}', 'https://articulo.mercadolibre.com.pe/MPE-447046001-historia-maritima-del-peru-12-tomos-coleccion-completa-_JM', '253 Historia_Marítima_del_Perú_Tomo_IV.jpeg', 1),
('Historia Marítima del Perú Tomo V Volumen 1', 'José A. de la Puente Candamo', '{"genero": "Historia"}', 'https://articulo.mercadolibre.com.pe/MPE-447046001-historia-maritima-del-peru-12-tomos-coleccion-completa-_JM', '254 Historia_Marítima_del_Perú_Tomo_V_Volumen_1.jpeg', 1),
('Historia Marítima del Perú Tomo V Volumen 2', 'José A. de la Puente Candamo', '{"genero": "Historia"}', 'https://articulo.mercadolibre.com.pe/MPE-447046001-historia-maritima-del-peru-12-tomos-coleccion-completa-_JM', '255 Historia_Marítima_del_Perú_Tomo_V_Volumen_2.jpeg', 1),
('Historia Marítima del Perú Tomo VI Volumen 1', 'Félix Denegrí Luna', '{"genero": "Historia"}', 'https://articulo.mercadolibre.com.pe/MPE-447046001-historia-maritima-del-peru-12-tomos-coleccion-completa-_JM', '256 Historia_Marítima_del_Perú_Tomo_VI_Volumen_1.jpeg', 1),
('Historia Marítima del Perú Tomo VI Volumen 2', 'Félix Denegrí Luna', '{"genero": "Historia"}', 'https://articulo.mercadolibre.com.pe/MPE-447046001-historia-maritima-del-peru-12-tomos-coleccion-completa-_JM', '257 Historia_Marítima_del_Perú_Tomo_VI_Volumen_2.jpeg', 1),
('Historia Marítima del Perú Tomo VII', 'Murguía, Velez', '{"genero": "Historia"}', 'https://articulo.mercadolibre.com.pe/MPE-447046001-historia-maritima-del-peru-12-tomos-coleccion-completa-_JM', '258 Historia_Marítima_del_Perú_Tomo_VII.jpeg', 1),
('Enciclopedia Técnica de la Educación I', 'Grupo editorial', '{"genero": "Pedagogía"}', 'https://articulo.mercadolibre.com.mx/MLM-2937641492-enciclopedia-tecnica-de-la-educacion-6-tomos-santillana-_JM', '259 Enciclopedia_Técnica_de_la_Educación_I.jpeg', 1),
('Enciclopedia Técnica de la Educación II', 'Grupo editorial', '{"genero": "Pedagogía"}', 'https://articulo.mercadolibre.com.mx/MLM-2937641492-enciclopedia-tecnica-de-la-educacion-6-tomos-santillana-_JM', '260 Enciclopedia_Técnica_de_la_Educación_II.jpeg', 1),
('Enciclopedia Técnica de la Educación III', 'Grupo editorial', '{"genero": "Pedagogía"}', 'https://articulo.mercadolibre.com.mx/MLM-2937641492-enciclopedia-tecnica-de-la-educacion-6-tomos-santillana-_JM', '261 Enciclopedia_Técnica_de_la_Educación_III.jpeg', 1),
('Enciclopedia Técnica de la Educación IV', 'Grupo editorial', '{"genero": "Pedagogía"}', 'https://articulo.mercadolibre.com.mx/MLM-2937641492-enciclopedia-tecnica-de-la-educacion-6-tomos-santillana-_JM', '262 Enciclopedia_Técnica_de_la_Educación_IV.jpeg', 1),
('Enciclopedia Técnica de la Educación V', 'Grupo editorial', '{"genero": "Pedagogía"}', 'https://articulo.mercadolibre.com.mx/MLM-2937641492-enciclopedia-tecnica-de-la-educacion-6-tomos-santillana-_JM', '263 Enciclopedia_Técnica_de_la_Educación_V.jpeg', 1),
('Enciclopedia Técnica de la Educación VI', 'Grupo editorial', '{"genero": "Pedagogía"}', 'https://articulo.mercadolibre.com.mx/MLM-2937641492-enciclopedia-tecnica-de-la-educacion-6-tomos-santillana-_JM', '264 Enciclopedia_Técnica_de_la_Educación_VI.jpeg', 1),
('Sones para los preguntones', 'Jorge Díaz Herrera', '{"genero": "Literatura infantil"}', 'https://colegiolatam.odilo.es/info/sones-para-los-preguntones-sones-para-los-preguntones-00516884', '265 Sones_para_los_preguntones.jpeg', 1),
('Diccionario', 'sin autor', '{"genero": "Referencial"}', '', '266 Diccionario.jpeg', 7),
('La culpa es de la vaca!', 'Gutiérrez, Bernal', '{"genero": "Fábula"}', 'https://biblioteca.cuenca.gob.ec/opac_css/index.php?lvl=notice_display&id=83702', '267 La_culpa_es_de_la_vaca!.jpeg', 1),
('El extraordinario Félix Feliz', 'Jordi Sierra i Fabra', '{"genero": "Literatura infantil"}', 'http://www.elem.mx/obra/datos/224912', '268 El_extraordinario_Félix_Feliz.jpeg', 1),
('El Mundo es ancho y ajeno', 'Ciro Alegría', '{"genero": "Ficción"}', 'https://biblioteca.choapa.cl/Libros/el-mundo-es-ancho-y-ajeno-de-ciro-alegrc3ada.pdf', '269 El_Mundo_es_ancho_y_ajeno.jpeg', 7),
('Grupos de niños y de adolescentes', 'René Fau.', '{"genero": "Ciencias sociales y humanísticas"}', 'https://articulo.mercadolibre.com.ar/MLA-740674173-libro-grupos-de-ninos-y-de-adolescentes-_JM', '270 Grupos_de_niños_y_de_adolescentes.jpeg', 1),
('Los niños difíciles', 'Georges Amado', '{"genero": "Psicología"}', 'https://articulo.mercadolibre.com.mx/MLM-1425464427-los-ninos-dificiles-g-amado-_JM', '271 Los_niños_difíciles.jpeg', 1),
('Nueva pedagogía científica', 'Gastón Mialaret', '{"genero": "Psicología"}', 'https://articulo.mercadolibre.com.ar/MLA-1146935064-nueva-pedagogia-cientifica-g-mialaret-luis-miracle-edit-_JM', '272 Nueva_pedagogía_científica.jpeg', 1),
('Las dificultades escolares', 'Gilbert Robin', '{"genero": "Ciencias sociales y humanísticas"}', 'https://articulo.mercadolibre.com.ar/MLA-678610043-dr-gilbert-robin-dificultades-escolares-ninos-c277-_JM', '273 Las_dificultades_escolares.jpeg', 1),
('El adolescente y los deportes', 'Georges Durand', '{"genero": "Ciencias sociales y humanísticas"}', 'https://articulo.mercadolibre.com.ar/MLA-678609392-dr-georges-durand-el-adolescente-y-los-deportes-c277-_JM', '274 El_adolescente_y_los_deportes.jpeg', 1),
('Estudio de las lenguas modernas', 'A. J. Roche, F. Sánchez', '{"genero": "Ciencias sociales y humanísticas"}', 'https://vallrovira.com/es/libro/el-estudio-de-las-lenguas-modernas-22331', '275 Estudio_de_las_lenguas_modernas.jpeg', 1),
('Psicopatología de la pubertad y de la adolescencia', 'J. Rouart', '{"genero": "Ciencias sociales y humanísticas"}', 'https://articulo.mercadolibre.com.ar/MLA-758705179-psicopatologia-de-la-pubertad-y-de-la-adolescencia-_JM', '276 Psicopatología_de_la_pubertad_y_de_la_adolescencia.jpeg', 1),
('El niño perverso', 'Léon Michaux', '{"genero": "Psicología infantil"}', 'https://solardelbruto.es/94347-el-nino-perverso.html', '277 El_niño_perverso.jpeg', 1),
('Convención sobre los derechos del niño', 'UNICEF', '{"genero": "Legal y educativo"}', 'https://www.unicef.org/peru/sites/unicef.org.peru/files/2019-01/convencion_sobre_los_derechos_del_nino__final.pdf', '278 Convención_sobre_los_derechos_del_niño.jpeg', 5),
('Moonraker (James Bond 007)', 'Ian Fleming', '{"genero": "Ficción"}', 'https://www.casadellibro.com/libro-moonraker-james-bond-007/9788466309035/884385', '279 Moonraker_(James_Bond_007).jpeg', 1),
('Ollantay', 'Anónimo', '{"genero": "Dramático"}', 'https://cuentoscomics.blogspot.com/2018/12/comic-de-ollantay.html', '280 Ollantay.jpeg', 1),
('¡Estás despedida!', 'Rachel Flynn', '{"genero": "Novela humorística"}', 'https://www.casadellibro.com/libro-estas-despedida/9788434888739/851786', '281 ¡Estás_despedida!.jpeg', 1),
('Pepín el niño juguetón', 'Ministerio de Educación', '{"genero": "Literatura infantil"}', 'https://catalogo.ucsm.edu.pe/bib/53027', '282 Pepín_el_niño_juguetón.jpeg', 1),
('Aviones 25 modelos', 'José R. Aroca', '{"genero": "Modelos"}', 'https://articulo.mercadolibre.com.ar/MLA-817836782-aviones-25-modelos-jose-r-aroca-doncel-a636-_JM', '283 Aviones_25_modelos.jpeg', 1);

UPDATE Libros
SET imagen = CONCAT('/uploads/', imagen)
WHERE imagen IN (
    '247 Historia_Marítima_del_Perú_Tomo_I_Volumen_1.jpeg',
    '248 Historia_Marítima_del_Perú_Tomo_I_Volumen_2.jpeg',
    '249 Historia_Marítima_del_Perú_Tomo_II_Volumen_1.jpeg',
    '250 Historia_Marítima_del_Perú_Tomo_II_Volumen_2.jpeg',
    '251 Historia_Marítima_del_Perú_Tomo_III_Volumen_1.jpeg',
    '252 Historia_Marítima_del_Perú_Tomo_III_Volumen_2.jpeg',
    '253 Historia_Marítima_del_Perú_Tomo_IV.jpeg',
    '254 Historia_Marítima_del_Perú_Tomo_V_Volumen_1.jpeg',
    '255 Historia_Marítima_del_Perú_Tomo_V_Volumen_2.jpeg',
    '256 Historia_Marítima_del_Perú_Tomo_VI_Volumen_1.jpeg',
    '257 Historia_Marítima_del_Perú_Tomo_VI_Volumen_2.jpeg',
    '258 Historia_Marítima_del_Perú_Tomo_VII.jpeg',
    '259 Enciclopedia_Técnica_de_la_Educación_I.jpeg',
    '260 Enciclopedia_Técnica_de_la_Educación_II.jpeg',
    '261 Enciclopedia_Técnica_de_la_Educación_III.jpeg',
    '262 Enciclopedia_Técnica_de_la_Educación_IV.jpeg',
    '263 Enciclopedia_Técnica_de_la_Educación_V.jpeg',
    '264 Enciclopedia_Técnica_de_la_Educación_VI.jpeg',
    '265 Sones_para_los_preguntones.jpeg',
    '266 Diccionario.jpeg',
    '267 La_culpa_es_de_la_vaca!.jpeg',
    '268 El_extraordinario_Félix_Feliz.jpeg',
    '269 El_Mundo_es_ancho_y_ajeno.jpeg',
    '270 Grupos_de_niños_y_de_adolescentes.jpeg',
    '271 Los_niños_difíciles.jpeg',
    '272 Nueva_pedagogía_científica.jpeg',
	'273 Las_dificultades_escolares.jpeg',
    '274 El_adolescente_y_los_deportes.jpeg',
    '275 Estudio_de_las_lenguas_modernas.jpeg',
    '276 Psicopatología_de_la_pubertad_y_de_la_adolescencia.jpeg',
    '277 El_niño_perverso.jpeg',
    '278 Convención_sobre_los_derechos_del_niño.jpeg',
    '279 Moonraker_(James_Bond_007).jpeg',
    '280 Ollantay.jpeg',
    '281 ¡Estás_despedida!.jpeg',
    '282 Pepín_el_niño_juguetón.jpeg',
    '283 Aviones_25_modelos.jpeg'
);


INSERT INTO Libros (titulo, autor, genero, url, imagen, cantidad)
VALUES
('Selección de poesías', 'Ruben Dario', '{"genero": "Poético"}', 'https://www.poesia-castellana.com/seleccion-de-poemas-de-ruben-dario', '284 Selección_de_poesías.jpeg', 1),
('Prestadito Nomás', 'Julio Cesar Alfaro G.', '{"genero": "Narrativa peruana"}', 'https://web.facebook.com/photo/?fbid=253517637175030&set=pb.100079939417632.-2207520000', '285 Prestadito_Nomás.jpeg', 1),
('La Gran Esperanza', 'Elena de White', '{"genero": "Religión y espiritualidad"}', 'https://libro.esperanzaweb.com/la-gran-esperanza/', '286 La_Gran_Esperanza.jpeg', 1),
('El libro de luz', 'Andreu Martín', '{"genero": "Thriller"}', 'https://www.casadellibro.com/libro-el-libro-de-la-luz/9788434860285/607225', '287 El_libro_de_luz.jpeg', 1),
('Tradiciones Cuzqueñas para niños', 'Clorinda Matto de Turner', '{"genero": "Literatura infantil"}', 'https://catalogo.ucsm.edu.pe/bib/53028', '288 Tradiciones_Cuzqueñas_para_niños.jpeg', 1),
('Sabi la hormiga que quería ser escritora', 'Cronwell Jara Jiménez', '{"genero": "Literatura infantil"}', 'https://www.librosperuanos.com/libros/detalle/11698/Sabi.-La-hormiga-que-queria-ser-escritora', '289 Sabi_la_hormiga_que_quería_ser_escritora.jpeg', 1),
('Descubriendo la Tecnología apropiada para el desarrollo local', 'Ministerio de Educación', '{"genero": "Académico y técnico"}', '', '290 Descubriendo_la_Tecnología_apropiada_para_el_desarrollo_local.jpeg', 1),
('Cabecita de jardín', 'Mayte Mujica', '{"genero": "Literatura infantil"}', 'https://www.libreriasur.com.pe/libro/cabecita-de-jardin_153755', '291 Cabecita_de_jardín.jpeg', 1),
('Los mamíferos', 'Ministerio de Educación', '{"genero": "Educativo"}', '', '292 Los_mamíferos.jpeg', 1),
('Manual de uso para el docente Segundo grado - Primaria Comunicación y Matemática I, II y III Trimestre', 'Ministerio de Educación', '{"genero": "Pedagógico"}', 'https://repositorio.minedu.gob.pe/handle/20.500.12799/6270', '293 Manual_de_uso_para_el_docente_Segundo_grado_-_Primaria_Comunicación_y_Matemática_I,_II_y_III_Trimestre.jpeg', 1),
('Manual de uso para el docente Cuarto grado - Primaria Matemática I, II y III Trimestre', 'Ministerio de Educación', '{"genero": "Pedagógico"}', 'https://es.scribd.com/document/424209861/kit-evaluacion-manual-uso-docente-4to-primaria-matematica-pdf', '294 Manual_de_uso_para_el_docente_Cuarto_grado_-_Primaria_Matemática_I,_II_y_III_Trimestre.jpeg', 2),
('Manual de uso para el docente Cuarto grado - Primaria Comunicación I, II y III Trimestre', 'Ministerio de Educación', '{"genero": "Pedagógico"}', 'https://es.scribd.com/document/421452708/Kit-Evaluacion-Manual-Uso-Docente-4to-Primaria-Comunicacion', '295 Manual_de_uso_para_el_docente_Cuarto_grado_-_Primaria_Comunicación_I,_II_y_III_Trimestre.webp', 1),
('Rutas de Aprendizaje 2015 V Ciclo Ciencia y Ambiente', 'Ministerio de Educación', '{"genero": "Pedagógico"}', 'https://es.slideshare.net/slideshow/rutas-de-aprendizaje-ciencia-y-ambiente-2015/46040048', '296 Rutas_de_Aprendizaje_2015_V_Ciclo_Ciencia_y_Ambiente.jpeg', 4),
('Rutas de Aprendizaje 2015 V Ciclo Personal Social', 'Ministerio de Educación', '{"genero": "Pedagógico"}', '', '297 Rutas_de_Aprendizaje_2015_V_Ciclo_Personal_Social.jpeg', 4),
('Rutas de Aprendizaje Fascículo 1 Ejerce plenamente su ciudadanía III Ciclo', 'Ministerio de Educación', '{"genero": "Pedagógico"}', '', '298 Rutas_de_Aprendizaje_Fascículo_1_Ejerce_plenamente_su_ciudadanía_III_Ciclo.jpeg', 5);

UPDATE Libros
SET imagen = CONCAT('/uploads/', imagen)
WHERE imagen IN (
    '284 Selección_de_poesías.jpeg',
    '285 Prestadito_Nomás.jpeg',
    '286 La_Gran_Esperanza.jpeg',
    '287 El_libro_de_luz.jpeg',
    '288 Tradiciones_Cuzqueñas_para_niños.jpeg',
    '289 Sabi_la_hormiga_que_quería_ser_escritora.jpeg',
    '290 Descubriendo_la_Tecnología_apropiada_para_el_desarrollo_local.jpeg',
    '291 Cabecita_de_jardín.jpeg',
    '292 Los_mamíferos.jpeg',
    '293 Manual_de_uso_para_el_docente_Segundo_grado_-_Primaria_Comunicación_y_Matemática_I,_II_y_III_Trimestre.jpeg',
    '294 Manual_de_uso_para_el_docente_Cuarto_grado_-_Primaria_Matemática_I,_II_y_III_Trimestre.jpeg',
    '295 Manual_de_uso_para_el_docente_Cuarto_grado_-_Primaria_Comunicación_I,_II_y_III_Trimestre.webp',
    '296 Rutas_de_Aprendizaje_2015_V_Ciclo_Ciencia_y_Ambiente.jpeg',
    '297 Rutas_de_Aprendizaje_2015_V_Ciclo_Personal_Social.jpeg',
    '298 Rutas_de_Aprendizaje_Fascículo_1_Ejerce_plenamente_su_ciudadanía_III_Ciclo.jpeg'
);

--(82-191)
INSERT INTO Libros (titulo, autor, genero, url, imagen, cantidad)
VALUES 
('Aula. Curso de Orientación Escolar. Ciencias Naturales', 'Cassinello, Castilla, Rubio, Sánchez', '{"genero": "Educativo"}', 'https://www.iberlibro.com/AULA-CURSO-ORIENTACI%C3%93N-ESCOLAR-CIENCIAS-NATURALES/16416879384/bd', '/uploads/82_Aula_Curso_de_Orientación Escolar_Ciencias_Naturales.png', 1),

('Aula. Curso de Orientación Escolar. Matematicas', 'Domínguez, García, Ruiz', '{"genero": "Educativo"}', 'https://biblio.com.au/book/curso-orientacion-escolar-matematicas-dominguez-montero/d/1504161779', '/uploads/83_Aula_Curso_de_Orientación_Escolar_Matematicas.jpg', 1),

('Aula. Curso de Orientación Escolar. Lengua y Literatura', 'Gimenos, Lechado, Rojas', '{"genero": "Educativo"}', 'https://www.abebooks.com/AULA-CURSO-ORIENTACI%C3%93N-ESCOLAR-LENGUA-LITERATURA/16416879848/bd', '/uploads/84_Aula_Curso_de_Orientación_Escolar_Lengua_y_Literatura.png', 1),

('Aula. Curso de Orientación Escolar. Humanidades', 'Benito, Ciaurriz, Gimeno', '{"genero": "Educativo"}', 'https://www.abebooks.co.uk/AULA-CURSO-ORIENTACI%C3%93N-ESCOLAR-HUMANIDADES-VARIOS/16416879393/bd', '/uploads/85_Aula_Curso_de_Orientación_Escolar_Humanidades.png', 1),

('Aula. Curso de Orientación Escolar. Fisica y Quimica', 'Domínguez, García', '{"genero": "Educativo"}', 'https://www.todocoleccion.net/libros/aula-curso-orientacion-escolar-fisica-quimica~x46617470', '/uploads/86_Aula_Curso_de_Orientación_Escolar_Fisica_y_Quimica.png', 1),

('Maria', 'Jorge Isaacs', '{"genero": "Novela"}', 'http://www.letras.ufmg.br/padrao_cms/documentos/profs/romulo/Mar%C3%ADa%20de%20Jorge%20Isaacs.pdf', '/uploads/87_Maria.jpeg', 1),

('Esa Mañana', 'Antonio Malpica Maury', '{"genero": "Narrativo"}', 'https://www.exlibris.com.co/libro/esa-manana_33383', '/uploads/88_Esa_Mañana.png', 7),

('El abuelo del bosque', 'Garrido, Builes', '{"genero": "Narrativo"}', 'https://www.planetadelibros.com.pe/libro-el-abuelo-del-bosque/265825', '/uploads/89_El_abuelo_del_bosque.jpeg', 1),

('Lucas y el puente peatonal', 'Andrés Flores Huerta', '{"genero": "Narrativo"}', 'https://es.scribd.com/document/220569564/Lucas-y-El-Puente-Peatonal', '/uploads/90_Lucas_y_el_puente_peatonal.jpeg', 1),

('El Chullachaqui virgulero', 'Pompeyo cerrón Martínez', '{"genero": "Educativo"}', '', '/uploads/91_El_Chullachaqui_virgulero.jpeg', 1),

('Rutas del Aprendizaje - Matemática', 'Ministerio de Educación', '{"genero": "Educativo"}', '', '/uploads/92_Rutas_del_Aprendizaje_Matemática.jpeg', 3),

('Rutas del Aprendizaje - Ciencia y Tecnología', 'Ministerio de Educación', '{"genero": "Educativo"}', '', '/uploads/93_Rutas_del_Aprendizaje_Ciencia_y_Tecnología.jpeg', 3),

('Rutas del Aprendizaje - Ciencia y Ambiente', 'Ministerio de Educación', '{"genero": "Educativo"}', '', '/uploads/94_Rutas_del_Aprendizaje_Ciencia_y_Ambiente.jpeg', 1),

('Rutas del Aprendizaje - Comprensión de textos orales III', 'Ministerio de Educación', '{"genero": "Educativo"}', '', '/uploads/95_Rutas_del_Aprendizaje_Comprensión_de_textos_orales_III.jpeg', 3),

('Rutas del Aprendizaje - Comunicación', 'Ministerio de Educación', '{"genero": "Educativo"}', '', '/uploads/96_Rutas_del_Aprendizaje_Comunicación.jpeg', 5),

('Los Jefes Los Cachorros', 'Mario Vargas Llosa', '{"genero": "Ficción"}', 'https://www.google.com.pe/books/edition/Los_jefes_Los_cachorros/Wi22CwAAQBAJ?hl=es&gbpv=1', '/uploads/98_Los_Jefes_Los_Cachorros.jpeg', 1),

('Constitución Política del Perú', 'Congreso Constituyente Democrático', '{"genero": "Educativo"}', 'https://www.tc.gob.pe/wp-content/uploads/2021/05/Constitucion-Politica-del-Peru-1993.pdf', '/uploads/99_Constitución_Política_del_Perú.jpeg', 2),

('Escuela Nueva. Matemática Quinto de Primaria', 'Marín del Águila, Angel', '{"genero": "Educativo"}', '', '/uploads/100_Escuela_Nueva_Matemática_Quinto_de_Primaria.jpeg', 1),

('Curso Completo de Ingles. Ilustrado', 'Toribio Anyarin Injante', '{"genero": "Educativo"}', '', '/uploads/101_Curso_Completo_de_Ingles_Ilustrado.jpeg', 1),

('Nuevo Testamento de La Biblia', 'Bernardo Hurault', '{"genero": "Religioso"}', 'https://www.iberlibro.com/servlet/BookDetailsPL?bi=19302603971&searchurl=an%3Dbernardo%2Bhurault%26ds%3D30%26rollup%3Don%26sortby%3D17%26tn%3Dbiblia%2Blatinoam%25E9rica&cm_sp=snippet-_-srp0-_-image2', '/uploads/102_Nuevo_Testamento_de_La_Biblia.jpeg', 1),

('Genio y figura de mi comunidad: Sicaya Primera parte', 'Jorge Ruiz Baldeón', '{"genero": "Historia"}', '', '/uploads/103_Genio_ y_figura_de_mi_comunidad_Sicaya_Primera_parte.jpeg', 1),

('Las Brujas', 'Roald Dahl', '{"genero": "Ficción"}', 'https://quintoemiliocarmona.wordpress.com/wp-content/uploads/2020/04/dahl-roald.-las-brujas.-pdf.pdf', '/uploads/104_las_Brujas.jpeg', 1),

('Diccionario Satélite 2000', 'Anónimo', '{"genero": "Educativo"}', '', '/uploads/105_Diccionario_Satélite_2000.jpeg', 1),

('Casinos Educativos de Alimentos', 'Ministerio de Educación', '{"genero": "Educativo"}', '', '/uploads/106_Casinos_Educativos_de_Alimentos.jpeg', 1),

('Un grito Desesperado', 'Carlos Cuauhtémoc Sánchez', '{"genero": "Novela"}', 'https://www.academia.edu/8531228/UN_GRITO_DESESPERADO_CARLOS_CUAHUTEMOC_S', '/uploads/107_Un_grito_Desesperado.jpeg', 1),

('Mi perro Míster y el gato', 'Thomas Winding', '{"genero": "Narrativo"}', 'https://es.scribd.com/document/387986675/mi-perro-mister-pdf', '/uploads/108_Mi_perro_Míster_y_el_gato.jpeg', 1),

('Fortunato', 'Luis Darío Bernal Pinilla', '{"genero": "Narrativo"}', 'https://www.casadellibro.com.co/libro-fortunato/9789589002506/13451535', '/uploads/109_Fortunato.jpeg', 1),

('Calendario de Festividades del Perú', 'José Durand Flórez', '{"genero": "Informativo"}', 'https://www.cpalc.org/descargas/CALENDARIO%20%20DE%20FIESTAS%20E%20IDENTIDAD%20T%20I.pdf', '/uploads/110_Calendario_de_Festividades_del_Perú.jpeg', 1),

('Antología de Cuentos Policiacos - Mr Crime', 'Bossio, Saldiva, Mucha, Osejo, Velazco', '{"genero": "Narrativo"}', 'https://es.scribd.com/document/633895713/Cuentos-policiales-Antologia-6to', '/uploads/111_Mr_Crime.jpeg', 1),

('Niños Inestables', 'André Beley', '{"genero": "Narrativo"}', 'https://www.tesaurolibros.com.ar/MLA-645930035-ninos-inestables-andres-beley-_JM', '/uploads/112_Niños_Inestables.jpeg', 1),

('Décimas y poemas', 'Nicomedes Santa Cruz', '{"genero": "Lírico"}', 'https://www.academia.edu/35093724/Poemas_de_Nicomedes_Santa_Cruz', '/uploads/113_Décimas_y_poemas.jpeg', 1),

('Las aventuras de tom sawyer', 'Mark Twain', '{"genero": "Narrativo"}', 'https://web.seducoahuila.gob.mx/biblioweb/upload/Mark%20Twain%20-%20Las%20Aventuras%20de%20Tom%20Sawyer.pdf', '/uploads/114_Las_aventuras_de_tom_sawyer.jpeg', 1),

('Pepe, Pepo, Pipo y la montaña de nieve resplandeciente', 'Luis Nieto Degregori', '{"genero": "Narrativo"}', 'https://www.crisol.com.pe/libro-pepe-pepo-pipo-y-la-montana-de-nieve-resplandeciente-9789972096181', '/uploads/115_Pepe_Pepo_Pipo_y_la_montaña_de nieve_resplandeciente.jpeg', 1),

('Guia Didactica de educación Religiosa Catolica', 'Oficaina departamental de educación', '{"genero": "Educativo"}', 'https://www.escuelamagisterioceuvigo.es/wp-content/uploads/2019/07/GD_PR_2019-20.pdf', '/uploads/116_Guia_Didactica_de_educación_Religiosa_Catolica.jpeg', 1),

('Aves sin nido', 'Clorinda Matto de Turner', '{"genero": "Novela"}', 'https://bdigital.uncu.edu.ar/objetos_digitales/1472/hintzecuyo16.pdf', '/uploads/117_Aves_sin_nido.jpeg', 2),

('5 pasos para tener éxito en la vida', 'Osorio,Amaro, Grados, Rodríguez', '{"genero": "Desarrollo personal"}', 'https://pruebat.org/biblioteca/descargar/pdf/Los-caminos-para-el-exito.pdf', '/uploads/118_5_pasos_para_tener_éxito_en_la_vida.jpeg', 1),

('La Jugada Final', 'Edison Mucha Soto', '{"genero": "Narrativo"}', 'https://ww3.lectulandia.com/book/la-jugada-final/', '/uploads/119_La_Jugada_Final.jpeg', 1),

('7 ensayos de la interpretación de la realidad Peruana', 'Jose Carlos Mariateguí', '{"genero": "Novela"}', 'https://centroderecursos.cultura.pe/sites/default/files/rb/pdf/mariategui_7_ensayos.pdf', '/uploads/120_7_ensayos_de_la_interpretación_de_la_realidad_Peruana.jpg', 1);

INSERT INTO Libros (titulo, autor, genero, url, imagen, cantidad)
VALUES 
('Formulario de Ciencias', 'Castro, De la Cruz, Paredes', '{"genero": "Educativo"}', 'https://www.academia.edu/44037751/CEREBRITO_FORMULARIO_DE_CIENCIAS', '/uploads/121_Formulario_de_Ciencias.jpeg', 1),

('Cuentos de Oscar Wilde', 'Oscar Wilde', '{"genero": "Narrativo"}', 'https://es.scribd.com/document/656027797/Cuentos-Oscar-Wilde', '/uploads/122_Cuentos_de_Oscar_Wilde.jpeg', 1),

('Hamlet', 'William Shakespeare', '{"genero": "Dramático"}', 'https://www.suneo.mx/literatura/subidas/William%20Shakespeare%20Hamlet.pdf', '/uploads/123_Hamlet.jpg', 1),

('El oso que no lo era', 'Frank Tashlin', '{"genero": "Narrativo"}', 'https://www.facinghistory.org/sites/default/files/2023-05/The_Bear_That_Wasn%27t_espanol.pdf', '/uploads/124_El oso_que_no_lo_era.jpg', 1),

('La vida de Jesús según el Evangelio de San Mateo', 'Ministerio de Educación', '{"genero": "Narrativo"}', 'https://verbodivino.es/hojear/2675/el-evangelio-segun-san-mateo.pdf', '/uploads/125_La_vida_de_Jesús_según_el_Evangelio_de_San_Mateo.jpeg', 1),

('Tabla de Logaritmos', 'Ragas Miranda', '{"genero": "Educativo"}', 'https://preparatoriaabiertapuebla.com.mx/wp-content/uploads/2021/12/TABLAS-DE-LOGARITMOS-Y-ANTILOGARITMOS.pdf', '/uploads/126_Tabla_de_Logaritmos.jpg', 1),

('Tres Amigos Recorren en Perú', 'Pedro Coronario Arrascue', '{"genero": "Educativo"}', 'https://www.librosperuanos.com/libros/detalle/15166/Tres-amigos-recorren-el-Peru', '/uploads/127_Tres_Amigos_Recorren_el_Perú.jpg', 1),

('Dinosaurios Los últimos Gigantes', 'Ministerio de Educación', '{"genero": "Educativo"}', 'https://www.panamericanaeditorial.com.co/dinosaurios-los-ultimos-gigantes-635671/p', '/uploads/128_Dinosaurios_Los_últimos_Gigantes.jpg', 1),

('Madre Tierra Pacha Mama', 'Efrain Orbegoso Rodriguez', '{"genero": "Narrativo"}', 'https://digitalrepository.unm.edu/cgi/viewcontent.cgi?article=1113&context=abya_yala', '/uploads/129_Madre_Tierra_Pacha_Mama.jpeg', 1),

('Origami Recreativo-2', 'Ministerio de Educación', '{"genero": "Educativo"}', 'https://infolibros.org/libros-pdf-gratis/arte/origami/', '/uploads/130_Origami Recreativo_2.jpeg', 2),

('Los Perros Hambrientos', 'Ciro Alegría', '{"genero": "Narrativo"}', 'https://bibliotecavirtual.unl.edu.ar:8443/bitstream/handle/11185/4679/RU075_09_A007.pdf?sequence=1&isAllowed=y', '/uploads/131_Los_Perros_Hambrientos.jpg', 1),

('Clásicos Infantiles - Pinocho', 'Carlo Codolli', '{"genero": "Narrativo"}', 'https://www.leer.org/files/Site/2020/Pinocho.pdf', '/uploads/132_Clásicos_Infantiles_Pinocho.jpg', 1),

('Manu y la máquina del tiempo', 'Florencia Esses', '{"genero": "Narrativo"}', 'https://www.abrecuentos.com/products/manu-y-la-maquina-del-tiempo-1', '/uploads/133_Manu_y_la_máquina_del_tiempo.jpg', 1),

('Hola, Andrés, Soy María otra vez', 'Fernanda Heredia', '{"genero": "Narrativo"}', 'https://www.loqueleo.com/ar/uploads/2016/05/hola-andres-soy-maria-otra-vez.pdf', '/uploads/134_Hola_Andrés_Soy_María_otra_vez.jpg', 1),

('El sexto', 'José María Arguedas', '{"genero": "Novela"}', 'https://es.scribd.com/doc/284515068/EL-SEXTO-Jose-Maria-Arguedas', '/uploads/135_El_sexto.jpg', 1),

('El si de las niñas', 'Leandro Fernández de Moratín', '{"genero": "Dramático"}', 'https://cdn.pruebat.org/recursos/recursos/El_si_Ninas.pdf', '/uploads/136_El_si_de_las_niñas.jpg', 1),

('Reflexiones para la vida', 'Alejandro Aguirre Huamán', '{"genero": "Desarrollo personal"}', '', '/uploads/137_Reflexiones_para_la_vida.jpeg', 1),

('Los heraldos Negros', 'César Vallejo', '{"genero": "Poesía"}', 'https://www.biblioteca-antologica.org/es/wp-content/uploads/2020/12/C%C3%89SAR-VALLEJO-Heraldos-negros.pdf', '/uploads/138_Los_heraldos_Negros.png', 1),

('Razonamieto Matemático', 'Hugo Medina, Piaggio', '{"genero": "Educativo"}', '', '/uploads/139_Razonamieto_Matemático.jpeg', 1),

('La clave de la Felicidad', 'Marcelo Fayard', '{"genero": "Desarrollo personal"}', 'https://biblioteca.ugc.edu.co/cgi-bin/koha/opac-detail.pl?biblionumber=28625', '/uploads/140_La_clave_de_la_Felicidad.jpeg', 1),

('De mi aldea', 'Ministerio de Educación', '{"genero": "Educativo"}', '', '/uploads/141_De_mi_aldea.jpeg', 1),

('El aprendiz de mago', 'Ulf Nilsson', '{"genero": "Historieta"}', 'https://es.slideshare.net/osornino69/el-aprendiz-de-magopdf', '/uploads/142_El_aprendiz_de_mago.jpg', 1),

('El hablador', 'Maria vargas LLosa', '{"genero": "Narrativo"}', 'https://blog.bettyboop.cat/wp-content/uploads/2013/11/Hablador.pdf', '/uploads/143_El_hablador.png', 1),

('Conociendo nuestro cuerpo', 'Ministerio de Educación', '{"genero": "Educativo"}', '', '/uploads/144_Conociendo_nuestro_cuerpo.jpeg', 1),

('Los días de Carbón', 'Rosa Cerna Guardia', '{"genero": "Narrativo"}', 'https://es.scribd.com/doc/310633233/Dias-de-Carbon-Completo-8', '/uploads/145_Los_días_de_Carbón.jpeg', 1),

('La diferencia soy yo Material sobre interculturalidad', 'Joseé María García', '{"genero": "Educativo"}', 'https://red.pucp.edu.pe/wp-content/uploads/biblioteca/Miguel%20L%C3%B3pez%20Melero.pdf', '/uploads/146_La_diferencia_soy_yo.jpeg', 1),

('Las plantas y sus partes-experimentos divertidos', 'Roman Jose, Pedro', '{"genero": "Educativo"}', 'https://isbn.bnp.gob.pe/catalogo.php?mode=detalle&nt=110173', '/uploads/147_Las_plantas_y_sus_partes.jpeg', 5),

('El verdadero amigo y otros amigos', 'Oscar Wilde', '{"genero": "Narrativo"}', 'https://es.scribd.com/document/429414759/EL-Verdadero-Amigo', '/uploads/148_El_verdadero_amigo.jpeg', 1),

('Vida y Ciencia-Area Ciencia y Ambiente-Tercer ciclo', 'Gonzalo Calle', '{"genero": "Educativo"}', 'https://webdeldocente.com/ciencia-y-ambiente-tercer-grado/', '/uploads/149_Vida_y_Ciencia.jpeg', 2),

('Atlas del Peru y del mundo', 'sin autor', '{"genero": "Educativo"}', 'https://editorialmacro.com/catalogo/atlas-del-peru-y-del-mundo/', '/uploads/150_Atlas_del_Peru_y_del_mundo.jpeg', 2),

('Érase una vez-El cuerpo humano', 'sin autor', '{"genero": "Educativo"}', 'https://www.amazon.es/ERASE-UNA-VEZ-CUERPO-HUMANO/dp/B00AO6F2LC', '/uploads/151_Erase_una_vez.jpeg', 1),

('Jose maria Arguedas-Un encuentro con la voz de los oprimidos', 'sin autor', '{"genero": "Revista"}', 'https://www.tandfonline.com/doi/full/10.1080/26390043.2014.12067780#d1e108', '/uploads/152_Jose_maria_Arguedas.jpeg', 1),

('Tecnologia Apropiada Para el Desarrollo Local', 'sin autor', '{"genero": "Revista-Libro taller"}', 'http://www.iiap.org.pe/upload/publicacion/tecnologias_apropiadas.pdf', '/uploads/153_Tecnologia_Apropiada.jpeg', 17);

INSERT INTO Libros (titulo, autor, genero, url, imagen, cantidad) 
VALUES
('Chacras Integrales-Una educación para la producción y el desarrollo rural', 'MINEDU', '{"genero": "Educativo"}', 'https://www.librosperuanos.com/libros/detalle/15922/chacras-integrales.-una-educacion-para-la-produccion-y-el-desarrollo-rural', '/uploads/160_Animales_y_plantas_en_peligro_de_extincion.jpeg', 2),
('Programa de Educacion Forestal-Guia Metodológica', 'MINEDU', '{"genero": "Educativo"}', 'http://biblioteca.cultura.pe:8020/cgi-bin/koha/opac-detail.pl?biblionumber=11913&shelfbrowse_itemnumber=18860', '/uploads/181_AVANZO_técnicas_de_lectura_y_ejercicios_de_lenguaje.jpeg', 5),
('Manual Forestal Escolar', 'MINEDU', '{"genero": "Educativo"}', 'https://www.ipcinfo.org/fileadmin/user_upload/training_material/docs/Manual%20de%20Plantaciones%20Forestales.pdf', '/uploads/182_Arriba_las_manos_limpias.jpeg', 3),
('La sostenibilidad en la naturaleza', 'sin autor', '{"genero": "Revista-Libro taller"}', 'https://www.fundacionwiese.org/blog/es/que-es-la-sostenibilidad-ambiental-y-como-impacta-en-nuestras-vidas/', '/uploads/183_Y_tu_que_haria_Guia_metodologica_del_programa_de_educacion_en_valores.jpeg', 1),
('Yaravi', 'Samaniego Antenor', '{"genero": "Narrativo"}', 'https://www.librosperuanos.com/libros/detalle/14736/El-libro-del-Yaravi.-Poemas-1959-1963', '/uploads/184_La_tierra_nuestro_hogar.jpeg', 1),
('Energia', 'MINEDU Y Ramos Ttito Francisco', '{"genero": "Educativo"}', 'https://es.everand.com/book/419685226/Energia', '/uploads/185_Legado.jpeg', 1),
('Animales y plantas en peligro de extincion', 'MINEDU', '{"genero": "Educativo"}', 'https://www.minam.gob.pe/proyecolegios/Curso/curso-virtual/Modulos/modulo2/2Primaria/m2_primaria_sesion_aprendizaje/Sesion_3_Primaria_Grado_2_BIODIVERSIDAD_ANEXO5.pdf', '/uploads/186_La_ilusión_de_Maria.jpeg', 11),
('El gas natural', 'MINEDU', '{"genero": "Educativo"}', 'https://www.osinergmin.gob.pe/seccion/centro_documental/Institucional/Estudios_Economicos/Libros/Libro-Industria-Gas-Natural-Peru-bicentenario.pdf', '/uploads/187_El_zorro_enamorado_de_la_Luna.jpeg', 5),
('La biodiversidad del Perú', 'MINEDU', '{"genero": "Educativo"}', 'https://www.minam.gob.pe/proyecolegios/Curso/curso-virtual/Modulos/modulo1/biodiversidad/Lectura-Peru-Pais-Maravillosp_p99-p112.pdf', '/uploads/188_Caperucita_Roja.jpeg', 9),
('Super Vigor-Salud Integral', 'MINEDU', '{"genero": "Educativo"}', 'https://repositorio.minedu.gob.pe/handle/20.500.12799/4448', '/uploads/189_Mis_fabulas_de_Junín.jpeg', 2),
('El arte un mundo maravilloso', 'Cornock M., Tania y Alvarado S., Catalina', '{"genero": "Educativo"}', 'sin link', '/uploads/190_La_energia_mueve_el_mundo.jpeg', 1),
('Nosotros-Nosotras', 'Equipo de autores de Metrocolor', '{"genero": "Educativo"}', 'sin link', '/uploads/191_Guia_metodologica_para_elaboracion_participativa_del_plan_de_Gestion_del_Riesgo_en_Instituciones_Educativas.jpeg', 1),
('Descubriendo el tiempo y el clima', 'Ramos Ttito, Isabel', '{"genero": "Educativo"}', 'https://isbn.bnp.gob.pe/catalogo.php?mode=detalle&nt=110031', '/uploads/160_Animales_y_plantas_en_peligro_de_extincion.jpeg', 3),
('Patrimonio Historio y Cultural', 'MINEDU', '{"genero": "Educativo"}', 'https://cdn.www.gob.pe/uploads/document/file/3717302/Manual_EBR%20PATRIMONIO%20CULTURAL%20EN%20LA%20ESCUELA%20%281%29.pdf.pdf', '/uploads/181_AVANZO_técnicas_de_lectura_y_ejercicios_de_lenguaje.jpeg', 1),
('Transtornos de la alimentacion', 'MINEDU', '{"genero": "Educativo"}', 'https://resources.aprendoencasa.pe/red/aec/regular/2021/da717f0e-c8dc-4304-969c-83331aba3b10/exp7-primaria-3y4-exploramos-act1.pdf', '/uploads/182_Arriba_las_manos_limpias.jpeg', 1),
('El arenque rojo', 'Moura Gonzalo - Varela Alicia', '{"genero": "Narrativo"}', 'https://www.buscalibre.pe/libro-el-arenque-rojo/9788467556858/p/14566134?srsltid=AfmBOopOvkHJz4R5VM_l8-Tpf4JmCJNUiBd8_PIcZHF4Tlq6rJyi8CHL', '/uploads/183_Y_tu_que_haria_Guia_metodologica_del_programa_de_educacion_en_valores.jpeg', 1),
('El traje nuevo del emperador', 'Menendez Margarita', '{"genero": "Narrativo"}', 'https://es.wikipedia.org/wiki/El_traje_nuevo_del_emperador', '/uploads/184_La_tierra_nuestro_hogar.jpeg', 1),
('El bosque', 'Toribio Alvarado Percy', '{"genero": "Narrativo"}', 'https://es.scribd.com/document/385133957/Percy-Toribio-Sobre-El-Bosque', '/uploads/185_Legado.jpeg', 1),
('Tradiciones peruanas', 'Ricardo Palma', '{"genero": "Narrativo-Recopilación"}', 'https://bicentenario.gob.pe/ricardo-palma-tradiciones-peruanas-independencia/', '/uploads/186_La_ilusión_de_Maria.jpeg', 2),
('Poemas y cuentos populares', 'Navarro Balvin Longino', '{"genero": "Narrativo"}', 'https://www.zendalibros.com/los-30-mejores-poemas-en-espanol/', '/uploads/187_El_zorro_enamorado_de_la_Luna.jpeg', 1),
('Relatos Selectos para niños y jovenes', 'Alvarado Hernan', '{"genero": "Narrativo-Recopilación"}', 'https://books.google.com.pe/books/about/Relatos_selectos_para_ni%C3%B1os_y_jovenes.html?id=v8jhpwAACAAJ', '/uploads/188_Caperucita_Roja.jpeg', 1),
('Perú: país maravilloso', 'MINEDU', '{"genero": "Educativo"}', 'https://www.minam.gob.pe/proyecolegios/Ecolegios/contenidos/biblioteca/biblioteca/peru_maravilloso_MINEDU4a.pdf', '/uploads/189_Mis_fabulas_de_Junín.jpeg', 1),
('Manual de conservación y mantenimiento:Pisos, Techos y Muros', 'MINEDU', '{"genero": "Educativo"}', 'https://www.arquitectosdecadiz.com/wp-content/uploads/2017/12/Manual-General-para-el-uso-mantenimiento-y-conservacion-de-edificios-destinados-a-vivienda.pdf', '/uploads/190_La_energia_mueve_el_mundo.jpeg', 1),
('Cuando no queriamos comer lentejas', 'MINEDU', '{"genero": "Educativo"}', 'https://es.slideshare.net/slideshow/cuando-no-queramos-comer-lentejas/36804313', '/uploads/191_Guia_metodologica_para_elaboracion_participativa_del_plan_de_Gestion_del_Riesgo_en_Instituciones_Educativas.jpeg', 1),
('KANSAY', 'MINEDU', '{"genero": "Educativo"}', 'https://www.editorialbruno.com.pe/bstore/textos-escolares/ciencia-y-ambiente.html', '/uploads/160_Animales_y_plantas_en_peligro_de_extincion.jpeg', 1),
('COMUNICACION', 'MINEDU', '{"genero": "Educativo"}', 'https://richardfong.wordpress.com/wp-content/uploads/2011/02/stallings-william-comunicaciones-y-redes-de-computadores.pdf', '/uploads/181_AVANZO_técnicas_de_lectura_y_ejercicios_de_lenguaje.jpeg', 1),
('Jose Maria Arguedas-Obras ganadoras 2009', 'MINEDU', '{"genero": "Narrativo-Recopilación"}', 'http://ebeteca.minedu.gob.pe/cgi-bin/koha/opac-detail.pl?biblionumber=99&query_desc=pb%3AMinisterio%20de%20Educaci%C3%B3n', '/uploads/182_Arriba_las_manos_limpias.jpeg', 1),
('AVANZO-técnicas de lectura y ejercicios de lenguaje', 'Lopez Ruiz Juan', '{"genero": "Educativo"}', 'https://www.universidadviu.com/pe/actualidad/nuestros-expertos/tecnicas-de-lectura-como-surcar-los-7-mares-del-conocimiento-sin-ahogarse', '/uploads/183_Y_tu_que_haria_Guia_metodologica_del_programa_de_educacion_en_valores.jpeg', 2),
('Arriba las manos limpias', 'MINEDU', '{"genero": "Educativo"}', 'https://repositorio.minedu.gob.pe/bitstream/handle/20.500.12799/8926/Adquiriendo%20h%C3%A1bitos%20de%20higiene%20gu%C3%ADa%20para%20las%20familias.%20Orientaciones%20para%20el%20desarrollo%20de%20las%20experiencias%20de%20aprendizaje%2C%20texto%20aprendizaje%202%2C%20de%2010%20a%2018%20meses.PDF?sequence=1&isAllowed=y', '/uploads/182_Arriba_las_manos_limpias.jpeg', 1),
('Y tu que harías?-Guía metodológica del programa de educación en valores', 'MINEDU', '{"genero": "Educativo"}', 'https://www.gob.pe/institucion/minedu/noticias/821614-minedu-impulsa-campana-de-valores-se-ejemplo', '/uploads/183_Y_tu_que_haria_Guia_metodologica_del_programa_de_educacion_en_valores.jpeg', 1),
('La tierra-nuestro hogar', 'MINEDU', '{"genero": "Educativo"}', 'https://libut.pe/producto/la-tierra-nuestro-hogar', '/uploads/184_La_tierra_nuestro_hogar.jpeg', 1),
('Legado', 'Metrocolor', '{"genero": "Educativo"}', 'https://www.elperuano.pe/noticia/241808-herencia-cultural#:~:text=Por%20%C3%BAltimo%2C%20el%20Per%C3%BA%20cuenta,geoglifos%20de%20Nasca%20y%20Palpa.', '/uploads/185_Legado.jpeg', 1),
('La ilusión de María', 'MINEDU', '{"genero": "Narrativo"}', 'https://catalogo.ucsm.edu.pe/bib/53039', '/uploads/186_La_ilusión_de_Maria.jpeg', 2),
('El zorro enamorado de la Luna', 'MINEDU', '{"genero": "Narrativo"}', 'https://resources.aprendoencasa.pe/perueduca/inicial/4/semana-3/pdf/s3-4-dia-4-cuento-el-zorro-enamorado-luna.pdf', '/uploads/187_El_zorro_enamorado_de_la_Luna.jpeg', 1),
('Caperucita Roja', 'MINEDU y Candell Arianna', '{"genero": "Narrativo"}', 'https://comunidadsm.com.pe/wp-content/uploads/La-Caperucita-Roja-1.pdf', '/uploads/188_Caperucita_Roja.jpeg', 1),
('Mis fábulas de Junín', 'Salazar Galarza E., Gavino Fernandez M., Camarena Montes de la Oca M.', '{"genero": "Narrativo"}', 'https://isbn.cloud/9786124577727/mis-fabulas-de-junin/', '/uploads/189_Mis_fabulas_de_Junín.jpeg', 1),
('La energía mueve el mundo', 'Abad Alicia, Ferragut Mirta y Inda Graciela', '{"genero": "Narrativo"}', 'https://especial.elcomercio.pe/petroperu-sostenibilidad/', '/uploads/190_La_energia_mueve_el_mundo.jpeg', 1),
('Guía metodológica para elaboración participativa del plan de Gestión del Riesgo en Instituciones Educativas', 'MINEDU', '{"genero": "Educativo"}', 'https://repositorio.minedu.gob.pe/handle/20.500.12799/5228', '/uploads/191_Guia_metodologica_para_elaboracion_participativa_del_plan_de_Gestion_del_Riesgo_en_Instituciones_Educativas.jpeg', 1);
INSERT INTO Libros (titulo, autor, genero, url, imagen, cantidad)
VALUES 
(
    'Rutas del Aprendizaje - Comunicarse oralmente y por escrito', 
    'Ministerio de Educación', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/97_Rutas_del_Aprendizaje_Comunicarse_oralmente_y_por_escrito.jpeg', 
    2
);


---(321-412)
INSERT INTO Libros (titulo, autor, genero, url, imagen, cantidad) 
VALUES
('Atlas Geografia Del Mundo', 'Rosa Vasquez Siesquen', '{"genero": "Ciencia"}', 'https://www.buscalibre.pe/libro-atlas-del-mundo-no-ficcion-infantil/9788498673692/p/2907860', '/uploads/321_Atlas_Geografia_Del_Mundo.jpeg', 1),
('Lenguaje Nuevo Amanecer Lenguaje 4', 'Sin autor', '{"genero": "Comunicación"}', 'https://m.facebook.com/groups/4749677081770190/posts/26185302097781045/', '/uploads/322_Lenguaje_Nuevo_Amanecer_Lenguaje_4.jpeg', 1),
('Una Hermosa Experiencia', 'Jose Zera', '{"genero": "Cuento"}', 'https://ugel01agp.wordpress.com/wp-content/uploads/2014/03/biblioteca-de-aula-de-primaria-catalogo-total-word.pdf', '/uploads/323_Una_Hermosa_Experiencia.jpeg', 3),
('Matemática 5 Escuela Nueva', 'Angel Marin Del Aguilar', '{"genero": "Matemática"}', 'http://bibliotecamunicipal.munipuno.gob.pe/biblioteca/opac_css/index.php?lvl=notice_display&id=6007', '/uploads/324_Matemática_5_Escuela_Nueva.jpg', 1),
('Lenguaje De Señas Peruana', 'Equipo Pedagógico Dep', '{"genero": "Lenguaje"}', 'https://pt.scribd.com/doc/151726273/Lengua-de-Senas-Peruana', '/uploads/325_Lenguaje_De_Señas_Peruana.jpeg', 4),
('La Flor Del Lirolay', 'Generación De Innovación Para El Desarrollo', '{"genero": "Cuento"}', 'https://es.slideshare.net/slideshow/sesin-de-aprendizaje-09-unidad-didctica-01-reas-comunicacin-y-personal-social-cuarto-grado-de-leemos-para-explorar-los-textos-de-la-biblioteca-del-aula/46453691', '/uploads/326_La_Flor_Del_Lirolay.jpeg', 1),
('Voces De Nuestra Tierra', 'Compilación Martha Fernandez De Lopez', '{"genero": "Cuento"}', 'https://repositorio.minedu.gob.pe/bitstream/handle/20.500.12799/7850/Libros%20de%20la%20Biblioteca%20de%20Aula%20de%20Educaci%C3%B3n%20Primaria%20tercer%20grado.pdf', '/uploads/327_Voces_De_Nuestra_Tierra.jpeg', 1),
('Proyecto Educativo Nacional', 'Ministerio De Educación', '{"genero": "Informativo"}', 'https://www.gob.pe/institucion/cne/informes-publicaciones/2050299-seis-objetivos-para-la-accion-hacia-el-cambio-educativo-version-resumida-del-proyecto-educativo-nacional', '/uploads/328_Proyecto_Educativo_Nacional.jpeg', 14),
('Set De Hidroponia', 'Dirección General De Educación Básica Regular', '{"genero": "Ciencia"}', 'https://es.scribd.com/document/289400478/Set-de-Hidroponia-2-Desglosable-a-41', '/uploads/329_Set_De_Hidroponia.jpeg', 2),
('Fenómenos Atmosféricos', 'Isabel Ramos', '{"genero": "Ciencias"}', 'https://isbn.bnp.gob.pe/catalogo.php?mode=detalle&nt=110024', '/uploads/330_Fenómenos_Atmosféricos.jpeg', 5),
('Dinosaurios Y Animales Prehistóricos Del Perú', 'Nicolas Rodriguez', '{"genero": "Ciencias"}', 'https://simple.ripley.com.pe/dinosaurios-y-animales-prehistoricos-del-peru-pmp20000606138?s=mdco', '/uploads/331_Dinosaurios_Y_Animales_Prehistóricos_Del_Perú.jpeg', 3),
('Tradiciones Cuzqueñas Para Niños', 'Ministerio De Educación', '{"genero": "Cuentos"}', 'https://catalogo.ucsm.edu.pe/bib/53028', '/uploads/332_Tradiciones_Cuzqueñas_Para_Niños.jpeg', 2),
('La Primera Navidad', 'Matilde Indacochera P.', '{"genero": "Cuento"}', 'http://biblioteca.casadelaliteratura.gob.pe/cgi-bin/koha/opac-detail.pl?biblionumber=1145&shelfbrowse_itemnumber=1914', '/uploads/334_La_Primera_Navidad.jpeg', 1),
('Amaze Student Book 1', 'Alicia Becker', '{"genero": "Cuaderno De Trabajo"}', 'https://enkasaes.com/product/amaze-1-students-book/', '/uploads/335_Amaze_Student_Book_1.jpeg', 1),
('Madera Corcho Y Alambre Creaciones Manuales Educativas', 'Ramon Nieto', '{"genero": "Manual"}', 'https://articulo.mercadolibre.com.ar/MLA-759033890--creaciones-manuales-madera-corcho-alambre-l185-_JM', '/uploads/336_Madera_Corcho_Y_Alambre_Creaciones_Manuales_Educativas.jpeg', 1),
('Historias De La Biblia Contadas Para Niños', 'Rosa Maria De Los Heros', '{"genero": "Cuento"}', '', '/uploads/337_Historias_De_La_Biblia_Contadas_Para_Niños.jpeg', 1),
('Wedo Educación Primaria 7 A 11 Años', 'Ministerio De Educación', '{"genero": "Manual"}', 'https://www.ebay.es/help/home', '/uploads/338_Wedo_Educación_Primaria_7_A_11_Años.jpeg', 1),
('Experimentos 5 Grado De Primaria', 'Ministerio De Educación', '{"genero": "Manual"}', 'https://repositorio.perueduca.pe/concurso-el-peru-lee/categoria-C.pdf', '/uploads/339_Experimentos_5_Grado_De_Primaria.jpeg', 3),
('Segundo Grado Del Ciclo Intermedio De Educación Básica Alternativa', 'Ministerio De Educación', '{"genero": "Cuaderno De Trabajo"}', 'https://es.scribd.com/document/440628254/75308902-Sesiones-de-1er-grado-Educacion-Basica-Alternativa', '/uploads/340_Segundo_Grado_Del_Ciclo_Intermedio_De_Educación_Básica_Alternativa.jpeg', 1),
('Jose Maria Arguedas Ley N 28898 Obras Ganadoras 2010', 'Ministerio De Educación', '{"genero": "Cuentos"}', 'https://catalogo.ucsm.edu.pe/bib/53029', '/uploads/341_Jose_Maria_Arguedas_Ley_N_28898_Obras_Ganadoras_2010.jpeg', 1),
('Todos Cuidamos El Agua', 'Ministerio De Educación', '{"genero": "Historieta"}', '', '/uploads/342_Todos_Cuidamos_El_Agua.jpeg', 11),
('El Secreto De La Selva', 'Luisa Naguera Arrieta', '{"genero": "Cuento"}', 'https://www.buscalibre.pe/libro-el-secreto-de-la-selva/9789583058073/p/52174193', '/uploads/343_El_Secreto_De_La_Selva.jpeg', 11),
('Martín Chambi', 'Roberto Castro', '{"genero": "Cuento"}', 'https://maclima.pe/product/peruanos-power-martin-chambi-roberto-castro/', '/uploads/344_Martín_Chambi.jpeg', 1),
('Jorge Chavez', 'Roberto Castro', '{"genero": "Cuento Ilustrado"}', 'https://maclima.pe/product/peruanos-power-jorge-chavez-roberto-castro/', '/uploads/345_Jorge_Chavez.jpeg', 1),
('Ciencias Naturales 5', 'Ministerio De Educación', '{"genero": "Ciencias"}', '', '/uploads/346_Ciencias_Naturales_5.jpeg', 14),
('Susana baca', 'Adriana Roca', '{"genero": "Cuento Ilustrado"}', 'https://www.pichoncito.pe/peruanos-power-susana-baca-en-cosas-susana-baca/', '/uploads/347_Susana_baca.jpeg', 1),
('Electricidad Y Magnetismo', 'Ministerio De Educación', '{"genero": "Ciencias"}', 'https://repositorio.minedu.gob.pe/bitstream/handle/20.500.12799/7850/Libros%20de%20la%20Biblioteca%20de%20Aula%20de%20Educaci%C3%B3n%20Primaria%20tercer%20grado.pdf', '/uploads/348_Electricidad_Y_Magnetismo.jpeg', 1),
('Primaria Interactiva Ciencias Naturales', 'Cultural Sa', '{"genero": "Ciencias"}', 'https://libreriapensar.com/product/primaria-interactiva-ciencias-de-la-naturaleza-cultural/', '/uploads/350_Primaria_Interactiva_Ciencias_Naturales.jpeg', 1),
('La Serpiente De Oro', 'Ciro Alegria', '{"genero": "Obra Literaria"}', 'https://es.slideshare.net/slideshow/laserpientedeorociroalegriapdfpdf/267291621', '/uploads/351_La_Serpiente_De_Oro_.jpeg', 2),
('Animales Y Plantas En Peligro De Extinción', 'Ministerio De Educación', '{"genero": "Ciencias"}', 'https://issuu.com/riverakaori/docs/animales_en_peligro_de_extincion_libro', '/uploads/352_Animales_Y_Plantas_En_Peligro_De_Extinción.jpg', 12),
('Cholito Y Amazonita', 'Oscar Colchado Licio', '{"genero": "Cuento"}', 'https://www.loqueleo.com/pe/libro/cholito-y-amazonita', '/uploads/353_Cholito_Y_Amazonita.jpeg', 1),
('Blanquita Y Rocky', 'Stephen Gulbis', '{"genero": "Cuento"}', 'https://biblioteca.apps-mosquera.gov.co/cgi-bin/koha/opac-detail.pl?biblionumber=7136', '/uploads/354_Blanquita_Y_Rocky.jpeg', 1),
('Incas Una Gran Historia', 'Melissa Siles', '{"genero": "Material Ilustrado"}', 'https://www.crisol.com.pe/libro-incas-una-gran-historia-9786124450433?srsltid=AfmBOorFp8ri7UStU44OqmdaXBHJPXBI3JnEu9bxwxYH_SySJ4_DQXlL', '/uploads/355_Incas_Una_Gran_Historia.jpeg', 1),
('Teresa Izquierdo', 'Viviana Galvez', '{"genero": "Cuento Ilustrado"}', 'https://maclima.pe/product/peruanos-power-teresa-izquierdo-viviana-galvez/', '/uploads/356_Teresa_Izquierdo.jpeg', 1),
('Zambo Cavero', 'Roberto Castro', '{"genero": "Cuento Ilustrado"}', 'https://maclima.pe/product/peruanos-power-zambo-cavero-roberto-castro/', '/uploads/357_Zambo_Cavero.jpeg', 1),
('Jose Sabogal', 'Jenny Varillas Paz', '{"genero": "Cuento Ilustrado"}', 'https://www.libreriasur.com.pe/libro/jose-sabogal_158638?srsltid=AfmBOopIjO7pgBegI3P44WexUzacUD6X5ah0fQ0nxMRZWJt9vuRGlTCM', '/uploads/358_Jose_Sabogal.jpeg', 1),
('Inés Melchor', 'Adriana Roca Y Nicolás Rodríguez Galer', '{"genero": "Cuento Ilustrado"}', 'https://perupublica.cpl.org.pe/brand/view/index/id/142370/', '/uploads/359_Inés_Melchor.jpeg', 2),
('Elena Izcue', 'Claudia Berrios', '{"genero": "Cuento Ilustrado"}', 'https://www.buscalibre.pe/libro-elena-izcue/9786124450365/p/54308480?srsltid=AfmBOopoHuN0dkGKVWjvHgEnmU_KEnFtDoHACjCZFZKLkDzklAuIQJH1', '/uploads/360_Elena_Izcue.jpeg', 1),
('Jessica Marquez', 'Adriana Roca Y Nicolás Rodríguez Galer', '{"genero": "Cuento Ilustrado"}', 'https://www.pichoncito.pe/catalogo/colecciones/page/2/', '/uploads/361_Jessica_Marquez.jpeg', 1),
('Chabuca Granda', 'Viviana Galvez', '{"genero": "Cuento Ilustrado"}', 'https://www.crisol.com.pe/libro-peruanos-power-chabuca-granda-9786124791437?srsltid=AfmBOorTIo4LWHPFO72X1BBdqwf9GpdZkMaWCdjr-rrEEP6m_nwS_waQ', '/uploads/362_Chabuca_Granda.jpeg', 1),
('La Tierra', 'Ministerio De Educación', '{"genero": "Ciencia"}', 'https://www.buscalibre.pe/libro-nuestro-planeta-tierra-enciclopedia-del-saber/9788466220316/p/2837038', '/uploads/363_La_Tierra.jpeg', 1),
('Diccionario Biográfico De Personalidades Del Perú Y El Mundo', 'Fondo Editorial Navarrete', '{"genero": "Cuaderno Informativo"}', '', '/uploads/364_Diccionario_Biográfico_De_Personalidades_Del_Perú_Y_El_Mundo.jpeg', 1),
('Juego De Investigación', 'Ministerio De Educación', '{"genero": "Ciencias"}', 'http://indagandoconsilvia.blogspot.com/2015/10/sesion-de-aprendizaje-con-el-uso-de-los.html', '/uploads/365_Juego_De_Investigación.jpeg', 1),
('Historia Del Perú En El Proceso Americano Y Mundial', 'Juan Castillo Morales', '{"genero": "Historia"}', '', '/uploads/366_Historia_Del_Perú_En_El_Proceso_Americano_Y_Mundial.jpeg', 1),
('El Grillo Cantor', 'Ministerio De Educación', '{"genero": "Cuento Ilustrado"}', '', '/uploads/368_El_Grillo_Cantor.jpeg', 1),
('Isapí La Doncella Que No Podía Llorar', 'Ministerio De Educación', '{"genero": "Cuento Ilustrado"}', 'https://es.slideshare.net/slideshow/isap-la-doncella-que-no-podia-llorar/36804600', '/uploads/369_Isapí_La_Doncella_Que_No_Podía_Llorar.jpeg', 1),
('Lucas Y El Puente Peatonal', 'Ministerio De Educación', '{"genero": "Cuento Ilustrado"}', 'https://es.scribd.com/document/220569564/Lucas-y-El-Puente-Peatonal', '/uploads/370_Lucas_Y_El_Puente_Peatonal.jpeg', 1),
('Pepe,Pepo Y Pipo Y La Laguna Misteriosa', 'Luis Nieto Degregori', '{"genero": "Cuento"}', 'https://www.crisol.com.pe/libro-pepe-pepo-pipo-laguna-misteriosa-9789972092817?srsltid=AfmBOor5VDim_99tRtbaJJ7G_ak1IXDVyKIBF-x6lBQGQrQkOil5-4YI', '/uploads/371_Pepe,Pepo_Y_Pipo_Y_La_Laguna_Misteriosa.jpeg', 1),
('Relatos Ilustrados', 'Logino Navarro Balvin', '{"genero": "Cuento Ilustrado"}', '', '/uploads/372_Relatos_Ilustrados.jpeg', 7),
('Diez Mariposas', 'Ministerio De Educación', '{"genero": "Cuento Ilustrado"}', 'https://catalogo.ucsm.edu.pe/bib/53035', '/uploads/373_Diez_Mariposas.jpeg', 1),
('Geniecito', 'Irma Zuñiga', '{"genero": "Ciencia"}', '', '/uploads/374_Geniecito.jpeg', 1),
('Blancanieves Y Los Siete Enanitos', 'Ministerio De Educación', '{"genero": "Cuento Ilustrado"}', 'https://www.editorialbruno.com.pe/bstore/plan-lector/blancanieves-y-los-7-enanitos.html', '/uploads/375_Blancanieves_Y_Los_Siete_Enanitos.jpeg', 1),
('Kawsay Área De Ciencia Y Ambiente', 'Ministerio De Educación', '{"genero": "Cuaderno De Trabajo"}', '', '/uploads/376_Kawsay_Área_De__Ciencia_Y_Ambiente.jpeg', 1),
('Los Ecosistemas', 'Ministerio De Educación', '{"genero": "Ciencias"}', 'https://www.studocu.com/pe/document/universidad-san-pedro/educacion/los-ecosistemas-libro/94487944', '/uploads/377_Los_Ecosistemas.jpeg', 1),
('Descubriendo El Tiempo Y El Clima', 'Ministerio De Educación', '{"genero": "Ciencias"}', '', '/uploads/378_Descubriendo_El_Tiempo_Y_El_Clima.jpeg', 1),
('Deportes En Acción', 'Jose Jimenez', '{"genero": "Conocimientos"}', '', '/uploads/379_Deportes_En_Acción_.jpeg', 1),
('Modulo De Comprension Lectora', 'Ministerio De Educación', '{"genero": "Cuaderno De Trabajo"}', 'https://repositorio.minedu.gob.pe/handle/20.500.12799/5757', '/uploads/380_Modulo_De_Comprension_Lectora.jpeg', 2),
('Guia Para El Trabajo Docente Con Las Familias Del Ciclo V De Primaria', 'Ministerio De Educación', '{"genero": "Guia De Trabajo"}', 'https://es.slideshare.net/slideshow/ggua-para-el-trabajo-docente-con-las-familias-del-ciclo-v-de-primaria/61645564', '/uploads/381_Guia_Para_El_Trabajo_Docente_Con_Las_Familias_Del_Ciclo_V_De_Primaria.jpeg', 1),
('Guia De Tutoria Sexto Grado', 'Ministerio De Educación', '{"genero": "Guia De Trabajo"}', 'https://repositorio.minedu.gob.pe/handle/20.500.12799/4524', '/uploads/382_Guia_De_Tutoria_Sexto_Grado.jpeg', 1),
('Concurso Escolar Nacional De Literatura', 'Consejo Nacional De Educación', '{"genero": "Cuentos"}', '', '/uploads/383_Concurso_Escolar_Nacional_De_Literatura.jpeg', 4),
('Un Cuadrado En Un País Redondo', 'Ministerio De Educación', '{"genero": "Cuento Ilustrado"}', 'https://www.scribd.com/document/772318515/UN-CUADRADO-EN-EL-PAIS-DE-LOS-REDONDOS-1', '/uploads/384_Un_Cuadrado_En_Un_País_Redondo_.jpeg', 1),
('Las 3 R Para Disminuir La Contaminación Ambiental', 'Ministerio De Educación', '{"genero": "Ciencias"}', 'https://es.everand.com/book/419685552/Las-3-R-para-disminuir-la-contaminacion-ambiental', '/uploads/385_Las_3_R_Para_Disminuir_La_Contaminación_Ambiental.jpeg', 1),
('Origami Recreativo', 'Ministerio De Educación', '{"genero": "Instructivo"}', 'https://www.crisol.com.pe/libro-origami-creativo-2-9786124669323', '/uploads/386_Origami_Recreativo.jpeg', 4),
('Nosotros Cuentos Leyendas Y Poemas De América 5 Grado', 'Ministerio De Educación', '{"genero": "Cuentos Ilustrados"}', 'https://es.slideshare.net/slideshow/cuadernillo-de-comunicacin-5-quinto-grado-de-primariapdf/258936980', '/uploads/387_Nosotros_Cuentos_Leyendas_Y_Poemas_De_América_5_Grado.jpeg', 1),
('La Capa De Ozono Los Agujeros Del Ozono Atmosférico', 'Parramón Editorial Norma', '{"genero": "Informativo"}', 'https://www.amazon.com/-/es/capa-ozono-VVAA/dp/8434211939', '/uploads/388_La_Capa_De__Ozono_Los_Agujeros_Del_Ozono_Atmosférico.jpeg', 1),
('Lo Que Costaba Una Cauda El Sapo Y La Zorra', 'Catalina Alvarado', '{"genero": "Cuento Ilustrado"}', '', '/uploads/389_Lo_Que_Costaba_Una_Cauda_El_Sapo_Y_La_Zorra.jpeg', 1),
('Tu Cerebro Es Como Un Músculo', 'Sin autor', '{"genero": "Historieta"}', '', '/uploads/390_Tu_Cerebro_Es_Como_Un_Músculo_.jpeg', 1),
('El Sistema Nervioso', 'Ministerio De Educación', '{"genero": "Ciencias"}', '', '/uploads/391_El_Sistema_Nervioso.jpeg', 1),
('Diccionario Escolar', 'Ministerio De Educación', '{"genero": "Diccionario"}', 'https://www.tailoy.com.pe/dicc-escolar-ilustrado-td-unimundo-9917.html', '/uploads/392_Diccionario_Escolar.jpeg', 1),
('Disney Cuentos Mágicos Con Actividades Didácticas', 'Grupo Oceano', '{"genero": "Cuento Ilustrado"}', 'https://listado.mercadolibre.com.ar/cuentos-magicos-disney-oceano', '/uploads/393_Disney_Cuentos_Mágicos_Con_Actividades_Didácticas.jpeg', 2),
('Paco Yunque Versión Adaptada', 'Ministerio De Educación', '{"genero": "Cuento"}', 'https://librosengeneral.com/libro/paco-yunque-ruisenor/', '/uploads/394_Paco_Yunque_Versión_Adaptada.jpeg', 11),
('El Perú Y Sus Costumbres', 'Ministerio De Educación', '{"genero": "Libro Ilustrado"}', 'https://www.overdrive.com/media/4995253/el-peru-y-sus-costumbres', '/uploads/395_El_Perú_Y_Sus_Costumbres.jpeg', 1),
('A Mind Trip To To Grammar And Vocabulary Amaze', 'Richmond Publishing', '{"genero": "Cuaderno De Trabajo"}', 'https://www.sanborns.com.mx/producto/303767/amaze-3-student-s-book', '/uploads/396_A_Mind_Trip_To_To_Grammar_And_Vocabulary_Amaze.jpeg', 1),
('Como No Te Voy A Querer', 'Adrian Roca', '{"genero": "Biografías"}', 'https://www.falabella.com.pe/falabella-pe/product/127795018/PERUANOS-POWER-DEL-FUTBOL-COMO-NO-TE-VOY-A-QUERER/127795019', '/uploads/397_Como_No_Te_Voy_A_Querer.jpeg', 2),
('Sesiones De Aprendizaje Cuarto Grado De Primaria 1', 'Ministerio De Educación', '{"genero": "Cuaderno De Trabajo"}', 'https://docentes.org.pe/sesiones-de-aprendizaje-unidad-didactica-1-cuarto-grado-primaria-pdf/', '/uploads/398_Sesiones_De_Aprendizaje_Cuarto_Grado_De_Primaria_1.jpeg', 2),
('Sesiones De Aprendizaje Cuarto Grado De Primaria 6', 'Ministerio De Educación', '{"genero": "Cuaderno De Trabajo"}', 'https://www.minedu.gob.pe/curriculo/unidad1-cuartogrado.html', '/uploads/399_Sesiones_De_Aprendizaje_Cuarto_Grado_De_Primaria_6.jpeg', 2),
('Sesiones De Aprendizaje Cuarto Grado De Primaria 2', 'Ministerio De Educación', '{"genero": "Cuaderno De Trabajo"}', 'https://www.minedu.gob.pe/curriculo/unidad1-cuartogrado.html', '/uploads/400_Sesiones_De_Aprendizaje_Cuarto_Grado_De_Primaria_2.jpeg', 2),
('Sesiones De Aprendizaje Cuarto Grado De Primaria 3', 'Ministerio De Educación', '{"genero": "Cuaderno De Trabajo"}', 'https://www.minedu.gob.pe/curriculo/unidad1-cuartogrado.html', '/uploads/401_Sesiones_De_Aprendizaje_Cuarto_Grado_De_Primaria_3.jpeg', 2),
('Sesiones De Aprendizaje Cuarto Grado De Primaria 4', 'Ministerio De Educación', '{"genero": "Cuaderno De Trabajo"}', 'https://www.minedu.gob.pe/curriculo/unidad1-cuartogrado.html', '/uploads/402_Sesiones_De_Aprendizaje_Cuarto_Grado_De_Primaria_4.jpeg', 2),
('Sesiones De Aprendizaje Cuarto Grado De Primaria 5', 'Ministerio De Educación', '{"genero": "Cuaderno De Trabajo"}', 'https://www.minedu.gob.pe/curriculo/unidad1-cuartogrado.html', '/uploads/403_Sesiones_De_Aprendizaje_Cuarto_Grado_De_Primaria_5.jpeg', 1),
('Sesiones De Aprendizaje Tercer Grado De Primaria 1', 'Ministerio De Educación', '{"genero": "Cuaderno De Trabajo"}', 'https://www.minedu.gob.pe/curriculo/unidad1-cuartogrado.html', '/uploads/404_Sesiones_De_Aprendizaje_Tercer_Grado_De_Primaria_1.jpeg', 1),
('Sesiones De Aprendizaje Segundo Grado De Primaria 2', 'Ministerio De Educación', '{"genero": "Cuaderno De Trabajo"}', 'https://www.minedu.gob.pe/curriculo/unidad1-cuartogrado.html', '/uploads/405_Sesiones_De_Aprendizaje_Segundo_Grado_De_Primaria_2.jpeg', 1),
('Sesiones De Aprendizaje Segundo Grado De Primaria 3', 'Ministerio De Educación', '{"genero": "Cuaderno De Trabajo"}', 'https://www.minedu.gob.pe/curriculo/unidad1-cuartogrado.html', '/uploads/406_Sesiones_De_Aprendizaje_Segundo_Grado_De_Primaria_3.jpeg', 1),
('Sesiones De Aprendizaje Tercer Grado De Primaria 4', 'Ministerio De Educación', '{"genero": "Cuaderno De Trabajo"}', 'https://www.minedu.gob.pe/curriculo/unidad1-cuartogrado.html', '/uploads/407_Sesiones_De_Aprendizaje_Tercer_Grado_De_Primaria_4.jpeg', 1),
('Sesiones De Aprendizaje Segundo Grado De Primaria 5', 'Ministerio De Educación', '{"genero": "Cuaderno De Trabajo"}', 'https://www.minedu.gob.pe/curriculo/unidad1-cuartogrado.html', '/uploads/408_Sesiones_De_Aprendizaje_Segundo_Grado_De_Primaria_5.jpeg', 1),
('Rutas Del Aprendizaje Qué Y Cómo Aprenden Matemática Nuestros Niños Fascículo 1', 'Ministerio De Educación', '{"genero": "Guia De Aprendizaje"}', 'https://repositorio.minedu.gob.pe/handle/20.500.12799/5050', '/uploads/409_Rutas_Del_Aprendizaje_Qué_Y_Cómo_Aprenden_Matemática_Nuestros_Niños_Fascículo_1.jpeg', 1),
('Rutas Del Aprendizaje Hacer Uso De Saberes Matemáticos Para Afrontar Desafíos Diversos Fascículo General 2', 'Ministerio De Educación', '{"genero": "Guia De Aprendizaje"}', 'https://repositorio.minedu.gob.pe/handle/20.500.12799/4412', '/uploads/410_Rutas_Del_Aprendizaje_Hacer_Uso_De_Saberes_Matemáticos_Para_Afrontar_Desafíos_Diversos_Fascículo_General_2.jpeg', 1),
('Rutas Del Aprendizaje Què Y Còmo Aprenden Nuestros Estudiantes Ciclo Iii', 'Ministerio De Educación', '{"genero": "Guia De Aprendizaje"}', 'https://repositorio.minedu.gob.pe/handle/20.500.12799/7775', '/uploads/411_Rutas_Del_Aprendizaje_Què_Y_Còmo_Aprenden_Nuestros_Estudiantes_Ciclo_Iii.jpeg', 1),
('Rutas Del Aprendizaje Los Proyectos De Aprendizaje Por El Logro De Competencias Fascículo 1', 'Ministerio De Educación', '{"genero": "Guia De Aprendizaje"}', 'http://repositorio.minedu.gob.pe/handle/20.500.12799/3741', '/uploads/412_Rutas_Del_Aprendizaje_Los_Proyectos_De_Aprendizaje_Por_El_Logro_De_Competencias_Fascículo_1.jpeg', 2);

--(197-212)
INSERT INTO Libros (titulo, autor, genero, url, imagen, cantidad)
VALUES 
(
    'La gitanilla', 
    'Miguel de Cervantes Saavedra', 
    '{"genero": "Ficción"}', 
    'https://biblioteca.org.ar/libros/71388.pdf', 
    '/uploads/197_la gitanilla.jpeg', 
    1
),
(
    'Reglas oficiales del basquetbol', 
    'Sin autor', 
    '{"genero": "Informativo"}', 
    '', 
    '/uploads/198_reglas oficiales del basquetbol.jpeg', 
    1
),
(
    'La familia de Pascual Duarte', 
    'Camilo José Cela', 
    '{"genero": "Narrativa"}', 
    'https://www.suneo.mx/literatura/subidas/Camilo%20Jos%C3%A9%20Cela%20%20La%20Familia%20de%20Pascual%20Duarte.pdf', 
    '/uploads/199_la familia de pascual duarte.jpeg', 
    1
),
(
    'Verdi: La traviata', 
    'Francesco Maria Piave', 
    '{"genero": "Melodrama"}', 
    'https://de.scribd.com/document/408409040/LA-TRAVIATA-pdf', 
    '/uploads/200_verdi la traviata.jpeg', 
    1
),
(
    'Cuentos mágicos: con actividades didácticas', 
    'Disney', 
    '{"genero": "Narrativo"}', 
    'https://articulo.mercadolibre.com.ar/MLA-1448269749-serie-de-cuentos-magicos-con-actividades-didacticas-disney-_JM#polycard_client=search-nordic&position=21&search_layout=stack&type=item&tracking_id=c4e6a66e-e474-4037-a92b-b42789adbc55', 
    '/uploads/201_cuentos mágicos con actividades didácticas.jpeg', 
    2
),
(
    'El arriero y otros cuentos', 
    'Guido Vidal Rodríguez', 
    '{"genero": "Narrativo"}', 
    'https://www.librosperuanos.com/libros/detalle/15628/El-arriero-y-otros-cuentos', 
    '/uploads/202_el arriero y otros cuentos.jpeg', 
    1
),
(
    'Comentarios reales', 
    'Garcilaso de la Vega Inca', 
    '{"genero": "Crónica"}', 
    'https://biblioteca-repositorio.clacso.edu.ar/bitstream/CLACSO/15293/1/Comentarios_reales_1_Inca_Garcilaso_de_la_Vega.pdf', 
    '/uploads/203_comentarios reales.jpeg', 
    1
),

(
    'Cómo producir leche de calidad', 
    'William Bardales Escalante', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/205_cómo producir leche de calidad.jpeg', 
    8
),
(
    'La historia de Francisca', 
    'MINEDU', 
    '{"genero": "Narrativo"}', 
    'https://es.scribd.com/doc/312074803/La-Historia-de-Francisca', 
    '/uploads/206_la historia de francisca.jpeg', 
    1
),
(
    'Dorita y sus amigos', 
    'MINEDU', 
    '{"genero": "Narrativo"}', 
    'https://es.scribd.com/doc/288264399/dorita-y-sus-amigos-docx', 
    '/uploads/207_Dorita y sus amigos.jpeg', 
    3
),
(
    'El aseo para evitar enfermedades', 
    'MINEDU', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/208_el aseo para evitar enfermedades.jpeg', 
    1
),
(
    'El domador de monstruos', 
    'Ana María Machado', 
    '{"genero": "Educativo"}', 
    'https://colegiosaopaulo.cl/wp-content/uploads/2022/04/DOMADOR-DE-MONSTRUOS.pdf', 
    '/uploads/209_el domador de monstruos.jpg', 
    1
),
(
    'Grandes personajes para pequeños lectores', 
    'José Carlos Mariátegui', 
    '{"genero": "Narrativo"}', 
    '', 
    '/uploads/210_Grandes personajes para pequeños lectores.jpeg', 
    1
),
(
    'Sentimiento Andino', 
    'Jorge Ruiz Baldeón', 
    '{"genero": "Narrativa"}', 
    'https://www.reduii.org/cii/sites/default/files/field/doc/Apu-Qun-Illa-Tiqsi-Wiraqucha-Pachayachachiq-El-Ordenador-Del-Cosmos.pdf', 
    '/uploads/211_Sentimiento Andino.jpeg', 
    2
),
(
    'El misterio de la biblioteca más pequeña del mundo', 
    'Miguel Fernando Mendoza Luna', 
    '{"genero": "Ficción, Misterio, Literatura infantil"}', 
    'https://www.scribd.com/document/721641878/El-Misterio-de-La-Biblioteca-Mas-Pequena-Del-Mundo', 
    '/uploads/212_El misterio de la biblioteca más pequeña del mundo.jpg', 
    2
);

--libros faltantes mios
INSERT INTO Libros (titulo, autor, genero, url, imagen, cantidad)
VALUES 
(
    'Calendario de festividades del Perú', 
    'Ministerio de Educación Perú', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/calendario de festividades del perú.jpeg', 
    1
),
(
    'Naturales Cometa Seis', 
    'Desconocido', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/Naturales cometa seis.jpeg', 
    1
),
(
    'Nuevo Catecismo Escolar', 
    'Desconocido', 
    '{"genero": "Religioso"}', 
    '', 
    '/uploads/Nuevo catecismo escolar.jpeg', 
    1
),
(
    'Pintadita, La Vicuña', 
    'Desconocido', 
    '{"genero": "Literatura Infantil"}', 
    '', 
    '/uploads/pintadita, la vicuña.jpeg', 
    1
),
(
    'asi soy yo', 
    'Ministerio de educación', 
    '{"genero": "Literatura Infantil"}', 
    '', 
    '/uploads/asi soy yo.jpeg', 
    1
),
(

    'The Darkest Minds', 
    'Alexandra Bracken', 
    '{"genero": "Ciencia Ficción"}', 
    'https://www.amazon.com/Darkest-Minds-Alexandra-Bracken/dp/1423157370', 
    '/uploads/the darkest minds.jpeg', 
    1
),
(
    'El Cuerpo Humano', 
    'Desconocido', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/El cuerpo humano.jpeg', 
    1
),
(
    'La Diferencia Soy Yo', 
    'Ministerio de Educación Perú', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/La diferencia soy yo.jpeg', 
    1
),
(
    'El Lazarillo de Tormes', 
    'Anónimo', 
    '{"genero": "Clásico"}', 
    'https://www.gutenberg.org/files/320/320-h/320-h.htm', 
    '/uploads/El lazarillo de tormes.jpeg', 
    1
),
(
    'Sistemas de Gestión de la Calidad', 
    'Fredy Betalleluz Valencia', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/sistemas de gestion de la calidad.jpeg', 
    1
),
(
    'Por Caminos del Perú', 
    'Desconocido', 
    '{"genero": "Histórico"}', 
    '', 
    '/uploads/Por caminos del Perú.jpeg', 
    1
),
(
    'El Libro Invisible', 
    'Santiago García Clairac', 
    '{"genero": "Literatura Juvenil"}', 
    'https://www.amazon.com/-/es/Santiago-Garc%C3%ADa-Clairac/dp/8467585250', 
    '/uploads/el libro invisible.jpeg', 
    1
),
(
    'Recetario de la Quinua', 
    'Ministerio de Educación Perú', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/recetario de la quinua.jpeg', 
    1
),
(
    'Prevención de Desastres', 
    'Desconocido', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/Prevencion de desastres.jpeg', 
    1
),
(
    'Patentes', 
    'Ministerio de Educación Perú', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/patentes.jpeg', 
    1
),
(
    'Así Ocurrió: Relatos y Tradiciones', 
    'Editorial Bruño', 
    '{"genero": "Literatura"}', 
    '', 
    '/uploads/asi ocurrio relatos y tradiciones.jpeg', 
    1
),
(
    'Obras Narrativas y Ensayo', 
    'Lima Biblioteca Nacional 1972', 
    '{"genero": "Literatura"}', 
    '', 
    '/uploads/obras narrativas y ensayo.jpeg', 
    1
),
(
    'El Jovenzuelo Calamar', 
    'Desconocido', 
    '{"genero": "Literatura Infantil"}', 
    '', 
    '/uploads/el jovenzuelo calamar.jpeg', 
    1
),
(
    'Cartas Peligrosas', 
    'Hazel Townson', 
    '{"genero": "Literatura Juvenil"}', 
    'https://www.amazon.com/-/es/Hazel-Townson/dp/8420440020', 
    '/uploads/cartas peligrossas.jpeg', 
    1
),
(
    'Mi Libro de los Ciclos de la Vida', 
    'Ministerio de Educación Perú', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/mi libro de los ciclos de la vida.jpeg', 
    1
),
(
    'Cuero, Teñidos y Papel Maché', 
    'Desconocido', 
    '{"genero": "Manualidades"}', 
    '', 
    '/uploads/cuero, teñidos y papel mache.jpeg', 
    1
),
(
    'Recetario Dos: Nutritivo, Económico y Saludable', 
    'Ministerio de Educación Perú', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/recetario dos nutritivo economico y saludable.jpeg', 
    1
),
(
    'La Madre', 
    'Máximo Gorki', 
    '{"genero": "Clásico"}', 
    'https://www.gutenberg.org/files/2488/2488-h/2488-h.htm', 
    '/uploads/la madre.jpeg', 
    1
),
(
    'Barrio Ciencias Histórico Sociales', 
    'Desconocido', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/barrio ciencias historico sociales.jpeg', 
    1
),
(
    'El Niño Marrón', 
    'Ministerio de Educación Perú', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/el niño marron.jpeg', 
    1
),
(
    'Obtención de Semillas y Material Vegetativo de Árboles y Arbustos', 
    'Desconocido', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/obtencion de semillas y material vegetative.jpeg', 
    1
),
(
    'La Flor Azul', 
    'Ministerio de Educación Perú', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/la flor Azul.jpeg', 
    1
),
(
    'Manejo de Residuos Sólidos en el Hogar', 
    'Ministerio de Educación Perú', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/manejo de residuos sólidos en el hogar.jpeg', 
    1
),
(
    'Bodas de Sangre', 
    'Federico García Lorca', 
    '{"genero": "Teatro"}', 
    'https://www.gutenberg.org/files/38282/38282-h/38282-h.htm', 
    '/uploads/bodas de sangre.jpeg', 
    1
),
(
    'Los Tesoros del Sacerdote', 
    'Desconocido', 
    '{"genero": "Religioso"}', 
    '', 
    '/uploads/los tesoros del sacerdote.jpeg', 
    1
),
(
    '¿Qué Pasos Debes Seguir para Obtener tu DNI?', 
    'Ministerio de Educación Perú', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/que pasos debes seguir para obtener tu DNI.jpeg', 
    1
),
(
    'En Forma de Palabras', 
    'Ministerio de Educación Perú', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/en forma de palabras.jpeg', 
    1
),
(
    'Razonamiento Matemático', 
    'Dr. Félix Aucallanchi V.', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/razonamiento matematico.jpeg', 
    1
),
(
    'Especies en Peligro de Extinción', 
    'Ministerio de Educación Perú', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/especies en peligro de extinción.jpeg', 
    1
),
(
    'Babú', 
    'Roy Berocay', 
    '{"genero": "Literatura Infantil"}', 
    'https://www.amazon.com/-/es/Roy-Berocay/dp/9974723015', 
    '/uploads/babú.jpeg', 
    1
),
(
    'El Gato Negro', 
    'Edgar Allan Poe', 
    '{"genero": "Terror"}', 
    'https://www.gutenberg.org/files/2148/2148-h/2148-h.htm', 
    '/uploads/el gato negro.jpeg', 
    1
),
(
    'La Lechuza del Valle y Otros Cuentos', 
    'Ministerio de Educación Perú', 
    '{"genero": "Literatura"}', 
    '', 
    '/uploads/la Lechuza del valle y otros cuentos.jpeg', 
    1
),
(
    'Sicaya Capital del Hanan Wanka', 
    'Desconocido', 
    '{"genero": "Histórico"}', 
    '', 
    '/uploads/sicaya capital del hanan wanka.jpeg', 
    1
),
(
    'La Doncella que Quería Conocer el Mar y Otras Leyendas Peruanas', 
    'Ministerio de Educación Perú', 
    '{"genero": "Literatura"}', 
    '', 
    '/uploads/la doncella que queria conocer el mar y otras leyendas peruanas.jpeg', 
    1
),
(
    'También las Estatuas Tienen Miedo', 
    'Andrea Ferrari', 
    '{"genero": "Literatura Juvenil"}', 
    'https://www.amazon.com/-/es/Andrea-Ferrari/dp/849694038X', 
    '/uploads/Tambien las estatuas tienen miedo.jpeg', 
    1
),
(
    'Lándor el Murciélago Inteligente', 
    'Desconocido', 
    '{"genero": "Literatura Infantil"}', 
    '', 
    '/uploads/lándor el muercielago inteligente.jpeg', 
    1
),
(
    'Marabato', 
    'Consuelo Armijo', 
    '{"genero": "Literatura Infantil"}', 
    'https://www.amazon.com/-/es/Consuelo-Armijo/dp/8420440004', 
    '/uploads/marabato.jpeg', 
    1
),
(
    'Las 22 Leyes Inmutables del Marketing', 
    'Al Ries y Jack Trout', 
    '{"genero": "Negocios"}', 
    'https://www.amazon.com/-/es/Al-Ries/dp/0887306667', 
    '/uploads/las 22 leyes inmutables del marketing.jpeg', 
    1
),
(
    'El Pescado: Alimento Nacional y Saludable', 
    'Ministerio de Educación Perú', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/el pescado alimento nacional y saludable.jpeg', 
    1
),
(
    'Chacras Integrales', 
    'Desconocido', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/chacras integrales.jpeg', 
    1
),
(
    'Orientaciones de la Enseñanza del Área de Arte y Cultura', 
    'Ministerio de Educación Perú', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/orientaciones de la enseñanza del área de arte y cultura.png', 
    1
),
(
    'Orientaciones de la Enseñanza del Área Curricular de Ciencia y Tecnología', 
    'Ministerio de Educación Perú', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/orientaciones de la enseñanza del área curricular de ciencia y tecnologia.jpeg', 
    1
),
(
    'Comunicación 2', 
    'Ministerio de Educación Perú', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/comunicación 2.jpeg', 
    1
),
(
    'Personal Social 2', 
    'Ministerio de Educación Perú', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/personal social 2.jpeg', 
    1
),
(
    'El Cuy Valiente', 
    'Marcos Torres y Leyla Alburqueque', 
    '{"genero": "Literatura Infantil"}', 
    '', 
    '/uploads/el cuy valiente.jpeg', 
    1
),
(
    'Tests ABC', 
    'Lorenco Filho', 
    '{"genero": "Educativo"}', 
    '', 
    '/uploads/Tests ABC.jpeg', 
    1
);

