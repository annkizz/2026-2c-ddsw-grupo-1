// Comparación de habilidades entre un perfil buscado y una persona.
// Las habilidades llegan como texto ("React", "Node.js"…) o como objeto con título/código.

const texto = (habilidad) =>
  typeof habilidad === 'string'
    ? habilidad
    : habilidad?.titulo ?? habilidad?.nombre ?? habilidad?.codigo ?? '';

export const normalizarHabilidad = (habilidad) =>
  texto(habilidad)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();

// Devuelve { requeridas: [{ nombre, cumple }], opcionales: [...], cumpleRequeridas, totalRequeridas, ... }
export const compararHabilidades = (perfil, habilidadesPersona = []) => {
  const propias = new Set((habilidadesPersona ?? []).map(normalizarHabilidad));
  const marcar = (lista = []) =>
    lista.map((habilidad) => ({ nombre: texto(habilidad), cumple: propias.has(normalizarHabilidad(habilidad)) }));
  const requeridas = marcar(perfil?.habilidadesRequeridas);
  const opcionales = marcar(perfil?.habilidadesOpcionales);
  return {
    requeridas,
    opcionales,
    cumpleRequeridas: requeridas.filter((h) => h.cumple).length,
    totalRequeridas: requeridas.length,
    cumpleOpcionales: opcionales.filter((h) => h.cumple).length,
    totalOpcionales: opcionales.length
  };
};
