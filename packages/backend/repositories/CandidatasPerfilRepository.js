import { CandidatasPerfilModel } from "../schemas/candidatasPerfilSchema.js";

export class CandidatasPerfilRepository {
  constructor(model = CandidatasPerfilModel) {
    this.model = model;
  }

  buscarPorPerfil(idPerfil) {
    return this.model.findOne({ idPerfil }).lean().exec();
  }

  obtenerTodos() {
    return this.model.find().lean().exec();
  }

  guardar(idPerfil, idProyecto, candidatas, ahora = new Date()) {
    return this.model
      .findOneAndUpdate(
        { idPerfil },
        { idProyecto, candidatas, calculadoEn: ahora },
        { upsert: true, returnDocument: "after" },
      )
      .lean()
      .exec();
  }

  eliminarPorPerfil(idPerfil) {
    return this.model.deleteOne({ idPerfil }).exec();
  }

  eliminarTodos() {
    return this.model.deleteMany({}).exec();
  }
}
