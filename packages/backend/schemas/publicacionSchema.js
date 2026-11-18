import { EstadoEnvio } from "../domain/EstadoEnvio.js";

const publicacionSchema = new mongoose.Schema(
  {
    estado: { type: String, enum: Object.values(EstadoEnvio), required: true },
    fecha: { type: Date, required: true },
    urnPost: { type: String },
    detalle: { type: String },
  },
  { _id: false },
);