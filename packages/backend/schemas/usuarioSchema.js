import mongoose from "mongoose";
import { Usuario } from "../domain/Usuario.js";
import { Rol } from "../domain/Rol.js";

const usuarioSchema = new mongoose.Schema(
  {
    logtoId: { type: String, required: true, unique: true, trim: true },
    nombreUsuario: { type: String, trim: true },
    // sin default: mientras no tenga perfil el campo no existe
    rol: { type: String, enum: Object.values(Rol) },
  },
  { timestamps: true, collection: "usuarios" },
);

usuarioSchema.loadClass(Usuario);

export const UsuarioModel = mongoose.model("Usuario", usuarioSchema);
