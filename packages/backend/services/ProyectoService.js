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
  const colectivo = this.colectivoRepository.encontrarPorId(
    datosProyecto.idColectivo,
  );

  if (!colectivo) {
    throw new NotFoundError("el colectivo no existe", "COLECTIVO_NO_ENCONTRADO");
  }

    const fechaLimiteCierre = datosProyecto.fechaLimiteCierre ?? null;
    if (fechaLimiteCierre !== null) {
      this.validarFechaLimite(fechaLimiteCierre);
    }

    const proyecto = new Proyecto(
      datosProyecto.titulo,
      datosProyecto.descripcion,
      [], // perfiles
      Estado.ACTIVO,
      new Date(),
      randomUUID(),
      fechaLimiteCierre,
    );

    colectivo.agregarProyecto(proyecto);
    return this.proyectoRepository.save(proyecto);
  };

  validarFechaLimite(fechaLimiteCierre, ahora = new Date()) {
    if (fechaLimiteCierre <= ahora) {
      throw new BadRequestError(
        "La fecha límite de cierre debe ser futura",
        "FECHA_LIMITE_INVALIDA",
      );
    }
  }

  programarCierre(idProyecto, fechaLimite) {
    const proyecto = this.buscarProyectoOFallar(idProyecto);

    if (proyecto.estaFinalizado()) {
      throw new ConflictError(
        "No se puede programar el cierre de un proyecto finalizado",
        "PROYECTO_FINALIZADO",
      );
    }

    this.validarFechaLimite(fechaLimite);
    proyecto.programarCierre(fechaLimite);
    return proyecto;
  }

  cerrarProyecto(idProyecto) {
    const proyecto = this.buscarProyectoOFallar(idProyecto);
    this.finalizar(proyecto);
    return proyecto;
  }

  cerrarSiVencido(proyecto, ahora = new Date()) {
    if (!proyecto.cierreVencido(ahora)) {
      return false;
    }
    this.finalizar(proyecto);
    return true;
  }

  buscarProyectoOFallar(idProyecto) {
    const proyecto = this.obtenerProyectoPorId(idProyecto);

    if (!proyecto) {
      throw new NotFoundError(
        "Proyecto no encontrado",
        "PROYECTO_NO_ENCONTRADO",
      );
    }
    return proyecto;
  }

  async cerrarProyectosVencidos(ahora = new Date()) {
    const vencidos = await this.proyectoRepository.obtenerVencidos(ahora);
    const cerrados = [];
    const fallidos = [];

    for (const proyecto of vencidos) {
      try {
        await this.finalizar(proyecto);
        cerrados.push(proyecto.idProyecto);
      } catch (error) {
        fallidos.push({
          idProyecto: proyecto.idProyecto,
          error: error.message,
        });
      }
    }

    return { cerrados, fallidos };
  }

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
