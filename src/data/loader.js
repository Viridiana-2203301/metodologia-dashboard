const Papa = window.Papa;

export async function cargarDatos(rutaNac, rutaDef) {
  const [nacimientos, defunciones] = await Promise.all([
    parsearCSV(rutaNac),
    parsearCSV(rutaDef),
  ]);
  return { nacimientos, defunciones };
}

export async function cargarGeoJSON(url) {
  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    throw new Error(`No se pudo descargar GeoJSON: ${respuesta.status}`);
  }
  return respuesta.json();
}

function parsearCSV(ruta) {
  return new Promise((resolve, reject) => {
    Papa.parse(ruta, {
      download: true,
      header: true,
      delimiter: ";",
      encoding: "latin1",
      skipEmptyLines: true,
      complete: (resultado) => resolve(resultado.data),
      error: (error) => reject(error),
    });
  });
}
