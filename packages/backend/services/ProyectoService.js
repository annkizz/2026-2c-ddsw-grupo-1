import { randomUUID } from "node:crypto";
import { Compromiso } from "../domain/Compromiso.js";
import { Estado } from "../domain/Estado.js";
import { Proyecto } from "../domain/Proyecto.js";
import { ProyectoRepository } from "../repositories/ProyectoRepository.js";
import { HabilidadRepository } from "../repositories/HabilidadRepository.js";
import { NotFoundError } from "../errors/AppError.js";

export class ProyectoService {
  constructor(
    proyectoRepository = new ProyectoRepository(),
    habilidadRepository = new HabilidadRepository(),
    colectivoRepository = null,
  ) {
    this.proyectoRepository = proyectoRepository;
    this.habilidadRepository = habilidadRepository;
    this.colectivoRepository = colectivoRepository;
  }

  crear = (datosProyecto) => {
    if (this.colectivoRepository) {
      const colectivo = this.colectivoRepository.encontrarPorId(
        datosProyecto.id_colectivo,
      );

      if (!colectivo) {
        throw new NotFoundError("el colectivo no existe");
      }
    }

    const habilidades = datosProyecto.habilidades.map((tituloHabilidad) => {
      const habilidad =
        this.habilidadRepository.encontrarPorTitulo(tituloHabilidad);

      if (!habilidad) {
        throw new NotFoundError(`la habilidad ${tituloHabilidad} no existe`);
      }

      return habilidad;
    });

    const compromiso = new Compromiso(
      datosProyecto.compromiso.tipoCompromiso,
      datosProyecto.compromiso.horas,
    );

    const proyecto = new Proyecto(
      datosProyecto.titulo,
      datosProyecto.descripcion,
      habilidades,
      compromiso,
      datosProyecto.modalidadColaboracion,
      Estado.ACTIVO,
      new Date(),
      randomUUID(),
    );

    if (this.colectivoRepository) {
      const colectivo = this.colectivoRepository.encontrarPorId(
        datosProyecto.id_colectivo,
      );
      colectivo.agregarProyecto(proyecto);
    }

    return this.proyectoRepository.save(proyecto);
  };

  obtenerTodos() {
    return this.proyectoRepository.obtenerTodos();
  }
}
