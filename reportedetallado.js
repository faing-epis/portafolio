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
const labelCompletados = document.getElementById('label-completados');
const labelPendientes = document.getElementById('label-pendientes');
const reportTableHead = document.querySelector('#report-table thead');
const reportTableBody = document.querySelector('#report-table tbody');

const tabAll = document.getElementById('tab-all');
const tabSilabos = document.getElementById('tab-silabos');

let reportDataCache = [];
let reportHeadersCache = [];
let activeTab = 'all'; // 'all' | 'silabos'

// --- Mapeo de Clases CSS para Categorías ---
const categoryClassMap = {
    '1. Info General': 'category-general',
    '2. Prueba de Entrada': 'category-entrada',
    '3. Sílabos': 'category-silabos',
    '4. Unidad I': 'category-unidad1',
    '5. Unidad II': 'category-unidad2',
    '6. Unidad III': 'category-unidad3'
};

// --- Event Listeners ---
loadReportBtn.addEventListener('click', loadDetailedReportData);
exportBtn.addEventListener('click', exportToCsv);

if (tabAll && tabSilabos) {
    tabAll.addEventListener('click', () => {
        if (activeTab === 'all') return;
        activeTab = 'all';
        tabAll.classList.add('active');
        tabSilabos.classList.remove('active');
        renderActiveView();
    });

    tabSilabos.addEventListener('click', () => {
        if (activeTab === 'silabos') return;
        activeTab = 'silabos';
        tabSilabos.classList.add('active');
        tabAll.classList.remove('active');
        renderActiveView();
    });
}

function handleDetailedReportData(result) {
    try {
        if (!result.success) {
            throw new Error(result.message || 'Error del servidor.');
        }
        reportDataCache = result.data;
        reportHeadersCache = result.headers;
        renderActiveView();
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

function getActiveHeaders() {
    if (activeTab === 'silabos') {
        return reportHeadersCache.filter(h => !h.category || h.category === '3. Sílabos');
    }
    return reportHeadersCache;
}

function renderActiveView() {
    if (!reportDataCache || reportDataCache.length === 0) return;

    const activeHeaders = getActiveHeaders();
    updateMetrics();
    renderTable(activeHeaders);
    exportBtn.style.display = 'inline-flex';
}

function updateMetrics() {
    const total = reportDataCache.length;

    if (activeTab === 'silabos') {
        labelCompletados.textContent = 'Sílabos Completos';
        labelPendientes.textContent = 'Sílabos Pendientes';

        // Un curso tiene sílabos completos si tanto UPT como ICACIT tienen '✅'
        const completados = reportDataCache.filter(item => {
            const upt = item.status_url_silabo_upt && item.status_url_silabo_upt.status === '✅';
            const icacit = item.status_url_silabo_icacit && item.status_url_silabo_icacit.status === '✅';
            return upt && icacit;
        }).length;

        const sinRegistro = reportDataCache.filter(item => item.estadoGeneral === 'Sin Registro').length;
        const pendientes = total - completados - sinRegistro;

        totalCountEl.textContent = total;
        completedCountEl.textContent = completados;
        pendingCountEl.textContent = pendientes;
        unregisteredCountEl.textContent = sinRegistro;
    } else {
        labelCompletados.textContent = 'Completados';
        labelPendientes.textContent = 'Pendientes';

        const completados = reportDataCache.filter(item => item.estadoGeneral === 'Completado').length;
        const pendientes = reportDataCache.filter(item => item.estadoGeneral === 'Pendiente').length;
        const sinRegistro = reportDataCache.filter(item => item.estadoGeneral === 'Sin Registro').length;

        totalCountEl.textContent = total;
        completedCountEl.textContent = completados;
        pendingCountEl.textContent = pendientes;
        unregisteredCountEl.textContent = sinRegistro;
    }
}

function renderTable(headers) {
    reportTableHead.innerHTML = '';
    const headerRow1 = document.createElement('tr'); // Categorías principales
    const headerRow2 = document.createElement('tr'); // Subcategorías
    const headerRow3 = document.createElement('tr'); // Evidencias

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

        const catClass = categoryClassMap[categoryName] || 'category-general';
        catTh.classList.add(catClass);

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
    const sortedData = [...reportDataCache].sort((a, b) => a.docente.localeCompare(b.docente));

    sortedData.forEach(item => {
        const row = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            const value = item[header.key];

            if (header.category) {
                td.classList.add('status-cell');
                const tooltipText = value && value.names && value.names.length > 0 ? value.names.join('<br>') : '(Vacío)';
                td.innerHTML = `
                    <div class="tooltip">
                      <a href="${(value && value.url) ? value.url : '#'}" target="_blank">${(value && value.status) ? value.status : '❌'}</a>
                      <span class="tooltiptext">${tooltipText}</span>
                    </div>`;
            } else if (header.key === 'estadoGeneral') {
                let displayStatus = value;
                if (activeTab === 'silabos') {
                    const upt = item.status_url_silabo_upt && item.status_url_silabo_upt.status === '✅';
                    const icacit = item.status_url_silabo_icacit && item.status_url_silabo_icacit.status === '✅';
                    if (value === 'Sin Registro') {
                        displayStatus = 'Sin Registro';
                    } else if (upt && icacit) {
                        displayStatus = 'Completado';
                    } else {
                        displayStatus = 'Pendiente';
                    }
                }

                let statusClass = '';
                if (displayStatus === 'Completado') statusClass = 'status-completado';
                else if (displayStatus === 'Pendiente') statusClass = 'status-pendiente';
                else statusClass = 'status-sin-registro';

                td.innerHTML = `<span class="status-tag ${statusClass}">${displayStatus}</span>`;
            } else {
                td.textContent = value || 'N/A';
            }
            row.appendChild(td);
        });
        reportTableBody.appendChild(row);
    });
}

function exportToCsv() {
    if (!reportDataCache || reportDataCache.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }

    const activeHeaders = getActiveHeaders();
    const headersLine = activeHeaders.map(h => `"${h.label.replace(/"/g, '""')}"`).join(';');
    
    const rows = reportDataCache.map(item => {
        const rowData = activeHeaders.map(header => {
            let cellValue = item[header.key] || '';
            if (header.category) {
                cellValue = (cellValue && cellValue.status) ? cellValue.status : '❌';
            } else if (header.key === 'estadoGeneral' && activeTab === 'silabos') {
                const upt = item.status_url_silabo_upt && item.status_url_silabo_upt.status === '✅';
                const icacit = item.status_url_silabo_icacit && item.status_url_silabo_icacit.status === '✅';
                if (item.estadoGeneral === 'Sin Registro') cellValue = 'Sin Registro';
                else if (upt && icacit) cellValue = 'Completado';
                else cellValue = 'Pendiente';
            }
            return `"${String(cellValue).replace(/"/g, '""')}"`;
        });
        return rowData.join(';');
    });

    const csvContent = "\uFEFF" + headersLine + "\r\n" + rows.join("\r\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const suffix = activeTab === 'silabos' ? 'silabos' : 'evidencias';
    link.setAttribute("download", `reporte_${suffix}_${semesterSelector.value}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
