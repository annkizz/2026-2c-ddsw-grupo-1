export class Proyecto {
  constructor(
    titulo,
    descripcion,
    perfiles,
    estado,
    fechaInicio,
    idProyecto,
    fechaLimiteCierre,
  ) {
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.estado = estado;
    this.perfiles = perfiles;
    this.fechaInicio = fechaInicio;
    this.idProyecto = idProyecto;
    this.fechaLimiteCierre = fechaLimiteCierre;
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
  programarCierre(unaFechaLimite) {
    this.fechaLimiteCierre = unaFechaLimite;
  }
  tieneCierreProgramado() {
    return this.fechaLimiteCierre !== null;
  }
  cierreVencido(ahora = new Date()) {
    return !this.estaFinalizado() && this.fechaLimiteCierre <= ahora && this.tieneCierreProgramado()
  }
}
