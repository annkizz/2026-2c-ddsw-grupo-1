export class Colaboracion {
  constructor(
    proyecto,
    colaborador,
    fecha,
    esAnonima = false,
    perfil = null,
    postulacion = null,
  ) {
    this.proyecto = proyecto;
    this.perfil = perfil;
    this.postulacion = postulacion;
    this.colaborador = colaborador;
    this.fecha = fecha;
    this.esAnonima = esAnonima;
  }
}
