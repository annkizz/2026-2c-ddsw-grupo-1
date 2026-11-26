import mongoose from "mongoose";
import { TipoNotificacion } from "../domain/TipoNotificacion.js";
import { NotificacionModel } from "../schemas/notificacionSchema.js";

export class NotificacionRepository {
  constructor(model = NotificacionModel) {
    this.model = model;
  }

  async obtenerTodosPaginado(filtro, pag, limite) {
    const skip = (pag - 1) * limite;
    const [notificaciones, total] = await Promise.all([
      this.model
        .find(filtro)
        .sort({ fecha: -1 })
        .skip(skip)
        .limit(limite)
        .exec(),
      this.model.countDocuments(filtro).exec(),
    ]);

    return {
      notificaciones,
      total,
      pag,
      totalPags: Math.ceil(total / limite),
    };
  }

  obtenerTodosPorColaboradora(id, pag, limite) {
    return this.obtenerTodosPaginado({ idColaborador: id }, pag, limite);
  }

  buscarPorId(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return this.model.findById(id).exec();
  }

  existeNotificacionDeRechazo(idPostulacion, idColaborador) {
    return this.model.exists({
      idPostulacion,
      idColaborador,
      tipo: TipoNotificacion.POSTULACION_RECHAZADA,
    });
  }

  cambiarEstadoInvitacion(id, idColaborador, estadoActual, estadoNuevo) {
    return this.model
      .findOneAndUpdate(
        {
          _id: id,
          idColaborador,
          tipo: "INVITACION_PROYECTO",
          estadoInvitacion: estadoActual,
        },
        { $set: { estadoInvitacion: estadoNuevo } },
        { returnDocument: "after", runValidators: true },
      )
      .exec();
  }

  // Solo agrega el resultado de los envíos externos: no pisa otros campos que hayan cambiado
  // mientras se mandaba el mail (por ejemplo, el estado de una invitación ya respondida).
  registrarEnvios(id, envios) {
    return this.model
      .findByIdAndUpdate(
        id,
        { $set: { envios } },
        { returnDocument: "after", runValidators: true },
      )
      .exec();
  }

  save(notificacion) {
    const datos = {
      fecha: notificacion.fecha,
      contenido: notificacion.contenido,
      tipo: notificacion.tipo,
      idColectivo: notificacion.idColectivo,
      idColaborador: notificacion.idColaborador,
      idProyecto: notificacion.idProyecto,
      idPerfil: notificacion.idPerfil,
      idPostulacion: notificacion.idPostulacion,
      estadoInvitacion: notificacion.estadoInvitacion,
      envios: notificacion.envios,
      leida: notificacion.leida,
    };

    if (!notificacion.id) {
      return new this.model(datos).save();
    }

    return this.model
      .findByIdAndUpdate(notificacion.id, datos, {
        returnDocument: "after",
        runValidators: true,
      })
      .exec();
  }
}
