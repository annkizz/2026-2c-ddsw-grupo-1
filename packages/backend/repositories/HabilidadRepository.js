import { HabilidadModel } from "../schemas/habilidadSchema.js";

export class HabilidadRepository {
  constructor(model = HabilidadModel) {
    this.model = model;
  }

  obtenerTodos() {
    return this.model.find().sort({ titulo: 1 }).exec();
  }

  encontrarPorTitulo(titulo) {
    const codigo = normalizarHabilidad(titulo);
    return this.model.findOne({ codigo }).exec();
  }

  save(unaHabilidad) {
    const titulo = String(unaHabilidad.titulo).trim(); // se muestra tal cual
    const codigo = normalizarHabilidad(titulo); // se compara por este
    return this.model.findOneAndUpdate(
      { codigo },
      {
        $set: {
          titulo,
          codigo,
          descripcion: unaHabilidad.descripcion ?? "",
        },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    ).exec();
  }
}

export function normalizarHabilidad(texto = "") {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
