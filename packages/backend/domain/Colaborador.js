export class Colaborador {
    constructor(
    nombreFantasia,
    usuarioGitHub,
    nombre,
    apellido,
    presentacion,
    pronombres,
    idColaborador
    ) {
        this.nombreFantasia = nombreFantasia;
        this.usuarioGitHub = usuarioGitHub;
        this.nombre = nombre;
        this.apellido = apellido;
        this.presentacion = presentacion;
        this.pronombres = pronombres;
        this.idColaborador = idColaborador;
    }

   anotarse(proyecto) {
    if (proyecto.aceptarColaborador()) {
    this.proyectos.push(proyecto)}
    }
}

