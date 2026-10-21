export class Notificacion {
  constructor({
    id,
    fecha = new Date(),
    contenido,
    idColectivo,
    idColaborador,
    envios = [],
  }) {
    this.id = id;
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
