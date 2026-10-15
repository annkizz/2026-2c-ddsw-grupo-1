import { normalizarHabilidad } from "../repositories/HabilidadRepository.js";

const sinRepetidas = (habilidades = []) => {
  const vistas = new Map();
  for (const titulo of habilidades) {
    const codigo = normalizarHabilidad(titulo);
    if (codigo !== "" && !vistas.has(codigo)) {
      vistas.set(codigo, titulo);
    }
  }
  return vistas;
};

export function evaluarCoincidencia(perfil, habilidadesPersona) {
  const requeridas = sinRepetidas(perfil.habilidadesRequeridas);
  const opcionales = sinRepetidas(perfil.habilidadesOpcionales);
  for (const codigo of requeridas.keys()) opcionales.delete(codigo);

  const tiene = new Set(sinRepetidas(habilidadesPersona).keys());
  const coinciden = (mapa) =>
    [...mapa].filter(([codigo]) => tiene.has(codigo)).map(([, t]) => t);

  const requeridasCoincidentes = coinciden(requeridas);
  const opcionalesCoincidentes = coinciden(opcionales);

  return {
    tieneCoincidencia: requeridasCoincidentes.length > 0,
    requeridasCoincidentes,
    opcionalesCoincidentes,
  };
}
