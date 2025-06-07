# 📚 Sistema de Biblioteca UNCP

Bienvenido al repositorio del **Sistema de Biblioteca UNCP**. Este sistema permite gestionar libros, estudiantes y reportes de manera eficiente. 

## 🚀 Tecnologías Utilizadas

Este proyecto está desarrollado utilizando diversas tecnologías modernas:

- **🌐 Frontend:**
  - HTML5, CSS3 y JavaScript (Estructura y estilos del sistema)
  - Bootstrap (Diseño responsivo y elegante)
- **⚙️ Backend:**
  - Node.js (Servidor y lógica del negocio)
  - Express.js (Manejo de rutas y API REST)
- **🗄️ Base de Datos:**
  - SQL Server (Almacenamiento de información de libros y estudiantes)
- **🖥️ Aplicación de Escritorio:**
  - Electron (Transforma la app en una aplicación de escritorio)
- **📄 Generación de Reportes:**
  - PDFKit (Generación de reportes en PDF para administración)

## 🎯 Características del Proyecto

El sistema cuenta con dos interfaces principales: **Administrador** y **Estudiante**.

### 🛠️ Interfaz Administrador
👤 **Acceso con Login**
- 🔹 **Dashboard:** Vista general con estadísticas (📚 libros totales, 👥 estudiantes, ⭐ libros favoritos)
- 📖 **Gestión de Libros:** CRUD para agregar, editar, modificar y eliminar libros
- 👥 **Gestión de Estudiantes:** CRUD para administrar usuarios del sistema
- 📊 **Generación de Reportes:** Creación de informes en PDF sobre el estado de la biblioteca
- ⚙️ **Configuración y Soporte:** Información sobre el funcionamiento del sistema

### 🎓 Interfaz Estudiante
👤 **Acceso con Login**
- 🔹 **Dashboard:** Vista general con últimas adiciones de libros y estadísticas
- 📚 **Biblioteca Digital:** Exploración de todos los libros disponibles
- 📌 **Libros Favoritos:** Sección para guardar y visualizar libros favoritos
- 🌎 **Acceso Remoto:** Recursos digitales externos recomendados
- ⚙️ **Configuración y Soporte:** Guía de uso para estudiantes

## 🏗️ Arquitectura del Sistema

![Arquitectura](http://imgfz.com/i/cqHudEV.png)

1. **Frontend (HTML, CSS, Bootstrap, JavaScript)** → Interfaz de usuario interactiva 📜
2. **Backend (Node.js + Express.js)** → Gestión de datos y lógica del negocio ⚡
3. **Base de Datos (SQL Server)** → Almacenamiento y consultas 🔍
4. **Electron** → Convierte la aplicación en software de escritorio 🖥️
5. **PDFKit** → Generación de reportes en PDF 📄

## 📥 Instalación y Configuración

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/tuusuario/sistema-biblioteca-uncp.git
   ```
2. Instalar dependencias:
   ```bash
   cd sistema-biblioteca-uncp
   npm install
   ```
3. Configurar la base de datos en SQL Server
4. Iniciar el servidor:
   ```bash
   npm start
   ```
5. Ejecutar la aplicación de escritorio con Electron:
   ```bash
   npm run electron
   ```

## 📷 Capturas de Pantalla

### 📊 Dashboard Administrador
![Dashboard Admin](https://via.placeholder.com/800x400?text=Dashboard+Administrador)

### 📚 Biblioteca Digital
![Biblioteca Digital](https://via.placeholder.com/800x400?text=Biblioteca+Digital)

## 🤝 Contribuciones
¡Cualquier colaboración es bienvenida! Para contribuir, por favor sigue estos pasos:
1. Haz un fork del repositorio 📌
2. Crea una rama con tu nueva funcionalidad (`git checkout -b feature/nueva-funcion`)
3. Realiza los cambios y haz un commit (`git commit -m 'Añadir nueva función'`)
4. Envía un pull request 🚀

## 📩 Contacto
Para dudas o sugerencias, puedes comunicarte con el equipo de desarrollo a través de [correo electrónico](stivensaliaga@gmail.com).

---
💡 *Este proyecto está en constante mejora para ofrecer la mejor experiencia a los usuarios.*
