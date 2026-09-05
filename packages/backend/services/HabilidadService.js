import { HabilidadRepository } from "../repositories/HabilidadRepository.js"
import { HabilidadProyecto } from "../domain/HabilidadProyecto.js"
import { ConflictError } from "../errors/AppError.js";

export class HabilidadService {
    constructor(habilidadRepository = new HabilidadRepository()) {
        this.habilidadRepository = habilidadRepository;
    }

    crear = (habilidadNueva) => {
        const habilidadExistente = this.habilidadRepository.encontrarPorTitulo(habilidadNueva.titulo)
        if (!habilidadExistente) {
            const habilidad = new HabilidadProyecto(habilidadNueva.titulo);
            return this.habilidadRepository.save(habilidad);
        }
        throw new ConflictError ("el producto ya existe!!")
    }

    obtenerTodos() {
        return this.habilidadRepository.obtenerTodos()
    }
}