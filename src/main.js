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
  ESTADOS_LISTA,
} from "./data/transforms.js";

import {
  getEstado,
  suscribir,
  setDatos,
  setError,
  setEstadoSeleccionado,
  setEstadoComparacion,
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

  // Remover efectos de carga (skeletons)
  document.querySelectorAll(".skeleton").forEach((el) => el.classList.remove("skeleton"));

  const kpis = calcularKPIs(datosFiltrados);
  const estados = calcularPorEstado(datosFiltrados);
  const tendencias = calcularSeriesPorAño(datosFiltrados, filtros);
  const defectos = agruparPorTipoDefecto(datosFiltrados.defCongFilt);
  const agrupadoNac = agruparNacimientosPorInstitucion(datosFiltrados.nacFilt);

  renderKPIs(kpis);
  renderMapa("#mapa-mexico", mapaData, estados, filtros.estado, setEstadoSeleccionado);
  renderTopEstados("#top-estados", estados, filtros.estado, ordenAscendente, setEstadoSeleccionado);
  renderLineaTendencia("#linea-tendencia", tendencias, filtros.estado, filtros.estadoB);
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
        document.getElementById("filtro-estado").value = "";
        document.getElementById("filtro-estado-b").value = "";
      },
    });

    // Poblar selectores de estado
    const selA = document.getElementById("filtro-estado");
    const selB = document.getElementById("filtro-estado-b");
    ESTADOS_LISTA.forEach(edo => {
      const optA = document.createElement("option");
      optA.value = edo; optA.textContent = edo;
      selA.appendChild(optA);
      
      const optB = document.createElement("option");
      optB.value = edo; optB.textContent = edo;
      selB.appendChild(optB);
    });

    selA.addEventListener("change", (e) => setEstadoSeleccionado(e.target.value));
    selB.addEventListener("change", (e) => setEstadoComparacion(e.target.value));


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

    // Enlaces para exportación individual de gráficas
    document.querySelectorAll(".export-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const targetId = btn.dataset.target;
        const formato = btn.dataset.format;
        const elemento = document.getElementById(targetId);
        const titulo = elemento.querySelector("h2").textContent.toLowerCase().replace(/\s+/g, "-");
        
        // Ocultar botones temporalmente durante la captura
        const actions = elemento.querySelector(".export-actions");
        actions.style.display = "none";
        
        try {
          await exportarImagen(elemento, formato, `grafico-${titulo}`);
        } finally {
          actions.style.display = "flex";
        }
      });
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
