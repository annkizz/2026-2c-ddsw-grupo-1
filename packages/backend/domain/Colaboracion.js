export class Colaboracion {
  constructor(
    proyecto,
    colaborador,
    perfil,
    fecha,
    esAnonima = false,
    postulacion = null,
  ) {
    this.proyecto = proyecto;
    this.colaborador = colaborador;
    this.perfil = perfil;
    this.fecha = fecha;
    this.esAnonima = esAnonima;
    this.postulacion = postulacion;
    this.fechaCierre = null;
    this.motivoBaja = null;
  }
}