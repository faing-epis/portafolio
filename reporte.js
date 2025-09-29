// Usamos la MISMA URL de implementación que la aplicación principal
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwqkICDF4JnmlVKN_us6sq9QaM8gZ8oK-YQzf6rj1Rlmu-x3DWSs8HJq9Q299agGKjW/exec";

// --- Selectores del DOM del Reporte ---
const semesterSelector = document.getElementById('semester-selector');
const reportTypeSelector = document.getElementById('report-type-selector');
const loadReportBtn = document.getElementById('load-report-btn');
const dashboardLoader = document.getElementById('dashboard-loader');
const reportContent = document.getElementById('report-content');
const totalCountEl = document.getElementById('total-count');
const completedCountEl = document.getElementById('completed-count');
const pendingCountEl = document.getElementById('pending-count');
const unregisteredCountEl = document.getElementById('unregistered-count');
const reportTableBody = document.querySelector('#report-table tbody');

// --- Event Listener ---
loadReportBtn.addEventListener('click', loadReportData);

/**
 * Esta es la función que será llamada por el backend (JSONP).
 * Se define a nivel global para que sea accesible.
 * @param {object} result El objeto devuelto por el script de Google.
 */
function handleReportData(result) {
    try {
        if (!result.success) {
            throw new Error(result.message || 'Error desconocido del servidor.');
        }
        // Si todo sale bien, mostramos los datos
        displayReportData(result.data);
    } catch (error) {
        console.error('Error al procesar los datos del reporte:', error);
        alert(`No se pudo procesar el reporte: ${error.message}`);
    } finally {
        // Restauramos la UI sin importar el resultado
        dashboardLoader.style.display = 'none';
        reportContent.style.display = 'block';
        loadReportBtn.disabled = false;
        loadReportBtn.textContent = 'Generar Reporte';
    }
}

/**
 * Inicia el proceso de carga de datos mediante la técnica JSONP.
 */
function loadReportData() {
    // 1. Preparamos la UI para la carga
    reportContent.style.display = 'none';
    dashboardLoader.style.display = 'block';
    loadReportBtn.disabled = true;
    loadReportBtn.innerHTML = '<div class="spinner" style="width:18px; height:18px; border-width:2px; margin: 0 auto;"></div>';

    // 2. Obtenemos los valores de los filtros
    const semestre = semesterSelector.value;
    const reportType = reportTypeSelector.value;

    // 3. Eliminamos cualquier script antiguo para evitar duplicados
    const oldScript = document.getElementById('jsonp-script');
    if (oldScript) {
        oldScript.remove();
    }

    // 4. Creamos una etiqueta <script> dinámicamente
    const script = document.createElement('script');
    script.id = 'jsonp-script';
    
    // --- [CORRECCIÓN CRÍTICA AQUÍ] ---
    // Usamos la constante WEB_APP_URL para construir la URL completa
    script.src = `${WEB_APP_URL}?semestre=${semestre}&reportType=${reportType}&callback=handleReportData`;
    
    // 5. Añadimos el script al documento, lo que disparará la petición
    document.body.appendChild(script);
}

/**
 * Toma los datos del reporte y los muestra en la página.
 * @param {Array<object>} data Un array con los datos de cada curso.
 */
function displayReportData(data) {
    // 1. Calcular las métricas
    const total = data.length;
    const completados = data.filter(item => item.estado === 'Completado').length;
    const pendientes = data.filter(item => item.estado === 'Pendiente').length;
    const sinRegistro = data.filter(item => item.estado === 'Sin Registro').length;

    // 2. Actualizar las tarjetas de métricas
    totalCountEl.textContent = total;
    completedCountEl.textContent = completados;
    pendingCountEl.textContent = pendientes;
    unregisteredCountEl.textContent = sinRegistro;

    // 3. Limpiar y rellenar la tabla
    reportTableBody.innerHTML = ''; // Limpiamos la tabla anterior

    if (total === 0) {
        reportTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">No se encontraron cursos en la carga horaria para este semestre.</td></tr>';
        return;
    }

    // Ordenamos los datos para agrupar por docente
    data.sort((a, b) => a.docente.localeCompare(b.docente));

    data.forEach(item => {
        const row = document.createElement('tr');

        // Definimos el estilo y el emoji para cada estado
        let statusClass = '';
        let statusEmoji = '';
        switch (item.estado) {
            case 'Completado':
                statusClass = 'status-completado';
                statusEmoji = '✅';
                break;
            case 'Pendiente':
                statusClass = 'status-pendiente';
                statusEmoji = '🟡';
                break;
            case 'Sin Registro':
                statusClass = 'status-sin-registro';
                statusEmoji = '❌';
                break;
        }

        const statusCell = `<span class="status-tag ${statusClass}">${statusEmoji} ${item.estado}</span>`;

        row.innerHTML = `
            <td>${item.docente || 'N/A'}</td>
            <td>${item.curso || 'N/A'}</td>
            <td>${item.seccion || 'N/A'}</td>
            <td>${statusCell}</td>
        `;

        reportTableBody.appendChild(row);
    });
}