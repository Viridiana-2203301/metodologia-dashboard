import { cargarDatos, cargarGeoJSON } from "./data/loader.js";
import {
  aplicarFiltros,
  calcularKPIs,
  calcularPorEstado,
  calcularSeriesPorAño,
  agruparPorTipoDefecto,
  agruparNacimientosPorInstitucion,
  obtenerDefectoMasFrecuente,
  obtenerEstadoMayorTasa,
  TIPOS_DEFECTO,
} from "./data/transforms.js";
import {
  getEstado,
  suscribir,
  setDatos,
  setError,
  setEstadoSeleccionado,
  resetFiltros,
  setRangoAños,
  setSexo,
  setGrupoEda,
  toggleTipoDefecto,
} from "./ui/state.js";
import { setupFiltros } from "./ui/filters.js";
import { renderKPIs } from "./ui/kpis.js";
import { inyectarEstilosExportacion, exportarPDF, exportarImagen } from "./ui/export.js";
import { renderMapa } from "./charts/map.js";
import { renderTopEstados, renderNacimientosAgrupados } from "./charts/bars.js";
import { renderLineaTendencia } from "./charts/line.js";
import { renderDonut } from "./charts/donut.js";

const GEO_URL = "./datasets/mexico.geojson";
const ROOT = document.documentElement;
const OVERLAY = document.getElementById("page-overlay");
const RESET_BTN = document.getElementById("reset-filtros");
const EXPORT_PDF = document.getElementById("export-pdf");
const EXPORT_PNG = document.getElementById("export-dashboard-png");
const ORDEN_TOGGLE = document.getElementById("orden-toggle");

let ordenAscendente = false;
let mapaData = null;

function mostrarCarga(vis) {
  OVERLAY.classList.toggle("hidden", !vis);
}

function obtenerDatosFiltrados() {
  const { datos, filtros } = getEstado();
  if (!datos) return null;
  return aplicarFiltros(datos, filtros);
}

function actualizarDashboard() {
  const estadoGlobal = getEstado();
  const filtros = estadoGlobal.filtros;
  const datosFiltrados = obtenerDatosFiltrados();
  if (!datosFiltrados) return;

  const kpis = calcularKPIs(datosFiltrados);
  const estados = calcularPorEstado(datosFiltrados);
  const tendencias = calcularSeriesPorAño(datosFiltrados, filtros);
  const defectos = agruparPorTipoDefecto(datosFiltrados.defCongFilt);
  const agrupadoNac = agruparNacimientosPorInstitucion(datosFiltrados.nacFilt);

  renderKPIs(kpis);
  renderMapa("#mapa-mexico", mapaData, estados, filtros.estado, setEstadoSeleccionado);
  renderTopEstados("#top-estados", estados, filtros.estado, ordenAscendente, setEstadoSeleccionado);
  renderLineaTendencia("#linea-tendencia", tendencias, filtros.estado);
  renderDonut("#donut-defectos", defectos, filtros.estado);
  renderNacimientosAgrupados("#barras-grupo", agrupadoNac);
}

async function initDashboard() {
  mostrarCarga(true);
  try {
    inyectarEstilosExportacion();

    const [geojson, data] = await Promise.all([
      cargarGeoJSON(GEO_URL),
      cargarDatos("./datasets/Nacimientos.csv", "./datasets/Defunciones.csv"),
    ]);

    mapaData = geojson;
    setDatos({ ...data, geojson });

    setupFiltros({
      tiposDefecto: TIPOS_DEFECTO,
      onSelectSexo: setSexo,
      onSelectGrupo: setGrupoEda,
      onToggleDefecto: toggleTipoDefecto,
      onSetRangoAños: setRangoAños,
      onReset: () => {
        resetFiltros();
        ordenAscendente = false;
        ORDEN_TOGGLE.textContent = "Descendente";
      },
    });

    ORDEN_TOGGLE.addEventListener("click", () => {
      ordenAscendente = !ordenAscendente;
      ORDEN_TOGGLE.textContent = ordenAscendente ? "Ascendente" : "Descendente";
      actualizarDashboard();
    });

    EXPORT_PDF.addEventListener("click", async () => {
      await exportarPDF(document.querySelector(".page-shell"));
    });

    EXPORT_PNG.addEventListener("click", async () => {
      await exportarImagen(document.querySelector(".page-shell"), "png", "dashboard-defectos-congenitos");
    });

    suscribir("datos", () => {
      actualizarDashboard();
    });
    suscribir("filtros", () => {
      actualizarDashboard();
    });

    actualizarDashboard();
  } catch (error) {
    console.error(error);
    setError("No se pudieron cargar los datos. Inténtalo nuevamente más tarde.");
  } finally {
    mostrarCarga(false);
  }
}

// Espera a que los CDNs globales estén disponibles antes de iniciar
async function esperarLibrerias() {
  return new Promise((resolve) => {
    const verificar = setInterval(() => {
      if (typeof window.d3 !== "undefined" && typeof window.Papa !== "undefined" && typeof window.html2canvas !== "undefined") {
        clearInterval(verificar);
        resolve();
      }
    }, 100);
    // Timeout de seguridad
    setTimeout(() => {
      clearInterval(verificar);
      resolve();
    }, 5000);
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  await esperarLibrerias();
  initDashboard();
});
