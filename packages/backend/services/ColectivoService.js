import { randomUUID } from "node:crypto";
import { Colectivo } from "../domain/Colectivo.js";
import { ColectivoRepository } from "../repositories/ColectivoRepository.js";

export class ColectivoService {
  constructor(colectivoRepository = new ColectivoRepository()) {
    this.colectivoRepository = colectivoRepository;
  }

  crear = async (datosColectivo) => {
    const colectivo = new Colectivo(
      datosColectivo.nombre,
      randomUUID(),
      datosColectivo.descripcion,
      datosColectivo.ubicacion,
      datosColectivo.tipoDeColectivo,
    );
    return await this.colectivoRepository.save(colectivo);
  };

  async obtenerTodos() {
    return await this.colectivoRepository.obtenerTodos();
  }
}
