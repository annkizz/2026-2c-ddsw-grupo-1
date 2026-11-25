export const PAIS_ARGENTINA = {
  codigoPais: "AR",
  nombrePais: "Argentina",
};

export const PROVINCIAS = [
  {
    codigoProvincia: "AR-C",
    nombreProvincia: "Ciudad Autónoma de Buenos Aires",
  },
  { codigoProvincia: "AR-B", nombreProvincia: "Buenos Aires" },
  { codigoProvincia: "AR-K", nombreProvincia: "Catamarca" },
  { codigoProvincia: "AR-H", nombreProvincia: "Chaco" },
  { codigoProvincia: "AR-U", nombreProvincia: "Chubut" },
  { codigoProvincia: "AR-X", nombreProvincia: "Córdoba" },
  { codigoProvincia: "AR-W", nombreProvincia: "Corrientes" },
  { codigoProvincia: "AR-E", nombreProvincia: "Entre Ríos" },
  { codigoProvincia: "AR-P", nombreProvincia: "Formosa" },
  { codigoProvincia: "AR-Y", nombreProvincia: "Jujuy" },
  { codigoProvincia: "AR-L", nombreProvincia: "La Pampa" },
  { codigoProvincia: "AR-F", nombreProvincia: "La Rioja" },
  { codigoProvincia: "AR-M", nombreProvincia: "Mendoza" },
  { codigoProvincia: "AR-N", nombreProvincia: "Misiones" },
  { codigoProvincia: "AR-Q", nombreProvincia: "Neuquén" },
  { codigoProvincia: "AR-R", nombreProvincia: "Río Negro" },
  { codigoProvincia: "AR-A", nombreProvincia: "Salta" },
  { codigoProvincia: "AR-J", nombreProvincia: "San Juan" },
  { codigoProvincia: "AR-D", nombreProvincia: "San Luis" },
  { codigoProvincia: "AR-Z", nombreProvincia: "Santa Cruz" },
  { codigoProvincia: "AR-S", nombreProvincia: "Santa Fe" },
  { codigoProvincia: "AR-G", nombreProvincia: "Santiago del Estero" },
  {
    codigoProvincia: "AR-V",
    nombreProvincia: "Tierra del Fuego, Antártida e Islas del Atlántico Sur",
  },
  { codigoProvincia: "AR-T", nombreProvincia: "Tucumán" },
];

const ALIAS = {
  caba: "AR-C",
  "capital federal": "AR-C",
  "ciudad de buenos aires": "AR-C",
  "ciudad autonoma de buenos aires": "AR-C",
  "tierra del fuego": "AR-V",
};

function normalizarTexto(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function normalizarCoordenadas(latitud, longitud) {
  const latitudVacia =
    latitud == null || (typeof latitud === "string" && latitud.trim() === "");
  const longitudVacia =
    longitud == null ||
    (typeof longitud === "string" && longitud.trim() === "");

  if (latitudVacia && longitudVacia) {
    return {};
  }
  if (latitudVacia || longitudVacia) {
    return null;
  }

  const latitudNumerica = Number(latitud);
  const longitudNumerica = Number(longitud);
  if (
    !Number.isFinite(latitudNumerica) ||
    !Number.isFinite(longitudNumerica) ||
    latitudNumerica < -90 ||
    latitudNumerica > 90 ||
    longitudNumerica < -180 ||
    longitudNumerica > 180
  ) {
    return null;
  }

  return { latitud: latitudNumerica, longitud: longitudNumerica };
}

export function provinciaPorCodigo(codigo) {
  return PROVINCIAS.find((una) => una.codigoProvincia === codigo) ?? null;
}

export function normalizarPais(texto) {
  if (typeof texto !== "string") {
    return null;
  }

  const clave = normalizarTexto(texto);
  return clave === "argentina" || clave === "ar" ? PAIS_ARGENTINA : null;
}

export function normalizarProvincia(texto) {
  if (typeof texto !== "string") {
    return null;
  }

  const clave = normalizarTexto(texto);
  if (clave === "") {
    return null;
  }

  if (/^ar-[a-z]$/.test(clave)) {
    return provinciaPorCodigo(clave.toUpperCase());
  }

  const codigoAlias = ALIAS[clave];
  if (codigoAlias !== undefined) {
    return provinciaPorCodigo(codigoAlias);
  }

  return (
    PROVINCIAS.find(
      (una) => normalizarTexto(una.nombreProvincia) === clave,
    ) ?? null
  );
}

// req 15: la ubicación del proyecto es opcional y no se hereda del colectivo.
// Si se declara, debe incluir país, provincia, localidad y coordenadas exactas.
export function construirUbicacionDeProyecto(ubicacion) {
  if (!ubicacion || typeof ubicacion !== "object") {
    return null;
  }

  const pais = normalizarPais(ubicacion.pais);
  const provincia = normalizarProvincia(ubicacion.provincia);
  const ciudad =
    typeof ubicacion.ciudad === "string" ? ubicacion.ciudad.trim() : "";

  if (pais === null || provincia === null || ciudad === "") {
    return null;
  }

  const coordenadas = normalizarCoordenadas(
    ubicacion.latitud,
    ubicacion.longitud,
  );
  if (
    coordenadas === null ||
    coordenadas.latitud === undefined ||
    coordenadas.longitud === undefined
  ) {
    return null;
  }

  return {
    ...pais,
    codigoProvincia: provincia.codigoProvincia,
    nombreProvincia: provincia.nombreProvincia,
    ciudad,
    direccion:
      typeof ubicacion.direccion === "string" && ubicacion.direccion.trim()
        ? ubicacion.direccion.trim()
        : null,
    ...coordenadas,
  };
}
