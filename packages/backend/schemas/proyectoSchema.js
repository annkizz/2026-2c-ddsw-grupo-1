import mongoose from "mongoose";
import { Proyecto } from "../domain/Proyecto.js";
import { Estado } from "../domain/Estado.js";

const ubicacionSchema = new mongoose.Schema(
  {
    codigoPais: { type: String, trim: true },
    nombrePais: { type: String, trim: true },
    codigoProvincia: { type: String, trim: true },
    nombreProvincia: { type: String, trim: true },
    ciudad: { type: String, trim: true },
  },
  { _id: false },
);

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
    busquedaAbierta: { type: Boolean, default: false },
    fechaLimiteBusqueda: { type: Date, default: null },
    etiquetas: { type: [String], default: [] },
    ubicacion: { type: ubicacionSchema, default: null },
    destacado: { type: Boolean, default: false },
    destacadoHasta: { type: Date, default: null },
  },
  { timestamps: true, collection: "proyectos" },
);

// La tarea de cierre automático busca proyectos activos con fecha de cierre vencida: este índice
// hace que esa consulta no recorra toda la colección.
proyectoSchema.index({ estado: 1, fechaLimiteCierre: 1 });

proyectoSchema.loadClass(Proyecto);

export const ProyectoModel = mongoose.model("Proyecto", proyectoSchema);
