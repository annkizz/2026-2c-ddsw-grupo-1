import { ColaboracionModel } from "../schemas/colaboracionSchema.js";

export class ColaboracionRepository {
  constructor(colaboracionModel = ColaboracionModel) {
    this.colaboracionModel = colaboracionModel;
  }

  // distinct filtra x el campo plano idProyecto y devuelve idColaborador
  async obtenerIdsColaboradoresDeProyecto(idProyecto) {
    const ids = await this.colaboracionModel
      .distinct("idColaborador", { idProyecto })
      .exec();
    return ids.map((id) => id.toString());
  }

  async obtenerIdsProyectosDeColaborador(idColaborador) {
    const ids = await this.colaboracionModel
      .distinct("idProyecto", { idColaborador })
      .exec();
    return ids.map((id) => id.toString());
  }

  async existeColaboracion(idProyecto, idColaborador) {
    const encontrada = await this.colaboracionModel
      .findOne({ idProyecto, idColaborador })
      .exec();
    return encontrada !== null;
  }

  // colaboracion del proyecto y sus idColaborador 
  obtenerPorProyecto(idProyecto) {
    return this.colaboracionModel
      .find({ idProyecto })
      .select("idProyecto idColaborador fecha esAnonima")
      .populate("idColaborador", "nombreFantasia usuarioGitHub nombre apellido")
      .exec();
  }

  save(colaboracion) {
    return this.colaboracionModel
      .findOneAndUpdate(
        {
          idProyecto: colaboracion.proyecto._id,
          idColaborador: colaboracion.colaborador._id,
        },
        {
          $setOnInsert: {
            idProyecto: colaboracion.proyecto._id,
            idColaborador: colaboracion.colaborador._id,
            fecha: colaboracion.fecha,
            esAnonima: colaboracion.esAnonima,
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec()
      .then((guardada) => ({
        idProyecto: guardada.idProyecto,
        idColaborador: colaboracion.colaborador,
        fecha: guardada.fecha,
        esAnonima: guardada.esAnonima ?? colaboracion.esAnonima,
      }));
  }
}
