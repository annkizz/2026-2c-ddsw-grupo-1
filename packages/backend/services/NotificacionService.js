import { Rol } from "../domain/Rol.js";
import { EstadoPostulacion } from "../domain/EstadoPostulacion.js";
import { Notificacion } from "../domain/Notificacion.js";
import { EstadoEnvio } from "../domain/EstadoEnvio.js";
import { TipoNotificacion } from "../domain/TipoNotificacion.js";
import { NotificacionRepository } from "../repositories/NotificacionRepository.js";
import { ColectivoRepository } from "../repositories/ColectivoRepository.js";
import { ColaboradorRepository } from "../repositories/ColaboradorRepository.js";
import { ForbiddenError, NotFoundError } from "../errors/AppError.js";
import { NotificadorExterno } from "./notificadores/NotificadorExterno.js";

export class NotificacionService {
  constructor(
    notificacionRepository = new NotificacionRepository(),
    colectivoRepository = new ColectivoRepository(),
    colaboradorRepository = new ColaboradorRepository(),
    notificadorExterno = new NotificadorExterno(),
  ) {
    this.notificacionRepository = notificacionRepository;
    this.colectivoRepository = colectivoRepository;
    this.colaboradorRepository = colaboradorRepository;
    this.notificadorExterno = notificadorExterno;
  }

  toDTO(notificacion, nombres = {}) {
    return {
      id: String(notificacion.id ?? notificacion._id),
      fecha: notificacion.fecha,
      contenido: notificacion.contenido,
      tipo: notificacion.tipo ?? TipoNotificacion.MENSAJE,
      idColectivo: String(notificacion.idColectivo),
      idColaborador: String(notificacion.idColaborador),
      ...(notificacion.idProyecto && {
        idProyecto: String(notificacion.idProyecto),
      }),
      ...(notificacion.idPerfil && { idPerfil: String(notificacion.idPerfil) }),
      ...(notificacion.idPostulacion && {
        idPostulacion: String(notificacion.idPostulacion),
      }),
      ...(nombres.nombreColectivo && {
        nombreColectivo: nombres.nombreColectivo,
      }),
      ...(nombres.nombreColaborador && {
        nombreColaborador: nombres.nombreColaborador,
      }),
      leida: notificacion.leida ?? false,
      envios: (notificacion.envios ?? []).map(
        ({ tipoDeContacto, estado, detalle }) => ({
          tipoDeContacto,
          estado,
          ...(detalle && { detalle }),
        }),
      ),
    };
  }

  async toDTOs(notificaciones) {
    const idsColectivos = [
      ...new Set(notificaciones.map((n) => String(n.idColectivo))),
    ];
    const idsColaboradores = [
      ...new Set(notificaciones.map((n) => String(n.idColaborador))),
    ];
    const [colectivos, colaboradores] = await Promise.all([
      this.colectivoRepository.obtenerPorIds(idsColectivos),
      this.colaboradorRepository.obtenerPorIds(idsColaboradores),
    ]);
    const nombresColectivos = new Map(
      colectivos.map((colectivo) => [String(colectivo._id), colectivo.nombre]),
    );
    const nombresColaboradores = new Map(
      colaboradores.map((colaborador) => [
        String(colaborador._id),
        colaborador.nombreFantasia,
      ]),
    );

    return notificaciones.map((notificacion) =>
      this.toDTO(notificacion, {
        nombreColectivo: nombresColectivos.get(
          String(notificacion.idColectivo),
        ),
        nombreColaborador: nombresColaboradores.get(
          String(notificacion.idColaborador),
        ),
      }),
    );
  }

  construirMensaje(colectivo, contenido) {
    return {
      asunto: `Nuevo mensaje de ${colectivo.nombre} en Código a Voluntad`,
      texto: `${colectivo.nombre} te escribió en Código a Voluntad:\n\n${contenido}`,
    };
  }

  async crear(datosNotificacion, usuario) {
    if (usuario?.rol !== Rol.COLECTIVO) {
      throw new ForbiddenError(
        "Solo un colectivo puede enviar mensajes",
        "ROL_NO_PERMITIDO",
      );
    }

    const colectivo = await this.colectivoRepository.buscarPorUsuario(
      usuario._id,
    );
    if (!colectivo) {
      throw new NotFoundError(
        "No se encontró el perfil del colectivo",
        "COLECTIVO_NO_ENCONTRADO",
      );
    }

    const colaboradora = await this.colaboradorRepository.buscarPorId(
      datosNotificacion.idColaborador,
    );
    if (!colaboradora) {
      throw new NotFoundError(
        "La persona colaboradora no existe",
        "COLABORADORA_NO_ENCONTRADA",
      );
    }
    if (!colaboradora.aceptaMensajeria) {
      throw new ForbiddenError(
        "La persona colaboradora no aceptó recibir mensajes",
        "COLABORADORA_NO_ACEPTA_MENSAJERIA",
      );
    }

    const notificacion = new Notificacion({
      contenido: datosNotificacion.contenido,
      tipo: TipoNotificacion.MENSAJE,
      idColectivo: colectivo._id,
      idColaborador: colaboradora._id,
    });

    const guardadaInicial = await this.notificacionRepository.save(notificacion);
    notificacion.id = guardadaInicial.id ?? guardadaInicial._id;

    const mensaje = this.construirMensaje(colectivo, notificacion.contenido);
    const envios = await Promise.all(
      (colaboradora.mediosDeContacto ?? []).map(async (medio) => {
        try {
          const resultado = await this.notificadorExterno.enviar(medio, mensaje);
          const detalle =
            resultado.estado === EstadoEnvio.FALLIDO
              ? "No se pudo completar el envío por este medio."
              : resultado.detalle;
          return {
            tipoDeContacto: medio.tipoDeContacto,
            estado: resultado.estado,
            ...(detalle && { detalle }),
          };
        } catch (error) {
          console.error(
            `[notificaciones] Falló el envío por ${medio.tipoDeContacto} (${error.name}).`,
          );
          return {
            tipoDeContacto: medio.tipoDeContacto,
            estado: EstadoEnvio.FALLIDO,
            detalle: "No se pudo completar el envío por este medio.",
          };
        }
      }),
    );
    envios.forEach((envio) => notificacion.registrarEnvio(envio));

    const guardada =
      envios.length > 0
        ? await this.notificacionRepository.save(notificacion)
        : guardadaInicial;
    return this.toDTO(guardada, {
      nombreColectivo: colectivo.nombre,
      nombreColaborador: colaboradora.nombreFantasia,
    });
  }

  async crearEventoSistema(datos) {
    const notificacion = new Notificacion(datos);
    const guardada = await this.notificacionRepository.save(notificacion);
    return this.toDTO(guardada);
  }

  notificarResolucionPostulacion(proyecto, postulacion, estado, perfil) {
    const aceptada = estado === EstadoPostulacion.ACEPTADA;
    const detallePerfil = perfil?.descripcion
      ? ` al perfil "${perfil.descripcion}"`
      : "";

    return this.crearEventoSistema({
      tipo: aceptada
        ? TipoNotificacion.POSTULACION_ACEPTADA
        : TipoNotificacion.POSTULACION_RECHAZADA,
      contenido: `Tu postulación${detallePerfil} del proyecto "${proyecto.titulo}" fue ${aceptada ? "aceptada" : "rechazada"}.`,
      idColectivo: proyecto.idColectivo,
      idColaborador:
        postulacion.idColaborador?._id ?? postulacion.idColaborador,
      idProyecto: proyecto._id,
      idPerfil: postulacion.idPerfil,
      idPostulacion: postulacion._id ?? postulacion.id,
    });
  }

  async obtenerPerfilPropio(usuario) {
    if (usuario?.rol === Rol.COLECTIVO) {
      const colectivo = await this.colectivoRepository.buscarPorUsuario(
        usuario._id,
      );
      if (!colectivo) {
        throw new NotFoundError(
          "No se encontró el perfil del colectivo",
          "COLECTIVO_NO_ENCONTRADO",
        );
      }
      return {
        filtro: {
          idColectivo: colectivo._id,
          $or: [
            {
              tipo: {
                $in: [
                  TipoNotificacion.MENSAJE,
                  TipoNotificacion.INVITACION_POSTULACION,
                ],
              },
            },
            { tipo: { $exists: false } },
          ],
        },
        idPropiedad: "idColectivo",
        idPerfil: colectivo._id,
      };
    }

    if (usuario?.rol === Rol.COLABORADOR) {
      const colaborador = await this.colaboradorRepository.buscarPorUsuario(
        usuario._id,
      );
      if (!colaborador) {
        throw new NotFoundError(
          "No se encontró el perfil de la persona colaboradora",
          "COLABORADORA_NO_ENCONTRADA",
        );
      }
      return {
        filtro: { idColaborador: colaborador._id },
        idPropiedad: "idColaborador",
        idPerfil: colaborador._id,
      };
    }

    throw new ForbiddenError(
      "Tu cuenta no puede consultar mensajes",
      "ROL_NO_PERMITIDO",
    );
  }

  async obtenerTodosPaginado(usuario, pag, limite) {
    const { filtro } = await this.obtenerPerfilPropio(usuario);
    const resultado = await this.notificacionRepository.obtenerTodosPaginado(
      filtro,
      pag,
      limite,
    );

    return {
      ...resultado,
      notificaciones: await this.toDTOs(resultado.notificaciones),
    };
  }

  async obtenerTodosPorColaboradora(idColaboradora, pag, limite, usuario) {
    if (usuario?.rol !== Rol.COLABORADOR) {
      throw new ForbiddenError(
        "Solo las personas colaboradoras pueden consultar su bandeja",
        "ROL_NO_PERMITIDO",
      );
    }
    const colaboradora = await this.colaboradorRepository.buscarPorId(
      idColaboradora,
    );
    if (!colaboradora || String(colaboradora.usuario) !== String(usuario._id)) {
      throw new NotFoundError(
        "No se encontró la persona colaboradora",
        "COLABORADORA_NO_ENCONTRADA",
      );
    }

    const resultado = await this.notificacionRepository.obtenerTodosPaginado(
      { idColaborador: colaboradora._id },
      pag,
      limite,
    );
    return {
      ...resultado,
      notificaciones: await this.toDTOs(resultado.notificaciones),
    };
  }

  async obtenerPorId(id, usuario) {
    const { idPropiedad, idPerfil } = await this.obtenerPerfilPropio(usuario);
    const notificacion = await this.notificacionRepository.buscarPorId(id);
    if (
      !notificacion ||
      String(notificacion[idPropiedad]) !== String(idPerfil)
    ) {
      throw new NotFoundError(
        "No se encontró la notificación",
        "NOTIFICACION_NO_ENCONTRADA",
      );
    }

    return (await this.toDTOs([notificacion]))[0];
  }
}
