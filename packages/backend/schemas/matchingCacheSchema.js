import mongoose from "mongoose";

const matchingCacheSchema = new mongoose.Schema(
  {
    idColaborador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Colaborador",
      required: true,
      unique: true,
    },
    proyectos: { type: [mongoose.Schema.Types.Mixed], default: [] },
    calculadoEn: { type: Date, required: true },
  },
  { collection: "matchingCaches" },
);

export const MatchingCacheModel = mongoose.model(
  "MatchingCache",
  matchingCacheSchema,
);
