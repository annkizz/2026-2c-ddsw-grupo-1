import mongoose from "mongoose";
import { Colaborador } from "../domain/Colaborador.js";

const colaboradorSchema = new mongoose.Schema(
  {
    idColaborador: { type: String, required: true, unique: true, index: true },
    nombreFantasia: { type: String, trim: true },
    usuarioGitHub: { type: String, trim: true },
    nombre: { type: String, trim: true },
    apellido: { type: String, trim: true },
    presentacion: { type: String, trim: true },
    pronombres: { type: [String], default: [] },
    habilidades: { type: [String], required: true },
  },
  { timestamps: true, collection: "colaboradoras" },
);

colaboradorSchema.loadClass(Colaborador);

export const ColaboradorModel = mongoose.model(
  "Colaborador",
  colaboradorSchema,
);