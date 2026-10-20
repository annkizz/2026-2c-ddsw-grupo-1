import mongoose from "mongoose";
import { Proyecto } from "../domain/Proyecto.js";
import { Estado } from "../domain/Estado.js";

const proyectoSchema = new mongoose.Schema(
  {
    idColectivo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Colectivo",
      required: true,
      index: true,
    },
    titulo: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true, trim: true },
    perfiles: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Perfil" }],
      default: [],
    },
    estado: { type: String, enum: Object.values(Estado), required: true },
    fechaInicio: { type: Date, required: true },
    fechaLimiteCierre: { type: Date, default: null },
    porcentajeConcrecion: { type: Number, default: 0, min: 0, max: 100 },
    enlaceSistema: { type: String, default: null },
    enlaceCodigoFuente: { type: String, default: null },
  },
  { timestamps: true, collection: "proyectos" },
);

proyectoSchema.loadClass(Proyecto);

export const ProyectoModel = mongoose.model("Proyecto", proyectoSchema);
