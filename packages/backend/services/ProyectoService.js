import { randomUUID } from "node:crypto";
import { Estado } from "../domain/Estado.js";
import { Proyecto } from "../domain/Proyecto.js";
import { Colaboracion } from "../domain/Colaboracion.js";
import { ProyectoRepository } from "../repositories/ProyectoRepository.js";
import { HabilidadRepository } from "../repositories/HabilidadRepository.js";
import { evaluarCoincidencia } from "../domain/Matching.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../errors/AppError.js";
import { ColaboradorService } from "./ColaboradorService.js";
import { ColectivoRepository } from "../repositories/ColectivoRepository.js";
import { PerfilRepository } from "../repositories/PerfilRepository.js";

export class ProyectoService {
  constructor(
    proyectoRepository = new ProyectoRepository(),
    habilidadRepository = new HabilidadRepository(),
    colaboradorService = new ColaboradorService(),
    colectivoRepository = new ColectivoRepository(),
    perfilRepository = new PerfilRepository(),
  ) {
    this.proyectoRepository = proyectoRepository;
    this.habilidadRepository = habilidadRepository;
    this.colaboradorService = colaboradorService;
    this.colectivoRepository = colectivoRepository;
    this.perfilRepository = perfilRepository;
  }

  crear = async (datosProyecto) => {
    const colectivo = await this.colectivoRepository.encontrarPorId(
    datosProyecto.idColectivo,
  );

    if (!colectivo) {
      throw new NotFoundError(
        "el colectivo no existe",
        "COLECTIVO_NO_ENCONTRADO",
      );
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
      colectivo.idColectivo,
    );

    const proyectoGuardado = await this.proyectoRepository.save(proyecto);
    colectivo.agregarProyecto(proyecto.idProyecto);
    await this.colectivoRepository.save(colectivo);
    return proyectoGuardado;
  };

  validarFechaLimite(fechaLimiteCierre, ahora = new Date()) {
    if (fechaLimiteCierre <= ahora) {
      throw new BadRequestError(
        "La fecha límite de cierre debe ser futura",
        "FECHA_LIMITE_INVALIDA",
      );
    }
  }

  async programarCierre(idProyecto, fechaLimite) {
    const proyecto = await this.buscarProyectoOFallar(idProyecto);

    if (proyecto.estaFinalizado()) {
      throw new ConflictError(
        "No se puede programar el cierre de un proyecto finalizado",
        "PROYECTO_FINALIZADO",
      );
    }

    this.validarFechaLimite(fechaLimite);
    proyecto.programarCierre(fechaLimite);
    return await this.proyectoRepository.save(proyecto);
  }

  async cerrarSiVencido(proyecto, ahora = new Date()) {
    if (!proyecto.cierreVencido(ahora)) {
      return false;
    }
    await this.finalizar(proyecto);
    return true;
  }

  async buscarProyectoOFallar(idProyecto) {
    const proyecto = await this.obtenerProyectoPorId(idProyecto);

    if (!proyecto) {
      throw new NotFoundError(
        "Proyecto no encontrado",
        "PROYECTO_NO_ENCONTRADO",
      );
    }
    return proyecto;
  }

  async finalizar(proyecto) {
    // falta implementar lo de la 3era entrega: rechazar las postulaciones pendientes del proyecto
    proyecto.cerrar();
    return await this.proyectoRepository.save(proyecto);
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
    return this.proyectoRepository.encontrarPorId(id);
  }

  obtenerTodasColaboraciones = () => {
    return this.proyectoRepository.obtenerTodasColaboraciones();
  };

  obtenerColaboracionPorIdProyecto = async (proyectoId) => {
    const colaboraciones = await this.obtenerTodasColaboraciones();
    return colaboraciones.find((c) => c.proyecto?.idProyecto === proyectoId);
  };

  colaboradorPerteneceAProyecto = async (proyectoId, colaboradorId) => {
    const colaboraciones = await this.obtenerTodasColaboraciones();
    return colaboraciones.some(
      (colaboracion) =>
        colaboracion.proyecto?.idProyecto === proyectoId &&
        colaboracion.colaborador?.idColaborador === colaboradorId,
    );
  };

  verificarHabilidades = async (proyecto, colaborador) => {
    const perfiles = await this.perfilRepository.obtenerTodos(
      proyecto.idProyecto,
    );
    return perfiles.some(
      (perfil) =>
        evaluarCoincidencia(perfil, colaborador.habilidades).tieneCoincidencia,
    );
  };

  async crearColaboracion(proyecto, colaboradorId) {
    if (proyecto.estaFinalizado()) {
      throw new ConflictError(
        "No se puede anotar a un proyecto finalizado",
        "PROYECTO_FINALIZADO",
      );
    }

    const colaborador = await this.colaboradorService.obtenerPorId(colaboradorId);

    if (!colaborador) {
      throw new NotFoundError(
        "La colaboradora no existe",
        "COLABORADORA_NO_ENCONTRADA",
      );
    }

    if (await this.colaboradorPerteneceAProyecto(proyecto.idProyecto, colaboradorId)) {
      throw new ConflictError(
        "La colaboradora ya está anotada en este proyecto",
        "COLABORACION_YA_EXISTENTE",
      );
    }

    if (!(await this.verificarHabilidades(proyecto, colaborador))) {
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
    return await this.proyectoRepository.saveColaboracion(nuevaColaboracion);
  }

  async cerrarProyecto(idProyecto) {
    const proyecto = await this.buscarProyectoOFallar(idProyecto);
    return await this.finalizar(proyecto);
  }
}