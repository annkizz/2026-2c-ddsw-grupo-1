export class Colectivo {
  constructor(nombre, descripcion, ubicacion, tipoDeColectivo, etiquetas = []) {
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.ubicacion = ubicacion;
    this.tipoDeColectivo = tipoDeColectivo;
    this.etiquetas = etiquetas ?? [];
  }

  finalizar(proyecto) {
    proyecto.cerrar();
  }
}
