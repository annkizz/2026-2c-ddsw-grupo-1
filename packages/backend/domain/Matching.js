import { normalizarHabilidad } from "../repositories/HabilidadRepository.js";

const sinRepetidas = (habilidades = []) => {
  const unicas = [];
  for (const titulo of habilidades) {
    const codigo = normalizarHabilidad(titulo);
    const repetida = unicas.some((guardada) => guardada.codigo === codigo);
    if (codigo !== "" && !repetida) {
      unicas.push({ codigo, titulo });
    }
  }
  return unicas;
};

export function evaluarCoincidencia(perfil, habilidadesPersona) {
  return crearEvaluadorCoincidencia(habilidadesPersona)(perfil);
}

// cada requerida vale 2 y cada opcional 1
export function puntajeDeCoincidencia({
  requeridasCoincidentes = [],
  opcionalesCoincidentes = [],
} = {}) {
  return requeridasCoincidentes.length * 2 + opcionalesCoincidentes.length;
}

// si tuviera todas sus habilidades, para comparar proyectos de dist tamaño
export function puntajeMaximoDeCoincidencia({
  requeridasTotales = 0,
  opcionalesTotales = 0,
} = {}) {
  if (requeridasTotales <= 0) return 0;
  return requeridasTotales * 2 + opcionalesTotales;
}

export function porcentajeDeCobertura({ puntaje = 0, puntajeMaximo = 0 } = {}) {
  if (puntajeMaximo <= 0) return 0;
  return Math.round((puntaje / puntajeMaximo) * 100);
}

// primer criterio
export function porcentajeDeCoberturaRequerida({
  requeridasCoincidentes = 0,
  requeridasTotales = 0,
} = {}) {
  if (requeridasTotales <= 0) return 0;
  return Math.round((requeridasCoincidentes / requeridasTotales) * 100);
}

export function crearEvaluadorCoincidencia(habilidadesPersona) {
  const tiene = sinRepetidas(habilidadesPersona).map((una) => una.codigo);

  return (perfil) => {
    const requeridas = sinRepetidas(perfil.habilidadesRequeridas);
    const yaRequeridas = requeridas.map((guardada) => guardada.codigo);
    const opcionales = sinRepetidas(perfil.habilidadesOpcionales).filter(
      (una) => !yaRequeridas.includes(una.codigo),
    );

    const coinciden = (lista) =>
      lista
        .filter((una) => tiene.includes(una.codigo))
        .map((una) => una.titulo);

    return {
      tieneCoincidencia: coinciden(requeridas).length > 0,
      requeridasCoincidentes: coinciden(requeridas),
      opcionalesCoincidentes: coinciden(opcionales),
      requeridasTotales: requeridas.length,
      opcionalesTotales: opcionales.length,
    };
  };
}
