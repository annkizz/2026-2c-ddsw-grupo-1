export class Colectivo {
  constructor(nombre, id_colectivo, descripcion, ubicacion, tipoDeColectivo) {
    this.nombre = nombre;
    this.id_colectivo = id_colectivo;
    this.descripcion = descripcion;
    this.ubicacion = ubicacion;
    this.tipoDeColectivo = tipoDeColectivo;
    this.proyectos = [];
  }

  agregarProyecto(unProyecto) {
    this.proyectos.push(unProyecto);
  }

  finalizar(proyecto) {
    proyecto.cerrar();
  }
}
