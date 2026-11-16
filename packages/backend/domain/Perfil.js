export class Perfil {
  constructor(
    descripcion,
    habilidadesRequeridas,
    habilidadesOpcionales,
    compromiso,
    limiteColaboraciones = null,
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
  }
}
