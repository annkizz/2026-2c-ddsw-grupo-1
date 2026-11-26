import { MatchingCacheModel } from "../schemas/matchingCacheSchema.js";

export class MatchingCacheRepository {
  constructor(model = MatchingCacheModel) {
    this.model = model;
  }

  buscarPorColaborador(idColaborador) {
    return this.model.findOne({ idColaborador }).lean().exec();
  }

  obtenerTodos() {
    return this.model.find().lean().exec();
  }

  guardar(idColaborador, proyectos) {
    return this.model
      .findOneAndUpdate(
        { idColaborador },
        { proyectos, calculadoEn: new Date() },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      )
      .exec();
  }
}
