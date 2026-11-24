import mongoose from "mongoose";
import { EstadoPostulacion } from "../domain/EstadoPostulacion.js";
import { PostulacionModel } from "../schemas/postulacionSchema.js";

export class PostulacionRepository {
  constructor(model = PostulacionModel) {
    this.model = model;
  }

  save(postulacion) {
    return this.model.create({
      idProyecto: postulacion.idProyecto,
      idPerfil: postulacion.idPerfil,
      idColaborador: postulacion.idColaborador,
      fechaPostulacion: postulacion.fechaPostulacion,
      estado: postulacion.estado,
      esAnonima: postulacion.esAnonima,
    });
  }

  buscarPorId(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return this.model.findById(id).exec();
  }

  eliminarSiPendiente(id) {
    return this.model.deleteOne({ _id: id, estado: EstadoPostulacion.PENDIENTE }).exec();
  }

  obtenerPorProyecto(idProyecto) {
    return this.model
      .find({ idProyecto })
      .sort({ fechaPostulacion: -1 })
      .populate(
        "idColaborador",
        "nombreFantasia usuarioGitHub nombre apellido pronombres presentacion habilidades mediosDeContacto aceptaMensajeria",
      )
      .exec();
  }

  obtenerPorColaborador(idColaborador) {
    return this.model
      .find({ idColaborador })
      .sort({ fechaPostulacion: -1 })
      .exec();
  }

  existePendiente(idProyecto, idPerfil, idColaborador) {
    return this.model.exists({
      idProyecto,
      idPerfil,
      idColaborador,
      estado: EstadoPostulacion.PENDIENTE,
    });
  }

  contarPorPerfil(idPerfil) {
    return this.model.countDocuments({ idPerfil });
  }

  actualizarEstadoSiPendiente(id, estado) {
    return this.model
      .findOneAndUpdate(
        { _id: id, estado: EstadoPostulacion.PENDIENTE },
        { $set: { estado } },
        { returnDocument: "after" },
      )
      .exec();
  }

  async rechazarPendientes(filtro, registrarRevision = false) {
    const pendientes = await this.model
      .find({ ...filtro, estado: EstadoPostulacion.PENDIENTE })
      .exec();
    const rechazadas = [];

    for (const postulacion of pendientes) {
      const actualizacion = {
        $set: {
          estado: EstadoPostulacion.RECHAZADA,
          ...(registrarRevision && { fechaRevision: new Date() }),
        },
      };
      const rechazada = await this.model
        .findOneAndUpdate(
          {
            _id: postulacion._id,
            estado: EstadoPostulacion.PENDIENTE,
          },
          actualizacion,
          { returnDocument: "after" },
        )
        .exec();
      if (rechazada) rechazadas.push(rechazada);
    }

    return rechazadas;
  }

  rechazarPendientesDeProyecto(idProyecto) {
    return this.rechazarPendientes({ idProyecto });
  }

  reabrirSiAceptada(id) {
    return this.model
      .updateOne(
        { _id: id, estado: EstadoPostulacion.ACEPTADA },
        { $set: { estado: EstadoPostulacion.PENDIENTE } },
      )
      .exec();
  }

  reabrirSiRechazada(id) {
    return this.model
      .updateOne(
        { _id: id, estado: EstadoPostulacion.RECHAZADA },
        { $set: { estado: EstadoPostulacion.PENDIENTE } },
      )
      .exec();
  }

  rechazarPendientesPorPerfil(idPerfil) {
    return this.rechazarPendientes({ idPerfil }, true);
  }

}
