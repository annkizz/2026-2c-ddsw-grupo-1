import { EstadoEnvio } from "../../domain/EstadoEnvio.js";
import { enmascarar } from "./enmascarar.js";

// Envío por SMTP (Gmail con clave de aplicación, Brevo, Mailtrap, etc.).
// Variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_SECURE.
// Sin SMTP_HOST no se envía nada: queda SIMULADO y se avisa en el log.
export class EmailNotificador {
  constructor(config = process.env, crearTransporte = null) {
    this.config = config;
    this.crearTransporte = crearTransporte;
    this.transporte = null;
  }

  async obtenerTransporte() {
    if (!this.transporte) {
      const crear =
        this.crearTransporte ??
        (await import("nodemailer")).default.createTransport;
      const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } =
        this.config;
      this.transporte = crear({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587, // vacío o inválido -> 587
        secure: SMTP_SECURE === "true", // true = puerto 465; false = STARTTLS (587)
        auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
      });
    }
    return this.transporte;
  }

  async enviar(destino, { asunto, texto }) {
    if (!this.config.SMTP_HOST) {
      console.log(
        `[notificaciones] SIMULADO EMAIL -> ${enmascarar(destino)} (falta SMTP_HOST)`,
      );
      return { estado: EstadoEnvio.SIMULADO, detalle: "SMTP no configurado" };
    }

    const transporte = await this.obtenerTransporte();
    await transporte.sendMail({
      from: this.config.SMTP_FROM ?? this.config.SMTP_USER,
      to: destino,
      subject: asunto,
      text: texto,
    });
    return { estado: EstadoEnvio.ENVIADO };
  }
}
