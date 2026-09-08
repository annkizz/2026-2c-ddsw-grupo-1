import { randomUUID } from "node:crypto";
import { Colectivo } from "../domain/Colectivo.js";
import { ColectivoRepository } from "../repositories/ColectivoRepository.js";

export class ColectivoService {
  constructor(colectivoRepository = new ColectivoRepository()) {
    this.colectivoRepository = colectivoRepository;
  }

  crear = (datosColectivo) => {
    const colectivo = new Colectivo(
      datosColectivo.nombre,
      randomUUID(),
      datosColectivo.descripcion,
      datosColectivo.ubicacion,
      datosColectivo.tipoDeColectivo,
    );
    return this.colectivoRepository.save(colectivo);
  };

  obtenerTodos() {
    return this.colectivoRepository.obtenerTodos();
  }
}
