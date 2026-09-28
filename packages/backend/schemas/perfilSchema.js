import mongoose from "mongoose";
import { Perfil } from "../domain/Perfil.js";
import { TipoCompromiso } from "../domain/TipoCompromiso.js";
import { TipoColaboracion } from "../domain/TipoColaboracion.js";

const perfilSchema = new mongoose.Schema(
  {
    proyecto: { 
        type: String, 
        required: true, 
        index: true 
    },

    descripcion: { 
        type: String, 
        required: true, 
        trim: true 
    },

    habilidadesRequeridas: {
      type: [String],
      validate: {
        validator: (v) => v.length > 0,
        message: "El perfil necesita al menos una habilidad requerida.",
      },
    },

    habilidadesOpcionales: { 
        type: [String], 
        default: [] },
    
    compromiso: {
      tipoCompromiso: {
        type: String,
        enum: Object.values(TipoCompromiso),
        required: true,
      },

      horas: { type: Number, required: true, min: 1 },
      tipoColaboracion: {
        type: String,
        enum: Object.values(TipoColaboracion),
        required: true,
      },
    },

  },
  { timestamps: true, 
    collection: "perfiles" },
);

perfilSchema.loadClass(Perfil);

export const PerfilModel = mongoose.model("Perfil", perfilSchema);