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
    };
  };
}
