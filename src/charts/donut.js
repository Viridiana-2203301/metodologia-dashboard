const d3 = window.d3;

export function renderDonut(selector, datos, estadoSeleccionado) {
  const contenedor = d3.select(selector);
  contenedor.html("");
  const width = Math.min(480, contenedor.node().clientWidth || 480);
  const height = width;
  const radius = Math.min(width, height) / 2 - 24;
  const svg = contenedor.append("svg").attr("viewBox", `0 0 ${width} ${height}`).style("width", "100%").style("height", "100%");
  const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);

  const filtered = datos.filter((d) => d.cantidad > 0);
  if (!filtered.length) {
    contenedor.append("div").attr("class", "empty-state").text("No hay datos para el filtro seleccionado.");
    return;
  }

  const color = d3.scaleOrdinal().domain(filtered.map((d) => d.tipo)).range(["#ef4444", "#8b5cf6", "#f59e0b", "#14b8a6", "#3b82f6", "#64748b"]);
  const pie = d3.pie().sort(null).value((d) => d.cantidad)(filtered);
  const arc = d3.arc().innerRadius(radius * 0.55).outerRadius(radius);
  const hoverArc = d3.arc().innerRadius(radius * 0.55).outerRadius(radius + 8);

  const estadoActivo = new Set(filtered.map((d) => d.tipo));

  const arcPaths = g.selectAll("path").data(pie).join("path").attr("d", arc).attr("fill", (d) => color(d.data.tipo)).attr("stroke", "#0f172a").attr("stroke-width", 2).style("opacity", 1).on("mouseenter", function (event, d) {
    d3.select(this).transition().duration(150).attr("d", hoverArc);
  }).on("mouseleave", function () {
    d3.select(this).transition().duration(150).attr("d", arc);
  });

  const legend = contenedor.append("div").attr("class", "legend-grid");
  filtered.forEach((item, index) => {
    const row = legend.append("button").attr("type", "button").attr("class", "legend-item");
    row.append("span").attr("class", "legend-swatch").style("background", color(item.tipo));
    row.append("span").attr("class", "legend-label").text(`${item.tipo} (${item.cantidad.toLocaleString("es-MX")})`);
    row.on("click", () => {
      if (estadoActivo.has(item.tipo)) {
        estadoActivo.delete(item.tipo);
      } else {
        estadoActivo.add(item.tipo);
      }
      actualizarVisibilidad(arcPaths, pie, estadoActivo);
      row.classed("legend-item--inactive", !estadoActivo.has(item.tipo));
    });
  });
}

function actualizarVisibilidad(paths, datosPie, estadoActivo) {
  paths.each(function (d) {
    d3.select(this).style("opacity", estadoActivo.has(d.data.tipo) ? 1 : 0.18);
  });
}
