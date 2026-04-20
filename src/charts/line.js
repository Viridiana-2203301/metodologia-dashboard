const d3 = window.d3;

export function renderLineaTendencia(selector, datos, seleccionado) {
  const contenedor = d3.select(selector);
  contenedor.html("");
  const width = contenedor.node().clientWidth || 720;
  const height = 360;
  const margin = { top: 24, right: 24, bottom: 40, left: 50 };
  const svg = contenedor.append("svg").attr("viewBox", `0 0 ${width} ${height}`).style("width", "100%").style("height", "100%");

  const años = datos.nacional.map((d) => d.año);
  const yMax = d3.max([...datos.nacional, ...(datos.estado || [])], (d) => d.tasa) || 1;
  const xScale = d3.scalePoint().domain(años).range([margin.left, width - margin.right]);
  const yScale = d3.scaleLinear().domain([0, yMax]).nice().range([height - margin.bottom, margin.top]);

  const line = d3.line().x((d) => xScale(d.año)).y((d) => yScale(d.tasa)).curve(d3.curveMonotoneX);

  svg.append("g").attr("transform", `translate(0, ${height - margin.bottom})`).call(d3.axisBottom(xScale).tickFormat(d3.format("d"))).selectAll("text").attr("fill", "#cbd5e1");
  svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(yScale).ticks(5)).selectAll("text").attr("fill", "#cbd5e1");

  svg.append("path").datum(datos.nacional).attr("fill", "none").attr("stroke", "#14b8a6").attr("stroke-width", 3).attr("d", line);
  if (datos.estado) {
    svg.append("path").datum(datos.estado).attr("fill", "none").attr("stroke", "#f59e0b").attr("stroke-width", 3).attr("d", line);
  }

  d3.selectAll(".line-tooltip").remove();
  const tooltip = d3.select("body").append("div").attr("class", "tooltip line-tooltip").style("opacity", 0);

  svg.selectAll("circle.nacional").data(datos.nacional).join("circle").attr("class", "nacional").attr("cx", (d) => xScale(d.año)).attr("cy", (d) => yScale(d.tasa)).attr("r", 5).attr("fill", "#14b8a6").on("mouseenter", (event, d) => {
    tooltip.style("opacity", 1).html(`<strong>Nacional</strong><br/>Año ${d.año}<br/>Tasa ${d.tasa.toFixed(2)}`);
  }).on("mousemove", (event) => {
    tooltip.style("left", `${event.pageX + 12}px`).style("top", `${event.pageY + 12}px`);
  }).on("mouseleave", () => tooltip.style("opacity", 0));

  if (datos.estado) {
    svg.selectAll("circle.estado").data(datos.estado).join("circle").attr("class", "estado").attr("cx", (d) => xScale(d.año)).attr("cy", (d) => yScale(d.tasa)).attr("r", 5).attr("fill", "#f59e0b").on("mouseenter", (event, d) => {
      tooltip.style("opacity", 1).html(`<strong>Estado</strong><br/>Año ${d.año}<br/>Tasa ${d.tasa.toFixed(2)}`);
    }).on("mousemove", (event) => {
      tooltip.style("left", `${event.pageX + 12}px`).style("top", `${event.pageY + 12}px`);
    }).on("mouseleave", () => tooltip.style("opacity", 0));
  }
}
