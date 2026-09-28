export class Proyecto {
  constructor(
    titulo,
    descripcion,
    perfiles,
    estado,
    fechaInicio,
    idProyecto,
  ) {
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.estado = estado;
    this.perfiles = perfiles;
    this.fechaInicio = fechaInicio;
    this.idProyecto = idProyecto;
  }
  cambiarEstado(nuevoEstado) {
    this.estado = nuevoEstado;
  }
  cerrar() {
    this.cambiarEstado("FINALIZADO");
  }
  estaFinalizado() {
    return this.estado === "FINALIZADO";
  }

  aceptarColaborador() {
    if (this.estaFinalizado()) {
      throw new Error(
        "No se puede aceptar un colaborador en un proyecto finalizado.",
      );
    }
  }
}
