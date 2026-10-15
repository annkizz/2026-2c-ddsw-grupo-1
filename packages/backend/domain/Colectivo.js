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
    const idProyecto =
      typeof unProyecto === "string" ? unProyecto : unProyecto.idProyecto;
    if (!this.proyectos.includes(idProyecto)) {
      this.proyectos.push(idProyecto);
    }
  }

  finalizar(proyecto) {
    proyecto.cerrar();
  }
}
