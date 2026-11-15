import { EstadoPostulacion } from "./EstadoPostulacion.js";

export class Postulacion {
  constructor(colaborador, perfil, esAnonima = false, fechaPostulacion = new Date()) {
    this.colaborador = colaborador;
    this.perfil = perfil;
    this.esAnonima = esAnonima;
    this.fechaPostulacion = fechaPostulacion;
    this.fechaRevision = null;
    this.estado = EstadoPostulacion.PENDIENTE;
  }
/*
  estaPendiente() {
    return this.estado === EstadoPostulacion.PENDIENTE;
  }

  aceptar(ahora = new Date()) {
    this.revisar(EstadoPostulacion.ACEPTADA, ahora);
  }

  rechazar(ahora = new Date()) {
    this.revisar(EstadoPostulacion.RECHAZADA, ahora);
  }

  revisar(nuevoEstado, ahora) {
    if (!this.estaPendiente()) {
      throw new Error("La postulación ya fue revisada.");
    }
    this.estado = nuevoEstado;
    this.fechaRevision = ahora;
  }
*/

}