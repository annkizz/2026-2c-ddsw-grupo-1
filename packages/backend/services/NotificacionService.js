import { Notificacion } from "../domain/Notificacion.js";
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

  toDTO(notificacion) {
    return {
      id: String(notificacion.id ?? notificacion._id),
      fecha: notificacion.fecha,
      contenido: notificacion.contenido,
      idColectivo: String(notificacion.idColectivo),
      idColaborador: String(notificacion.idColaborador),
      envios: (notificacion.envios ?? []).map(
        ({ tipoDeContacto, estado, detalle }) => ({
          tipoDeContacto,
          estado,
          ...(detalle && { detalle }),
        }),
      ),
    };
  }

  construirMensaje(colectivo, contenido) {
    return {
      asunto: `Nuevo mensaje de ${colectivo.nombre} en Código a Voluntad`,
      texto: `${colectivo.nombre} te escribió en Código a Voluntad:\n\n${contenido}`,
    };
  }

  // Un colectivo contacta a una colaboradora. Si ella aceptó ser contactada:
  // 1) se guarda el mensaje interno; 2) se lo replica por cada medio de contacto registrado.
  async crear(datosNotificacion) {
    const { idColectivo, idColaborador, contenido } = datosNotificacion;

    const colectivo =
      await this.colectivoRepository.encontrarPorId(idColectivo);
    if (!colectivo) {
      throw new NotFoundError(
        "el colectivo no existe",
        "COLECTIVO_NO_ENCONTRADO",
      );
    }

    const colaboradora =
      await this.colaboradorRepository.encontrarPorId(idColaborador);
    if (!colaboradora) {
      throw new NotFoundError(
        "la colaboradora no existe",
        "COLABORADORA_NO_ENCONTRADA",
      );
    }

    if (!colaboradora.aceptaMensajeria) {
      throw new ForbiddenError(
        "la colaboradora no aceptó ser contactada por la mensajería de la plataforma",
        "COLABORADORA_NO_ACEPTA_MENSAJERIA",
      );
    }

    const notificacion = new Notificacion({
      contenido,
      idColectivo: colectivo._id,
      idColaborador: colaboradora._id,
    });

    // el mensaje interno queda guardado aunque falle (o se corte) el envío externo
    const guardadaInicial =
      await this.notificacionRepository.save(notificacion);
    notificacion.id = guardadaInicial.id ?? guardadaInicial._id;

    const mensaje = this.construirMensaje(colectivo, contenido);
    const envios = await Promise.all(
      (colaboradora.mediosDeContacto ?? []).map(async (medio) => {
        try {
          const resultado = await this.notificadorExterno.enviar(
            medio,
            mensaje,
          );
          return { ...resultado, tipoDeContacto: medio.tipoDeContacto };
        } catch (error) {
          console.error(
            `Falló el envío de notificación por ${medio.tipoDeContacto} (${error.name}).`,
          );
          return {
            tipoDeContacto: medio.tipoDeContacto,
            estado: "FALLIDO",
            detalle: "No se pudo completar el envío por este medio.",
          };
        }
      }),
    );
    envios.forEach((envio) => notificacion.registrarEnvio(envio));

    const guardada = await this.notificacionRepository.save(notificacion);
    return this.toDTO(guardada);
  }

  async obtenerTodos(filtro = {}) {
    const notificaciones =
      await this.notificacionRepository.obtenerTodos(filtro);
    return notificaciones.map((n) => this.toDTO(n));
  }

  async obtenerTodosPaginado(pag, limite) {
    const resultado =
      await this.notificacionRepository.obternerTodosPaginado(pag, limite);

    const notificacionesDto = resultado.notificaciones.map((n) => this.toDTO(n));
    return {
        ...resultado,
        notificaciones: notificacionesDto
    };
  }

  async obtenerPorId(id) {
    const notificacion = await this.notificacionRepository.encontrarPorId(id);
    if (!notificacion) {
      throw new NotFoundError(
        "la notificación no existe",
        "NOTIFICACION_NO_ENCONTRADA",
      );
    }
    return this.toDTO(notificacion);
  }
}
