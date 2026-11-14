import { EstadoPostulacion } from "../domain/EstadoPostulacion.js";
import { Postulacion } from "../domain/Postulacion.js";
import { Colaboracion } from "../domain/Colaboracion.js";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../errors/AppError.js";
import { ColaboradorService } from "./ColaboradorService.js";
import { ProyectoRepository } from "../repositories/ProyectoRepository.js";
import { PerfilRepository } from "../repositories/PerfilRepository.js";
import { ColaboracionRepository } from "../repositories/ColaboracionRepository.js";
import { PostulacionRepository } from "../repositories/PostulacionRepository.js";

export class PostulacionService {
  constructor(
    proyectoRepository = new ProyectoRepository(),
    perfilRepository = new PerfilRepository(),
    colaboradorService = new ColaboradorService(),
    colaboracionRepository = new ColaboracionRepository(),
    postulacionRepository = new PostulacionRepository(),
  ) {
    this.proyectoRepository = proyectoRepository;
    this.perfilRepository = perfilRepository;
    this.colaboradorService = colaboradorService;
    this.colaboracionRepository = colaboracionRepository;
    this.postulacionRepository = postulacionRepository;
  }

  async buscarProyectoYPerfil(idProyecto, idPerfil) {
    const proyecto = await this.proyectoRepository.buscarPorId(idProyecto);
    if (!proyecto) {
      throw new NotFoundError(
        "Proyecto no encontrado",
        "PROYECTO_NO_ENCONTRADO",
      );
    }

    const perfil = await this.perfilRepository.buscarPorId(idPerfil);
    if (!perfil || String(perfil.idProyecto) !== String(idProyecto)) {
      throw new NotFoundError("Perfil no encontrado", "PERFIL_NO_ENCONTRADO");
    }

    return { proyecto, perfil };
  }

  validarColectivoDelProyecto(actor, proyecto) {
    if (
      actor?.rol !== "COLECTIVO" ||
      String(actor.id) !== String(proyecto.idColectivo)
    ) {
      throw new ForbiddenError(
        "Solo el colectivo dueño del proyecto puede revisar postulaciones",
        "ACCESO_POSTULACIONES_DENEGADO",
      );
    }
  }

  validarColaboradora(actor, idColaborador) {
    if (
      actor?.rol !== "COLABORADORA" ||
      String(actor.id) !== String(idColaborador)
    ) {
      throw new ForbiddenError(
        "Solo se puede postular la colaboradora autenticada",
        "ACCESO_POSTULACION_DENEGADO",
      );
    }
  }

  validarProyectoAbierto(proyecto) {
    if (
      proyecto.estaFinalizado?.() ||
      proyecto.estado === "FINALIZADO" ||
      proyecto.cierreVencido?.()
    ) {
      throw new ConflictError(
        "No se puede operar sobre un proyecto cerrado",
        "PROYECTO_FINALIZADO",
      );
    }
  }

  busquedaAbierta(proyecto, ahora = new Date()) {
    if (typeof proyecto.busquedaDeColaboracionesAbierta === "function") {
      return proyecto.busquedaDeColaboracionesAbierta(ahora);
    }
    return (
      proyecto.busquedaAbierta !== false &&
      (!proyecto.fechaLimiteBusqueda ||
        new Date(proyecto.fechaLimiteBusqueda) > ahora)
    );
  }

  async crear(idProyecto, idPerfil, idColaborador, esAnonima = false, actor) {
    this.validarColaboradora(actor, idColaborador);
    const { proyecto, perfil } = await this.buscarProyectoYPerfil(
      idProyecto,
      idPerfil,
    );
    this.validarProyectoAbierto(proyecto);

    if (!this.busquedaAbierta(proyecto)) {
      throw new ConflictError(
        "La búsqueda de colaboraciones para este proyecto está cerrada",
        "BUSQUEDA_CERRADA",
      );
    }

    const colaborador =
      await this.colaboradorService.obtenerPorId(idColaborador);
    if (!colaborador) {
      throw new NotFoundError(
        "La colaboradora no existe",
        "COLABORADORA_NO_ENCONTRADA",
      );
    }

    if (
      await this.colaboracionRepository.existeColaboracion(
        idProyecto,
        idColaborador,
      )
    ) {
      throw new ConflictError(
        "La colaboradora ya participó de este proyecto",
        "COLABORACION_YA_EXISTENTE",
      );
    }

    if (
      await this.postulacionRepository.existePendiente(
        idProyecto,
        idPerfil,
        idColaborador,
      )
    ) {
      throw new ConflictError(
        "Ya existe una postulación pendiente para este perfil",
        "POSTULACION_YA_EXISTENTE",
      );
    }

    const postulacion = new Postulacion(
      proyecto,
      perfil,
      colaborador,
      new Date(),
      esAnonima,
    );
    try {
      const guardada = await this.postulacionRepository.save(postulacion);
      return this.toDTO(guardada);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictError(
          "Ya existe una postulación pendiente para este perfil",
          "POSTULACION_YA_EXISTENTE",
        );
      }
      throw error;
    }
  }

  async obtenerPorProyecto(idProyecto, actor) {
    const proyecto = await this.proyectoRepository.buscarPorId(idProyecto);
    if (!proyecto) {
      throw new NotFoundError(
        "Proyecto no encontrado",
        "PROYECTO_NO_ENCONTRADO",
      );
    }
    this.validarColectivoDelProyecto(actor, proyecto);
    const postulaciones =
      await this.postulacionRepository.obtenerPorProyecto(idProyecto);
    return postulaciones.map((postulacion) => this.toDTO(postulacion));
  }

  async resolver(idProyecto, idPostulacion, decision, actor) {
    if (
      decision !== EstadoPostulacion.ACEPTADA &&
      decision !== EstadoPostulacion.RECHAZADA
    ) {
      throw new BadRequestError(
        "La decisión debe ser ACEPTADA o RECHAZADA",
        "DECISION_POSTULACION_INVALIDA",
      );
    }

    const proyecto = await this.proyectoRepository.buscarPorId(idProyecto);
    if (!proyecto) {
      throw new NotFoundError(
        "Proyecto no encontrado",
        "PROYECTO_NO_ENCONTRADO",
      );
    }
    this.validarColectivoDelProyecto(actor, proyecto);

    const postulacion =
      await this.postulacionRepository.buscarPorId(idPostulacion);
    if (!postulacion || String(postulacion.idProyecto) !== String(idProyecto)) {
      throw new NotFoundError(
        "Postulación no encontrada",
        "POSTULACION_NO_ENCONTRADA",
      );
    }
    if (postulacion.estado !== EstadoPostulacion.PENDIENTE) {
      throw new ConflictError(
        "La postulación ya fue resuelta",
        "POSTULACION_YA_RESUELTA",
      );
    }

    if (decision === EstadoPostulacion.RECHAZADA) {
      const rechazada =
        await this.postulacionRepository.actualizarEstadoSiPendiente(
          idPostulacion,
          EstadoPostulacion.RECHAZADA,
        );
      if (!rechazada) {
        throw new ConflictError(
          "La postulación ya fue resuelta",
          "POSTULACION_YA_RESUELTA",
        );
      }
      return this.toDTO(rechazada);
    }

    this.validarProyectoAbierto(proyecto);
    const perfil = await this.perfilRepository.buscarPorId(
      postulacion.idPerfil,
    );
    if (!perfil || String(perfil.idProyecto) !== String(idProyecto)) {
      throw new NotFoundError("Perfil no encontrado", "PERFIL_NO_ENCONTRADO");
    }

    if (
      await this.colaboracionRepository.existeColaboracion(
        idProyecto,
        postulacion.idColaborador,
      )
    ) {
      throw new ConflictError(
        "La colaboradora ya participó de este proyecto",
        "COLABORACION_YA_EXISTENTE",
      );
    }

    const colaboracionesActivas =
      await this.colaboracionRepository.contarPorPerfil(perfil._id);
    if (
      perfil.limiteColaboraciones != null &&
      colaboracionesActivas >= perfil.limiteColaboraciones
    ) {
      throw new ConflictError(
        "Se alcanzó el límite de colaboraciones para este perfil",
        "LIMITE_COLABORACIONES_ALCANZADO",
      );
    }

    let postulacionAceptada = false;
    try {
      const aceptada =
        await this.postulacionRepository.actualizarEstadoSiPendiente(
          idPostulacion,
          EstadoPostulacion.ACEPTADA,
        );
      if (!aceptada) {
        throw new ConflictError(
          "La postulación ya fue resuelta",
          "POSTULACION_YA_RESUELTA",
        );
      }
      postulacionAceptada = true;

      const colaborador = await this.colaboradorService.obtenerPorId(
        postulacion.idColaborador,
      );
      if (!colaborador) {
        throw new NotFoundError(
          "La colaboradora no existe",
          "COLABORADORA_NO_ENCONTRADA",
        );
      }

      await this.colaboracionRepository.crearDesdePostulacion(
        new Colaboracion(
          proyecto,
          colaborador,
          new Date(),
          postulacion.esAnonima,
          perfil,
          postulacion,
        ),
      );

      return this.toDTO({
        ...postulacion.toObject(),
        estado: EstadoPostulacion.ACEPTADA,
        idColaborador: colaborador,
      });
    } catch (error) {
      const erroresRollback = [];
      if (postulacionAceptada) {
        try {
          const resultado =
            await this.postulacionRepository.reabrirSiAceptada(idPostulacion);
          if (resultado.modifiedCount !== 1) {
            erroresRollback.push(
              new Error("No se pudo reabrir la postulación"),
            );
          }
        } catch (errorRollback) {
          erroresRollback.push(errorRollback);
        }
      }
      if (erroresRollback.length > 0) {
        throw new AggregateError(
          [error, ...erroresRollback],
          "Falló la aceptación y también su reversión",
        );
      }
      throw error;
    }
  }

  async darDeBaja(idProyecto, idColaborador, actor) {
    const proyecto = await this.proyectoRepository.buscarPorId(idProyecto);
    if (!proyecto) {
      throw new NotFoundError(
        "Proyecto no encontrado",
        "PROYECTO_NO_ENCONTRADO",
      );
    }
    const esColectivoPropietario =
      actor?.rol === "COLECTIVO" &&
      String(actor.id) === String(proyecto.idColectivo);
    const esColaboradoraDeLaColaboracion =
      actor?.rol === "COLABORADORA" &&
      String(actor.id) === String(idColaborador);
    if (!esColectivoPropietario && !esColaboradoraDeLaColaboracion) {
      throw new ForbiddenError(
        "Solo la colaboradora o el colectivo dueño pueden dar de baja la colaboración",
        "ACCESO_BAJA_DENEGADO",
      );
    }

    const colaboracion = await this.colaboracionRepository.darDeBaja(
      idProyecto,
      idColaborador,
    );
    if (!colaboracion) {
      throw new NotFoundError(
        "Colaboración no encontrada",
        "COLABORACION_NO_ENCONTRADA",
      );
    }

    return {
      idProyecto: String(colaboracion.idProyecto),
      idPerfil: colaboracion.idPerfil ? String(colaboracion.idPerfil) : null,
      idColaborador: String(colaboracion.idColaborador),
      fecha: colaboracion.fecha,
      esAnonima: colaboracion.esAnonima,
    };
  }

  toDTO(postulacion) {
    const dto = {
      id: String(postulacion._id ?? postulacion.id),
      idProyecto: String(postulacion.idProyecto),
      idPerfil: String(postulacion.idPerfil),
      estado: postulacion.estado,
      fechaPostulacion: postulacion.fechaPostulacion,
      esAnonima: postulacion.esAnonima,
    };

    if (
      postulacion.estado === EstadoPostulacion.ACEPTADA &&
      postulacion.idColaborador
    ) {
      const colaborador =
        postulacion.idColaborador._id === undefined
          ? null
          : postulacion.idColaborador;
      if (colaborador) {
        dto.colaborador = {
          id: String(colaborador._id),
          nombreFantasia: colaborador.nombreFantasia,
          usuarioGitHub: colaborador.usuarioGitHub,
          nombre: colaborador.nombre,
          apellido: colaborador.apellido,
          pronombres: colaborador.pronombres,
          presentacion: colaborador.presentacion,
          mediosDeContacto: colaborador.mediosDeContacto,
          aceptaMensajeria: colaborador.aceptaMensajeria,
        };
      }
    }

    return dto;
  }
}
