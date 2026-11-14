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
      .select("idProyecto idPerfil idColaborador fecha esAnonima")
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
          // Si la colaboracion ya existe se actualiza; el service bloquea el
          // duplicado con 409 antes de llegar al repo.
          idProyecto: colaboracion.proyecto._id,
          idPerfil: colaboracion.perfil?._id ?? null,
          idPostulacion: colaboracion.postulacion?._id ?? null,
          idColaborador: colaboracion.colaborador._id,
          fecha: colaboracion.fecha,
          esAnonima: colaboracion.esAnonima,
        },
        {
          upsert: true,
          returnDocument: "after",
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec()
      .then((guardada) => ({
        idProyecto: guardada.idProyecto,
        idPerfil: guardada.idPerfil,
        idColaborador: colaboracion.colaborador,
        fecha: guardada.fecha,
        esAnonima: guardada.esAnonima ?? colaboracion.esAnonima,
      }));
  }

  crearDesdePostulacion(colaboracion) {
    return this.colaboracionModel.create({
      idProyecto: colaboracion.proyecto._id,
      idPerfil: colaboracion.perfil._id,
      idPostulacion: colaboracion.postulacion._id,
      idColaborador: colaboracion.colaborador._id,
      fecha: colaboracion.fecha,
      esAnonima: colaboracion.esAnonima,
    });
  }

  async contarPorPerfil(idPerfil) {
    return this.colaboracionModel.countDocuments({ idPerfil });
  }

  darDeBaja(idProyecto, idColaborador) {
    return this.colaboracionModel
      .findOneAndDelete({ idProyecto, idColaborador })
      .exec();
  }
}
