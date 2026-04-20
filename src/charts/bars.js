const d3 = window.d3;

export function renderTopEstados(selector, estados, seleccionado, ascendente, onSelect) {
  const contenedor = d3.select(selector);
  contenedor.html("");
  const datos = estados
    .filter((item) => item.nacimientos > 0)
    .sort((a, b) => (ascendente ? a.tasa - b.tasa : b.tasa - a.tasa))
    .slice(0, 15);

  const maxTasa = d3.max(datos, (d) => d.tasa) || 1;
  const lista = contenedor.append("div").attr("class", "top-list");

  const item = lista.selectAll(".top-item").data(datos).join("div").attr("class", "top-item").style("cursor", "pointer").on("click", (event, d) => onSelect(d.estado));

  item.append("div").attr("class", "top-item-label").text((d, i) => `${i + 1}. ${d.estado}`);
  item.append("div").attr("class", "top-gap").append("div").attr("class", "top-bar").style("width", (d) => `${(d.tasa / maxTasa) * 100}%`).style("background", (d) => (d.estado === seleccionado ? "var(--accent)" : "#38bdf8"));
  item.append("div").attr("class", "top-item-value").text((d) => `${d.tasa.toFixed(2)}`);
}

export function renderNacimientosAgrupados(selector, datos) {
  const contenedor = d3.select(selector);
  contenedor.html("");
  const maxValor = d3.max(datos.flatMap((item) => item.valores.map((v) => v.valor))) || 1;
  const chart = contenedor.append("div").attr("class", "grouped-grid");

  datos.forEach((item) => {
    const card = chart.append("div").attr("class", "group-card");
    card.append("div").attr("class", "group-title").text(item.institucion);
    const bars = card.append("div").attr("class", "group-bars");
    item.valores.forEach((serie) => {
      const row = bars.append("div").attr("class", "group-row");
      row.append("span").attr("class", "group-row-label").text(serie.label);
      row.append("div").attr("class", "group-row-track").append("div").attr("class", "group-row-fill").style("width", `${(serie.valor / maxValor) * 100}%`);
      row.append("span").attr("class", "group-row-value").text(serie.valor.toLocaleString("es-MX"));
    });
  });
}
