import { EstadoEnvio } from "../../domain/EstadoEnvio.js";
import { enmascarar } from "./enmascarar.js";

// SMS y WhatsApp a través de la API REST de Twilio (no requiere dependencias: usa fetch).
// Variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y, según el canal,
// TWILIO_SMS_FROM (ej. +15005550006) o TWILIO_WHATSAPP_FROM (ej. +14155238886, sandbox).
// Si falta alguna: SIMULADO.
export class TwilioNotificador {
  constructor(
    canal,
    config = process.env,
    fetchFn = (...args) => fetch(...args),
  ) {
    this.canal = canal; // "SMS" | "WHATSAPP"
    this.config = config;
    this.fetch = fetchFn;
  }

  get origen() {
    return this.canal === "WHATSAPP"
      ? this.config.TWILIO_WHATSAPP_FROM
      : this.config.TWILIO_SMS_FROM;
  }

  estaConfigurado() {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = this.config;
    return Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && this.origen);
  }

  conPrefijo(numero) {
    return this.canal === "WHATSAPP" ? `whatsapp:${numero}` : numero;
  }

  async enviar(destino, { texto }) {
    if (!this.estaConfigurado()) {
      console.log(
        `[notificaciones] SIMULADO ${this.canal} -> ${enmascarar(destino)} (falta configurar Twilio)`,
      );
      return { estado: EstadoEnvio.SIMULADO, detalle: "Twilio no configurado" };
    }

    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = this.config;
    const credenciales = Buffer.from(
      `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`,
    ).toString("base64");

    const respuesta = await this.fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credenciales}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: this.conPrefijo(destino),
          From: this.conPrefijo(this.origen),
          Body: texto,
        }),
      },
    );

    if (!respuesta.ok) {
      const error = await respuesta.json().catch(() => ({}));
      throw new Error(error.message ?? `Twilio respondió ${respuesta.status}`);
    }
    return { estado: EstadoEnvio.ENVIADO };
  }
}
