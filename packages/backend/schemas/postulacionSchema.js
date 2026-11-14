import mongoose from "mongoose";
import { EstadoPostulacion } from "../domain/EstadoPostulacion.js";

const postulacionSchema = new mongoose.Schema(
  {
    idProyecto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proyecto",
      required: true,
      index: true,
    },
    idPerfil: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Perfil",
      required: true,
      index: true,
    },
    idColaborador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Colaborador",
      required: true,
      index: true,
    },
    fechaPostulacion: { type: Date, required: true },
    estado: {
      type: String,
      enum: Object.values(EstadoPostulacion),
      required: true,
      default: EstadoPostulacion.PENDIENTE,
    },
    esAnonima: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "postulaciones" },
);

postulacionSchema.index(
  { idProyecto: 1, idPerfil: 1, idColaborador: 1 },
  { unique: true, partialFilterExpression: { estado: "PENDIENTE" } },
);

export const PostulacionModel = mongoose.model(
  "Postulacion",
  postulacionSchema,
);
