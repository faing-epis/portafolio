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

let silaboDataCache = [];
let silaboHeadersCache = [];

// --- Event Listeners ---
loadReportBtn.addEventListener('click', loadSilaboReportData);
exportBtn.addEventListener('click', exportToCsv);

function handleSilaboReportData(result) {
    try {
        if (!result.success) {
            throw new Error(result.message || 'Error del servidor.');
        }

        // Filtramos para conservar únicamente las cabeceras base y las de Sílabos
        const allHeaders = result.headers || [];
        const baseHeaders = allHeaders.filter(h => !h.category).map(h => {
            if (h.key === 'estadoGeneral') {
                return { key: 'estadoSilabo', label: 'Estado del Sílabo' };
            }
            return h;
        });

        const silaboHeaders = allHeaders.filter(h => h.category === '3. Sílabos');
        silaboHeadersCache = [...baseHeaders, ...silaboHeaders];

        // Procesamos los datos calculando el estado exclusivo de sílabos para cada curso
        silaboDataCache = result.data.map(item => {
            const copy = { ...item };
            const upt = copy.status_url_silabo_upt && copy.status_url_silabo_upt.status === '✅';
            const icacit = copy.status_url_silabo_icacit && copy.status_url_silabo_icacit.status === '✅';

            if (copy.estadoGeneral === 'Sin Registro') {
                copy.estadoSilabo = 'Sin Registro';
            } else if (upt && icacit) {
                copy.estadoSilabo = 'Completado';
            } else {
                copy.estadoSilabo = 'Pendiente';
            }
            return copy;
        });

        displaySilaboReport(silaboDataCache, silaboHeadersCache);
    } catch (error) {
        console.error('Error al procesar datos de sílabos:', error);
        alert(`No se pudo procesar el reporte: ${error.message}`);
    } finally {
        dashboardLoader.style.display = 'none';
        reportContent.style.display = 'block';
        loadReportBtn.disabled = false;
        loadReportBtn.textContent = 'Generar Reporte de Sílabos';
    }
}

function loadSilaboReportData() {
    reportContent.style.display = 'none';
    exportBtn.style.display = 'none';
    dashboardLoader.style.display = 'block';
    loaderText.textContent = 'Consultando estado de sílabos...';
    loadReportBtn.disabled = true;
    loadReportBtn.innerHTML = '<div class="spinner" style="width:18px; height:18px; border-width:2px; margin: 0 auto;"></div>';

    const semestre = semesterSelector.value;
    const oldScript = document.getElementById('jsonp-script-silabos');
    if (oldScript) { oldScript.remove(); }
    const script = document.createElement('script');
    script.id = 'jsonp-script-silabos';
    // Compatible con la acción getDetailedReport existente
    script.src = `${WEB_APP_URL}?action=getDetailedReport&semestre=${semestre}&callback=handleSilaboReportData`;
    document.body.appendChild(script);
}

function displaySilaboReport(data, headers) {
    const total = data.length;
    const completados = data.filter(item => item.estadoSilabo === 'Completado').length;
    const pendientes = data.filter(item => item.estadoSilabo === 'Pendiente').length;
    const sinRegistro = data.filter(item => item.estadoSilabo === 'Sin Registro').length;

    totalCountEl.textContent = total;
    completedCountEl.textContent = completados;
    pendingCountEl.textContent = pendientes;
    unregisteredCountEl.textContent = sinRegistro;

    reportTableHead.innerHTML = '';
    const headerRow1 = document.createElement('tr'); // Categoría principal
    const headerRow2 = document.createElement('tr'); // Subcategoría
    const headerRow3 = document.createElement('tr'); // Evidencias (Sil. UPT, Sil. ICACIT)

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
        catTh.classList.add('category-header', 'category-silabos');
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
    const sortedData = [...data].sort((a, b) => a.docente.localeCompare(b.docente));

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
            } else if (header.key === 'estadoSilabo') {
                let statusClass = '';
                if (value === 'Completado') statusClass = 'status-completado';
                else if (value === 'Pendiente') statusClass = 'status-pendiente';
                else statusClass = 'status-sin-registro';

                td.innerHTML = `<span class="status-tag ${statusClass}">${value}</span>`;
            } else {
                td.textContent = value || 'N/A';
            }
            row.appendChild(td);
        });
        reportTableBody.appendChild(row);
    });

    exportBtn.style.display = 'inline-flex';
}

function exportToCsv() {
    if (!silaboDataCache || silaboDataCache.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }

    const headersLine = silaboHeadersCache.map(h => `"${h.label.replace(/"/g, '""')}"`).join(';');
    
    const rows = silaboDataCache.map(item => {
        const rowData = silaboHeadersCache.map(header => {
            let cellValue = item[header.key] || '';
            if (header.category) {
                cellValue = (cellValue && cellValue.status) ? cellValue.status : '❌';
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
    link.setAttribute("download", `reporte_silabos_${semesterSelector.value}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
