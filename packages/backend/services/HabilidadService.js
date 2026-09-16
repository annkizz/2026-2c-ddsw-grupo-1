import {
  HabilidadRepository,
  normalizarHabilidad,
} from "../repositories/HabilidadRepository.js";
import { HabilidadProyecto } from "../domain/HabilidadProyecto.js";
import { ConflictError } from "../errors/AppError.js";

export class HabilidadService {
  constructor(habilidadRepository = new HabilidadRepository()) {
    this.habilidadRepository = habilidadRepository;
  }

  crear = (habilidadNueva) => {
    const tituloNormalizado = normalizarHabilidad(habilidadNueva.titulo);
    const habilidadExistente =
      this.habilidadRepository.encontrarPorTitulo(tituloNormalizado);
    if (!habilidadExistente) {
      const habilidad = new HabilidadProyecto(tituloNormalizado);
      return this.habilidadRepository.save(habilidad);
    }
    throw new ConflictError("La habilidad ya existe!!", "HABILIDAD_YA_EXISTE");
  };

  obtenerTodos() {
    return this.habilidadRepository.obtenerTodos();
  }
}
