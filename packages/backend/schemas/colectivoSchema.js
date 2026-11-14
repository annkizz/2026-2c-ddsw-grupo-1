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
    // cuenta duena del perfil (los colectivos del seed no tienen)
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true, collection: "colectivos" },
);

colectivoSchema.loadClass(Colectivo);

export const ColectivoModel = mongoose.model("Colectivo", colectivoSchema);
