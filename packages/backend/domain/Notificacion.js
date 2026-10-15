export class Notificacion {
  constructor({
    idNotificacion,
    fecha = new Date(),
    contenido,
    idColectivo,
    idColaborador,
    envios = [],
  }) {
    this.idNotificacion = idNotificacion;
    this.fecha = fecha;
    this.contenido = contenido;
    this.idColectivo = idColectivo;
    this.idColaborador = idColaborador;
    this.envios = envios;
  }

  registrarEnvio(envio) {
    this.envios.push(envio);
  }
}