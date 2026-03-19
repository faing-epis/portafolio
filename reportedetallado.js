const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwliquq5cdKRHEY7SMqy9FAr6xryQHHs6DGd0m_K2qRTPk1jRCbTOYxNFItIhFgiPXh/exec";

// --- Selectores del DOM ---
const semesterSelector = document.getElementById('semester-selector');
const loadReportBtn = document.getElementById('load-report-btn');
const exportBtn = document.getElementById('export-btn');
const dashboardLoader = document.getElementById('dashboard-loader');
const loaderText = document.getElementById('loader-text');
const reportContent = document.getElementById('report-content');
const totalCountEl = document.getElementById('total-count');
const completedCountEl = document.getElementById('completed-count');
const pendingCountEl = document.getElementById('pending-count');
const unregisteredCountEl = document.getElementById('unregistered-count');
const reportTableHead = document.querySelector('#report-table thead');
const reportTableBody = document.querySelector('#report-table tbody');

let reportDataCache = [];
let reportHeadersCache = [];

// --- Event Listeners ---
loadReportBtn.addEventListener('click', loadDetailedReportData);
exportBtn.addEventListener('click', exportToCsv);

function handleDetailedReportData(result) {
    try {
        if (!result.success) {
            throw new Error(result.message || 'Error del servidor.');
        }
        displayDetailedReport(result.data, result.headers);
    } catch (error) {
        console.error('Error al procesar datos:', error);
        alert(`No se pudo procesar el reporte: ${error.message}`);
    } finally {
        dashboardLoader.style.display = 'none';
        reportContent.style.display = 'block';
        loadReportBtn.disabled = false;
        loadReportBtn.textContent = 'Generar Reporte Detallado';
    }
}

function loadDetailedReportData() {
    reportContent.style.display = 'none';
    exportBtn.style.display = 'none';
    dashboardLoader.style.display = 'block';
    loaderText.textContent = 'Analizando carpetas y generando reporte...';
    loadReportBtn.disabled = true;
    loadReportBtn.innerHTML = '<div class="spinner" style="width:18px; height:18px; border-width:2px; margin: 0 auto;"></div>';

    const semestre = semesterSelector.value;
    const oldScript = document.getElementById('jsonp-script-detailed');
    if (oldScript) { oldScript.remove(); }
    const script = document.createElement('script');
    script.id = 'jsonp-script-detailed';
    script.src = `${WEB_APP_URL}?action=getDetailedReport&semestre=${semestre}&callback=handleDetailedReportData`;
    document.body.appendChild(script);
}

function displayDetailedReport(data, headers) {
    reportDataCache = data;
    reportHeadersCache = headers;

    const total = data.length;
    const completados = data.filter(item => item.estadoGeneral === 'Completado').length;
    const pendientes = data.filter(item => item.estadoGeneral === 'Pendiente').length;
    const sinRegistro = data.filter(item => item.estadoGeneral === 'Sin Registro').length;

    totalCountEl.textContent = total;
    completedCountEl.textContent = completados;
    pendingCountEl.textContent = pendientes;
    unregisteredCountEl.textContent = sinRegistro;

    reportTableHead.innerHTML = '';
    const headerRow1 = document.createElement('tr'); // Fila de categorías principales
    const headerRow2 = document.createElement('tr'); // Fila de subcategorías
    const headerRow3 = document.createElement('tr'); // Fila de evidencias

    const baseHeaders = headers.filter(h => !h.category);
    baseHeaders.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header.label;
        th.rowSpan = 3;
        th.classList.add('base-header');
        headerRow1.appendChild(th);
    });

    const categoryGroups = {};
    headers.forEach(h => {
        if (h.category) {
            if (!categoryGroups[h.category]) categoryGroups[h.category] = {};
            if (!categoryGroups[h.category][h.subcategory]) categoryGroups[h.category][h.subcategory] = [];
            categoryGroups[h.category][h.subcategory].push(h);
        }
    });

    for (const categoryName in categoryGroups) {
        const subcategories = categoryGroups[categoryName];
        let categoryColspan = 0;
        for (const subcategoryName in subcategories) {
            categoryColspan += subcategories[subcategoryName].length;
        }

        const catTh = document.createElement('th');
        catTh.textContent = categoryName;
        catTh.colSpan = categoryColspan;
        catTh.classList.add('category-header');

        // --- [CORRECCIÓN CRÍTICA AQUÍ] ---
        // Genera un nombre de clase válido eliminando espacios y caracteres especiales.
        const categoryClass = 'category-' + categoryName.split('.')[1].trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        catTh.classList.add(categoryClass);

        headerRow1.appendChild(catTh);

        for (const subcategoryName in subcategories) {
            const items = subcategories[subcategoryName];
            const subCatTh = document.createElement('th');
            subCatTh.textContent = subcategoryName;
            subCatTh.colSpan = items.length;
            subCatTh.classList.add('subcategory-header');
            headerRow2.appendChild(subCatTh);

            items.forEach(item => {
                const itemTh = document.createElement('th');
                itemTh.textContent = item.label;
                headerRow3.appendChild(itemTh);
            });
        }
    }

    reportTableHead.appendChild(headerRow1);
    reportTableHead.appendChild(headerRow2);
    reportTableHead.appendChild(headerRow3);

    reportTableBody.innerHTML = '';
    data.sort((a, b) => a.docente.localeCompare(b.docente));

    data.forEach(item => {
        const row = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            const value = item[header.key];

            if (header.category) {
                td.classList.add('status-cell');
                const tooltipText = value.names && value.names.length > 0 ? value.names.join('<br>') : '(Vacío)';
                td.innerHTML = `
                    <div class="tooltip">
                      <a href="${value.url}" target="_blank">${value.status}</a>
                      <span class="tooltiptext">${tooltipText}</span>
                    </div>`;
            } else if (header.key === 'estadoGeneral') {
                let statusClass = '';
                if (value === 'Completado') statusClass = 'status-completado';
                if (value === 'Pendiente') statusClass = 'status-pendiente';
                if (value === 'Sin Registro') statusClass = 'status-sin-registro';
                td.innerHTML = `<span class="status-tag ${statusClass}">${value}</span>`;
            } else {
                td.textContent = value;
            }
            row.appendChild(td);
        });
        reportTableBody.appendChild(row);
    });

    exportBtn.style.display = 'inline-flex';
}

function exportToCsv() {
    if (reportDataCache.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }

    const headers = reportHeadersCache.map(h => `"${h.label.replace(/"/g, '""')}"`).join(',');
    const rows = reportDataCache.map(item => {
        const rowData = reportHeadersCache.map(header => {
            let cellValue = item[header.key] || '';
            if (header.category) {
                cellValue = (cellValue && cellValue.status) ? cellValue.status : '❌';
            }
            return `"${String(cellValue).replace(/"/g, '""')}"`;
        });
        return rowData.join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_detallado_evidencias_${semesterSelector.value}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

}

