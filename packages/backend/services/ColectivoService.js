import { Colectivo } from "../domain/Colectivo.js";
import { ColectivoRepository } from "../repositories/ColectivoRepository.js";

export class ColectivoService {
  constructor(colectivoRepository = new ColectivoRepository()) {
    this.colectivoRepository = colectivoRepository;
  }

  toDTO(colectivo) {
    return {
      id: String(colectivo._id),
      nombre: colectivo.nombre,
      descripcion: colectivo.descripcion,
      tipoDeColectivo: colectivo.tipoDeColectivo,
      ubicacion: colectivo.ubicacion,
      proyectos: (colectivo.proyectos ?? []).map((proyecto) =>
        String(proyecto),
      ),
    };
  }

  crear = async (datosColectivo) => {
    const colectivo = new Colectivo(
      datosColectivo.nombre,
      datosColectivo.descripcion,
      datosColectivo.ubicacion,
      datosColectivo.tipoDeColectivo,
    );
    return this.toDTO(await this.colectivoRepository.save(colectivo));
  };

  async obtenerTodos() {
    const colectivos = await this.colectivoRepository.obtenerTodos();
    return colectivos.map((colectivo) => this.toDTO(colectivo));
  }
}
