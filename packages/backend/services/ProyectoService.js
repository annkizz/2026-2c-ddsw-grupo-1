import { randomUUID } from "node:crypto";
import { Compromiso } from "../domain/Compromiso.js";
import { Estado } from "../domain/Estado.js";
import { Proyecto } from "../domain/Proyecto.js";
import { Colaboracion } from "../domain/Colaboracion.js";
import { ProyectoRepository } from "../repositories/ProyectoRepository.js";
import {
  HabilidadRepository,
  normalizarHabilidad,
} from "../repositories/HabilidadRepository.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../errors/AppError.js";
import { ColaboradorService } from "./ColaboradorService.js";
import { ColectivoRepository } from "../repositories/ColectivoRepository.js";

export class ProyectoService {
  constructor(
    proyectoRepository = new ProyectoRepository(),
    habilidadRepository = new HabilidadRepository(),
    colaboradorService = new ColaboradorService(),
    colectivoRepository = new ColectivoRepository(),
  ) {
    this.proyectoRepository = proyectoRepository;
    this.habilidadRepository = habilidadRepository;
    this.colaboradorService = colaboradorService;
    this.colectivoRepository = colectivoRepository;
  }

  crear = (datosProyecto) => {
    if (this.colectivoRepository) {
      const colectivo = this.colectivoRepository.encontrarPorId(
        datosProyecto.idColectivo,
      );

      if (!colectivo) {
        throw new NotFoundError(
          "el colectivo no existe",
          "COLECTIVO_NO_ENCONTRADO",
        );
      }
    }

    const habilidades = datosProyecto.habilidades.map((tituloHabilidad) => {
      const habilidad =
        this.habilidadRepository.encontrarPorTitulo(tituloHabilidad);

      if (!habilidad) {
        throw new NotFoundError(
          "la habilidad ${tituloHabilidad} no existe",
          "HABILIDAD_NO_ENCONTRADA",
        );
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
        datosProyecto.idColectivo,
      );
      colectivo.agregarProyecto(proyecto);
    }

    return this.proyectoRepository.save(proyecto);
  };

  obtenerTodos() {
    return this.proyectoRepository.obtenerTodos();
  }

  obtenerProyectoPorId(id) {
    return this.obtenerTodos().find((p) => p.idProyecto === id);
  }

  cerrarProyecto(idProyecto) {
    const proyecto = this.obtenerProyectoPorId(idProyecto);

    if (!proyecto) {
      throw new NotFoundError(
        "Proyecto no encontrado",
        "PROYECTO_NO_ENCONTRADO",
      );
    }

    proyecto.cerrar();
    return proyecto;
  }

  obtenerTodasColaboraciones = () => {
    return this.proyectoRepository.obtenerTodasColaboraciones();
  };

  obtenerColaboracionPorIdProyecto = (proyectoId) => {
    if (this.obtenerTodasColaboraciones) {
      return this.obtenerTodasColaboraciones().find(
        (c) => c.proyecto.idProyecto === proyectoId,
      );
    }

    return undefined;
  };

  colaboradorPerteneceAProyecto = (proyectoId, colaboradorId) => {
    const colaboracion = this.obtenerColaboracionPorIdProyecto(proyectoId);
    return (
      colaboracion && colaboracion.colaborador.idColaborador === colaboradorId
    );
  };

  verificarHabilidades = (proyecto, colaborador) => {
    const habilidadesNecesarias = proyecto.habilidades.map((h) =>
      normalizarHabilidad(h.titulo),
    );
    const habilidadesColaborador = colaborador.habilidades.map((h) =>
      normalizarHabilidad(h.titulo),
    );

    return habilidadesNecesarias.some((habilidad) =>
      habilidadesColaborador.includes(habilidad),
    );
  };

  crearColaboracion(proyecto, colaboradorId) {
    if (proyecto.estaFinalizado()) {
      throw new ConflictError(
        "No se puede anotar a un proyecto finalizado",
        "PROYECTO_FINALIZADO",
      );
    }

    const colaborador = this.colaboradorService.obtenerPorId(colaboradorId);

    if (!colaborador) {
      throw new NotFoundError(
        "La colaboradora no existe",
        "COLABORADORA_NO_ENCONTRADA",
      );
    }

    if (
      this.colaboradorPerteneceAProyecto(proyecto.idProyecto, colaboradorId)
    ) {
      throw new ConflictError(
        "La colaboradora ya está anotada en este proyecto",
        "COLABORACION_YA_EXISTENTE",
      );
    }

    if (!this.verificarHabilidades(proyecto, colaborador)) {
      throw new BadRequestError(
        "La colaboradora no cumple con las habilidades requeridas",
        "HABILIDADES_INSUFICIENTES",
      );
    }

    const nuevaColaboracion = new Colaboracion(
      proyecto,
      colaborador,
      new Date().toISOString(),
    );
    this.proyectoRepository.saveColaboracion(nuevaColaboracion);
    return nuevaColaboracion;
  }
}
