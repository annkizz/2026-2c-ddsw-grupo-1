export class ProyectoRepository {
    constructor() {
        this.proyectos = [];
    }

    obtenerTodos() {
        return this.proyectos;
    }

    encontrarPorId(idProyecto) {
        return this.proyectos.find((proyecto) => proyecto.id_proyecto === idProyecto);
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
}