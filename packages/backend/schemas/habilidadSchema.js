import mongoose from "mongoose";
import { HabilidadProyecto } from "../domain/HabilidadProyecto.js";

const habilidadSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: true, trim: true },
    codigo: { type: String, required: true, unique: true, index: true },
    descripcion: { type: String, trim: true, default: "" },
  },
  { timestamps: true, collection: "habilidades" },
);

habilidadSchema.loadClass(HabilidadProyecto);

export const HabilidadModel = mongoose.model("Habilidad", habilidadSchema);