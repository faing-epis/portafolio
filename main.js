const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyWT2UZi_Hz8_SIZSDgSlpjMnv1X3UFV5BW2AXgwtN63owooAQcphYy6bjOgR5B6O_4/exec";

// --- Selectores de Elementos DOM ---
const semesterModal = document.getElementById('semesterModal');
const semesterSelector = document.getElementById('semesterSelector');
const loadSemesterBtn = document.getElementById('loadSemesterBtn');
const semesterLoader = document.getElementById('semesterLoader');
const appContainer = document.getElementById('app-container');
const semesterDisplay = document.getElementById('semester-display');
const reportTypeSelector = document.getElementById('reportTypeSelector');
const searchSection = document.getElementById('search-section');
const teacherInput = document.getElementById('teacherInput');
const searchButton = document.getElementById('searchButton');
const suggestionsDiv = document.getElementById('suggestions');
const searchLoader = document.getElementById('search-loader');
const teacherDetailsDiv = document.getElementById('teacher-details');
const coursesResultsDiv = document.getElementById('courses-results');
const reportModal = document.getElementById('reportModal');
const modalTitle = document.getElementById('modalTitle');
const entryTestStatusIndicator = document.getElementById('entryTestStatusIndicator');
const matriculadosInput = document.getElementById('matriculados');
const evaluadosInput = document.getElementById('evaluados');
const skillsContainer = document.getElementById('skills-container');
const addSkillBtn = document.getElementById('addSkillBtn');
const validationMsg = document.getElementById('validation-message');
const chkRepasoClase = document.getElementById('repaso_clase');
const chkRepasoAdicional = document.getElementById('repaso_adicional');
const chkEjerciciosCasa = document.getElementById('ejercicios_casa');
const chkEntregaMaterial = document.getElementById('entrega_material');
const chkRecomendacionBiblio = document.getElementById('recomendacion_biblio');
const chkOtros = document.getElementById('otros_check');
const txtOtrosDescripcion = document.getElementById('otros_descripcion');
const inputFecha = document.getElementById('fecha_informe');
const signaturePadWrapper = document.getElementById('signature_pad_wrapper');
const signatureCanvas = document.getElementById('signature_canvas');
const clearSignatureBtn = document.getElementById('clear_signature_btn');
const existingSignatureWrapper = document.getElementById('existing_signature_wrapper');
const existingSignatureIframe = document.getElementById('existing_signature_iframe');
const saveReportBtn = document.getElementById('saveReportBtn');
const finalResponseDiv = document.getElementById('final-response');
const portfolioModal = document.getElementById('portfolioModal');
const portfolioFormContainer = document.getElementById('portfolio-form-container');
const portfolioModalTitle = document.getElementById('portfolioModalTitle');
const portfolioStatusIndicator = document.getElementById('portfolioStatusIndicator');
const savePortfolioBtn = document.getElementById('savePortfolioBtn');
const p_matriculados = document.getElementById('p_matriculados');
const p_retirados = document.getElementById('p_retirados');
const p_abandono = document.getElementById('p_abandono');
const p_asisten = document.getElementById('p_asisten');
const p_aprobados = document.getElementById('p_aprobados');
const p_desaprobados = document.getElementById('p_desaprobados');
const portfolioValidationMsg = document.getElementById('portfolioValidationMsg');
const finalResponsePortfolioDiv = document.getElementById('final-response-portfolio');
const inputFechaPortfolio = document.getElementById('fecha_entrega_portfolio');
const signaturePadWrapperPortfolio = document.getElementById('signature_pad_wrapper_portfolio');
const signatureCanvasPortfolio = document.getElementById('signature_canvas_portfolio');
const clearSignatureBtnPortfolio = document.getElementById('clear_signature_btn_portfolio');
const existingSignatureWrapperPortfolio = document.getElementById('existing_signature_wrapper_portfolio');
const existingSignatureIframePortfolio = document.getElementById('existing_signature_iframe_portfolio');
const docPortfolioModal = document.getElementById('docPortfolioModal');
const docPortfolioFormContainer = document.getElementById('doc-portfolio-form-container');
const docPortfolioModalTitle = document.getElementById('docPortfolioModalTitle');
const docPortfolioStatusIndicator = document.getElementById('docPortfolioStatusIndicator');
const saveDocPortfolioBtn = document.getElementById('saveDocPortfolioBtn');
const finalResponseDocPortfolioDiv = document.getElementById('final-response-doc-portfolio');
const signaturePadWrapperDoc = document.getElementById('signature_pad_wrapper_doc');
const signatureCanvasDoc = document.getElementById('signature_canvas_doc');
const clearSignatureBtnDoc = document.getElementById('clear_signature_btn_doc');
const existingSignatureWrapperDoc = document.getElementById('existing_signature_wrapper_doc');
const existingSignatureIframeDoc = document.getElementById('existing_signature_iframe_doc');
const passwordModal = document.getElementById('passwordModal');
const passwordInput = document.getElementById('passwordInput');
const validatePasswordBtn = document.getElementById('validatePasswordBtn');
const passwordLoader = document.getElementById('passwordLoader');
const passwordValidationMessage = document.getElementById('passwordValidationMessage');
const passwordModalText = document.getElementById('passwordModalText');

// --- Variables Globales ---
let allTeachers = [];
let currentCourseData = {};
let currentTeacherData = {};
let selectedSemester = '';
let selectedReportType = '';
let existingEntryReports = {};
let existingPortfolioReports = {};
let existingDocPortfolioReports = {};
let currentReportId = null;
let entrySignaturePad;
let portfolioSignaturePad;
let docPortfolioSignaturePad;
let refreshOnClose = false;

// --- Estructura de Portafolio y Campos Obligatorios ---
const docPortfolioStructure = [
    { type: 'category', label: '1. Información General' },
    { type: 'item', key: 'url_cv_personal', label: 'Curriculum Personal', mandatory: true },
    { type: 'item', key: 'url_cv_icacit', label: 'Curriculum ICACIT', mandatory: true },
    { type: 'category', label: '2. Prueba de Entrada' },
    { type: 'item', key: 'url_examen_entrada', label: 'Examen', mandatory: true },
    { type: 'item', key: 'url_notas_entrada', label: 'Notas', mandatory: true },
    { type: 'category', label: '3. Sílabos' },
    { type: 'item', key: 'url_silabo_upt', label: 'Silabo UPT', mandatory: true },
    { type: 'item', key: 'url_silabo_icacit', label: 'Silabo ICACIT', mandatory: true },
    { type: 'category', label: '4. Unidad I' },
    { type: 'subcategory', label: '4.1. Notas Asistencia' },
    { type: 'item', key: 'url_notas_u1', label: 'Notas (U1)', mandatory: true },
    { type: 'item', key: 'url_asistencia_u1', label: 'Asistencia (U1)', mandatory: true },
    { type: 'subcategory', label: '4.2. Recursos Docente' },
    { type: 'item', key: 'url_solucion_examen_u1', label: 'Solución Examen (U1)', mandatory: true },
    { type: 'item', key: 'url_presentaciones_u1', label: 'Presentaciones (Diapositivas) (U1)', mandatory: true },
    { type: 'item', key: 'url_guias_lab_u1', label: 'Guías de Laboratorios (U1)', mandatory: false },
    { type: 'item', key: 'url_otros_recursos_docente_u1', label: 'Otros Recursos (U1)', mandatory: false },
    { type: 'subcategory', label: '4.3. Recursos Estudiante' },
    { type: 'item', key: 'url_examenes_estudiante_u1', label: 'Examenes (U1)', mandatory: true },
    { type: 'item', key: 'url_practicas_calificadas_u1', label: 'Practicas Calificadas (U1)', mandatory: false },
    { type: 'item', key: 'url_proyecto_final_u1', label: 'Proyecto Final (U1)', mandatory: true },
    { type: 'item', key: 'url_otros_recursos_estudiante_u1', label: 'Otros Recursos (U1)', mandatory: false },
    { type: 'category', label: '5. Unidad II' },
    { type: 'subcategory', label: '5.1. Notas Asistencia' },
    { type: 'item', key: 'url_notas_u2', label: 'Notas (U2)', mandatory: true },
    { type: 'item', key: 'url_asistencia_u2', label: 'Asistencia (U2)', mandatory: true },
    { type: 'subcategory', label: '5.2. Recursos Docente' },
    { type: 'item', key: 'url_solucion_examen_u2', label: 'Solución Examen (U2)', mandatory: true },
    { type: 'item', key: 'url_presentaciones_u2', label: 'Presentaciones (Diapositivas) (U2)', mandatory: true },
    { type: 'item', key: 'url_guias_lab_u2', label: 'Guías de Laboratorios (U2)', mandatory: false },
    { type: 'item', key: 'url_otros_recursos_docente_u2', label: 'Otros Recursos (U2)', mandatory: false },
    { type: 'subcategory', label: '5.3. Recursos Estudiante' },
    { type: 'item', key: 'url_examenes_estudiante_u2', label: 'Examenes (U2)', mandatory: true },
    { type: 'item', key: 'url_practicas_calificadas_u2', label: 'Practicas Calificadas (U2)', mandatory: false },
    { type: 'item', key: 'url_proyecto_final_u2', label: 'Proyecto Final (U2)', mandatory: true },
    { type: 'item', key: 'url_otros_recursos_estudiante_u2', label: 'Otros Recursos (U2)', mandatory: false },
    { type: 'category', label: '6. Unidad III' },
    { type: 'subcategory', label: '6.1. Notas Asistencia' },
    { type: 'item', key: 'url_notas_u3', label: 'Notas (U3)', mandatory: true },
    { type: 'item', key: 'url_asistencia_u3', label: 'Asistencia (U3)', mandatory: true },
    { type: 'subcategory', label: '6.2. Recursos Docente' },
    { type: 'item', key: 'url_solucion_examen_u3', label: 'Solución Examen (U3)', mandatory: true },
    { type: 'item', key: 'url_presentaciones_u3', label: 'Presentaciones (Diapositivas) (U3)', mandatory: true },
    { type: 'item', key: 'url_guias_lab_u3', label: 'Guías de Laboratorios (U3)', mandatory: false },
    { type: 'item', key: 'url_otros_recursos_docente_u3', label: 'Otros Recursos (U3)', mandatory: false },
    { type: 'subcategory', label: '6.3. Recursos Estudiante' },
    { type: 'item', key: 'url_examenes_estudiante_u3', label: 'Examenes (U3)', mandatory: true },
    { type: 'item', key: 'url_practicas_calificadas_u3', label: 'Practicas Calificadas (U3)', mandatory: false },
    { type: 'item', key: 'url_otros_recursos_estudiante_u3', label: 'Otros Recursos', mandatory: false },
    { type: 'subcategory', label: '6.4. Proyectos Finales' },
    { type: 'item', key: 'url_proyectos_finales_u3', label: 'Carpeta Principal de Proyectos (U3)', mandatory: true }
];

const materialKeys = [
    'silabo_upt', 'silabo_icacit', 'cv_icacit', 'material_curso', 'guias_lab', 'examenes', 'practicas', 'asistencia', 'notas', 'evaluaciones',
    'est_cuadernos', 'est_examenes', 'est_eval_practicas', 'est_inf_lab', 'est_trabajos', 'est_proyectos'
];

// --- Funciones de Inicialización y Eventos ---

function resizeCanvas(canvas, pad) {
    if (!pad) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d").scale(ratio, ratio);
    pad.clear();
}

window.addEventListener('resize', () => {
    resizeCanvas(signatureCanvas, entrySignaturePad);
    resizeCanvas(signatureCanvasPortfolio, portfolioSignaturePad);
    resizeCanvas(signatureCanvasDoc, docPortfolioSignaturePad);
});

clearSignatureBtn.addEventListener('click', () => {
    if (signaturePadWrapper.style.display !== 'none' && entrySignaturePad) {
        entrySignaturePad.clear();
    } else {
        existingSignatureWrapper.style.display = 'none';
        signaturePadWrapper.style.display = 'block';
        clearSignatureBtn.textContent = 'Limpiar Firma';
        setTimeout(() => {
            entrySignaturePad = new SignaturePad(signatureCanvas, { backgroundColor: 'rgb(255, 255, 255)' });
            resizeCanvas(signatureCanvas, entrySignaturePad);
        }, 50);
    }
    recalculateAndValidate();
});

clearSignatureBtnPortfolio.addEventListener('click', () => {
    if (signaturePadWrapperPortfolio.style.display !== 'none' && portfolioSignaturePad) {
        portfolioSignaturePad.clear();
    } else {
        existingSignatureWrapperPortfolio.style.display = 'none';
        signaturePadWrapperPortfolio.style.display = 'block';
        clearSignatureBtnPortfolio.textContent = 'Limpiar Firma';
        setTimeout(() => {
            portfolioSignaturePad = new SignaturePad(signatureCanvasPortfolio, { backgroundColor: 'rgb(255, 255, 255)' });
            resizeCanvas(signatureCanvasPortfolio, portfolioSignaturePad);
        }, 50);
    }
    updatePortfolioStatusIndicator();
});

clearSignatureBtnDoc.addEventListener('click', () => {
     if (signaturePadWrapperDoc.style.display !== 'none' && docPortfolioSignaturePad) {
        docPortfolioSignaturePad.clear();
     } else {
        existingSignatureWrapperDoc.style.display = 'none';
        signaturePadWrapperDoc.style.display = 'block';
        clearSignatureBtnDoc.textContent = 'Limpiar Firma';
        setTimeout(() => {
            docPortfolioSignaturePad = new SignaturePad(signatureCanvasDoc, { backgroundColor: 'rgb(255, 255, 255)' });
            resizeCanvas(signatureCanvasDoc, docPortfolioSignaturePad);
        }, 50);
     }
});

loadSemesterBtn.addEventListener('click', async () => {
    selectedSemester = semesterSelector.value;
    semesterLoader.style.display = 'block';
    loadSemesterBtn.disabled = true;
    try {
        const response = await fetch(`${WEB_APP_URL}?action=getInitialData&semestre=${selectedSemester}`);
        if (!response.ok) throw new Error(`Error en la red: ${response.statusText}`);
        const result = await response.json();
        if (result.success) {
            allTeachers = result.data.teachers;
            semesterDisplay.textContent = `Semestre de Trabajo: ${selectedSemester}`;
            semesterModal.style.display = 'none';
            appContainer.style.display = 'block';
        } else { throw new Error(result.message); }
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error al Cargar', text: error.message });
        semesterLoader.style.display = 'none';
        loadSemesterBtn.disabled = false;
    }
});

reportTypeSelector.addEventListener('change', () => {
    selectedReportType = reportTypeSelector.value;
    searchSection.style.display = 'block';
    if (teacherInput.value) {
        suggestionsDiv.style.display = 'none';
        performSearch(teacherInput.value);
    } else {
        teacherDetailsDiv.innerHTML = '';
        coursesResultsDiv.innerHTML = '';
    }
});

teacherInput.addEventListener('input', () => {
    teacherDetailsDiv.innerHTML = '';
    coursesResultsDiv.innerHTML = '';
    const inputText = teacherInput.value.toLowerCase();
    if (inputText.length === 0) {
        suggestionsDiv.style.display = 'none';
        return;
    }
    const filteredTeachers = allTeachers.filter(teacher => teacher.toLowerCase().includes(inputText));
    displaySuggestions(filteredTeachers);
});

function displaySuggestions(teachers) {
    suggestionsDiv.innerHTML = '';
    if (teachers.length === 0) {
        suggestionsDiv.style.display = 'none';
        return;
    }
    teachers.forEach(teacher => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = teacher;
        item.addEventListener('click', () => {
            teacherInput.value = teacher;
            suggestionsDiv.style.display = 'none';
            openPasswordModal(teacher);
        });
        suggestionsDiv.appendChild(item);
    });
    suggestionsDiv.style.display = 'block';
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-input-wrapper')) {
        suggestionsDiv.style.display = 'none';
    }
});

searchButton.addEventListener('click', () => {
    if (teacherInput.value) {
        suggestionsDiv.style.display = 'none';
        openPasswordModal(teacherInput.value);
    }
});
teacherInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && teacherInput.value) {
        suggestionsDiv.style.display = 'none';
        openPasswordModal(teacherInput.value);
    }
});

function openPasswordModal(teacherName) {
    passwordModal.style.display = 'flex';
    passwordInput.value = '';
    passwordValidationMessage.textContent = '';
    passwordLoader.style.display = 'none';
    validatePasswordBtn.disabled = false;
    passwordModalText.innerHTML = `Por favor, ingrese la contraseña para <b>${teacherName}</b>.`;
    passwordInput.focus();
}

validatePasswordBtn.addEventListener('click', handlePasswordValidation);
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handlePasswordValidation();
    }
});

async function handlePasswordValidation() {
    const teacherName = teacherInput.value;
    const password = passwordInput.value;
    if (!password) {
        passwordValidationMessage.textContent = 'El campo no puede estar vacío.';
        return;
    }

    passwordLoader.style.display = 'block';
    validatePasswordBtn.disabled = true;
    passwordValidationMessage.textContent = '';

    try {
        const url = `${WEB_APP_URL}?action=validateLogin&teacher=${encodeURIComponent(teacherName)}&password=${encodeURIComponent(password)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Error de red.");
        const result = await response.json();

        if (result.success) {
            passwordModal.style.display = 'none';
            performSearch(teacherName);
        } else {
            throw new Error(result.message || "Error desconocido.");
        }
    } catch (error) {
        passwordLoader.style.display = 'none';
        validatePasswordBtn.disabled = false;
        passwordValidationMessage.textContent = error.message;
    }
}

async function performSearch(teacherName) {
    searchLoader.style.display = 'flex';
    searchLoader.innerHTML = `<div class="spinner"></div><h2>Buscando datos del docente...</h2>`;
    teacherDetailsDiv.innerHTML = '';
    coursesResultsDiv.innerHTML = '';
    try {
        const url = `${WEB_APP_URL}?action=searchByTeacher&teacher=${encodeURIComponent(teacherName)}&semestre=${selectedSemester}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error en la red: ${response.statusText}`);
        const result = await response.json();
        searchLoader.style.display = 'none';
        if (result.success) {
            currentTeacherData = result.data.details;
            existingEntryReports = result.data.existingEntryReports;
            existingPortfolioReports = result.data.existingPortfolioReports;
            existingDocPortfolioReports = result.data.existingDocPortfolioReports;
            displayTeacherDetails(result.data.details);
            displayCourses(result.data.courses, teacherName);
        } else { throw new Error(result.message); }
    } catch (error) {
        searchLoader.style.display = 'none';
        coursesResultsDiv.innerHTML = `<p class="message" style="color:var(--danger-color);font-weight:bold;">${error.message}</p>`;
    }
}

function displayTeacherDetails(details) {
    teacherDetailsDiv.innerHTML = details ? `<h2>${details.NombreCompleto || ''}</h2><p><strong>Grado:</strong> ${details.GradoAcademico || 'N/A'}<span>  •  </span><strong>Correo:</strong> ${details.CorreoElectronico || 'N/A'}</p>` : `<p class="message">No se encontraron detalles para este docente.</p>`;
}

function isEntryTestTrulyComplete(reportInfo) {
    if (!reportInfo || !reportInfo.skills || reportInfo.skills.length === 0 || !reportInfo.evaluados || reportInfo.evaluados <= 0) return false;
    if (!reportInfo.signatureImageUrl) return false;
    const totalEvaluados = parseInt(reportInfo.evaluados);
    for (const skill of reportInfo.skills) {
        if (!skill.name) return false;
        const sumaFila = (parseInt(skill.deficiente_cantidad) || 0) + (parseInt(skill.suficiente_cantidad) || 0) + (parseInt(skill.bueno_cantidad) || 0);
        if (sumaFila !== totalEvaluados) return false;
    }
    return true;
}

function isPortfolioTrulyComplete(reportInfo) {
    if (!reportInfo) return false;
    const matriculados = parseInt(reportInfo.matriculados) || 0;
    const retirados = parseInt(reportInfo.retirados) || 0;
    const abandono = parseInt(reportInfo.abandono) || 0;
    const aprobados = reportInfo.aprobados;
    const asisten = matriculados - retirados - abandono;
    const desaprobados = asisten - (parseInt(aprobados) || 0);
    if (matriculados <= 0 || asisten < 0 || desaprobados < 0 || aprobados === undefined || aprobados === null || aprobados === '') return false;
    const docenteObligatorios = ['silabo_upt', 'silabo_icacit', 'cv_icacit', 'material_curso', 'guias_lab', 'examenes', 'asistencia', 'notas'];
    for (const key of docenteObligatorios) {
        const hasCheck = reportInfo[`dig_${key}`] || reportInfo[`imp_${key}`];
        const hasCant = (parseInt(reportInfo[`cant_${key}`]) || 0) > 0;
        if (!hasCheck || !hasCant) return false;
    }
    const estudianteObligatorios = ['est_examenes', 'est_proyectos'];
    for (const key of estudianteObligatorios) {
        const hasCheck = reportInfo[`dig_${key}`] || reportInfo[`imp_${key}`];
        const hasCant = (parseInt(reportInfo[`cant_${key}`]) || 0) > 0;
        if (!hasCheck || !hasCant) return false;
    }
    if (!reportInfo.signatureImageUrl) return false;
    return true;
}

function isDocPortfolioComplete(reportInfo) {
    return reportInfo && reportInfo.Estado_Informe === 'Completado';
}

function displayCourses(courses, teacherName) {
    coursesResultsDiv.innerHTML = '';
    if (!courses || courses.length === 0) {
        coursesResultsDiv.innerHTML = `<p class="message">No se encontraron cursos para ${teacherName} en ${selectedSemester}.</p>`;
        return;
    }
    courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.dataset.course = JSON.stringify(course);
        let buttonsHtml = '';
        if (selectedReportType === 'entryTest') {
            const reportId = `${selectedSemester}-${course.codigo}-${course.seccion}`;
            const entryReportInfo = existingEntryReports[reportId];
            if (entryReportInfo) {
                const isComplete = isEntryTestTrulyComplete(entryReportInfo);
                const buttonClass = isComplete ? 'btn-state-completed' : 'btn-state-pending';
                const buttonText = isComplete ? 'Informe Completado' : 'Informe Pendiente';
                buttonsHtml += `<button class="btn ${buttonClass}" data-report-type="entryTest">${buttonText}</button>`;
                if (entryReportInfo.url) buttonsHtml += `<a href="${entryReportInfo.url}" target="_blank" class="btn">Ver Formato</a>`;
            } else {
                buttonsHtml += `<button class="btn btn-state-new" data-report-type="entryTest">Hacer Informe</button>`;
            }
        } else if (selectedReportType.startsWith('portfolio_')) {
            const unit = selectedReportType.split('_')[1];
            const reportId = `${selectedSemester}-${course.codigo}-${course.seccion}-${unit}`;
            const portfolioReportInfo = existingPortfolioReports[reportId];
            if (portfolioReportInfo) {
                const isComplete = isPortfolioTrulyComplete(portfolioReportInfo);
                const buttonClass = isComplete ? 'btn-state-completed' : 'btn-state-pending';
                const buttonText = isComplete ? 'Portafolio Completado' : 'Portafolio Pendiente';
                buttonsHtml += `<button class="btn ${buttonClass}" data-report-type="${selectedReportType}">${buttonText}</button>`;
                if (portfolioReportInfo.url) buttonsHtml += `<a href="${portfolioReportInfo.url}" target="_blank" class="btn">Ver Archivo</a>`;
            } else {
                buttonsHtml += `<button class="btn btn-state-new" data-report-type="${selectedReportType}">Hacer Portafolio (U${unit})</button>`;
            }
        } else if (selectedReportType === 'docPortfolio') {
            const reportId = `${selectedSemester}-${course.codigo}-${course.seccion}`;
            const docPortfolioReportInfo = existingDocPortfolioReports[reportId];
            if (docPortfolioReportInfo) {
                const isComplete = isDocPortfolioComplete(docPortfolioReportInfo);
                const buttonClass = isComplete ? 'btn-state-completed' : 'btn-state-pending';
                const buttonText = isComplete ? 'Documentación Completa' : 'Gestionar Documentación';
                buttonsHtml += `<button class="btn ${buttonClass}" data-report-type="docPortfolio">${buttonText}</button>`;
            } else {
                buttonsHtml += `<button class="btn btn-state-new" data-report-type="docPortfolio">Iniciar Documentación</button>`;
            }
        }

        card.innerHTML = `<h3>${course.codigo} - ${course.nombre}</h3><p style="color: var(--text-secondary); margin-top: -8px; margin-bottom: 16px;"><strong>Sección:</strong> ${course.seccion}</p><div class="details-grid"><div class="detail-item"><strong>Ciclo:</strong> ${course.ciclo}</div><div class="detail-item"><strong>Horas:</strong> ${course.horas}</div><div class="detail-item"><strong>Créditos:</strong> ${course.creditos}</div><div class="detail-item"><strong>Tipo:</strong> ${course.tipo}</div><div class="detail-item" style="grid-column: span 2;"><strong>Área:</strong> ${course.area}</div></div><div style="flex-grow: 1;"></div><div class="card-buttons">${buttonsHtml}</div>`;
        coursesResultsDiv.appendChild(card);
    });
}

coursesResultsDiv.addEventListener('click', e => {
    const button = e.target.closest('button[data-report-type]');
    if (!button) return;
    const card = button.closest('.course-card');
    currentCourseData = JSON.parse(card.dataset.course);
    const reportType = button.dataset.reportType;
    if (reportType === 'entryTest') {
        const reportId = `${selectedSemester}-${currentCourseData.codigo}-${currentCourseData.seccion}`;
        openReportModal(existingEntryReports[reportId] || null);
    } else if (reportType.startsWith('portfolio_')) {
        const unit = reportType.split('_')[1];
        const reportId = `${selectedSemester}-${currentCourseData.codigo}-${currentCourseData.seccion}-${unit}`;
        openPortfolioModal(existingPortfolioReports[reportId] || null, unit);
    } else if (reportType === 'docPortfolio') {
        openDocPortfolioModal();
    }
});

// --- Lógica de Modales ---

function openReportModal(reportInfo) {
    const isEditing = !!reportInfo;
    currentReportId = isEditing ? `${selectedSemester}-${currentCourseData.codigo}-${currentCourseData.seccion}` : null;
    modalTitle.innerHTML = `Informe de Prueba de Entrada <small>${currentCourseData.codigo} - ${currentCourseData.nombre} (Sección ${currentCourseData.seccion})<br><b>Docente:</b> ${currentTeacherData.NombreCompleto}</small>`;
    reportModal.style.display = 'flex';
    setTimeout(() => {
        entrySignaturePad = new SignaturePad(signatureCanvas, { backgroundColor: 'rgb(255, 255, 255)' });
        resizeCanvas(signatureCanvas, entrySignaturePad);
        entrySignaturePad.addEventListener("endStroke", () => recalculateAndValidate());
    }, 100);
    skillsContainer.innerHTML = '';
    finalResponseDiv.innerHTML = '';
    saveReportBtn.style.display = 'block';
    addSkillBtn.style.display = 'inline-flex';
    saveReportBtn.innerHTML = isEditing ? 'Actualizar Informe' : 'Guardar Informe';
    saveReportBtn.disabled = false;
    matriculadosInput.value = isEditing ? reportInfo.matriculados : '';
    evaluadosInput.value = isEditing ? reportInfo.evaluados : '';
    if (isEditing && reportInfo.skills && reportInfo.skills.length > 0 && reportInfo.skills[0].name) {
        reportInfo.skills.forEach(skill => addSkillRow(skill));
    } else {
        addSkillRow();
    }
    const corrective = isEditing ? reportInfo.correctiveMeasures : {};
    chkRepasoClase.checked = corrective.repaso_clase || false;
    chkRepasoAdicional.checked = corrective.repaso_adicional || false;
    chkEjerciciosCasa.checked = corrective.ejercicios_casa || false;
    chkEntregaMaterial.checked = corrective.entrega_material || false;
    chkRecomendacionBiblio.checked = corrective.recomendacion_biblio || false;
    chkOtros.checked = corrective.otros_check || false;
    txtOtrosDescripcion.value = corrective.otros_descripcion || '';
    inputFecha.value = corrective.fecha || new Date().toISOString().split('T')[0];
    if (isEditing && reportInfo.signatureImageUrl) {
        const previewUrl = reportInfo.signatureImageUrl.replace("/uc?id=", "/file/d/") + "/preview";
        existingSignatureIframe.src = previewUrl;
        existingSignatureWrapper.style.display = 'block';
        signaturePadWrapper.style.display = 'none';
        clearSignatureBtn.textContent = 'Firmar de Nuevo';
    } else {
        existingSignatureWrapper.style.display = 'none';
        signaturePadWrapper.style.display = 'block';
        clearSignatureBtn.textContent = 'Limpiar Firma';
    }
    recalculateAndValidate();
}

function openPortfolioModal(reportInfo, unit) {
    const isEditing = !!reportInfo;
    currentReportId = isEditing ? `${selectedSemester}-${currentCourseData.codigo}-${currentCourseData.seccion}-${unit}` : null;
    portfolioModalTitle.innerHTML = `Portafolio (Unidad ${unit}) <small>${currentCourseData.nombre} (${currentCourseData.seccion})<br><b>Docente:</b> ${currentTeacherData.NombreCompleto}</small>`;
    portfolioModal.style.display = 'flex';
    setTimeout(() => {
        portfolioSignaturePad = new SignaturePad(signatureCanvasPortfolio, { backgroundColor: 'rgb(255, 255, 255)' });
        resizeCanvas(signatureCanvasPortfolio, portfolioSignaturePad);
        portfolioSignaturePad.addEventListener("endStroke", () => updatePortfolioStatusIndicator());
    }, 100);
    p_matriculados.value = isEditing ? reportInfo.matriculados : '';
    p_retirados.value = isEditing ? reportInfo.retirados : '';
    p_abandono.value = isEditing ? reportInfo.abandono : '';
    p_aprobados.value = (isEditing && reportInfo.aprobados !== undefined) ? reportInfo.aprobados : '';
    inputFechaPortfolio.value = isEditing ? (reportInfo.fecha_entrega ? new Date(reportInfo.fecha_entrega).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0];
    materialKeys.forEach(key => {
        const digEl = document.getElementById(`dig_${key}`);
        const impEl = document.getElementById(`imp_${key}`);
        const cantEl = document.getElementById(`cant_${key}`);
        if (digEl) digEl.checked = isEditing && reportInfo[`dig_${key}`];
        if (impEl) impEl.checked = isEditing && reportInfo[`imp_${key}`];
        if (cantEl) cantEl.value = isEditing ? reportInfo[`cant_${key}`] || '' : '';
    });
    if (isEditing && reportInfo.signatureImageUrl) {
        const previewUrl = reportInfo.signatureImageUrl.replace("/uc?id=", "/file/d/") + "/preview";
        existingSignatureIframePortfolio.src = previewUrl;
        existingSignatureWrapperPortfolio.style.display = 'block';
        signaturePadWrapperPortfolio.style.display = 'none';
        clearSignatureBtnPortfolio.textContent = 'Firmar de Nuevo';
    } else {
        existingSignatureWrapperPortfolio.style.display = 'none';
        signaturePadWrapperPortfolio.style.display = 'block';
        clearSignatureBtnPortfolio.textContent = 'Limpiar Firma';
    }
    finalResponsePortfolioDiv.innerHTML = '';
    savePortfolioBtn.style.display = 'block';
    savePortfolioBtn.innerHTML = isEditing ? 'Actualizar Datos' : 'Guardar Datos';
    savePortfolioBtn.disabled = false;
    calculatePortfolio();
    updatePortfolioStatusIndicator();
}

async function openDocPortfolioModal() {
    currentReportId = `${selectedSemester}-${currentCourseData.codigo}-${currentCourseData.seccion}`;
    
    docPortfolioModalTitle.innerHTML = `Documentación del Portafolio <small>${currentCourseData.nombre} (${currentCourseData.seccion})<br><b>Docente:</b> ${currentTeacherData.NombreCompleto}</small>`;
    docPortfolioModal.style.display = 'flex';
    docPortfolioFormContainer.innerHTML = `<div style="display:flex; flex-direction:column; align-items:center; gap:15px; padding: 40px 0;"><div class="spinner"></div><p>Preparando entorno de trabajo...</p></div>`;
    finalResponseDocPortfolioDiv.innerHTML = '';
    saveDocPortfolioBtn.style.display = 'block';
    saveDocPortfolioBtn.disabled = true;
    saveDocPortfolioBtn.innerHTML = 'Guardar Firma y Finalizar';

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'createOrGetDocPortfolio',
                data: { semestre: selectedSemester, course: currentCourseData, docente: currentTeacherData }
            })
        });

        if (!response.ok) throw new Error("Error de red al obtener los datos.");
        const result = await response.json();
        if (!result.success) throw new Error(result.message || "Error desconocido del servidor.");

        const reportData = result.reportData;
        existingDocPortfolioReports[currentReportId] = reportData;
        
        buildDocPortfolioForm(reportData);

        if (reportData.signatureImageUrl) {
            const previewUrl = reportData.signatureImageUrl.replace("/uc?id=", "/file/d/") + "/preview";
            existingSignatureIframeDoc.src = previewUrl;
            existingSignatureWrapperDoc.style.display = 'block';
            signaturePadWrapperDoc.style.display = 'none';
            clearSignatureBtnDoc.textContent = 'Firmar de Nuevo';
        } else {
            existingSignatureWrapperDoc.style.display = 'none';
            signaturePadWrapperDoc.style.display = 'block';
            clearSignatureBtnDoc.textContent = 'Limpiar Firma';
            setTimeout(() => {
                docPortfolioSignaturePad = new SignaturePad(signatureCanvasDoc, { backgroundColor: 'rgb(255, 255, 255)' });
                resizeCanvas(signatureCanvasDoc, docPortfolioSignaturePad);
            }, 50);
        }
        
        updateStatusIndicator(docPortfolioStatusIndicator, isDocPortfolioComplete(reportData));
        saveDocPortfolioBtn.disabled = false;

    } catch (error) {
        docPortfolioFormContainer.innerHTML = `<p class="message" style="color:var(--danger-color);font-weight:bold;">Error al cargar: ${error.message}</p>`;
        saveDocPortfolioBtn.style.display = 'none';
    }
}

function buildDocPortfolioForm(reportData) {
    docPortfolioFormContainer.innerHTML = '';

    const createItemHTML = (item) => {
        const folderUrl = reportData[item.key] || '#';
        const statusData = reportData.folderStatuses[item.key] || { count: 0, names: [] };
        
        const statusIcon = statusData.count > 0 ? '✅' : '❌';
        const statusText = statusData.count === 1 ? '1 elemento' : `${statusData.count} elementos`;
        let statusColor = statusData.count > 0 ? 'var(--success-color)' : 'var(--danger-color)';
        if (statusData.count === 0 && !item.mandatory) {
            statusColor = 'var(--text-secondary)';
        }
        
        const tooltipHTML = statusData.count > 0 ? `<div class="tooltiptext">${statusData.names.join('<br>')}</div>` : '';
        const mandatoryHTML = item.mandatory ? `<span class="mandatory-star">*</span>` : '';

        return `
            <div class="doc-item">
                <label>${item.label} ${mandatoryHTML}</label>
                <div class="doc-item-controls">
                    <div class="tooltip">
                        <span class="folder-status" style="color:${statusColor};">${statusIcon} ${statusText}</span>
                        ${tooltipHTML}
                    </div>
                    <a href="${folderUrl}" target="_blank" class="btn">Abrir Carpeta</a>
                </div>
            </div>`;
    };

    docPortfolioStructure.forEach(el => {
        if (el.type === 'category') {
            docPortfolioFormContainer.innerHTML += `<div class="doc-category">${el.label}</div>`;
        } else if (el.type === 'subcategory') {
            docPortfolioFormContainer.innerHTML += `<div class="doc-subcategory">${el.label}</div>`;
        } else if (el.type === 'item') {
            docPortfolioFormContainer.innerHTML += createItemHTML(el);
        }
    });

    docPortfolioFormContainer.innerHTML += `<p class="mandatory-legend" style="margin-top:20px;"><span class="mandatory-star">*</span> Los campos marcados son obligatorios para completar el informe.</p>`;

    const refreshButton = document.createElement('div');
    refreshButton.style.textAlign = 'center';
    refreshButton.innerHTML = `<button id="refresh-doc-status" class="btn" style="margin-top: 10px;">Refrescar Estado de Carpetas</button>`;
    docPortfolioFormContainer.appendChild(refreshButton);

    document.getElementById('refresh-doc-status').onclick = () => {
        const btn = document.getElementById('refresh-doc-status');
        btn.disabled = true;
        btn.innerHTML = `<div class="spinner" style="width:18px; height:18px; border-width:2px;"></div> Refrescando...`;
        openDocPortfolioModal();
    };
}

document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay');
        modal.style.display = 'none';
        if (refreshOnClose && teacherInput.value) {
            performSearch(teacherInput.value);
        }
        refreshOnClose = false;
    });
});

addSkillBtn.addEventListener('click', () => { if (skillsContainer.children.length < 5) addSkillRow(); });
skillsContainer.addEventListener('click', e => { if (e.target.classList.contains('btn-remove-skill')) { if (skillsContainer.children.length > 1) e.target.parentElement.remove(); recalculateAndValidate(); } });

function addSkillRow(skill = null) {
    const skillRow = document.createElement('div');
    skillRow.className = 'skill-row';
    skillRow.innerHTML = `<input type="text" placeholder="Escribe aquí..." value="${skill && skill.name ? skill.name : ''}"><input type="number" class="level-input" min="0" data-level="deficiente" value="${skill && skill.deficiente_cantidad ? skill.deficiente_cantidad : ''}"><span class="percent" data-level="deficiente-p">0.0</span><input type="number" class="level-input" min="0" data-level="suficiente" value="${skill && skill.suficiente_cantidad ? skill.suficiente_cantidad : ''}"><span class="percent" data-level="suficiente-p">0.0</span><input type="number" class="level-input" min="0" data-level="bueno" value="${skill && skill.bueno_cantidad ? skill.bueno_cantidad : ''}"><span class="percent" data-level="bueno-p">0.0</span><span class="percent" data-level="total-p">0.0%</span><button class="btn btn-remove-skill">×</button>`;
    skillsContainer.appendChild(skillRow);
}

reportModal.addEventListener('input', recalculateAndValidate);

function updateStatusIndicator(indicatorEl, isComplete) {
    indicatorEl.textContent = isComplete ? 'Estado: Completado' : 'Estado: Pendiente';
    indicatorEl.className = 'status-indicator';
    indicatorEl.classList.remove('pct-bg-green', 'pct-bg-yellow');
    indicatorEl.classList.add(isComplete ? 'pct-bg-green' : 'pct-bg-yellow');
}

function recalculateAndValidate() {
    let isOverallValid = true;
    let isReportComplete = true;
    const matriculados = parseInt(matriculadosInput.value) || 0;
    const evaluados = parseInt(evaluadosInput.value) || 0;
    if ((skillsContainer.children.length === 0 && evaluados > 0) || (existingSignatureWrapper.style.display === 'none' && (!entrySignaturePad || entrySignaturePad.isEmpty()))) { isReportComplete = false; }
    validationMsg.textContent = '';
    if (evaluados > matriculados && matriculados > 0) { isOverallValid = false; evaluadosInput.classList.add('input-error'); validationMsg.textContent = 'Error: Evaluados no puede superar a Matriculados.'; } else { evaluadosInput.classList.remove('input-error'); }
    document.querySelectorAll('.skill-row').forEach(row => {
        const inputs = row.querySelectorAll('.level-input'); let sumaFila = 0; inputs.forEach(input => sumaFila += parseInt(input.value) || 0);
        const rowIsValid = (evaluados === 0) || (sumaFila <= evaluados);
        if (!rowIsValid) isOverallValid = false;
        inputs.forEach(input => input.classList.toggle('input-error', !rowIsValid));
        if (sumaFila !== evaluados || evaluados === 0 || row.querySelector('input[type="text"]').value.trim() === '') { isReportComplete = false; }
        const def = parseInt(row.querySelector('[data-level="deficiente"]').value) || 0, suf = parseInt(row.querySelector('[data-level="suficiente"]').value) || 0, bue = parseInt(row.querySelector('[data-level="bueno"]').value) || 0;
        const pDef = evaluados > 0 ? (def / evaluados) * 100 : 0, pSuf = evaluados > 0 ? (suf / evaluados) * 100 : 0, pBue = evaluados > 0 ? (bue / evaluados) * 100 : 0;
        const pTotal = pDef + pSuf + pBue;
        row.querySelector('[data-level="deficiente-p"]').textContent = pDef.toFixed(1);
        row.querySelector('[data-level="suficiente-p"]').textContent = pSuf.toFixed(1);
        row.querySelector('[data-level="bueno-p"]').textContent = pBue.toFixed(1);
        row.querySelector('[data-level="total-p"]').textContent = pTotal.toFixed(1) + '%';
        const totalPercentSpan = row.querySelector('[data-level="total-p"]');
        totalPercentSpan.classList.remove('pct-bg-green', 'pct-bg-yellow', 'pct-bg-red');
        if (pTotal > 100.1) totalPercentSpan.classList.add('pct-bg-red');
        else if (pTotal > 99.9 && pTotal < 100.1) totalPercentSpan.classList.add('pct-bg-green');
        else if (pTotal >= 60) totalPercentSpan.classList.add('pct-bg-yellow');
    });
    updateStatusIndicator(entryTestStatusIndicator, isReportComplete);
    if (validationMsg.textContent === '') { validationMsg.textContent = isOverallValid ? '' : 'Error: La suma por fila no puede superar el total de evaluados.'; }
    const hasSkillName = skillsContainer.querySelector('input[type="text"]')?.value.trim() !== '';
    saveReportBtn.disabled = !isOverallValid || evaluados === 0 || matriculados === 0 || !hasSkillName;
}

portfolioModal.addEventListener('input', () => { calculatePortfolio(); updatePortfolioStatusIndicator(); });

function updatePortfolioStatusIndicator() {
    const isComplete = isPortfolioCompleteFromForm();
    updateStatusIndicator(portfolioStatusIndicator, isComplete);
}

function isPortfolioCompleteFromForm() {
    const matriculados = parseInt(p_matriculados.value) || 0;
    const retirados = parseInt(p_retirados.value) || 0;
    const abandono = parseInt(p_abandono.value) || 0;
    const aprobados = document.getElementById('p_aprobados').value;
    const asisten = matriculados - retirados - abandono;
    const desaprobados = asisten - (parseInt(aprobados) || 0);
    if (matriculados <= 0 || asisten < 0 || desaprobados < 0 || aprobados === '') return false;
    const docenteObligatorios = ['silabo_upt', 'silabo_icacit', 'cv_icacit', 'material_curso', 'guias_lab', 'examenes', 'asistencia', 'notas'];
    for (const key of docenteObligatorios) {
        const hasCheck = document.getElementById(`dig_${key}`).checked || document.getElementById(`imp_${key}`).checked;
        const hasCant = (parseInt(document.getElementById(`cant_${key}`).value) || 0) > 0;
        if (!hasCheck || !hasCant) return false;
    }
    const estudianteObligatorios = ['est_examenes', 'est_proyectos'];
    for (const key of estudianteObligatorios) {
        const hasCheck = document.getElementById(`dig_${key}`).checked || document.getElementById(`imp_${key}`).checked;
        const hasCant = (parseInt(document.getElementById(`cant_${key}`).value) || 0) > 0;
        if (!hasCheck || !hasCant) return false;
    }
    if (existingSignatureWrapperPortfolio.style.display === 'none' && (!portfolioSignaturePad || portfolioSignaturePad.isEmpty())) { return false; }
    return true;
}

function calculatePortfolio() {
    let isValid = true;
    let validationMessage = '';
    const matriculados = parseInt(p_matriculados.value) || 0;
    const retirados = parseInt(p_retirados.value) || 0;
    const abandono = parseInt(p_abandono.value) || 0;
    const aprobados = parseInt(p_aprobados.value) || 0;
    const asisten = matriculados - retirados - abandono;
    p_asisten.value = asisten >= 0 ? asisten : 0;
    const desaprobados = asisten - aprobados;
    p_desaprobados.value = desaprobados >= 0 ? desaprobados : 0;
    if (matriculados <= 0 && p_matriculados.value !== '') { validationMessage = 'Debe ingresar un número válido de matriculados.'; isValid = false; }
    else if (asisten < 0) { validationMessage = 'Error: Retirados y abandonos superan a los matriculados.'; isValid = false; }
    else if (desaprobados < 0) { validationMessage = 'Error: Aprobados superan a los que asisten.'; isValid = false; }
    portfolioValidationMsg.textContent = validationMessage;
    savePortfolioBtn.disabled = !isValid || (p_matriculados.value === '');
    const formatPctText = (val, total) => total > 0 ? ((val / total) * 100).toFixed(1) + '%' : '0.0%';
    document.getElementById('p_matriculados_span').textContent = formatPctText(matriculados, matriculados);
    document.getElementById('p_retirados_span').textContent = formatPctText(retirados, matriculados);
    document.getElementById('p_abandono_span').textContent = formatPctText(abandono, matriculados);
    document.getElementById('p_asisten_span').textContent = formatPctText(asisten, matriculados);
    document.getElementById('p_aprobados_span').textContent = formatPctText(aprobados, matriculados);
    document.getElementById('p_desaprobados_span').textContent = formatPctText(desaprobados, matriculados);
    const asisten_pct_val = matriculados > 0 ? (asisten / matriculados) * 100 : 0;
    const asistenBarContainer = p_asisten.nextElementSibling;
    asistenBarContainer.classList.remove('pct-bg-green', 'pct-bg-yellow', 'pct-bg-red');
    if (asisten_pct_val >= 90) asistenBarContainer.classList.add('pct-bg-green');
    else if (asisten_pct_val >= 60) asistenBarContainer.classList.add('pct-bg-yellow');
    else asistenBarContainer.classList.add('pct-bg-red');
}

saveReportBtn.addEventListener('click', async () => {
    saveReportBtn.disabled = true; saveReportBtn.innerHTML = `<div class="spinner" style="width:20px; height:20px; border-width:3px; margin:auto;"></div>`; finalResponseDiv.innerHTML = '';
    const reportData = { uniqueId: currentReportId, semestre: selectedSemester, matriculados: matriculadosInput.value, evaluados: evaluadosInput.value, course: currentCourseData, docente: currentTeacherData, skills: Array.from(skillsContainer.querySelectorAll('.skill-row')).map(row => { const totalEvaluados = parseInt(evaluadosInput.value) || 0; const def = parseInt(row.querySelector('[data-level="deficiente"]').value) || 0, suf = parseInt(row.querySelector('[data-level="suficiente"]').value) || 0, bue = parseInt(row.querySelector('[data-level="bueno"]').value) || 0; return { name: row.querySelector('input[type="text"]').value, deficiente_cantidad: def, deficiente_porcentaje: totalEvaluados > 0 ? (def / totalEvaluados) : 0, suficiente_cantidad: suf, suficiente_porcentaje: totalEvaluados > 0 ? (suf / totalEvaluados) : 0, bueno_cantidad: bue, bueno_porcentaje: totalEvaluados > 0 ? (bue / totalEvaluados) : 0, total_porcentaje: totalEvaluados > 0 ? ((def + suf + bue) / totalEvaluados) : 0 }; }).filter(skill => skill.name.trim() !== ''), correctiveMeasures: { repaso_clase: chkRepasoClase.checked, repaso_adicional: chkRepasoAdicional.checked, ejercicios_casa: chkEjerciciosCasa.checked, entrega_material: chkEntregaMaterial.checked, recomendacion_biblio: chkRecomendacionBiblio.checked, otros_check: chkOtros.checked, otros_descripcion: txtOtrosDescripcion.value, fecha: inputFecha.value }, signatureBase64: (signaturePadWrapper.style.display !== 'none' && entrySignaturePad && !entrySignaturePad.isEmpty()) ? entrySignaturePad.toDataURL('image/png') : null, existingSignatureUrl: (currentReportId && existingEntryReports[currentReportId]) ? existingEntryReports[currentReportId].signatureImageUrl : null };
    const statusText = document.getElementById('entryTestStatusIndicator').textContent || '';
    reportData.status = statusText.replace('Estado: ', '');
    try {
        const response = await fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'saveReport', reportType: 'entryTest', data: reportData }) });
        const result = await response.json();
        if (result.success) {
            refreshOnClose = true; saveReportBtn.style.display = 'none'; addSkillBtn.style.display = 'none';
            finalResponseDiv.innerHTML = `✅ ¡Informe Guardado! <a href="${result.url}" target="_blank">Abrir Archivo</a>`;
        } else { throw new Error(result.message || 'Error desconocido.'); }
    } catch (error) {
        finalResponseDiv.innerHTML = `<span style="color:var(--danger-color)">Error: ${error.message}</span>`;
        saveReportBtn.innerHTML = 'Guardar Informe'; saveReportBtn.disabled = false;
    }
});

savePortfolioBtn.addEventListener('click', async () => {
    savePortfolioBtn.disabled = true;
    savePortfolioBtn.innerHTML = `<div class="spinner" style="width:20px; height:20px; border-width:3px; margin:auto;"></div>`;
    finalResponsePortfolioDiv.innerHTML = 'Enviando datos...';
    const reportInfo = existingPortfolioReports[currentReportId];
    const portfolioData = { uniqueId: currentReportId, semestre: selectedSemester, course: currentCourseData, docente: currentTeacherData, matriculados: p_matriculados.value, retirados: p_retirados.value, abandono: p_abandono.value, asisten: p_asisten.value, aprobados: p_aprobados.value, desaprobados: p_desaprobados.value, matriculados_pct: (parseFloat(document.getElementById('p_matriculados_span').textContent) || 0) / 100, retirados_pct: (parseFloat(document.getElementById('p_retirados_span').textContent) || 0) / 100, abandono_pct: (parseFloat(document.getElementById('p_abandono_span').textContent) || 0) / 100, asisten_pct: (parseFloat(document.getElementById('p_asisten_span').textContent) || 0) / 100, aprobados_pct: (parseFloat(document.getElementById('p_aprobados_span').textContent) || 0) / 100, desaprobados_pct: (parseFloat(document.getElementById('p_desaprobados_span').textContent) || 0) / 100, fecha_entrega: inputFechaPortfolio.value, signatureBase64: (signaturePadWrapperPortfolio.style.display !== 'none' && portfolioSignaturePad && !portfolioSignaturePad.isEmpty()) ? portfolioSignaturePad.toDataURL('image/png') : null, existingSignatureUrl: (reportInfo) ? reportInfo.signatureImageUrl : null };
    materialKeys.forEach(key => {
        portfolioData[`dig_${key}`] = document.getElementById(`dig_${key}`).checked;
        portfolioData[`imp_${key}`] = document.getElementById(`imp_${key}`).checked;
        portfolioData[`cant_${key}`] = document.getElementById(`cant_${key}`).value;
    });
    const statusText = document.getElementById('portfolioStatusIndicator').textContent || '';
    portfolioData.status = statusText.replace('Estado: ', '');
    try {
        const response = await fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'saveReport', reportType: selectedReportType, data: portfolioData }) });
        const result = await response.json();
        if (result.success) {
            refreshOnClose = true; savePortfolioBtn.style.display = 'none';
            finalResponsePortfolioDiv.innerHTML = `✅ ¡Datos Guardados! <a href="${result.url}" target="_blank">Abrir Archivo</a>`;
        } else { throw new Error(result.message || 'Error desconocido.'); }
    } catch (error) {
        finalResponsePortfolioDiv.innerHTML = `<span style="color:var(--danger-color)">Error: ${error.message}</span>`;
        savePortfolioBtn.innerHTML = 'Guardar Datos'; savePortfolioBtn.disabled = false;
    }
});

saveDocPortfolioBtn.addEventListener('click', async () => {
    finalResponseDocPortfolioDiv.innerHTML = '';
    const hasSignature = existingSignatureWrapperDoc.style.display !== 'none' || (docPortfolioSignaturePad && !docPortfolioSignaturePad.isEmpty());
    if (!hasSignature) {
        finalResponseDocPortfolioDiv.innerHTML = `<span style="color:var(--danger-color)">La firma es obligatoria para finalizar.</span>`;
        return;
    }
    
    saveDocPortfolioBtn.disabled = true;
    saveDocPortfolioBtn.innerHTML = `<div class="spinner" style="width:20px; height:20px; border-width:3px; margin:auto;"></div>`;
    finalResponseDocPortfolioDiv.innerHTML = 'Guardando firma y finalizando...';

    const reportInfo = existingDocPortfolioReports[currentReportId];

    const docPortfolioData = {
        uniqueId: currentReportId,
        course: currentCourseData,
        docente: currentTeacherData,
        signatureBase64: (signaturePadWrapperDoc.style.display !== 'none' && docPortfolioSignaturePad && !docPortfolioSignaturePad.isEmpty()) ? docPortfolioSignaturePad.toDataURL('image/png') : null,
        existingSignatureUrl: (reportInfo) ? reportInfo.signatureImageUrl : null
    };

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'verifyAndFinalize', data: docPortfolioData })
        });
        const result = await response.json();
        if (result.success) {
            refreshOnClose = true;
            saveDocPortfolioBtn.style.display = 'none';
            finalResponseDocPortfolioDiv.innerHTML = `✅ ¡Proceso finalizado! Estado: <strong>${result.status}</strong>`;
            updateStatusIndicator(docPortfolioStatusIndicator, result.status === 'Completado');
        } else {
            throw new Error(result.message || 'Error desconocido.');
        }
    } catch (error) {
        finalResponseDocPortfolioDiv.innerHTML = `<span style="color:var(--danger-color)">Error: ${error.message}</span>`;
        saveDocPortfolioBtn.innerHTML = 'Guardar Firma y Finalizar';
        saveDocPortfolioBtn.disabled = false;
    }
});