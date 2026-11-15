import { Colectivo } from "../domain/Colectivo.js";
import { ColectivoRepository } from "../repositories/ColectivoRepository.js";
import { normalizarEtiquetas } from "../domain/etiquetas.js";

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
      etiquetas: colectivo.etiquetas ?? [],
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
      normalizarEtiquetas(datosColectivo.etiquetas),
    );
    return this.toDTO(await this.colectivoRepository.save(colectivo));
  };

  async obtenerTodos(filtros = {}) {
    const filtrosNormalizados = { ...filtros };
    if (filtrosNormalizados.etiquetas !== undefined) {
      filtrosNormalizados.etiquetas = normalizarEtiquetas(
        filtrosNormalizados.etiquetas,
      );
    }

    const colectivos = await this.colectivoRepository.obtenerTodos(
      filtrosNormalizados,
    );
    return colectivos.map((colectivo) => this.toDTO(colectivo));
  }
}
