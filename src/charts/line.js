const d3 = window.d3;

export function renderLineaTendencia(selector, datos, seleccionado, seleccionadoB) {
  const contenedor = d3.select(selector);
  contenedor.html("");
  const width = contenedor.node().clientWidth || 720;
  const height = 360;
  const margin = { top: 40, right: 30, bottom: 60, left: 70 };
  const svg = contenedor.append("svg").attr("viewBox", `0 0 ${width} ${height}`).style("width", "100%").style("height", "100%");

  const años = datos.nacional.map((d) => d.año);
  const todasLasTasas = [...datos.nacional, ...(datos.estado || []), ...(datos.estadoB || []), ...(datos.tendencia || [])];
  const yMax = d3.max(todasLasTasas, (d) => d.tasa) || 1;

  const xScale = d3.scalePoint().domain(años).range([margin.left, width - margin.right]);
  const yScale = d3.scaleLinear().domain([0, yMax]).nice().range([height - margin.bottom, margin.top]);

  const line = d3.line().x((d) => xScale(d.año)).y((d) => yScale(d.tasa)).curve(d3.curveMonotoneX);

  // Leyenda
  const leyendas = [
    { label: "Nacional", color: "#14b8a6", dash: "none" },
    { label: seleccionado || "Estado A", color: "#f59e0b", dash: "none", hide: !seleccionado },
    { label: seleccionadoB || "Estado B", color: "#ef4444", dash: "none", hide: !seleccionadoB },
    { label: "Tendencia nacional", color: "rgba(255,255,255,0.4)", dash: "4,4" },
  ].filter(l => !l.hide);

  const legendGroup = svg.append("g").attr("transform", `translate(${margin.left}, 20)`);
  
  let currentX = 0;
  leyendas.forEach(l => {
    const lg = legendGroup.append("g").attr("transform", `translate(${currentX}, 0)`);
    lg.append("line").attr("x1", 0).attr("x2", 20).attr("y1", -4).attr("y2", -4).attr("stroke", l.color).attr("stroke-width", 2).attr("stroke-dasharray", l.dash);
    lg.append("text").attr("x", 25).attr("y", 0).attr("fill", "#94a3b8").style("font-size", "10px").text(l.label);
    
    // Calcular ancho aproximado para el siguiente item
    currentX += l.label.length * 6 + 40;
  });

  // Ejes
  svg.append("g").attr("transform", `translate(0, ${height - margin.bottom})`).call(d3.axisBottom(xScale).tickFormat(d3.format("d"))).selectAll("text").attr("fill", "#cbd5e1");
  svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(yScale).ticks(5)).selectAll("text").attr("fill", "#cbd5e1");

  // Título de Ejes
  svg.append("text").attr("x", width / 2).attr("y", height - 10).attr("text-anchor", "middle").attr("fill", "#94a3b8").style("font-size", "12px").text("Año de registro");
  svg.append("text").attr("transform", "rotate(-90)").attr("x", -height / 2).attr("y", 20).attr("text-anchor", "middle").attr("fill", "#94a3b8").style("font-size", "12px").text("Tasa x 10,000 nacimientos");

  // Línea de Tendencia (Regresión)
  svg.append("path").datum(datos.tendencia).attr("fill", "none").attr("stroke", "rgba(255,255,255,0.2)").attr("stroke-width", 2).attr("stroke-dasharray", "4,4").attr("d", line);

  // Línea Nacional
  svg.append("path").datum(datos.nacional).attr("fill", "none").attr("stroke", "#14b8a6").attr("stroke-width", 3).attr("d", line);

  // Línea Estado A
  if (datos.estado) {
    svg.append("path").datum(datos.estado).attr("fill", "none").attr("stroke", "#f59e0b").attr("stroke-width", 3).attr("d", line);
  }

  // Línea Estado B
  if (datos.estadoB) {
    svg.append("path").datum(datos.estadoB).attr("fill", "none").attr("stroke", "#ef4444").attr("stroke-width", 3).attr("d", line);
  }

  d3.selectAll(".line-tooltip").remove();
  const tooltip = d3.select("body").append("div").attr("class", "tooltip line-tooltip").style("opacity", 0);

  // Puntos Nacional
  svg.selectAll("circle.nacional").data(datos.nacional).join("circle").attr("class", "nacional").attr("cx", (d) => xScale(d.año)).attr("cy", (d) => yScale(d.tasa)).attr("r", 5).attr("fill", "#14b8a6").on("mouseenter", (event, d) => {
    tooltip.style("opacity", 1).html(`<strong>Nacional</strong><br/>Año ${d.año}<br/>Tasa ${d.tasa.toFixed(2)}`);
  }).on("mousemove", (event) => {
    tooltip.style("left", `${event.pageX + 12}px`).style("top", `${event.pageY + 12}px`);
  }).on("mouseleave", () => tooltip.style("opacity", 0));

  // Puntos Estado A
  if (datos.estado) {
    svg.selectAll("circle.estado").data(datos.estado).join("circle").attr("class", "estado").attr("cx", (d) => xScale(d.año)).attr("cy", (d) => yScale(d.tasa)).attr("r", 5).attr("fill", "#f59e0b").on("mouseenter", (event, d) => {
      tooltip.style("opacity", 1).html(`<strong>${seleccionado}</strong><br/>Año ${d.año}<br/>Tasa ${d.tasa.toFixed(2)}`);
    }).on("mousemove", (event) => {
      tooltip.style("left", `${event.pageX + 12}px`).style("top", `${event.pageY + 12}px`);
    }).on("mouseleave", () => tooltip.style("opacity", 0));
  }

  // Puntos Estado B
  if (datos.estadoB) {
    svg.selectAll("circle.estadoB").data(datos.estadoB).join("circle").attr("class", "estadoB").attr("cx", (d) => xScale(d.año)).attr("cy", (d) => yScale(d.tasa)).attr("r", 5).attr("fill", "#ef4444").on("mouseenter", (event, d) => {
      tooltip.style("opacity", 1).html(`<strong>${seleccionadoB}</strong><br/>Año ${d.año}<br/>Tasa ${d.tasa.toFixed(2)}`);
    }).on("mousemove", (event) => {
      tooltip.style("left", `${event.pageX + 12}px`).style("top", `${event.pageY + 12}px`);
    }).on("mouseleave", () => tooltip.style("opacity", 0));
  }
}

