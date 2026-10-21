// se usa en seed.js y en las pruebas de integracion para que carguen la misma seed con el mismo codigo x eso lo puse aparte

import { PerfilModel } from "../schemas/perfilSchema.js";
import { LogroModel } from "../schemas/logroSchema.js";
import { ProyectoModel } from "../schemas/proyectoSchema.js";
import { ColaboracionModel } from "../schemas/colaboracionSchema.js";

export function crearAdaptadorDeSeed() {
  return {
    async borrarDatosDeProyectos(idsProyecto) {
      await PerfilModel.deleteMany({ idProyecto: { $in: idsProyecto } });
      await LogroModel.deleteMany({ idProyecto: { $in: idsProyecto } });
      await ColaboracionModel.deleteMany({ idProyecto: { $in: idsProyecto } });
    },
    guardarPerfil({ id, ...datos }) {
      return PerfilModel.findOneAndUpdate(
        { _id: id },
        { $set: datos },
        {
          upsert: true,
          returnDocument: "after",
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      );
    },
    guardarLogro({ id, ...datos }) {
      return LogroModel.findOneAndUpdate(
        { _id: id },
        { $set: datos },
        {
          upsert: true,
          returnDocument: "after",
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      );
    },
    idsProyectosDeColectivo(idColectivo) {
      return ProyectoModel.distinct("_id", { idColectivo });
    },
  };
}
