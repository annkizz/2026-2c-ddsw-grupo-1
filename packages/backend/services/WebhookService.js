import { randomBytes } from "node:crypto";
import { Rol } from "../domain/Rol.js";
import { Webhook } from "../domain/Webhook.js";
import { FormatoWebhook } from "../domain/EventoWebhook.js";
import { WebhookRepository } from "../repositories/WebhookRepository.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../errors/AppError.js";
import { DespachadorWebhooks } from "./webhooks/DespachadorWebhooks.js";
import {
  enmascararUrl,
  validarDestinoSeguro,
} from "./webhooks/validarDestino.js";

export const MAX_WEBHOOKS_POR_COLECTIVO = 5;

export class WebhookService {
  constructor(
    webhookRepository = new WebhookRepository(),
    despachador = new DespachadorWebhooks(webhookRepository),
    validarDestino = validarDestinoSeguro,
    env = process.env,
  ) {
    this.webhookRepository = webhookRepository;
    this.despachador = despachador;
    this.validarDestino = validarDestino;
    this.env = env;
  }

  // Nunca incluye el secreto, salvo al crearlo o regenerarlo (única vez que se muestra)
  // La URL va enmascarada: en Slack y Discord el token viaja dentro de la URL
  toDTO(webhook, secreto = undefined) {
    const dto = {
      id: String(webhook._id ?? webhook.id),
      idColectivo: String(webhook.idColectivo),
      url: enmascararUrl(webhook.url),
      eventos: webhook.eventos,
      formato: webhook.formato,
      activo: webhook.activo,
      ultimaEntrega: webhook.ultimaEntrega
        ? {
            fecha: webhook.ultimaEntrega.fecha,
            estado: webhook.ultimaEntrega.estado,
            httpStatus: webhook.ultimaEntrega.httpStatus,
          }
        : null,
    };
    if (secreto !== undefined) dto.secreto = secreto;
    return dto;
  }

  validarDueno(idColectivo, actor) {
    if (actor?.rol !== Rol.COLECTIVO || String(actor.id) !== String(idColectivo)) {
      throw new ForbiddenError(
        "solo podés administrar los webhooks de tu propio colectivo",
        "WEBHOOK_AJENO",
      );
    }
  }

  async buscarDelColectivo(idColectivo, idWebhook, opciones = {}) {
    const webhook = await this.webhookRepository.buscarPorId(
      idWebhook,
      opciones,
    );
    if (!webhook || String(webhook.idColectivo) !== String(idColectivo)) {
      throw new NotFoundError(
        "el webhook no existe",
        "WEBHOOK_NO_ENCONTRADO",
      );
    }
    return webhook;
  }

  generarSecreto() {
    return randomBytes(32).toString("hex");
  }

  async crear(idColectivo, datos, actor) {
    this.validarDueno(idColectivo, actor);

    const cantidad = await this.webhookRepository.contarPorColectivo(idColectivo);
    if (cantidad >= MAX_WEBHOOKS_POR_COLECTIVO) {
      throw new ConflictError(
        `un colectivo puede tener como máximo ${MAX_WEBHOOKS_POR_COLECTIVO} webhooks`,
        "LIMITE_WEBHOOKS_ALCANZADO",
      );
    }

    await this.validarDestino(datos.url, this.env);

    const secreto = this.generarSecreto();
    const webhook = new Webhook({
      idColectivo,
      url: datos.url,
      eventos: [...new Set(datos.eventos)],
      formato: datos.formato ?? FormatoWebhook.GENERICO,
      activo: datos.activo ?? true,
      secreto,
    });
    const guardado = await this.webhookRepository.save(webhook);
    return this.toDTO(guardado, secreto);
  }

  async listar(idColectivo, actor) {
    this.validarDueno(idColectivo, actor);
    const webhooks = await this.webhookRepository.obtenerPorColectivo(idColectivo);
    return webhooks.map((webhook) => this.toDTO(webhook));
  }

  async actualizar(idColectivo, idWebhook, datos, actor) {
    this.validarDueno(idColectivo, actor);
    await this.buscarDelColectivo(idColectivo, idWebhook);

    const cambios = {};
    if (datos.url !== undefined) {
      await this.validarDestino(datos.url, this.env);
      cambios.url = datos.url;
    }
    if (datos.eventos !== undefined) cambios.eventos = [...new Set(datos.eventos)];
    if (datos.formato !== undefined) cambios.formato = datos.formato;
    if (datos.activo !== undefined) cambios.activo = datos.activo;

    const actualizado = await this.webhookRepository.actualizar(idWebhook, cambios);
    return this.toDTO(actualizado);
  }

  async eliminar(idColectivo, idWebhook, actor) {
    this.validarDueno(idColectivo, actor);
    await this.buscarDelColectivo(idColectivo, idWebhook);
    await this.webhookRepository.eliminar(idWebhook);
  }

  async regenerarSecreto(idColectivo, idWebhook, actor) {
    this.validarDueno(idColectivo, actor);
    await this.buscarDelColectivo(idColectivo, idWebhook);

    const secreto = this.generarSecreto();
    const actualizado = await this.webhookRepository.actualizar(idWebhook, {
      secreto,
    });
    return this.toDTO(actualizado, secreto);
  }

  async probar(idColectivo, idWebhook, actor) {
    this.validarDueno(idColectivo, actor);
    const webhook = await this.buscarDelColectivo(idColectivo, idWebhook, {
      conSecreto: true,
    });
    return this.despachador.probar(webhook);
  }
}