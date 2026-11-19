import { EstadoEnvio } from "../../domain/EstadoEnvio.js";
import { TipoDeContacto } from "../../domain/TipoDeContacto.js";
import { EmailNotificador } from "./EmailNotificador.js";
import { TwilioNotificador } from "./TwilioNotificador.js";

export function crearCanalesPorDefecto() {
  return {
    [TipoDeContacto.EMAIL]: new EmailNotificador(),
    [TipoDeContacto.SMS]: new TwilioNotificador("SMS"),
    [TipoDeContacto.WHATSAPP]: new TwilioNotificador("WHATSAPP"),
  };
}

// Elige el canal según el tipo del medio de contacto. Un canal que falla NO tumba
// a los demás ni a la notificación interna: el error queda registrado como FALLIDO.
export class NotificadorExterno {
  constructor(canales = crearCanalesPorDefecto()) {
    this.canales = canales;
  }

  async enviar(medioDeContacto, mensaje) {
    const { tipoDeContacto, contacto } = medioDeContacto;
    const canal = this.canales[tipoDeContacto];

    if (!canal) {
      return {
        tipoDeContacto,
        estado: EstadoEnvio.FALLIDO,
        detalle: "medio de contacto no soportado",
      };
    }

    try {
      const { estado, detalle } = await canal.enviar(contacto, mensaje);
      return { tipoDeContacto, estado, ...(detalle && { detalle }) };
    } catch (error) {
      console.error(
        `[notificaciones] Falló el envío por ${tipoDeContacto} (${error.name}).`,
      );
      return {
        tipoDeContacto,
        estado: EstadoEnvio.FALLIDO,
        detalle: "No se pudo completar el envío por este medio.",
      };
    }
  }
}
