export class Colectivo {
  constructor(
    nombre,
    descripcion,
    ubicacion,
    tipoDeColectivo,
    etiquetas = [],
    mediosDeContacto = [],
    aceptaMensajeria = false,
  ) {
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.ubicacion = ubicacion;
    this.tipoDeColectivo = tipoDeColectivo;
    this.etiquetas = etiquetas ?? [];
    this.mediosDeContacto = mediosDeContacto ?? [];
    this.aceptaMensajeria = aceptaMensajeria;
  }

  finalizar(proyecto) {
    proyecto.cerrar();
  }
}
