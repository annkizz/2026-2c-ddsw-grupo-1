export class Proyecto {
  constructor(
    titulo,
    descripcion,
    perfiles,
    estado,
    fechaInicio,
    fechaLimiteCierre,
    idColectivo,
    porcentajeConcrecion,
    enlaceSistema,
    enlaceCodigoFuente,
    busquedaAbierta = true,
    fechaLimiteBusqueda = null,
  ) {
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.estado = estado;
    this.perfiles = perfiles;
    this.fechaInicio = fechaInicio;
    this.fechaLimiteCierre = fechaLimiteCierre;
    this.idColectivo = idColectivo;
    this.porcentajeConcrecion = porcentajeConcrecion;
    this.enlaceSistema = enlaceSistema;
    this.enlaceCodigoFuente = enlaceCodigoFuente;
    this.busquedaAbierta = busquedaAbierta;
    this.fechaLimiteBusqueda = fechaLimiteBusqueda;
    
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
    return (
      !this.estaFinalizado() &&
      this.fechaLimiteCierre <= ahora &&
      this.tieneCierreProgramado()
    );
  }
  actualizarAvance({
    porcentajeConcrecion,
    enlaceSistema,
    enlaceCodigoFuente,
  }) {
    if (porcentajeConcrecion !== undefined) {
      this.porcentajeConcrecion = porcentajeConcrecion;
    }
    if (enlaceSistema !== undefined) {
      this.enlaceSistema = enlaceSistema;
    }
    if (enlaceCodigoFuente !== undefined) {
      this.enlaceCodigoFuente = enlaceCodigoFuente;
    }
  }

  aceptaPostulaciones(ahora = new Date()) {
    return ( !this.estaFinalizado() && this.busquedaAbierta && (this.fechaLimiteBusqueda === null || this.fechaLimiteBusqueda > ahora) )
  }
}
