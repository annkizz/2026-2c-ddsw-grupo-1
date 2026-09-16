import { HabilidadProyecto } from "../domain/HabilidadProyecto.js";

const habilidadesIniciales = [
  { titulo: "Testing E2E con Cypress" },
  { titulo: "buscando a nemo" },
];

export class HabilidadRepository {
  constructor() {
    this.habilidades = habilidadesIniciales.map(
      (habilidad) => new HabilidadProyecto(habilidad.titulo),
    );
  }

  obtenerTodos() {
    return this.habilidades;
  }

  encontrarPorTitulo(titulo) {
    const tituloNormalizado = normalizarHabilidad(titulo);
    return this.habilidades.find(
      (unaHabilidad) => normalizarHabilidad(unaHabilidad.titulo) === tituloNormalizado,
    );
  }

  save(unaHabilidad) {
    const tituloNormalizado = normalizarHabilidad(unaHabilidad.titulo);
    const indice = this.habilidades.findIndex(
      (p) => normalizarHabilidad(p.titulo) === tituloNormalizado,
    );

    if (indice === -1) {
      this.habilidades.push(unaHabilidad);
      return unaHabilidad;
    }

    this.habilidades[indice] = unaHabilidad;
    return unaHabilidad;
  }
}

export function normalizarHabilidad(texto = "") {
  return String(texto)
    .trim()
    .toLowerCase()
    .replace(/\s+(.)/g, (_, letra) => letra.toUpperCase());
}