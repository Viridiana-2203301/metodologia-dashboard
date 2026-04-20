const html2canvas = window.html2canvas;

export function inyectarEstilosExportacion() {
  const style = document.createElement("style");
  style.textContent = `
    @media print {
      body { background: white; }
      .page-shell { max-width: 100%; }
    }
  `;
  document.head.appendChild(style);
}

export async function exportarImagen(elemento, formato = "png", nombre = "grafico") {
  if (typeof html2canvas === "undefined") {
    throw new Error("html2canvas no está cargado");
  }
  const canvas = await html2canvas(elemento, {
    backgroundColor: "#0f172a",
    scale: 2,
    useCORS: true,
    logging: false,
  });
  const tipo = formato === "jpg" ? "image/jpeg" : "image/png";
  const calidad = formato === "jpg" ? 0.92 : undefined;
  const dataUrl = canvas.toDataURL(tipo, calidad);
  descargarArchivo(dataUrl, `${nombre}.${formato}`);
}

export async function exportarPDF(contenedor, nombre = "dashboard-defectos-congenitos") {
  if (typeof html2canvas === "undefined") {
    throw new Error("html2canvas no está cargado");
  }
  if (typeof window.jspdf === "undefined") {
    throw new Error("jsPDF no está cargado");
  }
  const canvas = await html2canvas(contenedor, {
    backgroundColor: "#0f172a",
    scale: 1.4,
    useCORS: true,
    logging: false,
  });
  const imgData = canvas.toDataURL("image/jpeg", 0.9);
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const ratio = canvas.width / canvas.height;
  const imgW = pageW;
  const imgH = imgW / ratio;
  pdf.addImage(imgData, "JPEG", 0, 0, imgW, imgH);
  pdf.setProperties({ title: "Dashboard Defectos Congénitos México" });
  pdf.save(`${nombre}.pdf`);
}

function descargarArchivo(dataUrl, nombreArchivo) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = nombreArchivo;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
