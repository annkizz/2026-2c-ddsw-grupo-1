export class Colaboracion {
  constructor(proyecto, colaborador, fecha, esAnonima = false) {
    this.proyecto = proyecto;
    this.colaborador = colaborador;
    this.fecha = fecha;
    this.esAnonima = esAnonima;
  }
}
