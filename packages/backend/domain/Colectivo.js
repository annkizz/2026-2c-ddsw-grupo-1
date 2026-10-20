export class Colectivo {
  constructor(nombre, descripcion, ubicacion, tipoDeColectivo) {
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.ubicacion = ubicacion;
    this.tipoDeColectivo = tipoDeColectivo;
  }

  finalizar(proyecto) {
    proyecto.cerrar();
  }
}
