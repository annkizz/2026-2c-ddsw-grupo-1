import { HabilidadRepository } from "../repositories/HabilidadRepository.js";
import { HabilidadProyecto } from "../domain/HabilidadProyecto.js";

export class HabilidadService {
  constructor(habilidadRepository = new HabilidadRepository()) {
    this.habilidadRepository = habilidadRepository;
  }

  crear = async (habilidadNueva) => {
    const titulo = String(habilidadNueva?.titulo ?? "").trim();
    const descripcion = String(habilidadNueva?.descripcion ?? "");

    const habilidad = new HabilidadProyecto(titulo, descripcion);
    return await this.habilidadRepository.crear(habilidad);
  };

  async obtenerTodos() {
    return await this.habilidadRepository.obtenerTodos();
  }
}
