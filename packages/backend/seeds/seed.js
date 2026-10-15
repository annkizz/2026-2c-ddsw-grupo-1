import "dotenv/config";
import mongoose from "mongoose";
import { MongoDBClient } from "../config/database.js";
import { HabilidadRepository } from "../repositories/HabilidadRepository.js";
import { ColectivoRepository } from "../repositories/ColectivoRepository.js";
import { ProyectoRepository } from "../repositories/ProyectoRepository.js";
import { ColaboradorRepository } from "../repositories/ColaboradorRepository.js";
import { PerfilModel } from "../schemas/perfilSchema.js";
import { LogroModel } from "../schemas/logroSchema.js";
import { ProyectoModel } from "../schemas/proyectoSchema.js";
import { ColaboracionModel } from "../schemas/colaboracionSchema.js";
import { crearDatosIniciales } from "./datosIniciales.js";
import { ejecutarSeed } from "./ejecutarSeed.js";

// Minutos que tarda en cerrarse solo el proyecto "Laboratorio de pruebas".
const minutosParaCierre = Number(process.env.SEED_CIERRE_MINUTOS ?? 5);

// Operaciones que no existen en los repositorios (limpieza y ids fijos).
const db = {
  async borrarDatosDeProyectos(idsProyecto) {
    await PerfilModel.deleteMany({ proyecto: { $in: idsProyecto } });
    await LogroModel.deleteMany({ proyecto: { $in: idsProyecto } });
    await ColaboracionModel.deleteMany({ idProyecto: { $in: idsProyecto } });
  },
  guardarPerfil({ idPerfil, ...datos }) {
    return PerfilModel.findOneAndUpdate(
      { _id: idPerfil },
      { $set: datos },
      {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
  },
  guardarLogro({ idLogro, ...datos }) {
    return LogroModel.findOneAndUpdate(
      { _id: idLogro },
      { $set: datos },
      {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
  },
  idsProyectosDeColectivo(idColectivo) {
    return ProyectoModel.distinct("idProyecto", { idColectivo });
  },
};

await MongoDBClient.connect();

try {
  const resumen = await ejecutarSeed(
    {
      habilidadRepository: new HabilidadRepository(),
      colectivoRepository: new ColectivoRepository(),
      proyectoRepository: new ProyectoRepository(),
      colaboradorRepository: new ColaboradorRepository(),
      db,
    },
    crearDatosIniciales({ minutosParaCierre }),
  );

  console.log(
    `Seed listo: ${resumen.habilidades} habilidades, ${resumen.colectivos} colectivos, ` +
      `${resumen.proyectos} proyectos, ${resumen.perfiles} perfiles, ${resumen.logros} logros, ` +
      `${resumen.colaboradoras} colaboradoras, ${resumen.colaboraciones} colaboraciones`,
  );
  console.log(
    `El proyecto seed-proyecto-4 se cierra solo en ${minutosParaCierre} minutos.`,
  );
} finally {
  await mongoose.disconnect();
}
