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
    etiquetas = [],
    ubicacion = null,
    destacado = false,
    destacadoHasta = null,
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
    this.etiquetas = etiquetas ?? [];
    this.ubicacion = ubicacion ?? null;
    this.destacado = destacado ?? false;
    this.destacadoHasta = destacadoHasta ?? null;
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

  busquedaDeColaboracionesAbierta(ahora = new Date()) {
    return (
      this.busquedaAbierta !== false &&
      (!this.fechaLimiteBusqueda || this.fechaLimiteBusqueda > ahora)
    );
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

  configurarDestacado(destacado, destacadoHasta = null) {
    this.destacado = destacado;
    this.destacadoHasta = destacado ? destacadoHasta : null;
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

  editarDatos({ titulo, descripcion, etiquetas }) {
    this.titulo = titulo;
    this.descripcion = descripcion;
    if (etiquetas !== undefined) {
      this.etiquetas = etiquetas;
    }
  }

  configurarBusqueda(busquedaAbierta, fechaLimiteBusqueda = null) {
    this.busquedaAbierta = busquedaAbierta;
    this.fechaLimiteBusqueda = busquedaAbierta ? fechaLimiteBusqueda : null;
    // busquedaAbierta true -> this.fechaLimiteBusqueda = fechaLimiteBusqueda; si es false, null
  }

  busquedaVigente(ahora = new Date()) {
    return (
      !this.estaFinalizado() &&
      this.busquedaAbierta === true &&
      (!this.fechaLimiteBusqueda || this.fechaLimiteBusqueda > ahora)
    );
  }

  aceptaPostulaciones(ahora = new Date()) {
    return (
      !this.estaFinalizado() && this.busquedaDeColaboracionesAbierta(ahora)
    );
  }
}
