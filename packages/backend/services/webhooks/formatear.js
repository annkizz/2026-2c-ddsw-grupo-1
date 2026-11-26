import {
  EVENTO_PRUEBA,
  EventoWebhook,
  FormatoWebhook,
} from "../../domain/EventoWebhook.js";

export function textoDelEvento({ evento, datos = {} }) {
  const proyecto = datos.tituloProyecto ?? datos.titulo ?? "";
  switch (evento) {
    case EventoWebhook.POSTULACION_CREADA:
      return `Nueva postulación en el proyecto "${proyecto}" (Código a Voluntad)`;
    case EventoWebhook.COLABORACION_ACEPTADA:
      return `Se aceptó una colaboración en el proyecto "${proyecto}" (Código a Voluntad)`;
    case EventoWebhook.PROYECTO_CERRADO:
      return `El proyecto "${proyecto}" se cerró (Código a Voluntad)`;
    case EVENTO_PRUEBA:
      return "Evento de prueba de Código a Voluntad: el webhook funciona correctamente";
    default:
      return `Evento ${evento} de Código a Voluntad`;
  }
}

// Slack y Discord rechazan un JSON "genérico": esperan { text } y { content } respectivamente.
export function formatear(formato, cuerpo) {
  switch (formato) {
    case FormatoWebhook.SLACK:
      return { text: textoDelEvento(cuerpo) };
    case FormatoWebhook.DISCORD:
      return {
        content: textoDelEvento(cuerpo).slice(0, 2000),
        allowed_mentions: { parse: [] }, // que un título no pueda disparar @everyone
      };
    default:
      return cuerpo;
  }
}
