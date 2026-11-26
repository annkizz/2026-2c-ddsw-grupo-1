import mongoose from "mongoose";
import { ConexionLinkedin } from "../domain/ConexionLinkedin.js";

const conexionLinkedinSchema = new mongoose.Schema(
  {
    idColectivo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Colectivo",
      required: true,
      unique: true, // una conexión por colectivo
    },
    personUrn: { type: String, required: true },
    nombre: { type: String, trim: true },
    // select: false -> no se carga salvo que se pida explícitamente
    accessToken: { type: String, required: true, select: false },
    expiraEn: { type: Date, required: true },
  },
  { timestamps: true, collection: "conexionesLinkedin" },
);

conexionLinkedinSchema.loadClass(ConexionLinkedin);

export const ConexionLinkedinModel = mongoose.model(
  "ConexionLinkedin",
  conexionLinkedinSchema,
);
