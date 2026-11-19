import { z } from "zod";
import { Rol } from "../domain/Rol.js";
import { EventoWebhook, FormatoWebhook } from "../domain/EventoWebhook.js";
import { ForbiddenError } from "../errors/AppError.js";
import { UsuarioService } from "../services/UsuarioService.js";
import { WebhookService } from "../services/WebhookService.js";

const urlSchema = z.url({ protocol: /^https?$/ }).max(2048);
const eventosSchema = z
  .array(z.enum(Object.values(EventoWebhook)))
  .min(1)
  .max(Object.values(EventoWebhook).length);
const formatoSchema = z.enum(Object.values(FormatoWebhook));

export const webhookCrearSchema = z
  .object({
    url: urlSchema,
    eventos: eventosSchema,
    formato: formatoSchema.optional(),
    activo: z.boolean().optional(),
  })
  .strict();

export const webhookActualizarSchema = z
  .object({
    url: urlSchema.optional(),
    eventos: eventosSchema.optional(),
    formato: formatoSchema.optional(),
    activo: z.boolean().optional(),
  })
  .strict()
  .refine((datos) => Object.keys(datos).length > 0, {
    message: "indicá al menos un dato para modificar",
  });

export class WebhookController {
  constructor(
    webhookService = new WebhookService(),
    usuarioService = new UsuarioService(),
  ) {
    this.webhookService = webhookService;
    this.usuarioService = usuarioService;
  }

  async obtenerActor(req) {
    const sesion = await this.usuarioService.obtenerSesion(req.usuario);
    if (sesion.rol !== Rol.COLECTIVO || !sesion.idColectivo) {
      throw new ForbiddenError(
        "solo un colectivo con perfil registrado puede administrar webhooks",
        "PERFIL_REQUERIDO",
      );
    }
    return { rol: sesion.rol, id: sesion.idColectivo };
  }

  crear = async (req, res) => {
    const actor = await this.obtenerActor(req);
    const webhook = await this.webhookService.crear(
      req.params.idColectivo,
      req.body,
      actor,
    );
    res.status(201).json(webhook);
  };

  listar = async (req, res) => {
    const actor = await this.obtenerActor(req);
    const webhooks = await this.webhookService.listar(
      req.params.idColectivo,
      actor,
    );
    res.status(200).json(webhooks);
  };

  actualizar = async (req, res) => {
    const actor = await this.obtenerActor(req);
    const webhook = await this.webhookService.actualizar(
      req.params.idColectivo,
      req.params.idWebhook,
      req.body,
      actor,
    );
    res.status(200).json(webhook);
  };

  eliminar = async (req, res) => {
    const actor = await this.obtenerActor(req);
    await this.webhookService.eliminar(
      req.params.idColectivo,
      req.params.idWebhook,
      actor,
    );
    res.status(204).send();
  };

  regenerarSecreto = async (req, res) => {
    const actor = await this.obtenerActor(req);
    const webhook = await this.webhookService.regenerarSecreto(
      req.params.idColectivo,
      req.params.idWebhook,
      actor,
    );
    res.status(200).json(webhook);
  };

  probar = async (req, res) => {
    const actor = await this.obtenerActor(req);
    const resultado = await this.webhookService.probar(
      req.params.idColectivo,
      req.params.idWebhook,
      actor,
    );
    res.status(200).json(resultado);
  };
}