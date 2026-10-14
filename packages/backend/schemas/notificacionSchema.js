import mongoose from "mongoose";
import { Notificacion } from "../domain/Notificacion.js";
import { medioDeContactoSchema } from "./medioDeContactoSchema.js";

const notificacionSchema = new mongoose.Schema(
  {
    fecha: { type: Date, required: true, default: Date.now,},
    contenido: { type: String, trim: true },
    idColectivo: { type: String, trim: true }, 
    idColaborador: { type: String, trim: true },
    medioDeContacto: {type: medioDeContactoSchema},
  },
    { _id: false } ,
);

notificacionSchema.loadClass(Notificacion);

export const NotificacionSchemaModel = mongoose.model("Colectivo", notificacionSchema);