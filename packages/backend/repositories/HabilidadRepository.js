import { HabilidadProyecto } from "../domain/HabilidadProyecto.js"

const habilidadesIniciales = [
    { titulo: "Desarrollo Web React", descripcion: "desarrollando ando" },
    { titulo: "Testing E2E con Cypress", descripcion: "no se que es cypress" },
    { titulo: "buscando a nemo", descripcion: "pez azul"}
]

export class HabilidadRepository {
    constructor() {
        this.habilidades = habilidadesIniciales.map((habilidad) => new HabilidadProyecto(habilidad.titulo, habilidad.descripcion))
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