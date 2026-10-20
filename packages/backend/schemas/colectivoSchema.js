import mongoose from "mongoose";
import { Colectivo } from "../domain/Colectivo.js";
import { TipoColectivo } from "../domain/TipoColectivo.js";

const ubicacionSchema = new mongoose.Schema(
  {
    pais: { type: String, trim: true },
    provincia: { type: String, trim: true },
    ciudad: { type: String, trim: true },
  },
  { _id: false },
);

const colectivoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true, trim: true },
    ubicacion: { type: ubicacionSchema, default: undefined },
    tipoDeColectivo: {
      type: String,
      enum: Object.values(TipoColectivo),
      required: true,
    },
    proyectos: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Proyecto" }],
      default: [],
    },
  },
  { timestamps: true, collection: "colectivos" },
);

colectivoSchema.loadClass(Colectivo);

export const ColectivoModel = mongoose.model("Colectivo", colectivoSchema);
