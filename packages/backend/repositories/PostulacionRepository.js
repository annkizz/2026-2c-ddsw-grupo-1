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

  obtenerPorProyecto(idProyecto) {
    return this.model
      .find({ idProyecto })
      .sort({ fechaPostulacion: -1 })
      .populate(
        "idColaborador",
        "nombreFantasia usuarioGitHub nombre apellido pronombres presentacion mediosDeContacto aceptaMensajeria",
      )
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

  rechazarPendientesDeProyecto(idProyecto) {
    return this.model
      .updateMany(
        { idProyecto, estado: EstadoPostulacion.PENDIENTE },
        { $set: { estado: EstadoPostulacion.RECHAZADA } },
      )
      .exec();
  }

  reabrirSiAceptada(id) {
    return this.model
      .updateOne(
        { _id: id, estado: EstadoPostulacion.ACEPTADA },
        { $set: { estado: EstadoPostulacion.PENDIENTE } },
      )
      .exec();
  }

}
