export const ESTADO_NORM = {
  AGUASCALIENTES: "Aguascalientes",
  "BAJA CALIFORNIA": "Baja California",
  "BAJA CALIFORNIA SUR": "Baja California Sur",
  CAMPECHE: "Campeche",
  CDMX: "Ciudad de México",
  CHIAPAS: "Chiapas",
  CHIHUAHUA: "Chihuahua",
  COAHUILA: "Coahuila",
  COLIMA: "Colima",
  DURANGO: "Durango",
  "ESTADO DE MEXICO": "Estado de México",
  GUANAJUATO: "Guanajuato",
  GUERRERO: "Guerrero",
  HIDALGO: "Hidalgo",
  JALISCO: "Jalisco",
  MICHOACAN: "Michoacán",
  MORELOS: "Morelos",
  NAYARIT: "Nayarit",
  "NUEVO LEON": "Nuevo León",
  OAXACA: "Oaxaca",
  PUEBLA: "Puebla",
  QUERETARO: "Querétaro",
  "QUINTANA ROO": "Quintana Roo",
  "SAN LUIS POTOSI": "San Luis Potosí",
  SINALOA: "Sinaloa",
  SONORA: "Sonora",
  TABASCO: "Tabasco",
  TAMAULIPAS: "Tamaulipas",
  TLAXCALA: "Tlaxcala",
  VERACRUZ: "Veracruz",
  YUCATAN: "Yucatán",
  ZACATECAS: "Zacatecas",
};

export const TIPOS_DEFECTO = [
  "Cardiaco",
  "Sistema Nervioso",
  "Cromosomico",
  "Labio/Paladar",
  "Musculoesqueletico",
  "Otros Defectos",
];

export const INSTITUCIONES = ["IMSS", "ISSSTE", "SSA", "OTRO"];

export const PARTO_TIPOS = ["Vaginal", "Cesarea", "No especificado"];

export const ESTADOS_LISTA = Object.values(ESTADO_NORM).sort();

/**
 * Busca una propiedad en el objeto row de forma robusta, 
 * ignorando mayúsculas/minúsculas y manejando variaciones de "Año" (ao, ao, etc)
 */
function getProp(row, ...keys) {
  const rowKeys = Object.keys(row);
  for (const k of keys) {
    // Intento coincidencia exacta
    if (row[k] !== undefined) return row[k];
    // Intento coincidencia ignorando caso y caracteres especiales
    const normalizedKey = k.toLowerCase().replace(/[ñ]/g, 'n');
    const match = rowKeys.find(rk => {
      const nrk = rk.toLowerCase().replace(/[ñ]/g, 'n');
      return nrk === normalizedKey || nrk === 'ao'; // 'ao' es común en errores de encoding
    });
    if (match) return row[match];
  }
  return null;
}

/**
 * Mapea una edad numérica al grupo estándar usado en Nacimientos.csv
 */
function mapearEdadAGrupo(edad) {
  if (!edad || isNaN(edad)) return "Sin dato";
  if (edad < 20) return "Menor 20";
  if (edad >= 20 && edad <= 35) return "20-35";
  return "Mayor 35";
}


export function normalizarNacimiento(row) {
  const estadoStr = getProp(row, "Estado");
  const estado = ESTADO_NORM[estadoStr?.trim().toUpperCase()];
  if (!estado) return null;
  return {
    sexoBebe: getProp(row, "Sexo_Bebe")?.trim() || null,
    edadMadre: Number(getProp(row, "Edad_Madre")) || null,
    año: Number(getProp(row, "Año", "ao", "año")) || null,
    mes: Number(getProp(row, "Mes")) || null,
    trimestre: mesATrimestre(Number(getProp(row, "Mes"))),
    estado,
    tipoParto: getProp(row, "Tipo_Parto")?.trim() || null,
    grupoEda: getProp(row, "Grupo_Eda")?.trim() || null,
    institucion: getProp(row, "Institucion")?.trim() || null,
  };
}

export function normalizarDefuncion(row) {
  const estadoStr = getProp(row, "Estado");
  const estado = ESTADO_NORM[estadoStr?.trim().toUpperCase()];
  if (!estado) return null;
  const tipoDefecto = getProp(row, "Tipo_Defecto")?.trim();
  
  // Detección flexible de defectog congéntios (ignora acentos y mayúsculas)
  const clasifRaw = getProp(row, "Clasificacion")?.trim() || "";
  const esCongenito = clasifRaw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes("defecto congenito");
  const edadMadre = Number(getProp(row, "Edad_Madre"));

  return {
    sexo: getProp(row, "Sexo")?.trim() || null,
    edadMadre: edadMadre || null,
    grupoEda: mapearEdadAGrupo(edadMadre),
    año: Number(getProp(row, "Año", "ao", "año")) || null,
    mes: Number(getProp(row, "Mes")) || null,
    trimestre: mesATrimestre(Number(getProp(row, "Mes"))),
    cie: getProp(row, "CIE")?.trim() || null,
    clasificacion: clasifRaw,
    esCongenito,
    tipoDefecto: esCongenito ? tipoDefecto : null,
    defectoDescripcion: getProp(row, "Defecto_Descripcion")?.trim() || null,
    estado,
  };
}


export function mesATrimestre(mes) {
  if (mes >= 1 && mes <= 3) return "T1";
  if (mes <= 6) return "T2";
  if (mes <= 9) return "T3";
  return "T4";
}

export function calcularTasa(defunciones, nacimientos) {
  return nacimientos === 0 ? 0 : Number(((defunciones / nacimientos) * 10000).toFixed(2));
}

export function contarPorCampo(lista, campo) {
  return lista.reduce((mapa, fila) => {
    const clave = fila[campo] || "Sin dato";
    mapa[clave] = (mapa[clave] || 0) + 1;
    return mapa;
  }, {});
}

export function aplicarFiltros(datos, filtros) {
  const nacimientos = datos.nacimientos.map(normalizarNacimiento).filter(Boolean);
  const defunciones = datos.defunciones.map(normalizarDefuncion).filter(Boolean);
  const [minAño, maxAño] = filtros.años;

  const cumpleAño = (fila) => fila.año >= minAño && fila.año <= maxAño;
  const cumpleEstado = (fila) => !filtros.estado || fila.estado === filtros.estado;
  const cumpleSexoNac = (fila) => !filtros.sexo || fila.sexoBebe === filtros.sexo;
  const cumpleSexoDef = (fila) => !filtros.sexo || fila.sexo === filtros.sexo;
  const cumpleGrupo = (fila) => !filtros.grupoEda || fila.grupoEda === filtros.grupoEda;
  
  const cumpleTipo = (fila) => {
    if (!filtros.tiposDefecto || filtros.tiposDefecto.length === 0) return true;
    return filtros.tiposDefecto.some(t => {
       const ft = (fila.tipoDefecto || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
       const target = t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
       return ft === target;
    });
  };

  const nacFilt = nacimientos.filter((fila) => cumpleAño(fila) && cumpleEstado(fila) && cumpleSexoNac(fila) && cumpleGrupo(fila));
  const defFilt = defunciones.filter((fila) => cumpleAño(fila) && cumpleEstado(fila) && cumpleSexoDef(fila) && cumpleGrupo(fila));
  const defCongFilt = defFilt.filter((fila) => fila.esCongenito && cumpleTipo(fila));

  return { nacFilt, defFilt, defCongFilt };
}


export function calcularKPIs({ nacFilt, defCongFilt }) {
  const totalNac = nacFilt.length;
  const totalDef = defCongFilt.length;
  const tasaNacional = calcularTasa(totalDef, totalNac);
  const defectoMasFrecuente = obtenerDefectoMasFrecuente(defCongFilt);
  const estadoMayorTasa = obtenerEstadoMayorTasa(nacFilt, defCongFilt);
  
  let rangoAños = "2021–2024";
  if (nacFilt.length > 0) {
    // Calculamos min/max de forma segura para evitar stack overflow
    let minA = Infinity;
    let maxA = -Infinity;
    nacFilt.forEach(r => {
      if (r.año < minA) minA = r.año;
      if (r.año > maxA) maxA = r.año;
    });
    rangoAños = (minA === Infinity) ? "Sin datos" : `${minA}–${maxA}`;
  }
  
  return {
    totalNacimientos: totalNac,
    totalDefunciones: totalDef,
    tasaNacional,
    defectoMasFrecuente,
    estadoMayorTasa: estadoMayorTasa.estado,
    tasaEstadoMayor: estadoMayorTasa.tasa,
    rangoAños,
  };
}

export function calcularPorEstado({ nacFilt, defCongFilt }) {
  const nacPorEstado = contarPorCampo(nacFilt, "estado");
  const defPorEstado = contarPorCampo(defCongFilt, "estado");

  return ESTADOS_LISTA.map((estado) => {
    const nac = nacPorEstado[estado] || 0;
    const def = defPorEstado[estado] || 0;
    const tasa = calcularTasa(def, nac);
    const defectoMas = obtenerDefectoMasFrecuente(defCongFilt.filter((fila) => fila.estado === estado));
    return {
      estado,
      nacimientos: nac,
      defunciones: def,
      tasa,
      defectoMasFrecuente: defectoMas,
    };
  }).filter((item) => item.nacimientos > 0 || item.defunciones > 0);
}

export function calcularSeriesPorAño({ nacFilt, defCongFilt }, filtros) {
  const años = [2021, 2022, 2023, 2024];
  const nacional = años.map((año) => {
    const nac = nacFilt.filter((fila) => fila.año === año).length;
    const def = defCongFilt.filter((fila) => fila.año === año).length;
    return { año, tasa: calcularTasa(def, nac), nacimientos: nac, defunciones: def };
  });

  const res = {
    nacional,
    tendencia: calcularRegresionLineal(nacional),
    estado: filtros.estado ? nacionalEstado(defCongFilt, nacFilt, filtros.estado, años) : null,
    estadoB: filtros.estadoB ? nacionalEstado(defCongFilt, nacFilt, filtros.estadoB, años) : null,
  };

  return res;
}

export function calcularRegresionLineal(datos) {
  if (datos.length < 2) return datos;
  const n = datos.length;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumXX = 0;
  datos.forEach((d, i) => {
    const x = i; // Usamos el índice como X (0, 1, 2...)
    const y = d.tasa;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  });

  const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const b = (sumY - m * sumX) / n;

  return datos.map((d, i) => ({
    año: d.año,
    tasa: m * i + b,
  }));
}


function nacionalEstado(defCongFilt, nacFilt, estado, años) {
  return años.map((año) => {
    const nac = nacFilt.filter((fila) => fila.año === año && fila.estado === estado).length;
    const def = defCongFilt.filter((fila) => fila.año === año && fila.estado === estado).length;
    return { año, tasa: calcularTasa(def, nac), nacimientos: nac, defunciones: def };
  });
}

export function agruparPorTipoDefecto(defCongFilt) {
  const mapa = TIPOS_DEFECTO.reduce((acc, tipo) => ({ ...acc, [tipo]: 0 }), {});
  defCongFilt.forEach((fila) => {
    if (fila.tipoDefecto && fila.tipoDefecto !== "No aplica" && mapa[fila.tipoDefecto] !== undefined) {
      mapa[fila.tipoDefecto] += 1;
    }
  });
  return Object.entries(mapa).map(([tipo, cantidad]) => ({ tipo, cantidad }));
}

export function agruparNacimientosPorInstitucion(nacFilt) {
  const agrupado = INSTITUCIONES.map((institucion) => {
    const totales = PARTO_TIPOS.map((parto) => ({
      label: parto,
      valor: nacFilt.filter((fila) => fila.institucion === institucion && fila.tipoParto === parto).length,
    }));
    return { institucion, valores: totales };
  });
  return agrupado;
}

export function obtenerDefectoMasFrecuente(defCongFilt) {
  const conteo = {};
  defCongFilt.forEach((fila) => {
    if (!fila.tipoDefecto || fila.tipoDefecto === "No aplica") return;
    conteo[fila.tipoDefecto] = (conteo[fila.tipoDefecto] || 0) + 1;
  });
  const max = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
  return max.length ? max[0][0] : "No aplica";
}

export function obtenerEstadoMayorTasa(nacFilt, defCongFilt) {
  const porEstado = calcularPorEstado({ nacFilt, defCongFilt });
  const mayor = porEstado.sort((a, b) => b.tasa - a.tasa)[0] || { estado: "N/A", tasa: 0 };
  return mayor;
}
