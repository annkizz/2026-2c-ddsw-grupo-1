export class Ubicacion {
  constructor(pais, provincia, ciudad, latitud = null, longitud = null) {
    this.pais = pais;
    this.provincia = provincia;
    this.ciudad = ciudad;
    this.latitud = latitud;
    this.longitud = longitud;
  }

  tieneCoordenadas() {
    return this.latitud != null && this.longitud != null;
  }
}
