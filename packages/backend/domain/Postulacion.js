import { EstadoPostulacion } from "./EstadoPostulacion.js";

export class Postulacion {
  constructor(
    proyecto,
    perfil,
    colaborador,
    fechaPostulacion,
    esAnonima = false,
  ) {
    this.idProyecto = proyecto._id;
    this.idPerfil = perfil._id;
    this.idColaborador = colaborador._id;
    this.fechaPostulacion = fechaPostulacion;
    this.esAnonima = esAnonima;
    this.estado = EstadoPostulacion.PENDIENTE;
  }
}
