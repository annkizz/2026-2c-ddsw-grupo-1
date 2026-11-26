import { HabilidadModel } from "../schemas/habilidadSchema.js";
import { BadRequestError, ConflictError } from "../errors/AppError.js";

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

  encontrarPorCodigos(codigos) {
    return this.model.find({ codigo: { $in: codigos } }).exec();
  }

  async crear(habilidad) {
    const titulo = String(habilidad.titulo).trim();
    const codigo = normalizarHabilidad(titulo);
    if (!codigo) {
      throw new BadRequestError("El título debe contener letras o números", "HABILIDAD_TITULO_INVALIDO");
    }
    try {
      return await this.model.create({ titulo, codigo, descripcion: habilidad.descripcion ?? "" });
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictError("La habilidad ya existe", "HABILIDAD_YA_EXISTE");
      }
      throw error;
    }
  }

  save(unaHabilidad) {
    const titulo = String(unaHabilidad.titulo).trim(); // se muestra tal cual
    const codigo = normalizarHabilidad(titulo); // se compara por este
    return this.model
      .findOneAndUpdate(
        { codigo },
        {
          titulo,
          codigo,
          descripcion: unaHabilidad.descripcion ?? "",
        },
        {
          upsert: true,
          returnDocument: "after",
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec();
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
