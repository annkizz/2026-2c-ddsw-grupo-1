import mongoose from "mongoose";

const colaboracionSchema = new mongoose.Schema(
  {
    idProyecto: { type: String, required: true, index: true },
    idColaborador: { type: String, required: true, index: true },
    fecha: { type: Date, required: true },
  },
  { timestamps: true, collection: "colaboraciones" },
);

colaboracionSchema.index(
  { idProyecto: 1, idColaborador: 1 },
  { unique: true },
);

export const ColaboracionModel = mongoose.model(
  "Colaboracion",
  colaboracionSchema,
);