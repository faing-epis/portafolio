// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- CONFIGURACIÓN GLOBAL ---
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
const SPREADSHEET = SpreadsheetApp.getActiveSpreadsheet();
const HOJA_DOCENTE_NOMBRE = "docente";
const HOJA_INFORME_NOMBRE = "informe_prueba_entrada";
const HOJA_PORTAFOLIO_NOMBRE = "informe_portafolio_unidad";
const HOJA_DOC_PORTFOLIO_NOMBRE = "informe_documentacion_portafolio";
const HOJA_INFORME_FINAL_NOMBRE = "informe_final_curso"; // <-- AÑADIDO

// --- IDs de Google Drive (Producción) ---
const TEMPLATE_ID = "1jKJxcuslUGhtJRIeV4p-tMY2iAhFiGE5mbkA5IObpYs";
const DESTINATION_FOLDER_ID = "1sjyPIBVPEI09V2z12w5m4zFHVyHPH9ZM";
const SIGNATURES_FOLDER_ID = "1X3a4f-hDdQUlK9xhX-WGQNbhXtY6hPB7";
const PORTFOLIO_TEMPLATE_ID = "1hYSZNeFDCyZsHm3EdKu3wXkojMl7SH0uDvyDxPMoRQA";
const PORTFOLIO_DESTINATION_FOLDER_ID = "1gGlWzAgTxiMYs_pdKHC7pp1vr1nq9jKq";
const DOC_PORTFOLIO_EVIDENCE_FOLDER_ID = "1-Njg-Kk0pswZ8Pq4l9vLXtp3kykAem08";
const FINAL_REPORT_TEMPLATE_ID = "1AJcVrQlngUnqcXFOqmzbq6mXh-Li3clhkjqFVNL9BUk"; // <-- AÑADIDO
const FINAL_REPORT_DESTINATION_FOLDER_ID = "19dF0f49Jq8HRazhL4F97Oe67oKuKnOpp"; // <-- AÑADIDO

// Referencias a las hojas
const sheetDocente = SPREADSHEET.getSheetByName(HOJA_DOCENTE_NOMBRE);
const sheetInforme = SPREADSHEET.getSheetByName(HOJA_INFORME_NOMBRE);
const sheetPortafolio = SPREADSHEET.getSheetByName(HOJA_PORTAFOLIO_NOMBRE);
const sheetDocPortfolio = SPREADSHEET.getSheetByName(HOJA_DOC_PORTFOLIO_NOMBRE);
const sheetInformeFinal = SPREADSHEET.getSheetByName(HOJA_INFORME_FINAL_NOMBRE); // <-- AÑADIDO


// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- MENÚ DE ADMINISTRADOR ---
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('Admin Portafolios')
      .addItem('Abrir Panel de Generación', 'showSidebar')
      .addToUi();
}

function showSidebar() {
  const html = HtmlService.createTemplateFromFile('Sidebar')
      .evaluate()
      .setTitle('Panel de Generación Masiva');
  SpreadsheetApp.getUi().showSidebar(html);
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- SERVIDOR WEB (GET y POST) ---
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function doGet(e) {
  try {
    const action = e.parameter.action;
    const callback = e.parameter.callback;

    // --- MANEJO DE PETICIONES PARA REPORTES (JSONP) ---
    if (callback) {
      if (action === 'getDetailedReport') {
        return handleDetailedReportRequest(e);
      } else {
        // Asume que cualquier otra llamada con callback es para el reporte general
        return getDashboardDataJsonp(e);
      }
    }
    
    // --- LÓGICA DE LA APLICACIÓN PRINCIPAL (FETCH) ---
    if (action === 'validateLogin') {
      const teacherName = decodeURIComponent(e.parameter.teacher);
      const password = e.parameter.password;
      const isValid = validateTeacherPassword(teacherName, password);
      return createJsonResponse({ success: isValid, message: isValid ? "" : "Contraseña o usuario incorrecto." });
    }

    const semestre = e.parameter.semestre;
    if (!semestre) { throw new Error("El parámetro 'semestre' es requerido."); }
    const sheetCarga = SPREADSHEET.getSheetByName(`carga_${semestre}`);
    if (!sheetCarga) { throw new Error(`No tenemos registrada la carga horaria para el semestre ${semestre}. Consulte con soporte.`); }

    if (action === 'getInitialData') {
      const teachers = getUniqueTeachers(sheetCarga);
      return createJsonResponse({ success: true, data: { teachers } });
    }

    if (action === 'searchByTeacher') {
      const teacherName = decodeURIComponent(e.parameter.teacher);
      const courses = findCoursesByTeacher(sheetCarga, teacherName);
      const teacherDetails = findTeacherDetails(teacherName);
      const existingEntryReportsData = getReportDataMap(semestre);
      const existingPortfolioReportsData = getPortfolioDataMap(semestre);
      const existingDocPortfolioReportsData = getDocPortfolioDataMap(semestre);
      const existingFinalReportsData = getFinalReportDataMap(semestre); // <-- AÑADIDO
      
      return createJsonResponse({
        success: true,
        data: {
          details: teacherDetails,
          courses: courses,
          existingEntryReports: existingEntryReportsData,
          existingPortfolioReports: existingPortfolioReportsData,
          existingDocPortfolioReports: existingDocPortfolioReportsData,
          existingFinalReports: existingFinalReportsData // <-- AÑADIDO
        }
      });
    }

    throw new Error("Acción GET no reconocida.");
    
  } catch (error) {
    Logger.log(error.stack);
    if (e.parameter.callback) {
      const callbackFunc = e.parameter.callback || 'handleError';
      return ContentService.createTextOutput(`${callbackFunc}(${JSON.stringify({success: false, message: error.message})})`).setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return createJsonResponse({ success: false, message: error.message });
  }
}

function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);

    if (requestData.action === 'saveReport') {
      if (requestData.reportType === 'entryTest') {
        const result = saveReportData(requestData.data);
        return createJsonResponse({ success: true, url: result.url, status: result.status });
      } else if (requestData.reportType.startsWith('portfolio_')) {
        const unit = requestData.reportType.split('_')[1];
        requestData.data.unit = unit;
        const result = savePortfolioData(requestData.data);
        return createJsonResponse({ success: true, url: result.url });
      } else if (requestData.reportType === 'finalReport') { // <-- AÑADIDO
        const result = saveFinalReportData(requestData.data);
        return createJsonResponse({ success: true, url: result.url, status: result.status });
      }
    }
    
    if (requestData.action === 'createOrGetDocPortfolio') {
      const result = createOrGetDocPortfolio(requestData.data);
      return createJsonResponse({ success: true, reportData: result });
    }
    
    if (requestData.action === 'verifyAndFinalize') {
        const result = verifyAndFinalizePortfolio(requestData.data);
        return createJsonResponse({ success: true, status: result.status, message: result.message });
    }

    throw new Error("Acción POST no reconocida.");
  } catch (error) {
    Logger.log(`Error en doPost: ${error.stack}`);
    return createJsonResponse({ success: false, message: error.message });
  }
}

// --- LÓGICA DEL REPORTE ---
function getDashboardDataJsonp(e) {
  const semestre = e.parameter.semestre;
  const reportType = e.parameter.reportType;
  const callback = e.parameter.callback;

  const sheetCarga = SPREADSHEET.getSheetByName(`carga_${semestre}`);
  if (!sheetCarga) throw new Error(`La hoja de carga para el semestre ${semestre} no existe.`);

  let statusMap = {};
  let sheetReport;
  let unit = null;

  switch (reportType) {
    case 'entryTest': sheetReport = sheetInforme; break;
    case 'portfolio_I': sheetReport = sheetPortafolio; unit = 'I'; break;
    case 'portfolio_II': sheetReport = sheetPortafolio; unit = 'II'; break;
    case 'portfolio_III': sheetReport = sheetPortafolio; unit = 'III'; break;
    case 'docPortfolio': sheetReport = sheetDocPortfolio; break;
    case 'finalReport': sheetReport = sheetInformeFinal; break; // <-- AÑADIDO
    default: throw new Error("Tipo de reporte no válido.");
  }
  
  if (sheetReport && sheetReport.getLastRow() > 1) {
    const reportData = sheetReport.getDataRange().getValues();
    const reportHeaders = reportData.shift();
    const idIndex = reportHeaders.indexOf('ID_Unico');
    const estadoIndex = reportHeaders.indexOf('Estado_Informe');
    
    for (const row of reportData) {
      const id = row[idIndex];
      const estado = (estadoIndex !== -1 && row[estadoIndex]) ? row[estadoIndex] : 'Pendiente';
      statusMap[id] = estado;
    }
  }

  const cargaData = sheetCarga.getDataRange().getValues();
  cargaData.shift();
  const results = [];

  for (const row of cargaData) {
    const cursoCodigo = row[1];
    const cursoNombre = row[2];
    
    for (let i = 7; i < row.length; i++) {
      const docenteNombre = row[i];
      if (docenteNombre && typeof docenteNombre === 'string' && docenteNombre.trim() !== '') {
        const seccion = String.fromCharCode(65 + (i - 7));
        
        let uniqueId;
        if (reportType.startsWith('portfolio_')) {
          uniqueId = `${semestre}-${cursoCodigo}-${seccion}-${unit}`;
        } else {
          uniqueId = `${semestre}-${cursoCodigo}-${seccion}`;
        }

        results.push({
          docente: docenteNombre.trim(),
          curso: cursoNombre,
          seccion: seccion,
          estado: statusMap[uniqueId] || 'Sin Registro'
        });
      }
    }
  }
  
  const jsonResponse = JSON.stringify({ success: true, data: results });
  return ContentService.createTextOutput(`${callback}(${jsonResponse})`).setMimeType(ContentService.MimeType.JAVASCRIPT);
}

// --- FUNCIONES PARA EL PANEL DE ADMINISTRADOR ---
function getSheetsData() {
  const sheets = SPREADSHEET.getSheets();
  const sheetNames = sheets.map(sheet => sheet.getName()).filter(name => name.startsWith('carga_'));
  return sheetNames;
}

function getTeachersFromSheet(sheetName) {
  const sheet = SPREADSHEET.getSheetByName(sheetName);
  if (!sheet) return [];
  return getUniqueTeachers(sheet);
}

function generateFoldersForTeacher(sheetName, teacherName) {
  try {
    const sheetCarga = SPREADSHEET.getSheetByName(sheetName);
    if (!sheetCarga) throw new Error(`La hoja ${sheetName} no existe.`);

    const courses = findCoursesByTeacher(sheetCarga, teacherName);
    if (courses.length === 0) return { created: 0, skipped: 0, total: 0 };
    
    const teacherDetails = findTeacherDetails(teacherName);
    if (!teacherDetails) throw new Error(`No se encontraron los detalles del docente: ${teacherName}`);

    const semestre = sheetName.replace('carga_', '');
    let createdCount = 0;
    let skippedCount = 0;

    courses.forEach(course => {
      const uniqueId = `${semestre}-${course.codigo}-${course.seccion}`;
      const rowIndex = findDocPortfolioRowIndexById(uniqueId);

      if (rowIndex) {
        updateFoldersForExistingRow(rowIndex, {
          semestre: semestre,
          course: course,
          docente: teacherDetails
        });
        skippedCount++;
      } else {
        createOrGetDocPortfolio({
          semestre: semestre,
          course: course,
          docente: teacherDetails
        });
        createdCount++;
        Utilities.sleep(1000);
      }
    });

    return { created: createdCount, skipped: skippedCount, total: courses.length };
  } catch (e) {
    Logger.log(`Error en generateFoldersForTeacher: ${e.message}`);
    return { error: e.message };
  }
}

function updateFoldersForExistingRow(rowIndex, data) {
  try {
    const allFolderUrls = createFolderStructureForCourse(data);
    const headers = sheetDocPortfolio.getRange(1, 1, 1, sheetDocPortfolio.getLastColumn()).getValues()[0];

    for (const key in allFolderUrls) {
      const columnIndex = headers.indexOf(key) + 1;
      
      if (columnIndex > 0) {
        const cell = sheetDocPortfolio.getRange(rowIndex, columnIndex);
        if (cell.getValue() === '') {
          cell.setValue(allFolderUrls[key]);
        }
      }
    }
  } catch(e) {
    Logger.log(`Error actualizando la fila ${rowIndex}: ${e.message}`);
  }
}

// --- LÓGICA: PORTAFOLIO DE DOCUMENTACIÓN ---
const CAMPOS_OBLIGATORIOS_DOC_PORTFOLIO = [
  'url_cv_personal', 'url_cv_icacit', 'url_examen_entrada', 'url_notas_entrada',
  'url_silabo_upt', 'url_silabo_icacit',
  'url_notas_u1', 'url_asistencia_u1', 'url_solucion_examen_u1', 'url_presentaciones_u1',
  'url_examenes_estudiante_u1', 'url_proyecto_final_u1', 'url_trabajos_encargados_docente_u1', 'url_trabajos_encargados_estudiante_u1',
  'url_notas_u2', 'url_asistencia_u2', 'url_solucion_examen_u2', 'url_presentaciones_u2',
  'url_examenes_estudiante_u2', 'url_proyecto_final_u2', 'url_trabajos_encargados_docente_u2', 'url_trabajos_encargados_estudiante_u2',
  'url_notas_u3', 'url_asistencia_u3', 'url_solucion_examen_u3', 'url_presentaciones_u3',
  'url_examenes_estudiante_u3', 'url_proyectos_finales_u3', 'url_trabajos_encargados_docente_u3', 'url_trabajos_encargados_estudiante_u3'
];

function createOrGetDocPortfolio(data) {
  const uniqueId = `${data.semestre}-${data.course.codigo}-${data.course.seccion}`;
  const rowIndex = findDocPortfolioRowIndexById(uniqueId);

  if (!rowIndex) {
    const folderUrls = createFolderStructureForCourse(data);
    const headers = sheetDocPortfolio.getRange(1, 1, 1, sheetDocPortfolio.getLastColumn()).getValues()[0];
    const newRowData = headers.map(header => {
      switch(header) {
        case 'ID_Unico': return uniqueId;
        case 'Semestre': return data.semestre;
        case 'Fecha_Registro': return new Date();
        case 'Docente': return data.docente.NombreCompleto;
        case 'Codigo_Curso': return data.course.codigo;
        case 'Nombre_Curso': return data.course.nombre;
        case 'Seccion': return data.course.seccion;
        case 'Ciclo': return data.course.ciclo;
        case 'Horas': return data.course.horas;
        case 'Creditos': return data.course.creditos;
        case 'Tipo': return data.course.tipo;
        case 'Area_Academica': return data.course.area;
        case 'Estado_Informe': return 'Pendiente';
        default:
          return folderUrls[header] || ''; 
      }
    });
    
    sheetDocPortfolio.appendRow(newRowData);
  }

  const reportData = getSingleDocPortfolioData(uniqueId);
  reportData.folderStatuses = getFolderStatuses(reportData);
  
  return reportData;
}

function createFolderStructureForCourse(data) {
  const courseFolderName = `${data.course.codigo} - ${data.course.nombre} (${data.course.seccion})`;
  const basePath = `${data.semestre}/${data.docente.NombreCompleto}/${courseFolderName}`;
  const folderUrls = {};

  const folderMap = {
    url_cv_personal: "1. Información General/Curriculum Personal", url_cv_icacit: "1. Información General/Curriculum ICACIT",
    url_examen_entrada: "2. Prueba de Entrada/Examen", url_notas_entrada: "2. Prueba de Entrada/Notas",
    url_silabo_upt: "3. Sílabos/Silabo UPT", url_silabo_icacit: "3. Sílabos/Silabo ICACIT",
    url_notas_u1: "4. Unidad I/4.1. Notas Asistencia/Notas (U1)", url_asistencia_u1: "4. Unidad I/4.1. Notas Asistencia/Asistencia (U1)",
    url_solucion_examen_u1: "4. Unidad I/4.2. Recursos Docente/Solución Examen (U1)",
    url_practica_calificada_docente_u1: "4. Unidad I/4.2. Recursos Docente/Practica Calificada (U1)",
    url_trabajos_encargados_docente_u1: "4. Unidad I/4.2. Recursos Docente/Trabajos Encargados (U1)",
    url_presentaciones_u1: "4. Unidad I/4.2. Recursos Docente/Presentaciones (Diapositivas) (U1)",
    url_guias_lab_u1: "4. Unidad I/4.2. Recursos Docente/Guías de Laboratorios (U1)", url_otros_recursos_docente_u1: "4. Unidad I/4.2. Recursos Docente/Otros Recursos (U1)",
    url_examenes_estudiante_u1: "4. Unidad I/4.3. Recursos Estudiante/Examenes (U1)", url_practicas_calificadas_u1: "4. Unidad I/4.3. Recursos Estudiante/Practicas Calificadas (U1)",
    url_trabajos_encargados_estudiante_u1: "4. Unidad I/4.3. Recursos Estudiante/Trabajos Encargados (U1)",
    url_proyecto_final_u1: "4. Unidad I/4.3. Recursos Estudiante/Proyecto Final (U1)", url_otros_recursos_estudiante_u1: "4. Unidad I/4.3. Recursos Estudiante/Otros Recursos (U1)",
    url_notas_u2: "5. Unidad II/5.1. Notas Asistencia/Notas (U2)", url_asistencia_u2: "5. Unidad II/5.1. Notas Asistencia/Asistencia (U2)",
    url_solucion_examen_u2: "5. Unidad II/5.2. Recursos Docente/Solución Examen (U2)",
    url_practica_calificada_docente_u2: "5. Unidad II/5.2. Recursos Docente/Practica Calificada (U2)",
    url_trabajos_encargados_docente_u2: "5. Unidad II/5.2. Recursos Docente/Trabajos Encargados (U2)",
    url_presentaciones_u2: "5. Unidad II/5.2. Recursos Docente/Presentaciones (Diapositivas) (U2)",
    url_guias_lab_u2: "5. Unidad II/5.2. Recursos Docente/Guías de Laboratorios (U2)", url_otros_recursos_docente_u2: "5. Unidad II/5.2. Recursos Docente/Otros Recursos (U2)",
    url_examenes_estudiante_u2: "5. Unidad II/5.3. Recursos Estudiante/Examenes (U2)", url_practicas_calificadas_u2: "5. Unidad II/5.3. Recursos Estudiante/Practicas Calificadas (U2)",
    url_trabajos_encargados_estudiante_u2: "5. Unidad II/5.3. Recursos Estudiante/Trabajos Encargados (U2)",
    url_proyecto_final_u2: "5. Unidad II/5.3. Recursos Estudiante/Proyecto Final (U2)", url_otros_recursos_estudiante_u2: "5. Unidad II/5.3. Recursos Estudiante/Otros Recursos (U2)",
    url_notas_u3: "6. Unidad III/6.1. Notas Asistencia/Notas (U3)", url_asistencia_u3: "6. Unidad III/6.1. Notas Asistencia/Asistencia (U3)",
    url_solucion_examen_u3: "6. Unidad III/6.2. Recursos Docente/Solución Examen (U3)",
    url_practica_calificada_docente_u3: "6. Unidad III/6.2. Recursos Docente/Practica Calificada (U3)",
    url_trabajos_encargados_docente_u3: "6. Unidad III/6.2. Recursos Docente/Trabajos Encargados (U3)",
    url_presentaciones_u3: "6. Unidad III/6.2. Recursos Docente/Presentaciones (Diapositivas) (U3)",
    url_guias_lab_u3: "6. Unidad III/6.2. Recursos Docente/Guías de Laboratorios (U3)", url_otros_recursos_docente_u3: "6. Unidad III/6.2. Recursos Docente/Otros Recursos (U3)",
    url_examenes_estudiante_u3: "6. Unidad III/6.3. Recursos Estudiante/Examenes (U3)", url_practicas_calificadas_u3: "6. Unidad III/6.3. Recursos Estudiante/Practicas Calificadas (U3)",
    url_trabajos_encargados_estudiante_u3: "6. Unidad III/6.3. Recursos Estudiante/Trabajos Encargados (U3)",
    url_otros_recursos_estudiante_u3: "6. Unidad III/6.3. Recursos Estudiante/Otros Recursos",
    url_proyectos_finales_u3: "6. Unidad III/6.4. Proyectos Finales"
  };

  for (const key in folderMap) {
    const subPath = folderMap[key];
    const folder = getOrCreateFolderByPath(DOC_PORTFOLIO_EVIDENCE_FOLDER_ID, `${basePath}/${subPath}`);
    folderUrls[key] = JSON.stringify({
        url: folder.getUrl(),
        count: 0,
        names: []
    });
  }
  return folderUrls;
}

function verifyAndFinalizePortfolio(data) {
    const uniqueId = data.uniqueId;
    const rowIndex = findDocPortfolioRowIndexById(uniqueId);
    if (!rowIndex) throw new Error("No se encontró el registro para finalizar.");

    const reportData = getSingleDocPortfolioData(uniqueId);
    let isComplete = true; 
    let signatureImageUrl = data.existingSignatureUrl || null;

    if (data.signatureBase64 && data.signatureBase64.startsWith('data:image/png;base64,')) {
        if (signatureImageUrl) {
            try {
                const oldFileId = signatureImageUrl.match(/[-\w]{25,}/)[0];
                if (oldFileId) DriveApp.getFileById(oldFileId).setTrashed(true);
            } catch (e) { Logger.log(`No se pudo borrar la firma antigua: ${e.message}`); }
        }
        const base64Data = data.signatureBase64.split(',')[1];
        const decodedData = Utilities.base64Decode(base64Data);
        const blob = Utilities.newBlob(decodedData, 'image/png', `firma_doc_${uniqueId}.png`);
        const signaturesFolder = DriveApp.getFolderById(SIGNATURES_FOLDER_ID);
        const newSignatureFile = signaturesFolder.createFile(blob);
        newSignatureFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        signatureImageUrl = `https://drive.google.com/uc?id=${newSignatureFile.getId()}`;
    }

    if (!signatureImageUrl) isComplete = false;

    const statuses = getFolderStatuses(reportData);
    if (isComplete) {
      for (const field of CAMPOS_OBLIGATORIOS_DOC_PORTFOLIO) {
        if (!statuses[field] || statuses[field].count === 0) {
          isComplete = false;
          break;
        }
      }
    }

    const finalStatus = isComplete ? 'Completado' : 'Pendiente';
    const headers = sheetDocPortfolio.getRange(1, 1, 1, sheetDocPortfolio.getLastColumn()).getValues()[0];
    const currentRow = sheetDocPortfolio.getRange(rowIndex, 1, 1, headers.length).getValues()[0];

    // Actualizar la caché JSON para las 45 carpetas
    for (const key of Object.keys(statuses)) {
        if (statuses[key] && statuses[key].url) {
            const colIndex = headers.indexOf(key);
            if (colIndex >= 0) {
               currentRow[colIndex] = JSON.stringify({
                   url: statuses[key].url,
                   count: statuses[key].count,
                   names: statuses[key].names
               });
            }
        }
    }

    const signatureCol = headers.indexOf('Firma_URL');
    const statusCol = headers.indexOf('Estado_Informe');

    if (signatureCol >= 0) currentRow[signatureCol] = signatureImageUrl;
    if (statusCol >= 0) currentRow[statusCol] = finalStatus;
    
    // Guardar toda la fila con una sola llamada para mejor rendimiento
    sheetDocPortfolio.getRange(rowIndex, 1, 1, headers.length).setValues([currentRow]);
    
    const entregados = [];
    const pendientes = [];
    const labels = getDocPortfolioLabels();

    CAMPOS_OBLIGATORIOS_DOC_PORTFOLIO.forEach(key => {
        if(statuses[key] && statuses[key].count > 0) {
            entregados.push(labels[key]);
        } else {
            pendientes.push(labels[key]);
        }
    });
    
    const emailSummaryHtml = createEmailSummaryHtml(entregados, pendientes);
    const emailData = {
      docente: findTeacherDetails(reportData.Docente),
      course: { 
        codigo: reportData.Codigo_Curso, 
        nombre: reportData.Nombre_Curso, 
        seccion: reportData.Seccion 
      },
      semestre: reportData.Semestre
    };

    sendGenericConfirmationEmail(emailData, null, true, 'Documentación de Portafolio', finalStatus, emailSummaryHtml);
    
    return { status: finalStatus, message: 'El informe ha sido verificado y guardado.' };
}

function getFolderStatuses(reportData) {
    const statuses = {};
    const headers = sheetDocPortfolio.getRange(1, 1, 1, sheetDocPortfolio.getLastColumn()).getValues()[0];
    for(const header of headers) {
        if (header.startsWith('url_') && reportData[header]) {
            try {
                let folderId;
                let isJsonData = false;
                try {
                    const parsedData = JSON.parse(reportData[header]);
                    if (parsedData && parsedData.url) {
                        folderId = parsedData.url.match(/[-\w]{25,}/)[0];
                        isJsonData = true;
                    }
                } catch(e) {
                    folderId = reportData[header].match(/[-\w]{25,}/)[0];
                }

                if (folderId) {
                    const folder = DriveApp.getFolderById(folderId);
                    const contentData = { count: 0, names: [], url: isJsonData ? JSON.parse(reportData[header]).url : reportData[header] };
                    const files = folder.getFiles();
                    while (files.hasNext()) {
                        contentData.names.push("📄 " + files.next().getName());
                        contentData.count++;
                    }
                    const subFolders = folder.getFolders();
                    while (subFolders.hasNext()) {
                        contentData.names.push("📁 " + subFolders.next().getName());
                        contentData.count++;
                    }
                    statuses[header] = contentData;
                }
            } catch (e) {
                let existingUrl = reportData[header];
                try {
                   const parsedDetails = JSON.parse(reportData[header]);
                   if(parsedDetails && parsedDetails.url) existingUrl = parsedDetails.url;
                } catch(err) {}
                statuses[header] = { count: 0, names: [], error: true, url: existingUrl };
            }
        }
    }
    return statuses;
}

function saveReportData(data) {
  const isUpdate = !!data.uniqueId;
  const uniqueId = isUpdate ? data.uniqueId : `${data.semestre}-${data.course.codigo}-${data.course.seccion}`;
  if (!isUpdate) {
    const idColumnValues = sheetInforme.getRange("A:A").getValues().flat();
    if (idColumnValues.includes(uniqueId)) {
      throw new Error("Conflicto: Este informe ya fue creado. Por favor, refresque la búsqueda para editarlo.");
    }
  }
  let signatureImageUrl = data.existingSignatureUrl || null;
  if (data.signatureBase64 && data.signatureBase64.startsWith('data:image/png;base64,')) {
    if (isUpdate && signatureImageUrl) {
      try {
        const oldFileId = signatureImageUrl.match(/[-\w]{25,}/)[0];
        if(oldFileId) DriveApp.getFileById(oldFileId).setTrashed(true);
      }
      catch(e) { Logger.log(`No se pudo borrar la firma antigua: ${e.message}`); }
    }
    const base64Data = data.signatureBase64.split(',')[1];
    const decodedData = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decodedData, 'image/png', `firma_entrada_${uniqueId}.png`);
    const signaturesFolder = DriveApp.getFolderById(SIGNATURES_FOLDER_ID);
    const newSignatureFile = signaturesFolder.createFile(blob);
    newSignatureFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    signatureImageUrl = `https://drive.google.com/uc?id=${newSignatureFile.getId()}`;
  }
  let reportFile;
  if (isUpdate) {
    const reportUrl = findReportUrl(uniqueId);
    if (!reportUrl) throw new Error("No se pudo encontrar el archivo del informe para actualizar.");
    reportFile = SpreadsheetApp.openByUrl(reportUrl);
  } else {
    const destinationFolder = DriveApp.getFolderById(DESTINATION_FOLDER_ID);
    const templateFile = DriveApp.getFileById(TEMPLATE_ID);
    const newFileName = `${data.semestre} - Informe Prueba de Entrada - ${data.course.nombre} - ${data.course.seccion}`;
    const newFile = templateFile.makeCopy(newFileName, destinationFolder);
    reportFile = SpreadsheetApp.openById(newFile.getId());
  }
  populateReportSheet(reportFile, data, signatureImageUrl);
  SpreadsheetApp.flush();
  const reportUrl = reportFile.getUrl();
  const newRowData = [
    uniqueId, data.semestre, new Date(), data.docente.NombreCompleto,
    data.course.codigo, data.course.nombre, data.course.seccion, data.course.ciclo, data.course.horas,
    data.course.creditos, data.course.tipo, data.course.area, data.matriculados, data.evaluados
  ];
  let allSkillsComplete = data.skills.length > 0 && data.evaluados > 0;
  for (let i = 0; i < 5; i++) {
    const skill = data.skills[i];
    if (skill && skill.name) {
      newRowData.push(
        skill.name, skill.deficiente_cantidad, skill.deficiente_porcentaje,
        skill.suficiente_cantidad, skill.suficiente_porcentaje,
        skill.bueno_cantidad, skill.bueno_porcentaje, skill.total_porcentaje
      );
      if (Math.abs(skill.total_porcentaje - 1) > 0.001) { allSkillsComplete = false; }
    } else {
      newRowData.push('', '', '', '', '', '', '', '');
    }
  }
  newRowData.push(reportUrl);
  const corrective = data.correctiveMeasures || {};
  newRowData.push(
    corrective.repaso_clase || false, corrective.repaso_adicional || false, corrective.ejercicios_casa || false,
    corrective.entrega_material || false, corrective.recomendacion_biblio || false, corrective.otros_check || false,
    corrective.otros_descripcion || '', corrective.fecha || ''
  );
  newRowData.push(signatureImageUrl || '');

  let finalStatus = 'Pendiente';
  if (signatureImageUrl && parseInt(data.evaluados) > 0 && allSkillsComplete) {
    finalStatus = 'Completado';
  }
  newRowData.push(finalStatus);

  if (isUpdate) {
    const rowIndex = findRowIndexById(uniqueId);
    if (!rowIndex) throw new Error("No se encontró la fila del informe para actualizar en el registro.");
    sheetInforme.getRange(rowIndex, 1, 1, newRowData.length).setValues([newRowData]);
  } else {
    sheetInforme.appendRow(newRowData);
  }
  sendGenericConfirmationEmail(data, reportUrl, isUpdate, "Informe de Prueba de Entrada", finalStatus);
  return { url: reportUrl, status: finalStatus };
}

function savePortfolioData(data) {
  const uniqueId = data.uniqueId || `${data.semestre}-${data.course.codigo}-${data.course.seccion}-${data.unit}`;
  const isUpdate = !!data.uniqueId;
  if (!isUpdate) {
    const idColumnValues = sheetPortafolio.getRange("A:A").getValues().flat();
    if (idColumnValues.includes(uniqueId)) {
      throw new Error("Conflicto: Este informe de portafolio ya fue creado. Por favor, refresque la búsqueda para editarlo.");
    }
  }
  let signatureImageUrl = data.existingSignatureUrl || null;
  if (data.signatureBase64 && data.signatureBase64.startsWith('data:image/png;base64,')) {
    if (isUpdate && signatureImageUrl) {
      try {
        const oldFileId = signatureImageUrl.match(/[-\w]{25,}/)[0];
        if(oldFileId) DriveApp.getFileById(oldFileId).setTrashed(true);
      }
      catch(e) { Logger.log(`No se pudo borrar la firma antigua del portafolio: ${e.message}`); }
    }
    const base64Data = data.signatureBase64.split(',')[1];
    const decodedData = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decodedData, 'image/png', `firma_portafolio_${uniqueId}.png`);
    const signaturesFolder = DriveApp.getFolderById(SIGNATURES_FOLDER_ID);
    const newSignatureFile = signaturesFolder.createFile(blob);
    newSignatureFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    signatureImageUrl = `https://drive.google.com/uc?id=${newSignatureFile.getId()}`;
  }
  let reportFile;
  if (isUpdate) {
    const reportUrl = findPortfolioUrl(uniqueId);
    if (!reportUrl) throw new Error("No se pudo encontrar el archivo del portafolio para actualizar.");
    try {
      reportFile = SpreadsheetApp.openByUrl(reportUrl);
    } catch(e) {
      throw new Error(`Argumento no válido: url. No se pudo abrir el archivo. Verifique el enlace en la hoja de cálculo.`);
    }
  } else {
    const destinationFolder = DriveApp.getFolderById(PORTFOLIO_DESTINATION_FOLDER_ID);
    const templateFile = DriveApp.getFileById(PORTFOLIO_TEMPLATE_ID);
    const newFileName = `${data.semestre} - Portafolio Unidad ${data.unit} - ${data.course.nombre} - ${data.course.seccion}`;
    const newFile = templateFile.makeCopy(newFileName, destinationFolder);
    reportFile = SpreadsheetApp.openById(newFile.getId());
  }
  populatePortfolioSheet(reportFile, data, signatureImageUrl);
  SpreadsheetApp.flush();
  const reportUrl = reportFile.getUrl();
  const newRowData = [
    uniqueId, data.semestre, data.unit, new Date(), data.docente.NombreCompleto,
    data.course.codigo, data.course.nombre, data.course.seccion, data.course.ciclo, data.course.horas,
    data.course.creditos, data.course.tipo, data.course.area,
    data.matriculados, data.retirados, data.abandono, data.asisten, data.aprobados, data.desaprobados,
    data.matriculados_pct, data.retirados_pct, data.abandono_pct, data.asisten_pct, data.aprobados_pct, data.desaprobados_pct,
    data.dig_silabo_upt, data.imp_silabo_upt, data.cant_silabo_upt,
    data.dig_silabo_icacit, data.imp_silabo_icacit, data.cant_silabo_icacit,
    data.dig_cv_icacit, data.imp_cv_icacit, data.cant_cv_icacit,
    data.dig_material_curso, data.imp_material_curso, data.cant_material_curso,
    data.dig_guias_lab, data.imp_guias_lab, data.cant_guias_lab,
    data.dig_examenes, data.imp_examenes, data.cant_examenes,
    data.dig_practicas, data.imp_practicas, data.cant_practicas,
    data.dig_asistencia, data.imp_asistencia, data.cant_asistencia,
    data.dig_notas, data.imp_notas, data.cant_notas,
    data.dig_evaluaciones, data.imp_evaluaciones, data.cant_evaluaciones,
    data.dig_est_cuadernos, data.imp_est_cuadernos, data.cant_est_cuadernos,
    data.dig_est_examenes, data.imp_est_examenes, data.cant_est_examenes,
    data.dig_est_eval_practicas, data.imp_est_eval_practicas, data.cant_est_eval_practicas,
    data.dig_est_inf_lab, data.imp_est_inf_lab, data.cant_est_inf_lab,
    data.dig_est_trabajos, data.imp_est_trabajos, data.cant_est_trabajos,
    data.dig_est_proyectos, data.imp_est_proyectos, data.cant_est_proyectos,
    data.fecha_entrega, signatureImageUrl,
    reportUrl
  ];
  
  const docenteObligatorios = ['silabo_upt', 'silabo_icacit', 'cv_icacit', 'material_curso', 'guias_lab', 'examenes', 'asistencia', 'notas'];
  const estudianteObligatorios = ['est_examenes', 'est_proyectos'];
  let isDataComplete = true;
  if (!signatureImageUrl || !data.matriculados || parseInt(data.matriculados) <= 0 || data.aprobados === undefined || data.aprobados === null || data.aprobados === '') {
    isDataComplete = false;
  }
  if (isDataComplete) {
      for (const key of docenteObligatorios) {
        if (!(data[`dig_${key}`] || data[`imp_${key}`]) || !(parseInt(data[`cant_${key}`]) > 0)) {
            isDataComplete = false; break;
        }
      }
  }
  if (isDataComplete) {
      for (const key of estudianteObligatorios) {
        if (!(data[`dig_${key}`] || data[`imp_${key}`]) || !(parseInt(data[`cant_${key}`]) > 0)) {
            isDataComplete = false; break;
        }
      }
  }
  
  const finalStatus = isDataComplete ? 'Completado' : 'Pendiente';
  newRowData.push(finalStatus);

  if (isUpdate) {
    const rowIndex = findPortfolioRowIndexById(uniqueId);
    if (!rowIndex) throw new Error("No se encontró la fila del informe de portafolio para actualizar.");
    sheetPortafolio.getRange(rowIndex, 1, 1, newRowData.length).setValues([newRowData]);
  } else {
    sheetPortafolio.appendRow(newRowData);
  }
  sendGenericConfirmationEmail(data, reportUrl, isUpdate, `Portafolio Unidad ${data.unit}`, finalStatus);
  return { url: reportUrl };
}

// ==================================================================
// --- AÑADIDO: LÓGICA PARA EL INFORME FINAL DE CURSO ---
// ==================================================================

/**
 * Rellena la plantilla del Informe Final con los datos recibidos del frontend.
 */
function populateFinalReportSheet(spreadsheet, data, signatureImageUrl) {
  const reportSheet = spreadsheet.getSheets()[0];
  
  // --- Tabla 1: Datos Generales ---
  reportSheet.getRange('E8').setValue(data.semestre);
  reportSheet.getRange('C11').setValue(data.course.codigo);
  reportSheet.getRange('C12').setValue(data.course.nombre);
  reportSheet.getRange('C13').setValue(data.course.horas);
  reportSheet.getRange('C14').setValue(data.course.area);
  reportSheet.getRange('C15').setValue(data.docente.NombreCompleto);
  reportSheet.getRange('C16').setValue(data.semestre);
  reportSheet.getRange('E11').setValue(data.course.seccion);
  reportSheet.getRange('E13').setValue(data.course.creditos);
  reportSheet.getRange('H11').setValue(data.course.ciclo);
  reportSheet.getRange('H13').setValue(data.course.tipo);

  // --- Tabla 2: Resumen del Curso ---
  reportSheet.getRange('D20').setValue(data.resumen.pct_cumplimiento_silabo);
  reportSheet.getRange('D21').setValue(data.resumen.cant_practicas_realizadas);
  reportSheet.getRange('D22').setValue(data.resumen.cant_laboratorios_realizados);
  reportSheet.getRange('D23').setValue(data.resumen.cant_proyectos_realizados);
  reportSheet.getRange('D24').setValue(data.resumen.cantidad_matriculados);
  reportSheet.getRange('D25').setValue(data.resumen.cantidad_retirados);
  reportSheet.getRange('D26').setValue(data.resumen.cantidad_abandono);
  reportSheet.getRange('D27').setValue(data.resumen.cantidad_asisten);
  reportSheet.getRange('D28').setValue(data.resumen.cantidad_aprobados);
  reportSheet.getRange('D29').setValue(data.resumen.cantidad_desaprobados);
  reportSheet.getRange('D30').setValue(data.resumen.nota_final_alta);
  reportSheet.getRange('D31').setValue(data.resumen.nota_final_promedio);
  reportSheet.getRange('D32').setValue(data.resumen.nota_final_baja);
  
  // Rellenar porcentajes (opcional si la plantilla ya tiene fórmulas)
  reportSheet.getRange('E24').setValue(data.resumen.pct_matriculados).setNumberFormat('0.0%');
  reportSheet.getRange('E25').setValue(data.resumen.pct_retirados).setNumberFormat('0.0%');
  reportSheet.getRange('E26').setValue(data.resumen.pct_abandono).setNumberFormat('0.0%');
  reportSheet.getRange('E27').setValue(data.resumen.pct_asisten).setNumberFormat('0.0%');
  reportSheet.getRange('E28').setValue(data.resumen.pct_aprobados).setNumberFormat('0.0%');
  reportSheet.getRange('E29').setValue(data.resumen.pct_desaprobados).setNumberFormat('0.0%');

  // --- Tabla 3: Logros de Capacidades ---
  const ras = ['ra1', 'ra2', 'ra3', 'ra4', 'ra5'];
  const ra_rows = { ra1: 53, ra2: 54, ra3: 55, ra4: 56, ra5: 57 };
  const nivel_cols = { 'N': 'E', 'P': 'F', 'A': 'G', 'B': 'H', 'M': 'I' };

  ras.forEach(ra_key => {
    const ra_data = data.logros[ra_key];
    const row = ra_rows[ra_key];
    reportSheet.getRange(`B${row}`).setValue(ra_data.nombre);
    
    // Limpiar la fila antes de marcar
    reportSheet.getRange(`E${row}:I${row}`).clearContent();
    const col = nivel_cols[ra_data.nivel];
    if (col) {
      reportSheet.getRange(`${col}${row}`).setValue('X');
    }
  });

  // --- Observaciones y Campos de Texto ---
  reportSheet.getRange('B60').setValue(data.observaciones.obs_motivo_no_logro);
  reportSheet.getRange('B67').setValue(data.observaciones.obs_estudiantes);
  reportSheet.getRange('B72').setValue(data.observaciones.obs_asistencia);
  reportSheet.getRange('B77').setValue(data.observaciones.obs_silabo);
  reportSheet.getRange('B88').setValue(data.observaciones.obs_administrativas);
  reportSheet.getRange('B93').setValue(data.observaciones.obs_competencias);
  reportSheet.getRange('B98').setValue(data.observaciones.obs_mejora_continua);
  reportSheet.getRange('B103').setValue(data.observaciones.obs_actualizacion_docente);
  reportSheet.getRange('B108').setValue(data.observaciones.obs_recomendaciones);

  // --- Uso del Aula Virtual ---
  reportSheet.getRange('C82').setValue(data.aula_virtual.av_material_curso);
  reportSheet.getRange('F82').setValue(data.aula_virtual.av_cuestionarios);
  reportSheet.getRange('I82').setValue(data.aula_virtual.av_tareas);
  reportSheet.getRange('C84').setValue(data.aula_virtual.av_foros);
  reportSheet.getRange('F84').setValue(data.aula_virtual.av_examenes);
  reportSheet.getRange('I84').setValue(data.aula_virtual.av_slideshow);
  
  // --- Campos Finales ---
  if(data.fecha_informe) reportSheet.getRange('G111').setValue(new Date(data.fecha_informe));
  if (signatureImageUrl) {
    reportSheet.getRange('D113').clearContent();
    reportSheet.getRange('D113').setFormula(`=IMAGE("${signatureImageUrl}")`);
  }
}

/**
 * Guarda o actualiza un registro del Informe Final y su archivo correspondiente.
 */
function saveFinalReportData(data) {
  const uniqueId = data.uniqueId || `${data.semestre}-${data.course.codigo}-${data.course.seccion}`;
  const isUpdate = !!data.uniqueId;

  if (!isUpdate) {
    const idColumnValues = sheetInformeFinal.getRange("A:A").getValues().flat();
    if (idColumnValues.includes(uniqueId)) {
      throw new Error("Conflicto: Este informe final ya fue creado. Por favor, refresque la búsqueda para editarlo.");
    }
  }

  let signatureImageUrl = data.existingSignatureUrl || null;
  if (data.signatureBase64 && data.signatureBase64.startsWith('data:image/png;base64,')) {
    if (isUpdate && signatureImageUrl) {
      try {
        const oldFileId = signatureImageUrl.match(/[-\w]{25,}/)[0];
        if(oldFileId) DriveApp.getFileById(oldFileId).setTrashed(true);
      }
      catch(e) { Logger.log(`No se pudo borrar la firma antigua del informe final: ${e.message}`); }
    }
    const base64Data = data.signatureBase64.split(',')[1];
    const decodedData = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decodedData, 'image/png', `firma_final_${uniqueId}.png`);
    const signaturesFolder = DriveApp.getFolderById(SIGNATURES_FOLDER_ID);
    const newSignatureFile = signaturesFolder.createFile(blob);
    newSignatureFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    signatureImageUrl = `https://drive.google.com/uc?id=${newSignatureFile.getId()}`;
  }

  let reportFile;
  if (isUpdate) {
    const reportUrl = findFinalReportUrl(uniqueId);
    if (!reportUrl) throw new Error("No se pudo encontrar el archivo del informe final para actualizar.");
    try {
      reportFile = SpreadsheetApp.openByUrl(reportUrl);
    } catch(e) {
      throw new Error(`No se pudo abrir el archivo. Verifique el enlace en la hoja de cálculo.`);
    }
  } else {
    const destinationFolder = DriveApp.getFolderById(FINAL_REPORT_DESTINATION_FOLDER_ID);
    const templateFile = DriveApp.getFileById(FINAL_REPORT_TEMPLATE_ID);
    const newFileName = `${data.semestre} - Informe Final - ${data.course.nombre} - ${data.course.seccion}`;
    const newFile = templateFile.makeCopy(newFileName, destinationFolder);
    reportFile = SpreadsheetApp.openById(newFile.getId());
  }

  populateFinalReportSheet(reportFile, data, signatureImageUrl);
  SpreadsheetApp.flush();
  const reportUrl = reportFile.getUrl();

  const finalStatus = signatureImageUrl ? 'Completado' : 'Pendiente';

  const newRowData = [
    uniqueId, data.semestre, new Date(), data.docente.NombreCompleto, data.course.codigo, data.course.nombre, data.course.seccion,
    data.course.ciclo, data.course.horas, data.course.creditos, data.course.tipo, data.course.area,
    data.resumen.cantidad_matriculados, data.resumen.pct_matriculados, data.resumen.cantidad_retirados, data.resumen.pct_retirados,
    data.resumen.cantidad_abandono, data.resumen.pct_abandono, data.resumen.cantidad_asisten, data.resumen.pct_asisten,
    data.resumen.cantidad_aprobados, data.resumen.pct_aprobados, data.resumen.cantidad_desaprobados, data.resumen.pct_desaprobados,
    data.resumen.pct_cumplimiento_silabo, data.resumen.cant_practicas_realizadas, data.resumen.cant_laboratorios_realizados, data.resumen.cant_proyectos_realizados,
    data.resumen.nota_final_alta, data.resumen.nota_final_promedio, data.resumen.nota_final_baja,
    data.logros.ra1.nombre, data.logros.ra1.nivel, data.logros.ra2.nombre, data.logros.ra2.nivel, data.logros.ra3.nombre, data.logros.ra3.nivel,
    data.logros.ra4.nombre, data.logros.ra4.nivel, data.logros.ra5.nombre, data.logros.ra5.nivel,
    data.observaciones.obs_motivo_no_logro, data.observaciones.obs_estudiantes, data.observaciones.obs_asistencia, data.observaciones.obs_silabo,
    data.aula_virtual.av_material_curso, data.aula_virtual.av_cuestionarios, data.aula_virtual.av_tareas, data.aula_virtual.av_foros,
    data.aula_virtual.av_examenes, data.aula_virtual.av_slideshow,
    data.observaciones.obs_administrativas, data.observaciones.obs_competencias, data.observaciones.obs_mejora_continua,
    data.observaciones.obs_actualizacion_docente, data.observaciones.obs_recomendaciones,
    data.fecha_informe, signatureImageUrl, reportUrl, finalStatus
  ];

  if (isUpdate) {
    const rowIndex = findFinalReportRowIndexById(uniqueId);
    if (!rowIndex) throw new Error("No se encontró la fila del informe final para actualizar.");
    sheetInformeFinal.getRange(rowIndex, 1, 1, newRowData.length).setValues([newRowData]);
  } else {
    sheetInformeFinal.appendRow(newRowData);
  }

  sendGenericConfirmationEmail(data, reportUrl, isUpdate, "Informe Final de Curso", finalStatus);
  return { url: reportUrl, status: finalStatus };
}


// ==================================================================
// --- FIN DE LA SECCIÓN AÑADIDA ---
// ==================================================================


function populateReportSheet(spreadsheet, data, signatureImageUrl) {
    const reportSheet = spreadsheet.getSheets()[0];
    reportSheet.getRange('F6').setValue(data.semestre);
    reportSheet.getRange('B10').setValue(data.course.codigo); reportSheet.getRange('C10').setValue(data.course.nombre);
    reportSheet.getRange('C11').setValue(data.course.seccion); reportSheet.getRange('E11').setValue(data.course.ciclo);
    reportSheet.getRange('G11').setValue(data.course.horas); reportSheet.getRange('J11').setValue(data.course.creditos);
    reportSheet.getRange('L11').setValue(data.course.tipo);
    reportSheet.getRange('D14').setValue(data.docente.NombreCompleto); reportSheet.getRange('D15').setValue(data.docente.CorreoElectronico);
    reportSheet.getRange('L15').setValue(data.docente.Telefono);
    reportSheet.getRange('F17').setValue(data.matriculados); reportSheet.getRange('K17').setValue(data.evaluados);
    reportSheet.getRange('C22:M26').clearContent();
    data.skills.forEach((skill, index) => {
        if (index < 5) {
            const row = 22 + index;
            reportSheet.getRange(`C${row}`).setValue(skill.name);
            reportSheet.getRange(`F${row}`).setValue(skill.deficiente_cantidad);
            reportSheet.getRange(`G${row}`).setValue(skill.deficiente_porcentaje).setNumberFormat('0.00%');
            reportSheet.getRange(`H${row}`).setValue(skill.suficiente_cantidad);
            reportSheet.getRange(`J${row}`).setValue(skill.suficiente_porcentaje).setNumberFormat('0.00%');
            reportSheet.getRange(`K${row}`).setValue(skill.bueno_cantidad);
            reportSheet.getRange(`L${row}`).setValue(skill.bueno_porcentaje).setNumberFormat('0.00%');
            reportSheet.getRange(`M${row}`).setValue(skill.total_porcentaje).setNumberFormat('0.00%');
        }
    });
    const corrective = data.correctiveMeasures || {};
    reportSheet.getRange('F44').setValue(corrective.repaso_clase ? 'X' : '');
    reportSheet.getRange('F45').setValue(corrective.repaso_adicional ? 'X' : '');
    reportSheet.getRange('F46').setValue(corrective.ejercicios_casa ? 'X' : '');
    reportSheet.getRange('L44').setValue(corrective.entrega_material ? 'X' : '');
    reportSheet.getRange('L45').setValue(corrective.recomendacion_biblio ? 'X' : '');
    reportSheet.getRange('L46').setValue(corrective.otros_check ? 'X' : '');
    reportSheet.getRange('B49').setValue(corrective.otros_descripcion || '');
    const fecha = corrective.fecha ? new Date(corrective.fecha) : new Date();
    reportSheet.getRange('B54').setValue(fecha).setNumberFormat('dd/mm/yyyy');
    reportSheet.getRange('J56').setValue(data.docente.NombreCompleto);
    const signatureCell = reportSheet.getRange('J51');
    signatureCell.clearContent();
    if (signatureImageUrl) {
      signatureCell.setFormula(`=IMAGE("${signatureImageUrl}")`);
    }
}

function populatePortfolioSheet(spreadsheet, data, signatureImageUrl) {
    const reportSheet = spreadsheet.getSheets()[0];
    reportSheet.getRange('B8').setValue(`${data.semestre} - UNIDAD ${data.unit}`);
    reportSheet.getRange('C11').setValue(data.course.codigo);
    reportSheet.getRange('E11').setValue(data.course.seccion);
    reportSheet.getRange('G11').setValue(data.course.ciclo);
    reportSheet.getRange('C12').setValue(data.course.nombre);
    reportSheet.getRange('C13').setValue(data.course.horas);
    reportSheet.getRange('E13').setValue(data.course.creditos);
    reportSheet.getRange('G14').setValue(data.course.tipo);
    reportSheet.getRange('C14').setValue(data.course.area);
    reportSheet.getRange('C15').setValue(data.docente.NombreCompleto);
    reportSheet.getRange('C16').setValue(data.semestre);
    reportSheet.getRange('C20').setValue(data.matriculados);
    reportSheet.getRange('D20').setValue(data.matriculados_pct).setNumberFormat('0.00%');
    reportSheet.getRange('C21').setValue(data.retirados);
    reportSheet.getRange('D21').setValue(data.retirados_pct).setNumberFormat('0.00%');
    reportSheet.getRange('C22').setValue(data.abandono);
    reportSheet.getRange('D22').setValue(data.abandono_pct).setNumberFormat('0.00%');
    reportSheet.getRange('C23').setValue(data.asisten);
    reportSheet.getRange('D23').setValue(data.asisten_pct).setNumberFormat('0.00%');
    reportSheet.getRange('C24').setValue(data.aprobados);
    reportSheet.getRange('D24').setValue(data.aprobados_pct).setNumberFormat('0.00%');
    reportSheet.getRange('C25').setValue(data.desaprobados);
    reportSheet.getRange('D25').setValue(data.desaprobados_pct).setNumberFormat('0.00%');
    const teacherMaterials = [ { key: 'silabo_upt', row: 42 }, { key: 'silabo_icacit', row: 43 }, { key: 'cv_icacit', row: 44 }, { key: 'material_curso', row: 45 }, { key: 'guias_lab', row: 46 }, { key: 'examenes', row: 47 }, { key: 'practicas', row: 48 }, { key: 'asistencia', row: 49 }, { key: 'notas', row: 50 }, { key: 'evaluaciones', row: 51 } ];
    teacherMaterials.forEach(material => {
        reportSheet.getRange(`D${material.row}`).setValue(data[`dig_${material.key}`] ? 'X' : '');
        reportSheet.getRange(`E${material.row}`).setValue(data[`imp_${material.key}`] ? 'X' : '');
        reportSheet.getRange(`F${material.row}`).setValue(data[`cant_${material.key}`]);
        reportSheet.getRange(`G${material.row}`).clearContent();
    });
    const studentMaterials = [ { key: 'est_cuadernos', row: 58 }, { key: 'est_examenes', row: 59 }, { key: 'est_eval_practicas', row: 60 }, { key: 'est_inf_lab', row: 61 }, { key: 'est_trabajos', row: 62 }, { key: 'est_proyectos', row: 63 } ];
    studentMaterials.forEach(material => {
        reportSheet.getRange(`D${material.row}`).setValue(data[`dig_${material.key}`] ? 'X' : '');
        reportSheet.getRange(`E${material.row}`).setValue(data[`imp_${material.key}`] ? 'X' : '');
        reportSheet.getRange(`F${material.row}`).setValue(data[`cant_${material.key}`]);
        reportSheet.getRange(`G${material.row}`).clearContent();
    });
    const fecha = data.fecha_entrega ? new Date(data.fecha_entrega) : new Date();
    reportSheet.getRange('E70').setValue(fecha).setNumberFormat('dd/mm/yyyy');
    reportSheet.getRange('E71').setValue(fecha).setNumberFormat('dd/mm/yyyy');
    reportSheet.getRange('C70').setValue(data.docente.NombreCompleto);
    const signatureCell = reportSheet.getRange('F70');
    signatureCell.clearContent();
    if (signatureImageUrl) {
      signatureCell.setFormula(`=IMAGE("${signatureImageUrl}")`);
    }
}

function getReportDataMap(semestre) {
  if (!sheetInforme || sheetInforme.getLastRow() < 2) return {};
  const data = sheetInforme.getDataRange().getValues();
  const headers = data.shift();
  const reportMap = {};
  for (const row of data) {
    const id = row[0];
    if (id && id.startsWith(semestre + '-')) {
      const skills = [];
      for (let i = 0; i < 5; i++) {
        const baseIndex = 14 + (i * 8);
        if (baseIndex < headers.length) {
            const skillName = row[baseIndex];
            if (skillName) {
              skills.push({ name: skillName, deficiente_cantidad: row[baseIndex + 1], suficiente_cantidad: row[baseIndex + 3], bueno_cantidad: row[baseIndex + 5], });
            }
        }
      }
      reportMap[id] = { matriculados: row[12], evaluados: row[13], skills: skills, url: row[54], correctiveMeasures: { repaso_clase: row[55], repaso_adicional: row[56], ejercicios_casa: row[57], entrega_material: row[58], recomendacion_biblio: row[59], otros_check: row[60], otros_descripcion: row[61], fecha: row[62] ? new Date(row[62]).toISOString().split('T')[0] : '' }, signatureImageUrl: row[63] || null };
    }
  }
  return reportMap;
}

function getPortfolioDataMap(semestre) {
  if (!sheetPortafolio || sheetPortafolio.getLastRow() <= 1) return {};
  const data = sheetPortafolio.getDataRange().getValues();
  const headers = data.shift().map(h => h.toLowerCase());
  const reportMap = {};
  for (const row of data) {
    const id = row[0];
    if (id && id.startsWith(semestre + '-')) {
      const rowData = {};
      headers.forEach((header, i) => { if(row[i] !== undefined) rowData[header] = row[i]; });
      rowData['url'] = rowData['url_Informe'];
      rowData['signatureImageUrl'] = rowData['firma_url'] || null;
      reportMap[id] = rowData;
    }
  }
  return reportMap;
}

/**
 * AÑADIDO: Busca los informes finales existentes para un semestre.
 */
function getFinalReportDataMap(semestre) {
  if (!sheetInformeFinal || sheetInformeFinal.getLastRow() <= 1) return {};
  const data = sheetInformeFinal.getDataRange().getValues();
  const headers = data.shift(); // Los encabezados de las 60 columnas
  const reportMap = {};
  for (const row of data) {
    const id = row[0]; // ID_Unico
    if (id && id.startsWith(semestre + '-')) {
      const rowData = {};
      headers.forEach((header, i) => {
        if(row[i] !== undefined) rowData[header] = row[i];
      });
      rowData['url'] = rowData['URL_Informe'];
      rowData['signatureImageUrl'] = rowData['Firma_URL'] || null;
      reportMap[id] = rowData;
    }
  }
  return reportMap;
}


function getDocPortfolioDataMap(semestre) {
  if (!sheetDocPortfolio || sheetDocPortfolio.getLastRow() <= 1) return {};
  const data = sheetDocPortfolio.getDataRange().getValues();
  const headers = sheetDocPortfolio.getRange(1, 1, 1, sheetDocPortfolio.getLastColumn()).getValues()[0];
  const reportMap = {};
  const dataRows = data.slice(1);
  for (const row of dataRows) {
    const id = row[0];
    if (id && id.startsWith(semestre + '-')) {
      const rowData = {};
      headers.forEach((header, i) => { if (row[i] !== undefined) rowData[header] = row[i]; });
      rowData.signatureImageUrl = rowData['Firma_URL'] || null;
      reportMap[id] = rowData;
    }
  }
  return reportMap;
}

function getSingleDocPortfolioData(uniqueId) {
    const rowIndex = findDocPortfolioRowIndexById(uniqueId);
    if (!rowIndex) return null;
    const headers = sheetDocPortfolio.getRange(1, 1, 1, sheetDocPortfolio.getLastColumn()).getValues()[0];
    const rowValues = sheetDocPortfolio.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
    const rowData = {};
    headers.forEach((header, i) => { rowData[header] = rowValues[i]; });
    rowData.signatureImageUrl = rowData['Firma_URL'] || null;
    return rowData;
}

function getOrCreateFolderByPath(baseFolderId, path) {
  let currentFolder = DriveApp.getFolderById(baseFolderId);
  const pathParts = path.split('/');
  for (const part of pathParts) {
    if (!part) continue;
    const folders = currentFolder.getFoldersByName(part);
    if (folders.hasNext()) {
      currentFolder = folders.next();
    } else {
      currentFolder = currentFolder.createFolder(part);
    }
  }
  return currentFolder;
}

function findDocPortfolioRowIndexById(id) {
  if (!sheetDocPortfolio) return null;
  const ids = sheetDocPortfolio.getRange("A:A").getValues().flat();
  const index = ids.indexOf(id);
  return index !== -1 ? index + 1 : null;
}

function findPortfolioRowIndexById(id) {
  if (!sheetPortafolio) return null;
  const ids = sheetPortafolio.getRange("A:A").getValues().flat();
  const index = ids.indexOf(id);
  return index !== -1 ? index + 1 : null;
}

function findRowIndexById(id) {
  if (!sheetInforme) return null;
  const ids = sheetInforme.getRange("A:A").getValues().flat();
  const index = ids.indexOf(id);
  return index !== -1 ? index + 1 : null;
}

/**
 * AÑADIDO: Encuentra el índice de fila de un Informe Final por su ID.
 */
function findFinalReportRowIndexById(id) {
  if (!sheetInformeFinal) return null;
  const ids = sheetInformeFinal.getRange("A:A").getValues().flat();
  const index = ids.indexOf(id);
  return index !== -1 ? index + 1 : null;
}

function findPortfolioUrl(id) {
  const rowIndex = findPortfolioRowIndexById(id);
  if (!rowIndex) return null;
  const headers = sheetPortafolio.getRange(1, 1, 1, sheetPortafolio.getLastColumn()).getValues()[0];
  const urlCol = headers.indexOf('URL_Informe') + 1;
  return urlCol > 0 ? sheetPortafolio.getRange(rowIndex, urlCol).getValue() : null;
}

function findReportUrl(id) {
  const rowIndex = findRowIndexById(id);
  if (!rowIndex) return null;
  const headers = sheetInforme.getRange(1, 1, 1, sheetInforme.getLastColumn()).getValues()[0];
  const urlCol = headers.indexOf('informe_prueba_entrada') + 1;
  return urlCol > 0 ? sheetInforme.getRange(rowIndex, urlCol).getValue() : null;
}

/**
 * AÑADIDO: Encuentra la URL de un Informe Final por su ID.
 */
function findFinalReportUrl(id) {
  const rowIndex = findFinalReportRowIndexById(id);
  if (!rowIndex) return null;
  // Asumiendo que la cabecera es 'URL_Informe' según tu definición de 60 columnas.
  const headers = sheetInformeFinal.getRange(1, 1, 1, sheetInformeFinal.getLastColumn()).getValues()[0];
  const urlCol = headers.indexOf('URL_Informe') + 1;
  return urlCol > 0 ? sheetInformeFinal.getRange(rowIndex, urlCol).getValue() : null;
}

function validateTeacherPassword(teacherName, password) {
  if (!sheetDocente) return false;
  const data = sheetDocente.getDataRange().getValues();
  const headers = data.shift();
  const nameIndex = headers.indexOf('NombreCompleto');
  const passIndex = headers.indexOf('Contraseña');
  if (nameIndex === -1 || passIndex === -1) { throw new Error("La hoja 'docente' no tiene las columnas 'NombreCompleto' y 'Contraseña'."); }
  for (const row of data) {
    if (row[nameIndex] && row[nameIndex].toString().trim() === teacherName.trim()) {
      const storedPassword = row[passIndex].toString();
      return storedPassword ? storedPassword === password : false;
    }
  }
  return false;
}

function getUniqueTeachers(sheet) {
  const numColumns = Math.max(1, sheet.getLastColumn() - 7);
  const values = sheet.getRange(2, 8, sheet.getLastRow() - 1, numColumns).getValues();
  const teacherSet = new Set();
  values.forEach(row => row.forEach(name => { if (name && typeof name === 'string' && name.trim() !== '') { teacherSet.add(name.trim()); } }));
  return Array.from(teacherSet).sort();
}

function findCoursesByTeacher(sheet, teacherName) {
  const data = sheet.getDataRange().getValues();
  data.shift();
  const courses = [];
  data.forEach(row => {
    for (let i = 7; i < row.length; i++) {
      if (row[i] && row[i].toString().trim() === teacherName.trim()) {
        courses.push({ ciclo: row[0], codigo: row[1], nombre: row[2], horas: row[3], creditos: row[4], tipo: row[5], area: row[6], seccion: String.fromCharCode(65 + (i - 7)) });
      }
    }
  });
  return courses;
}

function findTeacherDetails(teacherName) {
  const data = sheetDocente.getDataRange().getValues();
  const headers = data.shift();
  for (const row of data) {
    if (row[0] && row[0].toString().trim() === teacherName.trim()) {
      const details = {};
      headers.forEach((h, i) => { details[h] = row[i]; });
      return details;
    }
  }
  return null;
} 

function sendGenericConfirmationEmail(data, reportUrl, isUpdate, reportTitle, status, detailsHtml) {
  const recipient = (data.docente && data.docente.CorreoElectronico) || (data.details && data.details.CorreoElectronico);
  const ccRecipient = "roblesf17@gmail.com";
  const actionText = "Estado Actualizado";
  const subject = `Confirmación: ${reportTitle} - ${(data.course ? data.course.nombre : data.Nombre_Curso)}`;
  
  const statusHtml = status ? `<tr><td style="padding: 8px; font-weight: bold;">Estado del Informe:</td><td style="padding: 8px;"><span style="background-color: ${status === 'Completado' ? '#e7f4f0' : '#fff9e6'}; color: ${status === 'Completado' ? '#0d875a' : '#b48700'}; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 0.9em;">${status}</span></td></tr>` : '';
  
  let finalDetailsHtml = detailsHtml || '';
  if (reportUrl && !detailsHtml) {
      finalDetailsHtml = `<div style="text-align: center; margin: 20px 0;"><a href="${reportUrl}" style="background-color: #0078d4; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver Informe</a></div>`;
  }

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #0078d4;">Confirmación de Informe ${actionText}</h2>
        <p>Estimado(a) <strong>${(data.docente ? data.docente.NombreCompleto : (data.details ? data.details.NombreCompleto : 'Docente'))}</strong>,</p>
        <p>Le informamos que se ha actualizado el estado del <strong>${reportTitle}</strong> para el siguiente curso:</p>
        <hr>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background-color: #f2f2f2;"><td style="padding: 8px; font-weight: bold;">Asignatura:</td><td style="padding: 8px;">${(data.course ? data.course.codigo : data.Codigo_Curso)} - ${(data.course ? data.course.nombre : data.Nombre_Curso)}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Sección:</td><td style="padding: 8px;">${(data.course ? data.course.seccion : data.Seccion)}</td></tr>
          <tr style="background-color: #f2f2f2;"><td style="padding: 8px; font-weight: bold;">Semestre:</td><td style="padding: 8px;">${(data.semestre || data.Semestre)}</td></tr>
          ${statusHtml}
        </table>
        ${finalDetailsHtml}
        <p style="font-size: 0.9em; color: #777;">Este es un correo generado automáticamente, por favor no responda a este mensaje.</p>
      </div>
    </div>`;
  try {
    if (recipient) {
      MailApp.sendEmail({ to: recipient, cc: ccRecipient, subject: subject, htmlBody: htmlBody });
    }
  } catch (e) {
    Logger.log("Error al enviar el correo de confirmación: " + e.message);
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function getDocPortfolioLabels() {
    return {
        url_cv_personal: "Curriculum Personal", url_cv_icacit: "Curriculum ICACIT", url_examen_entrada: "Examen", url_notas_entrada: "Notas",
        url_silabo_upt: "Silabo UPT", url_silabo_icacit: "Silabo ICACIT", url_notas_u1: "Notas (U1)", url_asistencia_u1: "Asistencia (U1)",
        url_solucion_examen_u1: "Solución Examen (U1)", url_presentaciones_u1: "Presentaciones (U1)", url_guias_lab_u1: "Guías de Laboratorios (U1)", url_otros_recursos_docente_u1: "Otros Recursos (U1)",
        url_examenes_estudiante_u1: "Examenes (U1)", url_practicas_calificadas_u1: "Practicas Calificadas (U1)", url_proyecto_final_u1: "Proyecto Final (U1)", url_otros_recursos_estudiante_u1: "Otros Recursos (U1)",
        url_notas_u2: "Notas (U2)", url_asistencia_u2: "Asistencia (U2)", url_solucion_examen_u2: "Solución Examen (U2)", url_presentaciones_u2: "Presentaciones (U2)",
        url_guias_lab_u2: "Guías de Laboratorios (U2)", url_otros_recursos_docente_u2: "Otros Recursos (U2)", url_examenes_estudiante_u2: "Examenes (U2)", url_practicas_calificadas_u2: "Practicas Calificadas (U2)",
        url_proyecto_final_u2: "Proyecto Final (U2)", url_otros_recursos_estudiante_u2: "Otros Recursos (U2)", url_notas_u3: "Notas (U3)", url_asistencia_u3: "Asistencia (U3)",
        url_solucion_examen_u3: "Solución Examen (U3)", url_presentaciones_u3: "Presentaciones (U3)", url_guias_lab_u3: "Guías de Laboratorios (U3)", url_otros_recursos_docente_u3: "Otros Recursos (U3)",
        url_examenes_estudiante_u3: "Examenes (U3)", url_practicas_calificadas_u3: "Practicas Calificadas (U3)", url_otros_recursos_estudiante_u3: "Otros Recursos",
        url_proyectos_finales_u3: "Carpeta Principal de Proyectos (U3)"
    };
}

function createEmailSummaryHtml(entregados, pendientes) {
    let html = '<hr style="border: none; border-top: 1px solid #eee;" /><p>A continuación, se detalla el estado de las evidencias obligatorias registradas:</p>';
    if (entregados.length > 0) {
        html += `<h4 style="color: #0d875a;">Evidencias Entregadas (${entregados.length}):</h4><ul style="color: #333; list-style-type: none; padding-left: 0;">`;
        entregados.forEach(item => { html += `<li style="margin-bottom: 5px;">✅ ${item}</li>`; });
        html += '</ul>';
    }
    if (pendientes.length > 0) {
        html += `<h4 style="color: #d13438;">Evidencias Pendientes (${pendientes.length}):</h4><ul style="color: #333; list-style-type: none; padding-left: 0;">`;
        pendientes.forEach(item => { html += `<li style="margin-bottom: 5px;">❌ ${item}</li>`; });
        html += '</ul>';
    }
    return html;
}

// --- FUNCIÓN FINAL PARA REPORTE DETALLADO (CABECERAS DE 3 NIVELES) ---
function handleDetailedReportRequest(e) {
  const semestre = e.parameter.semestre;
  const callback = e.parameter.callback;

  const headers = [
    { key: "docente", label: "Docente" }, { key: "curso", label: "Curso" },
    { key: "codigo", label: "Código" }, { key: "ciclo", label: "Ciclo" },
    { key: "seccion", label: "Sección" }, { key: "estadoGeneral", label: "Estado General" },
    
    // Evidencias con categoría y subcategoría
    { key: "status_url_cv_personal", label: "CV Pers.", category: "1. Info General", subcategory: "Documentos" },
    { key: "status_url_cv_icacit", label: "CV ICACIT", category: "1. Info General", subcategory: "Documentos" },
    { key: "status_url_examen_entrada", label: "Ex. Ent.", category: "2. Prueba de Entrada", subcategory: "Resultados" },
    { key: "status_url_notas_entrada", label: "Notas Ent.", category: "2. Prueba de Entrada", subcategory: "Resultados" },
    { key: "status_url_silabo_upt", label: "Sil. UPT", category: "3. Sílabos", subcategory: "Documentos" },
    { key: "status_url_silabo_icacit", label: "Sil. ICACIT", category: "3. Sílabos", subcategory: "Documentos" },
    
    { key: "status_url_notas_u1", label: "Notas", category: "4. Unidad I", subcategory: "Notas/Asistencia" },
    { key: "status_url_asistencia_u1", label: "Asist.", category: "4. Unidad I", subcategory: "Notas/Asistencia" },
    { key: "status_url_solucion_examen_u1", label: "Sol. Ex.", category: "4. Unidad I", subcategory: "Rec. Docente" },
    { key: "status_url_trabajos_encargados_docente_u1", label: "Trab. Enc.", category: "4. Unidad I", subcategory: "Rec. Docente" },
    { key: "status_url_trabajos_encargados_estudiante_u1", label: "Trab. Enc.", category: "4. Unidad I", subcategory: "Rec. Estudiante" },
    
    { key: "status_url_notas_u2", label: "Notas", category: "5. Unidad II", subcategory: "Notas/Asistencia" },
    { key: "status_url_asistencia_u2", label: "Asist.", category: "5. Unidad II", subcategory: "Notas/Asistencia" },
    { key: "status_url_solucion_examen_u2", label: "Sol. Ex.", category: "5. Unidad II", subcategory: "Rec. Docente" },
    { key: "status_url_trabajos_encargados_docente_u2", label: "Trab. Enc.", category: "5. Unidad II", subcategory: "Rec. Docente" },
    { key: "status_url_trabajos_encargados_estudiante_u2", label: "Trab. Enc.", category: "5. Unidad II", subcategory: "Rec. Estudiante" },
    
    { key: "status_url_notas_u3", label: "Notas", category: "6. Unidad III", subcategory: "Notas/Asistencia" },
    { key: "status_url_asistencia_u3", label: "Asist.", category: "6. Unidad III", subcategory: "Notas/Asistencia" },
    { key: "status_url_solucion_examen_u3", label: "Sol. Ex.", category: "6. Unidad III", subcategory: "Rec. Docente" },
    { key: "status_url_trabajos_encargados_docente_u3", label: "Trab. Enc.", category: "6. Unidad III", subcategory: "Rec. Docente" },
    { key: "status_url_trabajos_encargados_estudiante_u3", label: "Trab. Enc.", category: "6. Unidad III", subcategory: "Rec. Estudiante" },
  ];
  
  // (El resto de la función es idéntica y está correcta)
  const sheetCarga = SPREADSHEET.getSheetByName(`carga_${semestre}`);
  if (!sheetCarga) throw new Error(`La hoja de carga para ${semestre} no existe.`);

  const docPortfolioMap = {};
  if (sheetDocPortfolio && sheetDocPortfolio.getLastRow() > 1) {
    const reportData = sheetDocPortfolio.getDataRange().getValues();
    const headers_map = reportData.shift();
    const idIndex = headers_map.indexOf('ID_Unico');
    reportData.forEach(row => {
      const id = row[idIndex];
      const rowObject = {};
      headers_map.forEach((header, i) => { rowObject[header] = row[i]; });
      docPortfolioMap[id] = rowObject;
    });
  }

  const cargaData = sheetCarga.getDataRange().getValues();
  cargaData.shift();
  const results = [];
  const evidenceKeys = headers.filter(h => h.category);

  for (const row of cargaData) {
    const cursoCodigo = row[1];
    const cursoNombre = row[2];
    const ciclo = row[0];

    for (let i = 7; i < row.length; i++) {
      const docenteNombre = row[i];
      if (docenteNombre && typeof docenteNombre === 'string' && docenteNombre.trim() !== '') {
        const seccion = String.fromCharCode(65 + (i - 7));
        const uniqueId = `${semestre}-${cursoCodigo}-${seccion}`;
        const reportData = docPortfolioMap[uniqueId];
        
        let rowResult = {
          docente: docenteNombre.trim(), curso: cursoNombre, codigo: cursoCodigo,
          ciclo: ciclo, seccion: seccion, uniqueId: uniqueId
        };

        if (!reportData) {
          rowResult.estadoGeneral = "Sin Registro";
          evidenceKeys.forEach(h => {
            rowResult[h.key] = { status: '❌', url: '#', names: [] };
          });
        } else {
          rowResult.estadoGeneral = reportData.Estado_Informe || "Pendiente";
          // Usar la caché JSON directamente sin llamar a getFolderStatuses
          evidenceKeys.forEach(h => {
            const key = h.key.replace('status_', '');
            let count = 0;
            let names = [];
            let folderUrl = reportData[key] || '#';
            
            if (reportData[key]) {
               try {
                   const parsed = JSON.parse(reportData[key]);
                   if (parsed && typeof parsed === 'object') {
                       folderUrl = parsed.url || folderUrl;
                       count = parsed.count || 0;
                       names = parsed.names || [];
                   }
               } catch(e) { } // Es una URL antigua texto plano
            }

            if (count > 0) {
              rowResult[h.key] = { status: '✅', url: folderUrl, names: names };
            } else {
              rowResult[h.key] = { status: '🟡', url: folderUrl, names: [] };
            }
          });
        }
        results.push(rowResult);
      }
    }
  }
  
  const jsonResponse = JSON.stringify({ success: true, data: results, headers: headers });
  return ContentService.createTextOutput(`${callback}(${jsonResponse})`).setMimeType(ContentService.MimeType.JAVASCRIPT);
}