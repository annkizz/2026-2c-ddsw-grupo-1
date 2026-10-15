import { ColectivoModel } from "../schemas/colectivoSchema.js";

export class ColectivoRepository {
  constructor(model = ColectivoModel) {
    this.model = model;
  }

  obtenerTodos() {
    return this.model.find().exec();
  }

  encontrarPorId(id) {
    return this.model.findOne({ idColectivo: id }).exec();
  }

  save(unColectivo) {
    return this.model.findOneAndUpdate(
      { idColectivo: unColectivo.idColectivo },
      {
        $set: {
          nombre: unColectivo.nombre,
          descripcion: unColectivo.descripcion,
          ubicacion: unColectivo.ubicacion,
          tipoDeColectivo: unColectivo.tipoDeColectivo,
          proyectos: unColectivo.proyectos,
        },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    ).exec();
  }
}
