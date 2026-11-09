import { EtiquetaRepository } from "../repositories/EtiquetaRepository.js";

export class EtiquetaService {
  constructor(etiquetaRepository = new EtiquetaRepository()) {
    this.etiquetaRepository = etiquetaRepository;
  }

  async obtenerTodas() {
    return this.etiquetaRepository.obtenerTodas();
  }
}
