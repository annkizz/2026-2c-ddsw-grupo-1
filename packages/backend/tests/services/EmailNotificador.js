import { describe, expect, it, jest } from "@jest/globals";
import { EmailNotificador } from "../../services/notificadores/EmailNotificador.js";
import { NotificacionService } from "../../services/NotificacionService.js";
import { EstadoEnvio } from "../../domain/EstadoEnvio.js";

const GMAIL = {
  SMTP_HOST: "smtp.gmail.com",
  SMTP_PORT: "587",
  SMTP_SECURE: "false",
  SMTP_USER: "colectivos@gmail.com",
  SMTP_PASS: "abcdabcdabcdabcd",
};

const conTransporteFalso = (config) => {
  const sendMail = jest.fn(async () => ({ messageId: "1" }));
  const crear = jest.fn(() => ({ sendMail }));
  return { notificador: new EmailNotificador(config, crear), crear, sendMail };
};

describe("EmailNotificador", () => {
  it("sin SMTP_HOST no envía nada y queda SIMULADO", async () => {
    const { notificador, crear } = conTransporteFalso({});
    const resultado = await notificador.enviar("ana@example.org", {
      asunto: "A",
      texto: "T",
    });

    expect(resultado.estado).toBe(EstadoEnvio.SIMULADO);
    expect(crear).not.toHaveBeenCalled();
  });

  it("con Gmail usa STARTTLS en el 587, autentica y corta a los 10 segundos", async () => {
    const { notificador, crear, sendMail } = conTransporteFalso({
      ...GMAIL,
      SMTP_FROM: "Código a Voluntad <colectivos@gmail.com>",
    });
    const resultado = await notificador.enviar("ana@example.org", {
      asunto: "Asunto",
      texto: "Texto",
    });

    expect(resultado.estado).toBe(EstadoEnvio.ENVIADO);
    expect(crear).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: { user: "colectivos@gmail.com", pass: "abcdabcdabcdabcd" },
        connectionTimeout: 10_000,
        socketTimeout: 10_000,
      }),
    );
    expect(sendMail).toHaveBeenCalledWith({
      from: "Código a Voluntad <colectivos@gmail.com>",
      to: "ana@example.org",
      subject: "Asunto",
      text: "Texto",
    });
  });

  it("si SMTP_FROM llega vacío (como lo pasa docker-compose), envía desde SMTP_USER", async () => {
    const { notificador, sendMail } = conTransporteFalso({
      ...GMAIL,
      SMTP_FROM: "",
    });
    await notificador.enviar("ana@example.org", { asunto: "A", texto: "T" });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: "colectivos@gmail.com" }),
    );
  });
});

describe("NotificacionService.construirMensaje", () => {
  const colectivo = { nombre: "Huerta Sur" };

  it("incluye el mensaje y un enlace para leerlo en la plataforma", () => {
    const service = new NotificacionService(
      {},
      {},
      {},
      {},
      { FRONTEND_URL: "https://codigo.example/" },
    );
    const { asunto, texto } = service.construirMensaje(
      colectivo,
      "Hola, ¿te sumás?",
    );

    expect(asunto).toBe("Nuevo mensaje de Huerta Sur en Código a Voluntad");
    expect(texto).toContain(
      "Huerta Sur te escribió en Código a Voluntad:\n\nHola, ¿te sumás?",
    );
    expect(texto).toContain("https://codigo.example/notificaciones");
  });

  it("sin FRONTEND_URL no agrega un enlace roto", () => {
    const service = new NotificacionService({}, {}, {}, {}, {});
    expect(service.construirMensaje(colectivo, "Hola").texto).not.toContain(
      "http",
    );
  });
});
