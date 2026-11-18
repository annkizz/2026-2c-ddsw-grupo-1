import mongoose from "mongoose";
import { Logro } from "../domain/Logro.js";
import { EstadoEnvio } from "../domain/EstadoEnvio.js";

const logroSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true, trim: true },
    fecha: { type: Date, required: true },
    idProyecto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proyecto",
      required: true,
      index: true,
    },
    publicacionLinkedIn: { 
      type: publicacionSchema, 
      default: undefined 
    },
  },
  { timestamps: true, collection: "logros" },
);

logroSchema.loadClass(Logro);

export const LogroModel = mongoose.model("Logro", logroSchema);
