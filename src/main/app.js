const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

// Resto de tu código...
const app = express();
app.use(cors());
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"], // Solo permite cargar recursos desde el mismo origen
                scriptSrc: ["'self'", 'cdn.jsdelivr.net', "'unsafe-inline'"], // Permite cargar scripts desde cdn.jsdelivr.net y inline
                styleSrc: ["'self'", 'cdn.jsdelivr.net', 'fonts.googleapis.com', "'unsafe-inline'"], // Permite cargar estilos desde cdn.jsdelivr.net, fonts.googleapis.com y inline
                fontSrc: ["'self'", 'fonts.gstatic.com', 'cdn.jsdelivr.net'], // Permite cargar fuentes desde fonts.gstatic.com y cdn.jsdelivr.net
                connectSrc: ["'self'"], // Permite conexiones solo desde el mismo origen
                objectSrc: ["'none'"], // Bloquea la carga de objetos como Flash
                mediaSrc: ["'none'"], // Bloquea la carga de medios
                frameSrc: ["'none'"], // Bloquea la carga de frames o iframes
                styleSrcElem: ["'self'", 'cdn.jsdelivr.net', "'unsafe-inline'"], // Permite estilos en elementos
                scriptSrcElem: ["'self'", 'cdn.jsdelivr.net', "'unsafe-inline'"], // Permite scripts en elementos
            },
        },
        crossOriginEmbedderPolicy: true, // Refuerza la política de seguridad para recursos incrustados
    })
);



app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


module.exports = {
    app,
    PORT
}