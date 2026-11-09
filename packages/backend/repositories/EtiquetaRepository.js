import { ProyectoModel } from "../schemas/proyectoSchema.js";
import { ColectivoModel } from "../schemas/colectivoSchema.js";

export class EtiquetaRepository {
  constructor(
    proyectoModel = ProyectoModel,
    colectivoModel = ColectivoModel,
  ) {
    this.proyectoModel = proyectoModel;
    this.colectivoModel = colectivoModel;
  }

  async obtenerTodas() {
    const proyectos = await this.proyectoModel
      .find()
      .select("etiquetas")
      .exec();
    const colectivos = await this.colectivoModel
      .find()
      .select("etiquetas")
      .exec();

    // Se recorre y agrega a mano: si la etiqueta ya esta, no se agrega otra vez
    const todas = [];
    for (const documento of [...proyectos, ...colectivos]) {
      for (const etiqueta of documento.etiquetas ?? []) {
        if (!todas.includes(etiqueta)) {
          todas.push(etiqueta);
        }
      }
    }

    return todas.sort();
  }
}
