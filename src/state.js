// ============================================================
// state.js — Estado global reactivo del dashboard
// Patrón pub/sub simple sin dependencias externas
// ============================================================

const _suscriptores = {};
let _estado = {
  // Datos crudos cargados una sola vez
  datos: null,          // { nacimientos, defunciones }

  // Filtros activos
  filtros: {
    años:        [2021, 2024],
    estado:      null,           // null = vista nacional
    sexo:        null,           // null = ambos
    grupoEda:    null,           // null = todos
    tiposDefecto: [],            // [] = todos
  },

  // Estado de UI
  cargando:    true,
  error:       null,
};

// -----------------------------------------------------------
// Lectura del estado (inmutable hacia afuera)
// -----------------------------------------------------------
export function getEstado() {
  return structuredClone(_estado);
}

export function getFiltros() {
  return structuredClone(_estado.filtros);
}

export function getDatos() {
  return _estado.datos; // referencia, no clonar (pesado)
}

// -----------------------------------------------------------
// Escritura — cada set dispara notificaciones
// -----------------------------------------------------------
export function setDatos(datos) {
  _estado.datos    = datos;
  _estado.cargando = false;
  _notificar("datos");
  _notificar("*");
}

export function setError(msg) {
  _estado.error    = msg;
  _estado.cargando = false;
  _notificar("error");
}

export function setEstadoSeleccionado(estado) {
  _estado.filtros.estado = estado; // null = nacional
  _notificar("filtros");
  _notificar("*");
}

export function setRangoAños(min, max) {
  _estado.filtros.años = [min, max];
  _notificar("filtros");
  _notificar("*");
}

export function setSexo(sexo) {
  _estado.filtros.sexo = sexo; // "F" | "M" | null
  _notificar("filtros");
  _notificar("*");
}

export function setGrupoEda(grupo) {
  _estado.filtros.grupoEda = grupo;
  _notificar("filtros");
  _notificar("*");
}

export function toggleTipoDefecto(tipo) {
  const lista = _estado.filtros.tiposDefecto;
  const idx   = lista.indexOf(tipo);
  if (idx === -1) lista.push(tipo);
  else lista.splice(idx, 1);
  _notificar("filtros");
  _notificar("*");
}

export function resetFiltros() {
  _estado.filtros = {
    años:        [2021, 2024],
    estado:      null,
    sexo:        null,
    grupoEda:    null,
    tiposDefecto: [],
  };
  _notificar("filtros");
  _notificar("*");
}

// -----------------------------------------------------------
// Pub/Sub
// -----------------------------------------------------------
/**
 * Suscribirse a un evento.
 * Eventos: "datos" | "filtros" | "error" | "*"
 * Devuelve función para desuscribirse.
 */
export function suscribir(evento, fn) {
  if (!_suscriptores[evento]) _suscriptores[evento] = [];
  _suscriptores[evento].push(fn);
  return () => {
    _suscriptores[evento] = _suscriptores[evento].filter(f => f !== fn);
  };
}

function _notificar(evento) {
  (_suscriptores[evento] || []).forEach(fn => {
    try { fn(getEstado()); } catch (e) { console.error(`[state] error en suscriptor "${evento}":`, e); }
  });
}
