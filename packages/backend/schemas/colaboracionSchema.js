import mongoose from "mongoose";

const colaboracionSchema = new mongoose.Schema(
  {
    idProyecto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proyecto",
      required: true,
      index: true,
    },
    idColaborador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Colaborador",
      required: true,
      index: true,
    },
    fecha: { type: Date, required: true },
    esAnonima: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "colaboraciones" },
);

colaboracionSchema.index({ idProyecto: 1, idColaborador: 1 }, { unique: true });

export const ColaboracionModel = mongoose.model(
  "Colaboracion",
  colaboracionSchema,
);
