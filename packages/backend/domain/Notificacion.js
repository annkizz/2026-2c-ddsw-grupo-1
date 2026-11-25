export class Notificacion {
  constructor({
    id,
    fecha = new Date(),
    contenido,
    tipo,
    idColectivo,
    idColaborador,
    idProyecto,
    idPerfil,
    idPostulacion,
    estadoInvitacion,
    envios = [],
  }) {
    this.id = id;
    this.fecha = fecha;
    this.contenido = contenido;
    this.tipo = tipo;
    this.idColectivo = idColectivo;
    this.idColaborador = idColaborador;
    this.idProyecto = idProyecto;
    this.idPerfil = idPerfil;
    this.idPostulacion = idPostulacion;
    this.estadoInvitacion = estadoInvitacion;
    this.envios = envios;
    this.leida = false;
  }

  registrarEnvio(envio) {
    this.envios.push(envio);
  }
}
