const KPI_GRID = document.getElementById("kpi-grid");
const KPI_DEFINICIONES = [
  { key: "totalDefunciones", label: "Total defunciones congénitas" },
  { key: "totalNacimientos", label: "Total nacimientos registrados" },
  { key: "tasaNacional", label: "Tasa nacional por 10,000" },
  { key: "estadoMayorTasa", label: "Estado con mayor tasa" },
  { key: "defectoMasFrecuente", label: "Defecto congénito más frecuente" },
  { key: "rangoAños", label: "Rango de años activo" },
];

export function renderKPIs(kpis) {
  KPI_GRID.innerHTML = "";
  KPI_DEFINICIONES.forEach((item) => {
    const value = kpis[item.key];
    const card = document.createElement("article");
    card.className = "kpi-card";
    card.innerHTML = `
      <div class="kpi-label">${item.label}</div>
      <div class="kpi-value">${formatValue(item.key, value)}</div>
    `;
    KPI_GRID.appendChild(card);
  });
}

function formatValue(key, value) {
  if (key === "tasaNacional") {
    return `${Number(value).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (key === "totalNacimientos" || key === "totalDefunciones") {
    return Number(value).toLocaleString("es-MX");
  }
  return value || "—";
}
