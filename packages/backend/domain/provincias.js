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

export function provinciaPorCodigo(codigo) {
  return PROVINCIAS.find((una) => una.codigoProvincia === codigo) ?? null;
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
    PROVINCIAS.find((una) => normalizarTexto(una.nombreProvincia) === clave) ??
    null
  );
}

// req 15: la ubicacion del proyecto es opcional. Si el proyecto la ingresa,
// la provincia es obligatoria pero la ciudad queda opcional. Si no manda ubicacion, se hereda la
// del colectivo; si el colectivo tampoco tiene, queda sin ubicacion.
export function construirUbicacionDeProyecto(ubicacion) {
  if (!ubicacion || typeof ubicacion !== "object") {
    return null;
  }

  const provincia = normalizarProvincia(ubicacion.provincia);

  if (provincia === null) {
    return null;
  }

  return {
    ...PAIS_ARGENTINA,
    codigoProvincia: provincia.codigoProvincia,
    nombreProvincia: provincia.nombreProvincia,
    ciudad: ubicacion.ciudad ?? null,
  };
}

export function ubicacionHeredadaDeColectivo(colectivo) {
  if (!colectivo || !colectivo.ubicacion) {
    return null;
  }

  const provincia = normalizarProvincia(colectivo.ubicacion.provincia);
  if (provincia === null) {
    return null;
  }

  return {
    ...PAIS_ARGENTINA,
    codigoProvincia: provincia.codigoProvincia,
    nombreProvincia: provincia.nombreProvincia,
    ciudad: colectivo.ubicacion.ciudad ?? null,
  };
}
