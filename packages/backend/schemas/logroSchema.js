import mongoose from "mongoose";
import { Logro } from "../domain/Logro.js";

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
  },
  { timestamps: true, collection: "logros" },
);

logroSchema.loadClass(Logro);

export const LogroModel = mongoose.model("Logro", logroSchema);
