import mongoose from "mongoose";

// Cola de cambios que afectan el matching y todavía no se procesaron.
// Un perfil o una colaboradora aparece una sola vez aunque cambie varias veces antes del próximo lote.
const cambioMatchingSchema = new mongoose.Schema(
  {
    tipo: { type: String, enum: ["PERFIL", "COLABORADORA"], required: true },
    idEntidad: { type: mongoose.Schema.Types.ObjectId, required: true },
    idProyecto: { type: mongoose.Schema.Types.ObjectId, default: null },
    registradoEn: { type: Date, required: true }, // primer cambio: define cuánto lleva esperando
    actualizadoEn: { type: Date, required: true }, // último cambio
  },
  { collection: "cambiosMatching" },
);

cambioMatchingSchema.index({ tipo: 1, idEntidad: 1 }, { unique: true });
cambioMatchingSchema.index({ registradoEn: 1 });

export const CambioMatchingModel = mongoose.model("CambioMatching", cambioMatchingSchema);
