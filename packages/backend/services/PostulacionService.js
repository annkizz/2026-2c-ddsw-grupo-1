import { EstadoPostulacion } from "../domain/EstadoPostulacion.js";
import { Rol } from "../domain/Rol.js";
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
import { TipoAceptacion } from "../domain/TipoAceptacion.js";
import { EventoWebhook } from "../domain/EventoWebhook.js";
import { despachadorNulo } from "./webhooks/DespachadorWebhooks.js";
import { NotificacionService } from "./NotificacionService.js";
import { TipoNotificacion } from "../domain/TipoNotificacion.js";
import { NotificacionRepository } from "../repositories/NotificacionRepository.js";

export class PostulacionService {
  constructor(
    proyectoRepository = new ProyectoRepository(),
    perfilRepository = new PerfilRepository(),
    colaboradorService = new ColaboradorService(),
    colaboracionRepository = new ColaboracionRepository(),
    postulacionRepository = new PostulacionRepository(),
    despachadorWebhooks = despachadorNulo,
    notificacionService = new NotificacionService(),
    notificacionRepository = new NotificacionRepository(),
  ) {
    this.proyectoRepository = proyectoRepository;
    this.perfilRepository = perfilRepository;
    this.colaboradorService = colaboradorService;
    this.colaboracionRepository = colaboracionRepository;
    this.postulacionRepository = postulacionRepository;
    this.despachadorWebhooks = despachadorWebhooks;
    this.notificacionService = notificacionService;
    this.notificacionRepository = notificacionRepository;
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
      actor?.rol !== Rol.COLECTIVO ||
      String(actor.id) !== String(proyecto.idColectivo)
    ) {
      throw new ForbiddenError(
        "Solo el colectivo dueño del proyecto puede revisar postulaciones",
        "ACCESO_POSTULACIONES_DENEGADO",
      );
    }
  }

  validarColaboradora(actor) {
    if (actor?.rol !== Rol.COLABORADOR || !actor.id) {
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

  async crear(idProyecto, idPerfil, esAnonima = false, actor) {
    const idColaborador = actor?.id;
    this.validarColaboradora(actor);
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
    if (perfil.busquedaAbierta === false) {
      throw new ConflictError(
        "La búsqueda de colaboraciones para este perfil está cerrada",
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

    const anterior = await this.postulacionRepository.obtenerUltima(
      idProyecto,
      idPerfil,
      idColaborador,
    );
    if (
      anterior?.estado === EstadoPostulacion.RECHAZADA &&
      !(await this.notificacionService.existeNotificacionDeRechazo(
        anterior._id,
        idColaborador,
      ))
    ) {
      throw new ConflictError(
        "La postulación anterior todavía no fue notificada",
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

      try {
        await this.notificacionService.crearEventoSistema({
          tipo: TipoNotificacion.POSTULACION_RECIBIDA,
          contenido: `Recibiste una postulación para el perfil "${perfil.descripcion}" del proyecto "${proyecto.titulo}".`,
          idColectivo: proyecto.idColectivo,
          idColaborador,
          idProyecto: proyecto._id,
          idPerfil: perfil._id,
          idPostulacion: guardada._id,
        });
      } catch (error) {
        try {
          const resultado =
            await this.postulacionRepository.eliminarSiPendiente(guardada._id);
          if (resultado.deletedCount !== 1)
            throw new Error("No se pudo revertir la postulación");
        } catch (errorRollback) {
          throw new AggregateError(
            [error, errorRollback],
            "Falló la notificación y la reversión de la postulación",
          );
        }
        throw error;
      }

      if (perfil.tipoAceptacion === TipoAceptacion.SIN_LIMITE) {
        return await this.aceptarPostulacion(proyecto, guardada, idProyecto);
      }

      this.despachadorWebhooks.emitir(
        EventoWebhook.POSTULACION_CREADA,
        proyecto.idColectivo,
        {
          idProyecto: String(proyecto._id),
          tituloProyecto: proyecto.titulo,
          idPerfil: String(perfil._id),
          idPostulacion: String(guardada._id),
          fecha: guardada.fechaPostulacion,
        },
      );
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
    return postulaciones.map((postulacion) => {
      const dto = this.toDTO(postulacion);
      const colaboradora = postulacion.idColaborador;
      if (
        postulacion.estado === EstadoPostulacion.PENDIENTE &&
        colaboradora?._id
      ) {
        dto.perfilPublico = {
          id: String(colaboradora._id),
          nombreFantasia: colaboradora.nombreFantasia,
          usuarioGitHub: colaboradora.usuarioGitHub,
          nombre: colaboradora.nombre,
          apellido: colaboradora.apellido,
          pronombres: colaboradora.pronombres,
          presentacion: colaboradora.presentacion,
          habilidades: colaboradora.habilidades,
        };
      }
      return dto;
    });
  }

  async obtenerColaboracionesParaGestion(idProyecto, actor) {
    const proyecto = await this.proyectoRepository.buscarPorId(idProyecto);
    if (!proyecto) {
      throw new NotFoundError(
        "Proyecto no encontrado",
        "PROYECTO_NO_ENCONTRADO",
      );
    }
    this.validarColectivoDelProyecto(actor, proyecto);
    const colaboraciones =
      await this.colaboracionRepository.obtenerPorProyecto(idProyecto);
    return colaboraciones.map((colaboracion) => {
      const colaborador = colaboracion.idColaborador;
      if (!colaborador) {
        throw new NotFoundError(
          "Colaboradora no encontrada",
          "COLABORADORA_NO_ENCONTRADA",
        );
      }
      return {
        idColaborador: String(colaborador._id),
        idPerfil: colaboracion.idPerfil ? String(colaboracion.idPerfil) : null,
        nombreFantasia: colaborador.nombreFantasia,
        nombre: colaborador.nombre,
        apellido: colaborador.apellido,
        usuarioGitHub: colaborador.usuarioGitHub,
        esAnonima: colaboracion.esAnonima,
      };
    });
  }

  async invitar(idProyecto, idPerfil, idColaborador, actor, mensaje = "") {
    const { proyecto, perfil } = await this.buscarProyectoYPerfil(
      idProyecto,
      idPerfil,
    );
    this.validarColectivoDelProyecto(actor, proyecto);
    this.validarProyectoAbierto(proyecto);

    if (!this.busquedaAbierta(proyecto) || perfil.busquedaAbierta === false) {
      throw new ConflictError(
        "La búsqueda de colaboraciones está cerrada",
        "BUSQUEDA_CERRADA",
      );
    }

    const colaboradora =
      await this.colaboradorService.obtenerPorId(idColaborador);
    if (!colaboradora) {
      throw new NotFoundError(
        "La persona colaboradora no existe",
        "COLABORADORA_NO_ENCONTRADA",
      );
    }
    if (!colaboradora.aceptaMensajeria) {
      throw new ForbiddenError(
        "La persona colaboradora no acepta invitaciones ni mensajes",
        "COLABORADORA_NO_ACEPTA_MENSAJERIA",
      );
    }
    if (
      await this.colaboracionRepository.existeColaboracion(
        idProyecto,
        idColaborador,
      )
    ) {
      throw new ConflictError(
        "La persona ya participa de este proyecto",
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
        "La persona ya tiene una postulación pendiente para este perfil",
        "POSTULACION_YA_EXISTENTE",
      );
    }

    try {
      return await this.notificacionService.crearEventoSistema({
        tipo: TipoNotificacion.INVITACION_PROYECTO,
        contenido: `El colectivo te invita a colaborar en el proyecto "${proyecto.titulo}", para el perfil "${perfil.descripcion}".${mensaje ? ` Mensaje: ${mensaje}` : ""}`,
        idColectivo: proyecto.idColectivo,
        idColaborador: colaboradora._id ?? colaboradora.id,
        idProyecto: proyecto._id,
        idPerfil: perfil._id ?? perfil.id,
        estadoInvitacion: "PENDIENTE",
      });
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictError(
          "Ya existe una invitación pendiente para este perfil",
          "INVITACION_YA_EXISTENTE",
        );
      }
      throw error;
    }
  }

  async resolverInvitacion(
    idProyecto,
    idInvitacion,
    decision,
    esAnonima,
    actor,
  ) {
    this.validarColaboradora(actor);
    if (
      ![EstadoPostulacion.ACEPTADA, EstadoPostulacion.RECHAZADA].includes(
        decision,
      )
    ) {
      throw new BadRequestError(
        "La decisión debe ser ACEPTADA o RECHAZADA",
        "DECISION_INVITACION_INVALIDA",
      );
    }
    const repo = this.notificacionRepository;
    const invitacion = await repo.buscarPorId(idInvitacion);
    if (
      !invitacion ||
      invitacion.tipo !== TipoNotificacion.INVITACION_PROYECTO ||
      String(invitacion.idColaborador) !== String(actor.id) ||
      String(invitacion.idProyecto) !== String(idProyecto)
    ) {
      throw new NotFoundError(
        "Invitación no encontrada",
        "INVITACION_NO_ENCONTRADA",
      );
    }
    if (invitacion.estadoInvitacion !== "PENDIENTE") {
      throw new ConflictError(
        "La invitación ya fue respondida",
        "INVITACION_YA_RESUELTA",
      );
    }

    let proyecto;
    let perfil;
    let colaboradora;
    if (decision === EstadoPostulacion.ACEPTADA) {
      ({ proyecto, perfil } = await this.buscarProyectoYPerfil(
        idProyecto,
        invitacion.idPerfil,
      ));
      this.validarProyectoAbierto(proyecto);
      if (!this.busquedaAbierta(proyecto) || perfil.busquedaAbierta === false) {
        throw new ConflictError(
          "La búsqueda de colaboraciones está cerrada",
          "BUSQUEDA_CERRADA",
        );
      }
      if (
        await this.colaboracionRepository.existeColaboracion(
          idProyecto,
          actor.id,
        )
      ) {
        throw new ConflictError(
          "Ya participás de este proyecto",
          "COLABORACION_YA_EXISTENTE",
        );
      }
      if (
        await this.postulacionRepository.existePendiente(
          idProyecto,
          perfil._id,
          actor.id,
        )
      ) {
        throw new ConflictError(
          "Ya tenés una postulación pendiente para este perfil",
          "POSTULACION_YA_EXISTENTE",
        );
      }
      const ocupadas = await this.colaboracionRepository.contarPorPerfil(
        perfil._id,
      );
      if (
        perfil.limiteColaboraciones != null &&
        ocupadas >= perfil.limiteColaboraciones
      ) {
        throw new ConflictError(
          "Se alcanzó el límite de colaboraciones para este perfil",
          "LIMITE_COLABORACIONES_ALCANZADO",
        );
      }
      colaboradora = await this.colaboradorService.obtenerPorId(actor.id);
      if (!colaboradora)
        throw new NotFoundError(
          "Colaboradora no encontrada",
          "COLABORADORA_NO_ENCONTRADA",
        );
    }

    const actualizada = await repo.cambiarEstadoInvitacion(
      idInvitacion,
      actor.id,
      "PENDIENTE",
      decision,
    );
    if (!actualizada)
      throw new ConflictError(
        "La invitación ya fue respondida",
        "INVITACION_YA_RESUELTA",
      );
    if (decision === EstadoPostulacion.ACEPTADA) {
      try {
        await this.colaboracionRepository.crearDesdeInvitacion(
          new Colaboracion(
            proyecto,
            colaboradora,
            perfil,
            new Date(),
            esAnonima,
          ),
        );
      } catch (error) {
        try {
          const revertida = await repo.cambiarEstadoInvitacion(
            idInvitacion,
            actor.id,
            decision,
            "PENDIENTE",
          );
          if (!revertida) throw new Error("No se pudo reabrir la invitación");
        } catch (errorRollback) {
          throw new AggregateError(
            [error, errorRollback],
            "Falló la colaboración y la reversión de la invitación",
          );
        }
        if (error.code === 11000)
          throw new ConflictError(
            "Ya participás de este proyecto",
            "COLABORACION_YA_EXISTENTE",
          );
        throw error;
      }
      await this.cerrarPerfilSiLleno(perfil, proyecto);
    }
    return this.notificacionService.toDTO(actualizada);
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
      try {
        await this.notificacionService.notificarResolucionPostulacion(
          proyecto,
          rechazada,
          EstadoPostulacion.RECHAZADA,
        );
      } catch (error) {
        let resultado;
        try {
          resultado =
            await this.postulacionRepository.reabrirSiRechazada(idPostulacion);
        } catch (errorRollback) {
          throw new AggregateError(
            [error, errorRollback],
            "Falló el rechazo y también su reversión",
          );
        }
        if (resultado.modifiedCount !== 1) {
          throw new AggregateError(
            [error, new Error("No se pudo reabrir la postulación")],
            "Falló el rechazo y también su reversión",
          );
        }
        throw error;
      }
      return this.toDTO(rechazada);
    }

    return this.aceptarPostulacion(proyecto, postulacion, idProyecto);
  }

  async aceptarPostulacion(proyecto, postulacion, idProyecto) {
    this.validarProyectoAbierto(proyecto);
    const idPostulacion = String(postulacion._id ?? postulacion.id);

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
    let colaboracionCreada = false;
    let colaborador;
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

      colaborador = await this.colaboradorService.obtenerPorId(
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
          perfil,
          new Date(),
          postulacion.esAnonima,
          postulacion,
        ),
      );
      colaboracionCreada = true;

      await this.notificacionService.notificarResolucionPostulacion(
        proyecto,
        { ...postulacion, idColaborador: colaborador._id },
        EstadoPostulacion.ACEPTADA,
        perfil,
      );
    } catch (error) {
      const erroresRollback = [];
      if (colaboracionCreada) {
        try {
          await this.colaboracionRepository.darDeBaja(
            idProyecto,
            postulacion.idColaborador,
          );
        } catch (errorRollback) {
          erroresRollback.push(errorRollback);
        }
      }
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

    await this.cerrarPerfilSiLleno(perfil, proyecto);

    const resultado = this.toDTO({
      ...(typeof postulacion.toObject === "function"
        ? postulacion.toObject()
        : postulacion),
      estado: EstadoPostulacion.ACEPTADA,
      idColaborador: colaborador,
    });
    this.despachadorWebhooks.emitir(
      EventoWebhook.COLABORACION_ACEPTADA,
      proyecto.idColectivo,
      {
        idProyecto: String(proyecto._id),
        tituloProyecto: proyecto.titulo,
        idPerfil: String(perfil._id),
        idPostulacion: String(idPostulacion),
        esAnonima: Boolean(postulacion.esAnonima),
        fecha: new Date().toISOString(),
      },
    );
    return resultado;
  }

  async cerrarPerfilSiLleno(perfil, proyecto) {
    if (
      perfil.tipoAceptacion === TipoAceptacion.LLENAR_VACANTES &&
      perfil.limiteColaboraciones != null &&
      (await this.colaboracionRepository.contarPorPerfil(perfil._id)) >=
        perfil.limiteColaboraciones
    ) {
      await this.perfilRepository.actualizar(perfil._id, {
        busquedaAbierta: false,
      });
      const rechazadas =
        await this.postulacionRepository.rechazarPendientesPorPerfil(
          perfil._id,
        );
      for (const rechazada of rechazadas) {
        await this.notificacionService.notificarResolucionPostulacion(
          proyecto,
          rechazada,
          EstadoPostulacion.RECHAZADA,
          perfil,
        );
      }
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
      actor?.rol === Rol.COLECTIVO &&
      String(actor.id) === String(proyecto.idColectivo);
    const esColaboradoraDeLaColaboracion =
      actor?.rol === Rol.COLABORADOR &&
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
