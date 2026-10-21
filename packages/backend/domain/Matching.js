import { normalizarHabilidad } from "../repositories/HabilidadRepository.js";

const sinRepetidas = (habilidades = []) =>
  habilidades.reduce((vistas, titulo) => {
    const codigo = normalizarHabilidad(titulo);
    if (codigo !== "" && !vistas.has(codigo)) {
      vistas.set(codigo, titulo);
    }
    return vistas;
  }, new Map());

export function evaluarCoincidencia(perfil, habilidadesPersona) {
  return crearEvaluadorCoincidencia(habilidadesPersona)(perfil);
}

export function crearEvaluadorCoincidencia(habilidadesPersona) {
  const tiene = new Set(sinRepetidas(habilidadesPersona).keys());
  return (perfil) => {
    const requeridas = sinRepetidas(perfil.habilidadesRequeridas);
    const opcionales = new Map(
      [...sinRepetidas(perfil.habilidadesOpcionales)].filter(
        ([codigo]) => !requeridas.has(codigo),
      ),
    );

    const coinciden = (mapa) =>
      [...mapa].filter(([codigo]) => tiene.has(codigo)).map(([, t]) => t);

    const requeridasCoincidentes = coinciden(requeridas);
    const opcionalesCoincidentes = coinciden(opcionales);

    return {
      tieneCoincidencia: requeridasCoincidentes.length > 0,
      requeridasCoincidentes,
      opcionalesCoincidentes,
    };
  };
}
