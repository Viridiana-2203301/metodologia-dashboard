const d3 = window.d3;
let TOOLTIP = null;

// Mapeo de nombres en el GeoJSON a los nombres normalizados usados en el CSV
const GEOJSON_NOMBRE_MAP = {
  "méxico": "Estado de México",
  "mexico": "Estado de México",
  "veracruz de ignacio de la llave": "Veracruz",
  "coahuila de zaragoza": "Coahuila",
  "michoacán de ocampo": "Michoacán",
};

function obtenerTooltip() {
  if (!TOOLTIP) {
    TOOLTIP = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);
  }
  return TOOLTIP;
}

function obtenerNombre(feature) {
  const raw = feature.properties.name || feature.properties.NOM_ENT || feature.properties.estado || "";
  return GEOJSON_NOMBRE_MAP[raw.toLowerCase()] || raw;
}

export function renderMapa(selector, geojson, datosEstado, seleccionado, onSelect) {
  const contenedor = d3.select(selector);
  contenedor.html("");
  const width = contenedor.node().clientWidth || 900;
  const height = 520;
  const svg = contenedor.append("svg").attr("viewBox", `0 0 ${width} ${height}`).style("width", "100%").style("height", "100%");

  const dataMap = new Map(datosEstado.map((d) => [d.estado.toLowerCase(), d]));
  const maxTasa = d3.max(datosEstado, (d) => d.tasa) || 1;
  const colorScale = d3.scaleSequential().domain([0, maxTasa]).interpolator((t) => d3.interpolateRgb("#e0f2fe", "#dc2626")(t));

  const projection = d3.geoMercator().fitSize([width, height], geojson);
  const path = d3.geoPath().projection(projection);

  svg.selectAll("path")
    .data(geojson.features)
    .join("path")
    .attr("d", path)
    .attr("fill", (feature) => {
      const nombre = obtenerNombre(feature).toLowerCase();
      const item = dataMap.get(nombre);
      return item ? colorScale(item.tasa) : "#1f2937";
    })
    .attr("stroke", "#334155")
    .attr("stroke-width", 1)
    .attr("opacity", (feature) => {
      const nombre = obtenerNombre(feature).toLowerCase();
      const item = dataMap.get(nombre);
      return item ? 1 : 0.55;
    })
    .style("cursor", "pointer")
    .on("mouseenter", (event, feature) => {
      const nombre = obtenerNombre(feature);
      const item = dataMap.get(nombre.toLowerCase()) || { tasa: 0, defunciones: 0, nacimientos: 0, defectoMasFrecuente: "—" };
      obtenerTooltip().style("opacity", 1).html(`
        <strong>${nombre}</strong><br/>
        Tasa: ${item.tasa.toFixed(2)}<br/>
        Defunciones: ${item.defunciones.toLocaleString("es-MX")}<br/>
        Nacimientos: ${item.nacimientos.toLocaleString("es-MX")}<br/>
        Defecto más frecuente: ${item.defectoMasFrecuente}
      `);
    })
    .on("mousemove", (event) => {
      obtenerTooltip().style("left", `${event.pageX + 14}px`).style("top", `${event.pageY + 14}px`);
    })
    .on("mouseleave", () => {
      obtenerTooltip().style("opacity", 0);
    })
    .on("click", (event, feature) => {
      const nombre = obtenerNombre(feature);
      onSelect(nombre.toLowerCase() === (seleccionado || "").toLowerCase() ? null : nombre);
    });

  svg.selectAll("path")
    .filter((feature) => obtenerNombre(feature).toLowerCase() === (seleccionado || "").toLowerCase())
    .attr("stroke", "#f59e0b")
    .attr("stroke-width", 2.5);
}
