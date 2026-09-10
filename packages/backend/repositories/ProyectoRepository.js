import { Colaboracion } from "../domain/Colaboracion.js";

export class ProyectoRepository {
  constructor() {
    this.proyectos = [];
    this.colaboraciones = [];
  }

  obtenerTodos() {
    return this.proyectos;
  }

  obtenerTodasColaboraciones = () => {
    return this.colaboraciones;
  }

  encontrarPorId(idProyecto) {
    return this.proyectos.find(
      (proyecto) => proyecto.id_proyecto === idProyecto,
    );
  }

  save(unProyecto) {
    const indice = this.proyectos.findIndex(
      (proyecto) => proyecto.id_proyecto === unProyecto.id_proyecto,
    );

    if (indice === -1) {
      this.proyectos.push(unProyecto);
      return unProyecto;
    }

    this.proyectos[indice] = unProyecto;
    return unProyecto;
  }

  saveColaboracion = (colaboracion) => {
    const indice = this.colaboraciones.push(colaboracion);
  }


}
