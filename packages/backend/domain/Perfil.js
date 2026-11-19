export class Perfil {
  constructor(
    descripcion,
    habilidadesRequeridas,
    habilidadesOpcionales,
    compromiso,
    limiteColaboraciones = null;
    tipoAceptacion,
  ) 
  {
    ((this.descripcion = descripcion),
      (this.habilidadesRequeridas = habilidadesRequeridas),
      (this.habilidadesOpcionales = habilidadesOpcionales),
      (this.compromiso = compromiso),
      (this.limiteColaboraciones = limiteColaboraciones),
      (this.busquedaAbierta = true),
      (this.tipoAceptacion = tipoAceptacion));
  }

  cerrarBusqueda(){
    this.busquedaAbierta = false;

  ) {
    this.descripcion = descripcion;
    this.habilidadesRequeridas = habilidadesRequeridas;
    this.habilidadesOpcionales = habilidadesOpcionales;
    this.compromiso = compromiso;
    this.limiteColaboraciones = limiteColaboraciones;
  }

  tieneLimite() {
    return this.limiteColaboraciones !== null;
  }

  tieneVacantes(colaboracionesActivas) {
    return (
      !this.tieneLimite() ||
      colaboracionesActivas < this.limiteColaboraciones
    );
  }
}
