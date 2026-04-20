// ============================================================
// transforms.js — Carga, normalización y cálculo de métricas
// Datos: Nacimientos.csv + Defunciones.csv (sep=;, latin1)
// ============================================================

// -----------------------------------------------------------
// 1. Mapa de normalización: clave CSV → nombre para UI y GeoJSON
// -----------------------------------------------------------
export const ESTADO_NORM = {
  "AGUASCALIENTES":      "Aguascalientes",
  "BAJA CALIFORNIA":     "Baja California",
  "BAJA CALIFORNIA SUR": "Baja California Sur",
  "CAMPECHE":            "Campeche",
  "CDMX":                "Ciudad de México",
  "CHIAPAS":             "Chiapas",
  "CHIHUAHUA":           "Chihuahua",
  "COAHUILA":            "Coahuila",
  "COLIMA":              "Colima",
  "DURANGO":             "Durango",
  "ESTADO DE MEXICO":    "Estado de México",
  "GUANAJUATO":          "Guanajuato",
  "GUERRERO":            "Guerrero",
  "HIDALGO":             "Hidalgo",
  "JALISCO":             "Jalisco",
  "MICHOACAN":           "Michoacán",
  "MORELOS":             "Morelos",
  "NAYARIT":             "Nayarit",
  "NUEVO LEON":          "Nuevo León",
  "OAXACA":              "Oaxaca",
  "PUEBLA":              "Puebla",
  "QUERETARO":           "Querétaro",
  "QUINTANA ROO":        "Quintana Roo",
  "SAN LUIS POTOSI":     "San Luis Potosí",
  "SINALOA":             "Sinaloa",
  "SONORA":              "Sonora",
  "TABASCO":             "Tabasco",
  "TAMAULIPAS":          "Tamaulipas",
  "TLAXCALA":            "Tlaxcala",
  "VERACRUZ":            "Veracruz",
  "YUCATAN":             "Yucatán",
  "ZACATECAS":           "Zacatecas",
};

// Inverso: nombre UI → clave CSV (útil para filtros)
export const ESTADO_KEY = Object.fromEntries(
  Object.entries(ESTADO_NORM).map(([k, v]) => [v, k])
);

export const ESTADOS_LISTA = Object.values(ESTADO_NORM).sort();

// -----------------------------------------------------------
// 2. Etiquetas en español para campos categóricos
// -----------------------------------------------------------
export const TIPO_DEFECTO_LABEL = {
  "Cardiaco":            "Cardíaco",
  "Sistema Nervioso":    "Sistema Nervioso",
  "Cromosomico":         "Cromosómico",
  "Labio/Paladar":       "Labio / Paladar",
  "Musculoesqueletico":  "Musculoesquelético",
  "Otros Defectos":      "Otros Defectos",
};

export const TIPO_DEFECTO_COLOR = {
  "Cardiaco":            "#ef4444",
  "Sistema Nervioso":    "#8b5cf6",
  "Cromosomico":         "#f59e0b",
  "Labio/Paladar":       "#14b8a6",
  "Musculoesqueletico":  "#3b82f6",
  "Otros Defectos":      "#64748b",
};

export const INSTITUCION_LABEL = {
  "IMSS":   "IMSS",
  "ISSSTE": "ISSSTE",
  "SSA":    "SSA / Secretaría de Salud",
  "OTRO":   "Otro",
};

export const GRUPO_EDA_LABEL = {
  "Menor 20": "Menor de 20 años",
  "20-35":    "20 a 35 años",
  "Mayor 35": "Mayor de 35 años",
};

// -----------------------------------------------------------
// 3. Cargador de CSV con PapaParse
//    Devuelve Promise<{ nacimientos: Array, defunciones: Array }>
// -----------------------------------------------------------
export async function cargarDatos(rutaNac = "./Nacimientos.csv", rutaDef = "./Defunciones.csv") {
  const [rawNac, rawDef] = await Promise.all([
    parsearCSV(rutaNac),
    parsearCSV(rutaDef),
  ]);

  const nacimientos  = rawNac.map(normalizarNacimiento).filter(Boolean);
  const defunciones  = rawDef.map(normalizarDefuncion).filter(Boolean);

  return { nacimientos, defunciones };
}

function parsearCSV(ruta) {
  return new Promise((resolve, reject) => {
    Papa.parse(ruta, {
      download:       true,
      header:         true,
      delimiter:      ";",
      encoding:       "latin1",
      skipEmptyLines: true,
      complete: (r) => resolve(r.data),
      error:    (e) => reject(e),
    });
  });
}

// -----------------------------------------------------------
// 4. Normalización de filas
// -----------------------------------------------------------
function normalizarNacimiento(row) {
  const estado = ESTADO_NORM[row["Estado"]?.trim().toUpperCase()];
  if (!estado) return null;

  return {
    sexoBebe:    row["Sexo_Bebe"]?.trim() || null,
    edadMadre:   parseInt(row["Edad_Madre"]) || null,
    año:         parseInt(row["Año"]),
    mes:         parseInt(row["Mes"]),
    trimestre:   mesATrimestre(parseInt(row["Mes"])),
    estado,
    tipoParto:   row["Tipo_Parto"]?.trim() || null,
    grupoEda:    row["Grupo_Eda"]?.trim() || null,
    institucion: row["Institucion"]?.trim() || null,
  };
}

function normalizarDefuncion(row) {
  const estado = ESTADO_NORM[row["Estado"]?.trim().toUpperCase()];
  if (!estado) return null;

  const tipoDefecto = row["Tipo_Defecto"]?.trim();
  const esCongenito = row["Clasificacion"]?.trim() === "Defecto Congenito";

  return {
    sexo:               row["Sexo"]?.trim() || null,
    edadMadre:          parseInt(row["Edad_Madre"]) || null,
    año:                parseInt(row["Año"]),
    mes:                parseInt(row["Mes"]),
    trimestre:          mesATrimestre(parseInt(row["Mes"])),
    cie:                row["CIE"]?.trim() || null,
    clasificacion:      row["Clasificacion"]?.trim() || null,
    esCongenito,
    tipoDefecto:        esCongenito ? tipoDefecto : null,
    defectoDescripcion: row["Defecto_Descripcion"]?.trim() || null,
    estado,
  };
}

function mesATrimestre(mes) {
  if (mes <= 3)  return "T1";
  if (mes <= 6)  return "T2";
  if (mes <= 9)  return "T3";
  return "T4";
}

// -----------------------------------------------------------
// 5. Motor de filtros — devuelve subsets filtrados
// -----------------------------------------------------------
/**
 * @param {Object} datos        - { nacimientos, defunciones }
 * @param {Object} filtros      - ver estructura abajo
 * @returns {{ nacFilt, defFilt, defCongFilt }}
 *
 * filtros = {
 *   años:        [2021, 2024],        // rango inclusivo
 *   estado:      "Jalisco" | null,    // null = nacional
 *   sexo:        "F" | "M" | null,
 *   grupoEda:    "Menor 20" | "20-35" | "Mayor 35" | null,
 *   tiposDefecto: ["Cardiaco", ...] | null,  // null = todos
 * }
 */
export function aplicarFiltros(datos, filtros = {}) {
  const { nacimientos, defunciones } = datos;
  const { años = [2021, 2024], estado = null, sexo = null, grupoEda = null, tiposDefecto = null } = filtros;

  const enRango = (r) => r.año >= años[0] && r.año <= años[1];
  const enEstado = (r) => !estado || r.estado === estado;

  const nacFilt = nacimientos.filter(r =>
    enRango(r) &&
    enEstado(r) &&
    (!sexo    || r.sexoBebe  === sexo) &&
    (!grupoEda || r.grupoEda === grupoEda)
  );

  const defFilt = defunciones.filter(r =>
    enRango(r) &&
    enEstado(r) &&
    (!sexo || r.sexo === sexo)
  );

  const defCongFilt = defFilt.filter(r =>
    r.esCongenito &&
    (!tiposDefecto || tiposDefecto.length === 0 || tiposDefecto.includes(r.tipoDefecto))
  );

  return { nacFilt, defFilt, defCongFilt };
}

// -----------------------------------------------------------
// 6. Cálculos de métricas
// -----------------------------------------------------------

/** Tasa por 10,000 nacimientos */
export function calcularTasa(defunciones, nacimientos) {
  if (!nacimientos || nacimientos === 0) return 0;
  return parseFloat(((defunciones / nacimientos) * 10000).toFixed(2));
}

/** KPIs nacionales o por estado */
export function calcularKPIs({ nacFilt, defCongFilt }) {
  const totalNac  = nacFilt.length;
  const totalDef  = defCongFilt.length;
  const tasaMedia = calcularTasa(totalDef, totalNac);

  // Defecto más frecuente (excluye "No aplica")
  const conteoTipos = contarPorCampo(defCongFilt, "tipoDefecto");
  const defectoTop  = Object.entries(conteoTipos)
    .filter(([k]) => k && k !== "No aplica")
    .sort((a, b) => b[1] - a[1])[0];

  // Estado con mayor tasa
  const porEstado = calcularPorEstado({ nacFilt, defCongFilt });
  const estadoTop = porEstado.sort((a, b) => b.tasa - a.tasa)[0];

  return {
    totalNacimientos:     totalNac,
    totalDefunciones:     totalDef,
    tasaNacional:         tasaMedia,
    defectoMasFrecuente:  defectoTop ? TIPO_DEFECTO_LABEL[defectoTop[0]] || defectoTop[0] : "—",
    estadoMayorTasa:      estadoTop?.estado || "—",
    tasaEstadoMayor:      estadoTop?.tasa   || 0,
  };
}

/** Agrupación por estado para el mapa y barras */
export function calcularPorEstado({ nacFilt, defCongFilt }) {
  const nacPorEstado  = contarPorCampo(nacFilt,      "estado");
  const defPorEstado  = contarPorCampo(defCongFilt,  "estado");

  return ESTADOS_LISTA.map(estado => {
    const nac = nacPorEstado[estado]  || 0;
    const def = defPorEstado[estado]  || 0;

    // Defecto más frecuente en este estado
    const defsDef = defCongFilt.filter(r => r.estado === estado && r.tipoDefecto && r.tipoDefecto !== "No aplica");
    const tipoTop = Object.entries(contarPorCampo(defsDef, "tipoDefecto"))
      .sort((a, b) => b[1] - a[1])[0];

    return {
      estado,
      nacimientos:  nac,
      defunciones:  def,
      tasa:         calcularTasa(def, nac),
      tipoTopLabel: tipoTop ? (TIPO_DEFECTO_LABEL[tipoTop[0]] || tipoTop[0]) : "—",
    };
  });
}

/** Serie temporal año a año */
export function calcularTendencia({ nacFilt, defCongFilt }, años = [2021, 2022, 2023, 2024]) {
  return años.map(año => {
    const nac = nacFilt.filter(r => r.año === año).length;
    const def = defCongFilt.filter(r => r.año === año).length;
    return { año, nacimientos: nac, defunciones: def, tasa: calcularTasa(def, nac) };
  });
}

/** Distribución por Tipo_Defecto (excluye "No aplica") */
export function calcularPorTipoDefecto(defCongFilt) {
  const conteo = contarPorCampo(
    defCongFilt.filter(r => r.tipoDefecto && r.tipoDefecto !== "No aplica"),
    "tipoDefecto"
  );
  return Object.entries(conteo)
    .map(([tipo, count]) => ({
      tipo,
      label: TIPO_DEFECTO_LABEL[tipo] || tipo,
      color: TIPO_DEFECTO_COLOR[tipo] || "#94a3b8",
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

/** Nacimientos por institución */
export function calcularPorInstitucion(nacFilt) {
  const conteo = contarPorCampo(nacFilt, "institucion");
  return Object.entries(conteo)
    .map(([inst, count]) => ({
      institucion: inst,
      label: INSTITUCION_LABEL[inst] || inst,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

/** Nacimientos por tipo de parto */
export function calcularPorTipoParto(nacFilt) {
  return Object.entries(contarPorCampo(nacFilt, "tipoParto"))
    .map(([tipo, count]) => ({ tipo, count }))
    .sort((a, b) => b.count - a.count);
}

// -----------------------------------------------------------
// 7. Utilidades internas
// -----------------------------------------------------------
function contarPorCampo(arr, campo) {
  return arr.reduce((acc, r) => {
    const val = r[campo];
    if (val != null) acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
}
