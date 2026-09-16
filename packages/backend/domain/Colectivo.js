export class Colectivo {
  constructor(nombre, idColectivo, descripcion, ubicacion, tipoDeColectivo) {
    this.nombre = nombre;
    this.idColectivo = idColectivo;
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
