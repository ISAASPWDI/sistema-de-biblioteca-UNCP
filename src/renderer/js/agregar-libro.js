const d = document
export function initAgregarLibro() {
    const formAgregarLibro = d.querySelector('.add-book-form');
    formAgregarLibro.addEventListener('submit', (e) => {
        e.preventDefault()
        handleAdd()
    })
}

async function handleAdd() {
    console.log('=== INICIO handleAdd ===');
    console.log('Timestamp:', new Date().toISOString());

    // Obtener valores del formulario
    const $titulo = d.getElementById('titulo')?.value
    const $autor = d.getElementById('autor')?.value
    const $genero = d.getElementById('genero')?.value
    const $imgLibro = d.getElementById('formFile').files[0]
    const $link = d.getElementById('link')?.value
    const $cantidad = d.getElementById('cantidad')?.value

    // Log de valores obtenidos
    console.log('Valores del formulario:');
    console.log('- titulo:', $titulo);
    console.log('- autor:', $autor);
    console.log('- genero:', $genero);
    console.log('- link:', $link);
    console.log('- cantidad:', $cantidad);
    console.log('- archivo imagen:', $imgLibro ? {
        name: $imgLibro.name,
        size: $imgLibro.size,
        type: $imgLibro.type,
        lastModified: new Date($imgLibro.lastModified).toISOString()
    } : 'No se seleccionó archivo');

    // Validaciones básicas
    if (!$titulo || !$autor || !$genero || !$cantidad) {
        console.error('ERROR: Campos requeridos faltantes');
        alert('Por favor complete todos los campos requeridos');
        return;
    }

    // Crear FormData
    console.log('Creando FormData...');
    const formData = new FormData()
    formData.append('titulo', $titulo)
    formData.append('autor', $autor)
    formData.append('genero', $genero)
    formData.append('url', $link || '')
    formData.append('cantidad', $cantidad)
    
    if ($imgLibro) {
        formData.append('imagen', $imgLibro)
        console.log('Archivo agregado al FormData');
    } else {
        console.log('No se agregó archivo al FormData');
    }

    // Log del FormData (solo claves, ya que los valores no se pueden iterar fácilmente)
    console.log('Claves en FormData:');
    for (let key of formData.keys()) {
        console.log(`- ${key}:`, formData.get(key) instanceof File ? 'File' : formData.get(key));
    }

    try {
        console.log('Obteniendo puerto...');
        const port = await window.sessionAPI.getPort();
        console.log('Puerto obtenido:', port);
        
        // URL completa para la solicitud
        const url = `/libros`;
        console.log('URL de solicitud:', url);
        console.log('Método: POST');

        console.log('Iniciando fetch...');
        const res = await fetch(url, {
            method: 'POST',
            body: formData
        });

        console.log('Respuesta recibida:');
        console.log('- Status:', res.status);
        console.log('- StatusText:', res.statusText);
        console.log('- OK:', res.ok);
        console.log('- Headers:', Object.fromEntries(res.headers.entries()));

        // Verificar content-type de la respuesta
        const contentType = res.headers.get('content-type');
        console.log('Content-Type de respuesta:', contentType);

        if (!res.ok) {
            console.error('ERROR: Respuesta no exitosa');
            
            // Intentar leer el cuerpo de la respuesta para más detalles
            const responseText = await res.text();
            console.error('Cuerpo de respuesta (texto):', responseText);
            
            // Si parece ser HTML (error 500 con página de error)
            if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
                console.error('ERROR: El servidor devolvió HTML en lugar de JSON');
                console.error('Esto indica un error interno del servidor');
                throw new Error(`Server error ${res.status}: Respuesta HTML en lugar de JSON`);
            }
            
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        // Intentar parsear JSON
        console.log('Intentando parsear respuesta como JSON...');
        let data;
        try {
            const responseText = await res.text();
            console.log('Respuesta cruda:', responseText);
            data = JSON.parse(responseText);
            console.log('JSON parseado exitosamente:', data);
        } catch (parseError) {
            console.error('ERROR al parsear JSON:');
            console.error('Mensaje:', parseError.message);
            console.error('Respuesta recibida no es JSON válido');
            throw new Error('Respuesta del servidor no es JSON válido');
        }

        if (data.message === 'Libro agregado con éxito') {
            console.log('SUCCESS: Libro agregado correctamente');
            showAddedBookModal()
            limpiarFormulario()
        } else {
            console.log('Respuesta inesperada:', data);
        }

    } catch (error) {
        console.log('=== ERROR EN handleAdd ===');
        console.error('Tipo de error:', error.constructor.name);
        console.error('Mensaje:', error.message);
        console.error('Stack trace:', error.stack);
        
        // Error de red
        if (error instanceof TypeError && error.message.includes('fetch')) {
            console.error('ERROR DE RED: No se pudo conectar al servidor');
            alert('Error de conexión. Verifique que el servidor esté funcionando.');
        }
        // Error de parseo JSON
        else if (error.message.includes('JSON')) {
            console.error('ERROR DE FORMATO: Respuesta no válida del servidor');
            alert('Error en la respuesta del servidor. Revise los logs.');
        }
        // Otros errores
        else {
            console.error('ERROR GENERAL:', error.message);
            alert(`Error: ${error.message}`);
        }
    }

    console.log('=== FIN handleAdd ===\n');
}

function limpiarFormulario() {
    console.log('Limpiando formulario...');
    d.getElementById('titulo').value = ''
    d.getElementById('autor').value = ''
    d.getElementById('genero').value = ''
    d.getElementById('formFile').value = ''
    d.getElementById('link').value = ''
    d.getElementById('cantidad').value = ''
    console.log('Formulario limpiado');
}

function showAddedBookModal() {
    console.log('Mostrando modal de éxito...');
    const addBookModal = new bootstrap.Modal(document.getElementById('addBookModal'))
    addBookModal.show()
}