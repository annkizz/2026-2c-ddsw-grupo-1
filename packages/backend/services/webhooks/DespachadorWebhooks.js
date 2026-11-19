import { createHmac, randomUUID } from "node:crypto";
import { EstadoEnvio } from "../../domain/EstadoEnvio.js";
import { EVENTO_PRUEBA } from "../../domain/EventoWebhook.js";
import { WebhookRepository } from "../../repositories/WebhookRepository.js";
import { formatear } from "./formatear.js";
import { hostDe, validarDestinoSeguro } from "./validarDestino.js";

const TIMEOUT_MS = 5000;
// 3 intentos: inmediato, a los 2 s y a los 10 s
const ESPERAS_MS = [0, 2000, 10000];

export const despachadorNulo = {
  emitir: async () => [],
  probar: async () => ({ estado: EstadoEnvio.SIMULADO }),
};

export class DespachadorWebhooks {
  constructor(
    webhookRepository = new WebhookRepository(),
    {
      fetchFn = (...args) => fetch(...args),
      validarDestino = validarDestinoSeguro,
      esperas = ESPERAS_MS,
      dormir = (ms) => new Promise((resolver) => setTimeout(resolver, ms)),
      logger = console,
      env = process.env,
    } = {},
  ) {
    this.webhookRepository = webhookRepository;
    this.fetch = fetchFn;
    this.validarDestino = validarDestino;
    this.esperas = esperas;
    this.dormir = dormir;
    this.logger = logger;
    this.env = env;
  }

  armarCuerpo(evento, datos) {
    return {
      id: randomUUID(),
      evento,
      fecha: new Date().toISOString(),
      datos,
    };
  }


  async emitir(evento, idColectivo, datos) {
    try {
      const webhooks = await this.webhookRepository.obtenerActivos(
        idColectivo,
        evento,
      );
      if (webhooks.length === 0) return [];

      const cuerpo = this.armarCuerpo(evento, datos);
      return await Promise.all(
        webhooks.map((webhook) => this.entregar(webhook, cuerpo)),
      );
    } catch (error) {
      this.logger.error(`[webhooks] error emitiendo ${evento}: ${error.message}`);
      return [];
    }
  }

  
  async probar(webhook) {
    const cuerpo = this.armarCuerpo(EVENTO_PRUEBA, {
      mensaje: "Este es un evento de prueba",
    });
    const { texto, firma } = this.preparar(webhook, cuerpo);
    const resultado = await this.intentar(webhook, cuerpo, texto, firma);
    await this.registrar(webhook, resultado);
    return this.publico(resultado);
  }

  preparar(webhook, cuerpo) {
    const texto = JSON.stringify(formatear(webhook.formato, cuerpo));
    const firma = createHmac("sha256", webhook.secreto)
      .update(texto)
      .digest("hex");
    return { texto, firma };
  }

  async entregar(webhook, cuerpo) {
    const { texto, firma } = this.preparar(webhook, cuerpo);
    let resultado = { estado: EstadoEnvio.FALLIDO, reintentable: false };

    for (const espera of this.esperas) {
      await this.dormir(espera);
      resultado = await this.intentar(webhook, cuerpo, texto, firma);
      if (!resultado.reintentable) break;
    }

    if (resultado.estado === EstadoEnvio.FALLIDO) {
      this.logger.error(
        `[webhooks] falló ${cuerpo.evento} -> ${hostDe(webhook.url)}: ${resultado.detalle}`,
      );
    }
    await this.registrar(webhook, resultado);
    return this.publico(resultado);
  }

  async intentar(webhook, cuerpo, texto, firma) {
    try {
      await this.validarDestino(webhook.url, this.env);
    } catch (error) {
      return {
        estado: EstadoEnvio.FALLIDO,
        detalle: error.reintentable
          ? "no se pudo resolver el destino"
          : "destino no permitido",
        reintentable: error.reintentable === true, // un destino prohibido nunca se reintenta
      };
    }

    try {
      const respuesta = await this.fetch(webhook.url, {
        method: "POST",
        redirect: "manual", // un redirect podría llevar a la red interna
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "CodigoAVoluntad-Webhooks/1.0",
          "X-CAV-Event": cuerpo.evento,
          "X-CAV-Delivery": cuerpo.id,
          "X-CAV-Signature": `sha256=${firma}`,
        },
        body: texto,
      });
      try {
        await respuesta.body?.cancel(); 
      } catch {
        /* nada */
      }

      if (respuesta.ok) {
        return {
          estado: EstadoEnvio.ENVIADO,
          httpStatus: respuesta.status,
          reintentable: false,
        };
      }
      return {
        estado: EstadoEnvio.FALLIDO,
        httpStatus: respuesta.status,
        detalle: `el destino respondió ${respuesta.status}`,
        // 5xx y 429 pueden ser transitorios; el resto de los 4xx/3xx no se arreglan reintentando
        reintentable: respuesta.status >= 500 || respuesta.status === 429,
      };
    } catch (error) {
      return {
        estado: EstadoEnvio.FALLIDO,
        detalle: error.name === "TimeoutError" ? "timeout" : "error de red",
        reintentable: true,
      };
    }
  }

  async registrar(webhook, { estado, httpStatus }) {
    try {
      await this.webhookRepository.registrarEntrega(webhook._id, {
        fecha: new Date(),
        estado,
        httpStatus,
      });
    } catch (error) {
      this.logger.error(
        `[webhooks] no se pudo registrar la entrega: ${error.message}`,
      );
    }
  }

  publico({ estado, httpStatus, detalle }) {
    return {
      estado,
      ...(httpStatus !== undefined && { httpStatus }),
      ...(detalle && { detalle }),
    };
  }
}