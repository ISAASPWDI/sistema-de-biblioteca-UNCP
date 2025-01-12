// reports.js
export function initReports() {
    const scrollableContainer = document.querySelector('.scrollable-reporting-container');
    
    // Crear el contenido inicial
    function createReportInterface() {
        scrollableContainer.innerHTML = `
            <div class="stats-container mb-4">
                <div class="card">
                    <div class="card-body">
                        <h3 class="card-title mb-4">Estadísticas Generales</h3>
                        <div class="row" id="statsRow">
                            <div class="col-md-4">
                                <div class="stat-card p-3 bg-light rounded">
                                    <h4 id="totalEstudiantes">-</h4>
                                    <p class="mb-0">Estudiantes</p>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="stat-card p-3 bg-light rounded">
                                    <h4 id="totalAdmins">-</h4>
                                    <p class="mb-0">Administradores</p>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="stat-card p-3 bg-light rounded">
                                    <h4 id="totalLibros">-</h4>
                                    <p class="mb-0">Libros</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="actions-container text-center mb-4">
                <button id="generateReportBtn" class="btn btn-primary btn-lg">
                    <i class="fas fa-file-pdf me-2"></i>
                    Generar Reporte PDF
                </button>
            </div>
            
            <div id="loadingIndicator" class="text-center d-none">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2">Generando reporte...</p>
            </div>
        `;
        
        // Agregar event listeners
        const generateReportBtn = document.getElementById('generateReportBtn');
        generateReportBtn.addEventListener('click', handleGenerateReport);
        
        // Cargar estadísticas iniciales
        loadStats();
    }
    
    async function loadStats() {
        try {
            const response = await fetch('/api/admin/stats');
            if (!response.ok) throw new Error('Error cargando estadísticas');
            
            const stats = await response.json();
            
            // Actualizar UI
            document.getElementById('totalEstudiantes').textContent = stats.totalEstudiantes;
            document.getElementById('totalAdmins').textContent = stats.totalAdmins;
            document.getElementById('totalLibros').textContent = stats.totalLibros;
            
        } catch (error) {
            console.error('Error:', error);
            alert('Error cargando estadísticas');
        }
    }
    
    async function handleGenerateReport() {
        const generateReportBtn = document.getElementById('generateReportBtn');
        const loadingIndicator = document.getElementById('loadingIndicator');
        
        try {
            // Mostrar loading
            generateReportBtn.disabled = true;
            loadingIndicator.classList.remove('d-none');
            
            const response = await fetch('/api/admin/generate-report');
            
            if (!response.ok) throw new Error('Error generando reporte');
            
            // Convertir respuesta a blob
            const blob = await response.blob();
            
            // Crear URL y descargar
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte-biblioteca-${moment().format('YYYY-MM-DD')}.pdf`;
            document.body.appendChild(a);
            a.click();
            
            // Limpiar
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
        } catch (error) {
            console.error('Error:', error);
            alert('Error generando reporte');
        } finally {
            // Restaurar UI
            generateReportBtn.disabled = false;
            loadingIndicator.classList.add('d-none');
        }
    }
    
    // Inicializar interfaz
    createReportInterface();
}