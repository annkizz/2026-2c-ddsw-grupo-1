// se usa en seed.js y en las pruebas de integracion para que carguen la misma seed con el mismo codigo x eso lo puse aparte

import { PerfilModel } from "../schemas/perfilSchema.js";
import { LogroModel } from "../schemas/logroSchema.js";
import { ProyectoModel } from "../schemas/proyectoSchema.js";
import { ColaboracionModel } from "../schemas/colaboracionSchema.js";

export function crearAdaptadorDeSeed() {
  return {
    async borrarDatosDeProyectos(idsProyecto) {
      await PerfilModel.deleteMany({ proyecto: { $in: idsProyecto } });
      await LogroModel.deleteMany({ proyecto: { $in: idsProyecto } });
      await ColaboracionModel.deleteMany({ idProyecto: { $in: idsProyecto } });
    },
    guardarPerfil({ idPerfil, ...datos }) {
      return PerfilModel.findOneAndUpdate(
        { _id: idPerfil },
        { $set: datos },
        {
          upsert: true,
          returnDocument: "after",
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      );
    },
    guardarLogro({ idLogro, ...datos }) {
      return LogroModel.findOneAndUpdate(
        { _id: idLogro },
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
      return ProyectoModel.distinct("idProyecto", { idColectivo });
    },
  };
}
