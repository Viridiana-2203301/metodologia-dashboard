// ============================================================
// export.js — Exportación de gráficos y dashboard completo
// Dependencias CDN: html2canvas 1.4.1, jsPDF 2.5.1
// ============================================================

// -----------------------------------------------------------
// 1. Exportar un elemento DOM como imagen PNG o JPG
// -----------------------------------------------------------
/**
 * @param {HTMLElement} elemento  - nodo DOM a capturar
 * @param {string}      formato   - "png" | "jpg"
 * @param {string}      nombre    - nombre del archivo sin extensión
 */
export async function exportarImagen(elemento, formato = "png", nombre = "grafico") {
  _validarLibrerias();

  const canvas = await html2canvas(elemento, {
    backgroundColor: "#0f172a",   // fondo oscuro del dashboard
    scale:           2,           // 2× para nitidez en pantallas HiDPI
    useCORS:         true,
    logging:         false,
  });

  const tipo     = formato === "jpg" ? "image/jpeg" : "image/png";
  const calidad  = formato === "jpg" ? 0.92 : undefined;
  const dataUrl  = canvas.toDataURL(tipo, calidad);

  _descargar(dataUrl, `${nombre}.${formato}`);
}

// -----------------------------------------------------------
// 2. Exportar el dashboard completo como PDF A4 landscape
// -----------------------------------------------------------
/**
 * @param {HTMLElement} contenedor - elemento raíz del dashboard
 * @param {string}      nombre     - nombre del archivo PDF
 */
export async function exportarPDF(contenedor, nombre = "dashboard-defectos-congenitos") {
  _validarLibrerias();

  // Capturar a alta resolución
  const canvas = await html2canvas(contenedor, {
    backgroundColor: "#0f172a",
    scale:           1.5,
    useCORS:         true,
    logging:         false,
    windowWidth:     1440,       // ancho fijo para consistencia
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.88);

  // jsPDF en modo landscape A4
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: "landscape",
    unit:        "mm",
    format:      "a4",
  });

  const pageW  = pdf.internal.pageSize.getWidth();
  const pageH  = pdf.internal.pageSize.getHeight();
  const ratio  = canvas.width / canvas.height;

  // Ajustar imagen al ancho de la página manteniendo proporción
  let imgW = pageW;
  let imgH = imgW / ratio;

  // Si la imagen es más alta que la página, partir en varias páginas
  let posY = 0;
  while (posY < imgH) {
    if (posY > 0) pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, -posY, imgW, imgH);
    posY += pageH;
  }

  // Metadatos del PDF
  pdf.setProperties({
    title:    "Dashboard Defectos Congénitos México",
    subject:  "Análisis por estado 2021–2024",
    author:   "Dashboard SINAVE",
    creator:  "html2canvas + jsPDF",
  });

  pdf.save(`${nombre}.pdf`);
}

// -----------------------------------------------------------
// 3. Botón de exportación individual para cada gráfico
//    Inyecta un botón ⬇ en la esquina de una card
// -----------------------------------------------------------
/**
 * @param {HTMLElement} card     - contenedor de la card del gráfico
 * @param {string}      idChart  - identificador legible (para el nombre de archivo)
 */
export function agregarBotonExportar(card, idChart) {
  // Evitar duplicados
  if (card.querySelector(".btn-exportar-chart")) return;

  const contenedor = document.createElement("div");
  contenedor.className = "btn-exportar-chart";
  contenedor.innerHTML = `
    <button class="export-btn export-png"  title="Descargar PNG">PNG</button>
    <button class="export-btn export-jpg"  title="Descargar JPG">JPG</button>
  `;

  card.style.position = "relative";
  card.appendChild(contenedor);

  contenedor.querySelector(".export-png").addEventListener("click", (e) => {
    e.stopPropagation();
    exportarImagen(card, "png", `defectos-${idChart}`);
  });

  contenedor.querySelector(".export-jpg").addEventListener("click", (e) => {
    e.stopPropagation();
    exportarImagen(card, "jpg", `defectos-${idChart}`);
  });
}

// -----------------------------------------------------------
// 4. Estilos para los botones de exportación
//    Llamar una vez en la inicialización del dashboard
// -----------------------------------------------------------
export function inyectarEstilosExportacion() {
  if (document.getElementById("export-styles")) return;

  const style = document.createElement("style");
  style.id    = "export-styles";
  style.textContent = `
    .btn-exportar-chart {
      position: absolute;
      top: 10px;
      right: 10px;
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.2s ease;
      z-index: 10;
    }
    .chart-card:hover .btn-exportar-chart,
    .btn-exportar-chart:focus-within {
      opacity: 1;
    }
    .export-btn {
      background: rgba(15, 23, 42, 0.85);
      color: #94a3b8;
      border: 1px solid #334155;
      border-radius: 4px;
      padding: 3px 7px;
      font-size: 10px;
      font-weight: 500;
      cursor: pointer;
      letter-spacing: 0.04em;
      transition: color 0.15s, border-color 0.15s;
    }
    .export-btn:hover {
      color: #14b8a6;
      border-color: #14b8a6;
    }
    /* Botones de exportación global en la barra superior */
    .export-global-bar {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .export-global-btn {
      background: transparent;
      color: #64748b;
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: color 0.2s, border-color 0.2s, background 0.2s;
    }
    .export-global-btn:hover {
      color: #f8fafc;
      border-color: #14b8a6;
      background: rgba(20, 184, 166, 0.08);
    }
    .export-global-btn svg {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }
  `;
  document.head.appendChild(style);
}

// -----------------------------------------------------------
// 5. Utilidades internas
// -----------------------------------------------------------
function _descargar(dataUrl, nombreArchivo) {
  const a      = document.createElement("a");
  a.href       = dataUrl;
  a.download   = nombreArchivo;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function _validarLibrerias() {
  if (typeof html2canvas === "undefined") {
    throw new Error("html2canvas no está cargado. Agrega el script CDN antes de usar export.js");
  }
  if (typeof window.jspdf === "undefined") {
    throw new Error("jsPDF no está cargado. Agrega el script CDN antes de usar export.js");
  }
}
