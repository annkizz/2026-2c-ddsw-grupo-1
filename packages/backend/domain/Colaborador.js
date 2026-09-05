export class Colaborador {
    constructor(
    nombreFantasia,
    usuarioGitHub,
    nombre,
    apellido,
    presentacion,
    pronombres,
    idColaborador,
    habilidades
    ) {
        this.nombreFantasia = nombreFantasia;
        this.usuarioGitHub = usuarioGitHub;
        this.nombre = nombre;
        this.apellido = apellido;
        this.presentacion = presentacion;
        this.pronombres = pronombres;
        this.idColaborador = idColaborador;
        this.habilidades = habilidades;
    }

   anotarse(proyecto) {
    if (proyecto.aceptarColaborador()) {
    this.proyectos.push(proyecto)}
    }
}

