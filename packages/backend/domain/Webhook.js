import { FormatoWebhook } from "./EventoWebhook.js";

// URL a la q un colectivo q que le avisemos cuando pasa algo en sus proyectos
export class Webhook {
  constructor({
    idColectivo,
    url,
    eventos,
    formato = FormatoWebhook.GENERICO,
    activo = true,
    secreto,
  }) {
    this.idColectivo = idColectivo;
    this.url = url;
    this.eventos = eventos;
    this.formato = formato;
    this.activo = activo;
    this.secreto = secreto;
  }

  escuchaEvento(evento) {
    return this.activo && this.eventos.includes(evento);
  }
}