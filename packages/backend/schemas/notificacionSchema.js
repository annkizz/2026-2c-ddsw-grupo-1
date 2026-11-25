import mongoose from "mongoose";
import { Notificacion } from "../domain/Notificacion.js";
import { EstadoEnvio } from "../domain/EstadoEnvio.js";
import { TipoDeContacto } from "../domain/TipoDeContacto.js";
import { TipoNotificacion } from "../domain/TipoNotificacion.js";

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
    fecha: { type: Date, required: true, default: Date.now },
    contenido: { type: String, required: true, trim: true },
    tipo: {
      type: String,
      enum: Object.values(TipoNotificacion),
      required: true,
      default: TipoNotificacion.MENSAJE,
    },
    idColectivo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Colectivo",
      required: true,
      index: true,
    },
    idColaborador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Colaborador",
      required: true,
      index: true,
    },
    idProyecto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proyecto",
    },
    idPerfil: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Perfil",
    },
    idPostulacion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Postulacion",
    },
    estadoInvitacion: {
      type: String,
      enum: ["PENDIENTE", "ACEPTADA", "RECHAZADA"],
    },
    envios: { type: [envioSchema], default: [] },
    leida: { type: Boolean, required: true, default: false },
  },
  { timestamps: true, collection: "notificaciones" },
);

notificacionSchema.index(
  { idProyecto: 1, idPerfil: 1, idColaborador: 1 },
  { unique: true, partialFilterExpression: { tipo: "INVITACION_PROYECTO", estadoInvitacion: "PENDIENTE" } },
);

notificacionSchema.index(
  { idPostulacion: 1, idColaborador: 1 },
  { partialFilterExpression: { tipo: "POSTULACION_RECHAZADA" } },
);

notificacionSchema.loadClass(Notificacion);

export const NotificacionModel = mongoose.model(
  "Notificacion",
  notificacionSchema,
);
