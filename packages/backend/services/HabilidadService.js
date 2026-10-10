import { HabilidadRepository } from "../repositories/HabilidadRepository.js";
import { HabilidadProyecto } from "../domain/HabilidadProyecto.js";
import { ConflictError } from "../errors/AppError.js";

export class HabilidadService {
  constructor(habilidadRepository = new HabilidadRepository()) {
    this.habilidadRepository = habilidadRepository;
  }

  crear = async (habilidadNueva) => {
    const titulo = String(habilidadNueva?.titulo ?? "").trim();
    const descripcion = String(habilidadNueva?.descripcion ?? "");

    const habilidadExistente = await this.habilidadRepository.encontrarPorTitulo(
      titulo,
    );
    if (!habilidadExistente) {
      const habilidad = new HabilidadProyecto(titulo, descripcion);
      return await this.habilidadRepository.save(habilidad);
    }
    throw new ConflictError("La habilidad ya existe!!", "HABILIDAD_YA_EXISTE");
  };

  async obtenerTodos() {
    return await this.habilidadRepository.obtenerTodos();
  }
}
