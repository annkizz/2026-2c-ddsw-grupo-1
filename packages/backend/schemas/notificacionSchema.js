import mongoose from "mongoose";
import { Notificacion } from "../domain/Notificacion.js";
import { EstadoEnvio } from "../domain/EstadoEnvio.js";
import { TipoDeContacto } from "../domain/TipoDeContacto.js";

const envioSchema = new mongoose.Schema(
  {
    tipoDeContacto: {
      type: String,
      enum: Object.values(TipoDeContacto),
      required: true,
    },
    estado: { type: String, enum: Object.values(EstadoEnvio), required: true },
    detalle: { type: String, trim: true },
  },
  { _id: false },
);

const notificacionSchema = new mongoose.Schema(
  {
    idNotificacion: { type: String, required: true, unique: true, index: true },
    fecha: { type: Date, required: true, default: Date.now },
    contenido: { type: String, required: true, trim: true },
    idColectivo: { type: String, required: true, trim: true, index: true },
    idColaborador: { type: String, required: true, trim: true, index: true },
    envios: { type: [envioSchema], default: [] },
  },
  { timestamps: true, collection: "notificaciones" },
);

notificacionSchema.loadClass(Notificacion);

export const NotificacionModel = mongoose.model(
  "Notificacion",
  notificacionSchema,
);