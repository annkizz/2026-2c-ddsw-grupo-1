import { HabilidadRepository } from "../../../repositories/HabilidadRepository.js";
import { ColectivoRepository } from "../../../repositories/ColectivoRepository.js";
import { ProyectoRepository } from "../../../repositories/ProyectoRepository.js";
import { ColaboracionRepository } from "../../../repositories/ColaboracionRepository.js";
import { ColaboradorRepository } from "../../../repositories/ColaboradorRepository.js";
import { crearAdaptadorDeSeed } from "../../../seeds/adaptadorDeSeed.js";
import { crearDatosIniciales } from "../../../seeds/datosIniciales.js";
import { ejecutarSeed } from "../../../seeds/ejecutarSeed.js";

// carga la seed npm run seed para trabajar con los datos reales

export function sembrarDatosIniciales(opciones = {}) {
  return ejecutarSeed(
    {
      habilidadRepository: new HabilidadRepository(),
      colectivoRepository: new ColectivoRepository(),
      proyectoRepository: new ProyectoRepository(),
      colaboradorRepository: new ColaboradorRepository(),
      colaboracionRepository: new ColaboracionRepository(),
      db: crearAdaptadorDeSeed(),
    },
    crearDatosIniciales(opciones),
  );
}
