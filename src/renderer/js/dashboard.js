export function initGetDataAdmin() {

    async function getDataInterfazAdmin() {
        try {
            const response = await fetch('http://localhost:3000/dashboard', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            const data = await response.json()
            const ultimosUsuariosAgregados = document.querySelector('.ultimos-usuarios-agregados')
            if (ultimosUsuariosAgregados) {
                const ultimosUsuariosAgregadosText = document.createElement('p')
                ultimosUsuariosAgregadosText.textContent = 'Ultimos usuarios agregados'
                ultimosUsuariosAgregadosText.classList.add('mb-0', 'fs-4', 'pb-3')
                ultimosUsuariosAgregados.insertAdjacentElement('afterbegin', ultimosUsuariosAgregadosText)
                data.ultimosUsuarios.forEach(usuario => {
                    usuario.esta_activo = usuario.esta_activo ? 'Activo' : 'Inactivo'
                    const usuarioHtml = `
                <div class="d-flex align-items-center pb-2">
                <div class="imagen-usuario"><img src="/assets/img/user-icon.png" class="mb-0" alt=""></div>
                <div class="usuario-info"> 
                <div class="d-flex flex-column nombre-email align-items-start"><p class="mb-0 me-2 ms-0">${usuario.nombre}
                </p><p class="mb-0">Correo: ${usuario.email}</p></div>
                
                <div class="d-flex estado-creado align-items-start"><p class="card-text mb-0 me-2">Estado: ${usuario.esta_activo}</p>
                <p class="card-text">Agregado: ${usuario.created_at.split('T')[0]}</p></div>
                </div>
                </div>
                `
                    ultimosUsuariosAgregados.innerHTML += usuarioHtml

                });
            }
            const librosFavoritos = document.querySelector('.libros-favoritos')
            if (librosFavoritos) {
                const librosFavoritosText = document.createElement('p')
                librosFavoritosText.textContent = 'Libros favoritos'
                librosFavoritosText.classList.add('mb-0', 'fs-4', 'pb-3')
                librosFavoritos.insertAdjacentElement('afterbegin', librosFavoritosText)
                data.librosFavoritos.forEach(libro => {
                    const libroFavoritoHtml = `
                <div class="d-flex align-items-center pb-3">
                <div class="imagen-usuario"><img src="${libro.imagen}" class="me-3 mb-0 rounded" width="60px" height="60px" alt=""></div>
                <div class="usuario-info"> 
                <div class="d-flex flex-column nombre-email align-items-start"><p class="mb-0 me-2 ms-0">${libro.titulo}
                </p><p class="mb-0">Autor: ${libro.autor}</p></div>
                
                <div class="d-flex estado-creado align-items-start"><p class="card-text mb-0 me-2">Estudiante: ${libro.nombre_usuario}</p>
                <p class="card-text">Agregado: ${libro.created_at.split('T')[0]}</p></div>
                </div>
                </div>
                `
                    librosFavoritos.innerHTML += libroFavoritoHtml
                })
            }


            const numeroLibrosFavoritos = document.querySelector('.libros_favoritos')
            if (numeroLibrosFavoritos) {

                const numeroLibrosFavoritosText = document.createElement('p')
                numeroLibrosFavoritosText.textContent = `Tienes ${data.numTotalLibrosFavoritos} libros`
                numeroLibrosFavoritosText.classList.add('mb-0', 'fs-4', 'pb-0')
                numeroLibrosFavoritos.insertAdjacentElement('afterbegin', numeroLibrosFavoritosText)
            }

            const ultimosLibrosAgregados = document.querySelector('.ultimos-libros-agregados')
            if (ultimosLibrosAgregados) {
                const ultimosLibrosAgregadosText = document.createElement('p')
                ultimosLibrosAgregadosText.textContent = 'Ultimos libros agregados'
                ultimosLibrosAgregadosText.classList.add('mb-0', 'fs-4', 'pb-3')
                ultimosLibrosAgregados.insertAdjacentElement('afterbegin', ultimosLibrosAgregadosText)
                data.ultimosLibros.forEach(libro => {
                    const libroHtml = `
                <div class="d-flex align-items-center pb-3">
                <div class="imagen-usuario"><img src="${libro.imagen}" class="me-3 mb-0 rounded" width="60px" height="60px" alt=""></div>
                <div class="usuario-info"> 
                <div class="d-flex flex-column nombre-email align-items-start"><p class="mb-0 me-2 ms-0">${libro.titulo}
                </p><p class="mb-0">Autor: ${libro.autor}</p></div>
                
                <div class="d-flex estado-creado align-items-start"><p class="card-text mb-0 me-2">Cantidad: ${libro.cantidad}</p>
                <p class="card-text">Agregado: ${libro.created_at.split('T')[0]}</p></div>
                </div>
                </div>
                `
                    ultimosLibrosAgregados.innerHTML += libroHtml
                })
            }


            const numeroLibrosTotales = document.querySelector('.libros_totales_numero')
            if (numeroLibrosTotales) {
                const numeroLibrosTotalesText = document.createElement('p')
                numeroLibrosTotalesText.textContent = `Hay ${data.numTotalLibros} libros`
                numeroLibrosTotalesText.classList.add('mb-0', 'fs-4', 'pb-0')
                numeroLibrosTotales.insertAdjacentElement('afterbegin', numeroLibrosTotalesText)
            }


            const numeroAdminTotales = document.querySelector('.administradores_numero')
            if (numeroAdminTotales) {
                const numeroAdminTotalesText = document.createElement('p')
                numeroAdminTotalesText.textContent = `Hay ${data.numAdmins} admins`
                numeroAdminTotalesText.classList.add('mb-0', 'fs-4', 'pb-0')
                numeroAdminTotales.insertAdjacentElement('afterbegin', numeroAdminTotalesText)
            }


            const numeroStudentTotales = document.querySelector('.students_numero')
            const numeroStudentTotalesText = document.createElement('p')
            numeroStudentTotalesText.textContent = `Hay ${data.numEstudiantes} estudiantes`
            numeroStudentTotalesText.classList.add('mb-0', 'fs-4', 'pb-0')
            numeroStudentTotales.insertAdjacentElement('afterbegin', numeroStudentTotalesText)

        } catch (error) {
            console.error('Error al cargar el dashboard', error)
        }
    }
    getDataInterfazAdmin()

}


