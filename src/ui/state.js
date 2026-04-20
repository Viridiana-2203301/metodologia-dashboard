const subscriptores = {};

let estado = {
  datos: null,
  filtros: {
    años: [2021, 2024],
    estado: null,
    estadoB: null,
    sexo: null,
    grupoEda: null,
    tiposDefecto: [],
  },
  cargando: true,
  error: null,
};

export function getEstado() {
  return structuredClone(estado);
}

export function setDatos(datos) {
  estado.datos = datos;
  estado.cargando = false;
  notificar("datos");
}

export function setError(mensaje) {
  estado.error = mensaje;
  estado.cargando = false;
  notificar("error");
}

export function setEstadoSeleccionado(nombre) {
  estado.filtros.estado = nombre || null;
  notificar("filtros");
}

export function setEstadoComparacion(nombre) {
  estado.filtros.estadoB = nombre || null;
  notificar("filtros");
}


export function setRangoAños(min, max) {
  if (min > max) [min, max] = [max, min];
  estado.filtros.años = [Number(min), Number(max)];
  notificar("filtros");
}

export function setSexo(sexo) {
  estado.filtros.sexo = sexo === "null" ? null : sexo;
  notificar("filtros");
}

export function setGrupoEda(grupo) {
  estado.filtros.grupoEda = grupo === "null" ? null : grupo;
  notificar("filtros");
}

export function toggleTipoDefecto(tipo) {
  const lista = estado.filtros.tiposDefecto;
  const index = lista.indexOf(tipo);
  if (index === -1) lista.push(tipo);
  else lista.splice(index, 1);
  notificar("filtros");
}

export function resetFiltros() {
  estado.filtros = {
    años: [2021, 2024],
    estado: null,
    estadoB: null,
    sexo: null,
    grupoEda: null,
    tiposDefecto: [],
  };

  notificar("filtros");
}

export function suscribir(evento, fn) {
  if (!subscriptores[evento]) subscriptores[evento] = [];
  subscriptores[evento].push(fn);
  return () => {
    subscriptores[evento] = subscriptores[evento].filter((handler) => handler !== fn);
  };
}

function notificar(evento) {
  const lista = subscriptores[evento] || [];
  lista.forEach((fn) => {
    try {
      fn(getEstado());
    } catch (error) {
      console.error(`[state] error en suscriptor ${evento}:`, error);
    }
  });
}
