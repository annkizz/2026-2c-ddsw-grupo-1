import mongoose from "mongoose";

// Resultado guardado de "colaboradoras compatibles con un perfil". Solo ids y la evaluación:
// los datos públicos (nombre, presentación…) se leen frescos al responder.
const candidatasPerfilSchema = new mongoose.Schema(
  {
    idPerfil: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
    idProyecto: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    candidatas: { type: [mongoose.Schema.Types.Mixed], default: [] },
    calculadoEn: { type: Date, required: true },
  },
  { collection: "candidatasPorPerfil" },
);

export const CandidatasPerfilModel = mongoose.model("CandidatasPerfil", candidatasPerfilSchema);
