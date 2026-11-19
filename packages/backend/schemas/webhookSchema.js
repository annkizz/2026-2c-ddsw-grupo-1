import mongoose from "mongoose";
import { Webhook } from "../domain/Webhook.js";
import { EventoWebhook, FormatoWebhook } from "../domain/EventoWebhook.js";

const ultimaEntregaSchema = new mongoose.Schema(
  {
    fecha: { type: Date },
    estado: { type: String },
    httpStatus: { type: Number },
  },
  { _id: false },
);

const webhookSchema = new mongoose.Schema(
  {
    idColectivo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Colectivo",
      required: true,
      index: true,
    },
    url: { type: String, required: true, trim: true },
    eventos: {
      type: [{ type: String, enum: Object.values(EventoWebhook) }],
      validate: {
        validator: (v) => v.length > 0,
        message: "El webhook necesita al menos un evento.",
      },
    },
    formato: {
      type: String,
      enum: Object.values(FormatoWebhook),
      default: FormatoWebhook.GENERICO,
    },
    secreto: { type: String, required: true, select: false },
    activo: { type: Boolean, default: true },
    ultimaEntrega: { type: ultimaEntregaSchema, default: undefined },
  },
  { timestamps: true, collection: "webhooks" },
);

webhookSchema.loadClass(Webhook);

export const WebhookModel = mongoose.model("Webhook", webhookSchema);