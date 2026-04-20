const labelMin = document.getElementById("label-rango-min");
const labelMax = document.getElementById("label-rango-max");
const rangoMin = document.getElementById("rango-min");
const rangoMax = document.getElementById("rango-max");
const chipsContainer = document.getElementById("chips-tipos-defecto");
const sexoButtons = Array.from(document.querySelectorAll(".toggle-group[data-group='sexo'] button"));
const edadButtons = Array.from(document.querySelectorAll(".toggle-group[data-group='edad'] button"));

export function setupFiltros({ tiposDefecto, onSelectSexo, onSelectGrupo, onToggleDefecto, onSetRangoAños, onReset }) {
  populateTipoDefectoChips(tiposDefecto, onToggleDefecto);
  setupRangoAños(onSetRangoAños);
  setupToggleGroup("sexo", onSelectSexo);
  setupToggleGroup("edad", onSelectGrupo);
  document.getElementById("reset-filtros").addEventListener("click", onReset);
}

function setupRangoAños(onSetAños) {
  labelMin.textContent = rangoMin.value;
  labelMax.textContent = rangoMax.value;

  const actualizar = (event) => {
    let min = Number(rangoMin.value);
    let max = Number(rangoMax.value);
    if (min > max) {
      if (event.target === rangoMin) rangoMin.value = max;
      else rangoMax.value = min;
      min = Number(rangoMin.value);
      max = Number(rangoMax.value);
    }
    labelMin.textContent = rangoMin.value;
    labelMax.textContent = rangoMax.value;
    onSetAños(min, max);
  };

  rangoMin.addEventListener("input", actualizar);
  rangoMax.addEventListener("input", actualizar);
}

function setupToggleGroup(name, callback) {
  const group = document.querySelector(`.toggle-group[data-group='${name}']`);
  if (!group) return;
  group.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      group.querySelectorAll("button").forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      callback(button.dataset[name]);
    });
  });
}

function populateTipoDefectoChips(tipos, onToggleDefecto) {
  chipsContainer.innerHTML = "";
  tipos.forEach((tipo) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = tipo;
    chip.dataset.tipo = tipo;
    chip.addEventListener("click", () => {
      chip.classList.toggle("selected");
      onToggleDefecto(tipo);
    });
    chipsContainer.appendChild(chip);
  });
}
