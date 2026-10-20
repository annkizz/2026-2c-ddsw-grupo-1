// se conecta a la base, arma los repo + el adaptador y ejecuta la insercion

import "dotenv/config";
import mongoose from "mongoose";
import { MongoDBClient } from "../config/database.js";
import { HabilidadRepository } from "../repositories/HabilidadRepository.js";
import { ColectivoRepository } from "../repositories/ColectivoRepository.js";
import { ProyectoRepository } from "../repositories/ProyectoRepository.js";
import { ColaboracionRepository } from "../repositories/ColaboracionRepository.js";
import { ColaboradorRepository } from "../repositories/ColaboradorRepository.js";
import { crearDatosIniciales } from "./datosIniciales.js";
import { ejecutarSeed } from "./ejecutarSeed.js";
import { crearAdaptadorDeSeed } from "./adaptadorDeSeed.js";

// Minutos que tarda en cerrarse solo el proyecto "Laboratorio de pruebas".
const minutosParaCierre = Number(process.env.SEED_CIERRE_MINUTOS ?? 5);

await MongoDBClient.connect();

try {
  const resumen = await ejecutarSeed(
    {
      habilidadRepository: new HabilidadRepository(),
      colectivoRepository: new ColectivoRepository(),
      proyectoRepository: new ProyectoRepository(),
      colaboradorRepository: new ColaboradorRepository(),
      colaboracionRepository: new ColaboracionRepository(),
      db: crearAdaptadorDeSeed(),
    },
    crearDatosIniciales({ minutosParaCierre }),
  );

  console.log(
    `Seed listo: ${resumen.habilidades} habilidades, ${resumen.colectivos} colectivos, ` +
      `${resumen.proyectos} proyectos, ${resumen.perfiles} perfiles, ${resumen.logros} logros, ` +
      `${resumen.colaboradoras} colaboradoras, ${resumen.colaboraciones} colaboraciones`,
  );
  console.log(
    `El proyecto "Laboratorio de pruebas" (a00000000000000000000004) se cierra solo en ${minutosParaCierre} minutos.`,
  );
} finally {
  await mongoose.disconnect();
}
