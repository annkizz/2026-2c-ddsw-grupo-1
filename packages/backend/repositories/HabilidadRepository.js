import { HabilidadProyecto } from "../domain/HabilidadProyecto.js"

const habilidadesIniciales = [
    { titulo: "Desarrollo Web React" },
    { titulo: "Testing E2E con Cypress" },
    { titulo: "buscando a nemo"}
]

export class HabilidadRepository {
    constructor() {
        this.habilidades = habilidadesIniciales.map((habilidad) => new HabilidadProyecto(habilidad.titulo))
    }

    obtenerTodos() {
        return this.habilidades;
    }

    encontrarPorTitulo(titulo) {
        return this.habilidades.find((unaHabilidad => unaHabilidad.titulo === titulo))
    }

    save(unaHabilidad) {
        const indice = this.habilidades.findIndex((p) => p.titulo === unaHabilidad.titulo)
        if (indice === -1) {
            this.habilidades.push(unaHabilidad)
            return unaHabilidad
        }
        this.habilidades[indice] = unaHabilidad
        return unaHabilidad
    }
}