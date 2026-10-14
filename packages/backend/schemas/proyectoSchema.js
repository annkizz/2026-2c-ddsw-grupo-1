import mongoose from "mongoose";
import { Proyecto } from "../domain/Proyecto.js";
import { Estado } from "../domain/Estado.js";

const proyectoSchema = new mongoose.Schema(
  {
    idProyecto: { type: String, required: true, unique: true, index: true },
    idColectivo: { type: String, required: true, index: true },
    titulo: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true, trim: true },
    perfiles: { type: [String], default: [] },
    estado: { type: String, enum: Object.values(Estado), required: true },
    fechaInicio: { type: Date, required: true },
    fechaLimiteCierre: { type: Date, default: null },
  },
  { timestamps: true, collection: "proyectos" },
);

proyectoSchema.loadClass(Proyecto);

export const ProyectoModel = mongoose.model("Proyecto", proyectoSchema);