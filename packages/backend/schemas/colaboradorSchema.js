import mongoose from "mongoose";
import { Colaborador } from "../domain/Colaborador.js";
import { medioDeContactoSchema } from "./medioDeContactoSchema.js";

const colaboradorSchema = new mongoose.Schema(
  {
    nombreFantasia: { type: String, trim: true },
    usuarioGitHub: { type: String, trim: true },
    nombre: { type: String, trim: true },
    apellido: { type: String, trim: true },
    presentacion: { type: String, trim: true },
    pronombres: { type: [String], default: [] },
    aceptaMensajeria: { type: Boolean, required: true, default: false },
    habilidades: { type: [String], required: true, index: true },
    mediosDeContacto: { type: [medioDeContactoSchema], default: [] },
  },
  { timestamps: true, collection: "colaboradoras" },
);

colaboradorSchema.loadClass(Colaborador);

export const ColaboradorModel = mongoose.model(
  "Colaborador",
  colaboradorSchema,
);
