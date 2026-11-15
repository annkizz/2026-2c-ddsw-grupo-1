export class Perfil {
  constructor(descripcion, habilidadesRequeridas, habilidadesOpcionales, compromiso, limiteColaboraciones = null)
  {
    this.descripcion = descripcion,
    this.habilidadesRequeridas = habilidadesRequeridas,
    this.habilidadesOpcionales = habilidadesOpcionales,
    this.compromiso = compromiso,
    this.limiteColaboraciones = limiteColaboraciones;
  }

  tieneLimite() {
    return this.limiteColaboraciones !== null;
  }

  tieneVacantes(colaboracionesActivas) {
    return !this.tieneLimite() || colaboracionesActivas < this.limiteColaboraciones;
  }
}
