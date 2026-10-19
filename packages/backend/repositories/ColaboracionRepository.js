import { Colaboracion } from "../domain/Colaboracion.js";
import { ColaboracionModel } from "../schemas/colaboracionSchema.js";
import { ColaboradorModel } from "../schemas/colaboradorSchema.js";

export class ColaboracionRepository {
  constructor(
    colaboracionModel = ColaboracionModel,
    colaboradorModel = ColaboradorModel,
  ) {
    this.colaboracionModel = colaboracionModel;
    this.colaboradorModel = colaboradorModel;
  }

  // distinct filtra x el campo plano idProyecto y devuelve idColaborador
  obtenerIdsColaboradoresDeProyecto(idProyecto) {
    return this.colaboracionModel
      .distinct("idColaborador", { idProyecto })
      .exec();
  }

  obtenerIdsProyectosDeColaborador(idColaborador) {
    return this.colaboracionModel
      .distinct("idProyecto", { idColaborador })
      .exec();
  }

  async existeColaboracion(idProyecto, idColaborador) {
    const encontrada = await this.colaboracionModel
      .findOne({ idProyecto, idColaborador })
      .exec();
    return encontrada !== null;
  }

  // colaboracion del proyecto y sus idColaborador 
  async obtenerPorProyecto(idProyecto) {
    const colaboraciones = await this.colaboracionModel
      .find({ idProyecto })
      .exec();

    const ids = [...new Set(colaboraciones.map((c) => c.idColaborador))];
    const colaboradores = ids.length
      ? await this.colaboradorModel.find({ idColaborador: { $in: ids } }).exec()
      : [];
    const colaboradoresPorId = new Map(
      colaboradores.map((colaborador) => [
        colaborador.idColaborador,
        colaborador,
      ]),
    );

    return colaboraciones.map((colaboracion) => ({
      colaborador: colaboradoresPorId.get(colaboracion.idColaborador) ?? null,
      fecha: colaboracion.fecha,
      esAnonima: colaboracion.esAnonima ?? false,
    }));
  }

  save(colaboracion) {
    return this.colaboracionModel
      .findOneAndUpdate(
        {
          idProyecto: colaboracion.proyecto.idProyecto,
          idColaborador: colaboracion.colaborador.idColaborador,
        },
        {
          $setOnInsert: {
            idProyecto: colaboracion.proyecto.idProyecto,
            idColaborador: colaboracion.colaborador.idColaborador,
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
      .then((guardada) =>
        new Colaboracion(
          colaboracion.proyecto,
          colaboracion.colaborador,
          guardada.fecha,
          guardada.esAnonima ?? colaboracion.esAnonima,
        ),
      );
  }
}
