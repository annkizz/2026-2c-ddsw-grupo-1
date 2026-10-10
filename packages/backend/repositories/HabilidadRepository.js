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
    const titulo = normalizarHabilidad(unaHabilidad.titulo);
    return this.model.findOneAndUpdate(
      { codigo: titulo },
      {
        $set: {
          titulo,
          codigo: titulo,
          descripcion: unaHabilidad.descripcion ?? "",
        },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    ).exec();
  }
}

export function normalizarHabilidad(texto = "") {
  return String(texto)
    .trim()
    .toLowerCase()
    .replace(/\s+(.)/g, (_, letra) => letra.toUpperCase());
}
