import { Colaboracion } from "../domain/Colaboracion.js";
import { ProyectoModel } from "../schemas/proyectoSchema.js";
import { ColaboracionModel } from "../schemas/colaboracionSchema.js";
import { ColaboradorModel } from "../schemas/colaboradorSchema.js";
import { Estado } from "../domain/Estado.js";

export class ProyectoRepository {
  constructor(
    proyectoModel = ProyectoModel,
    colaboracionModel = ColaboracionModel,
  ) {
    this.proyectoModel = proyectoModel;
    this.colaboracionModel = colaboracionModel;
  }

  obtenerTodos() {
    return this.proyectoModel.find().sort({ fechaInicio: -1 }).exec();
  }

  obtenerTodasColaboraciones = async () => {
    const colaboraciones = await this.colaboracionModel.find().lean().exec();
    return Promise.all(
      colaboraciones.map(async ({ idProyecto, idColaborador, fecha }) => {
        const [proyecto, colaborador] = await Promise.all([
          this.proyectoModel.findOne({ idProyecto }).exec(),
          ColaboradorModel.findOne({ idColaborador }).exec(),
        ]);
        return { proyecto, colaborador, fecha };
      }),
    );
  };

  encontrarPorId(idProyecto) {
    return this.proyectoModel.findOne({ idProyecto }).exec();
  }

  agregarPerfil(idProyecto, idPerfil) {
    return this.proyectoModel
      .updateOne({ idProyecto }, { $addToSet: { perfiles: idPerfil } })
      .exec();
  }

  quitarPerfil(idProyecto, idPerfil) {
    return this.proyectoModel
      .updateOne({ idProyecto }, { $pull: { perfiles: idPerfil } })
      .exec();
  }

  obtenerVencidos(ahora = new Date()) {
    return this.proyectoModel
      .find({
        estado: { $ne: Estado.FINALIZADO },
        fechaLimiteCierre: { $ne: null, $lte: ahora },
      })
      .exec();
  }

  save(unProyecto) {
    return this.proyectoModel.findOneAndUpdate(
      { idProyecto: unProyecto.idProyecto },
      {
        $set: {
          idColectivo: unProyecto.idColectivo,
          titulo: unProyecto.titulo,
          descripcion: unProyecto.descripcion,
          perfiles: unProyecto.perfiles,
          estado: unProyecto.estado,
          fechaInicio: unProyecto.fechaInicio,
          fechaLimiteCierre: unProyecto.fechaLimiteCierre,
        },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    ).exec();
  }

  saveColaboracion = async (colaboracion) => {
    const guardada = await this.colaboracionModel.findOneAndUpdate(
      {
        idProyecto: colaboracion.proyecto.idProyecto,
        idColaborador: colaboracion.colaborador.idColaborador,
      },
      {
        $setOnInsert: {
          idProyecto: colaboracion.proyecto.idProyecto,
          idColaborador: colaboracion.colaborador.idColaborador,
          fecha: colaboracion.fecha,
        },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    ).exec();

    return new Colaboracion(
      colaboracion.proyecto,
      colaboracion.colaborador,
      guardada.fecha,
    );
  };
}
