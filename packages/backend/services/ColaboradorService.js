import { randomUUID } from "node:crypto";
import { Colaborador } from "../domain/Colaborador.js";
import { ColaboradorRepository } from "../repositories/ColaboradorRepository.js";
import {
  HabilidadRepository,
  normalizarHabilidad,
} from "../repositories/HabilidadRepository.js";
import { NotFoundError } from "../errors/AppError.js";

export class ColaboradorService {
  constructor(
    colaboradorRepository = new ColaboradorRepository(),
    habilidadRepository = new HabilidadRepository(),
  ) {
    this.colaboradorRepository = colaboradorRepository;
    this.habilidadRepository = habilidadRepository;
  }

  crear = async (datosColaborador) => {
    // normaliza titulo x codigo 
    const codigos = [
      ...new Set(
        datosColaborador.habilidades.map((titulo) =>
          normalizarHabilidad(titulo),
        ),
      ),
    ];
    const encontradas =
      await this.habilidadRepository.encontrarPorCodigos(codigos);
    const porCodigo = new Map(
      encontradas.map((habilidad) => [habilidad.codigo, habilidad]),
    );

    const habilidades = datosColaborador.habilidades.map((tituloHabilidad) => {
      const habilidad = porCodigo.get(normalizarHabilidad(tituloHabilidad));

      if (!habilidad) {
        throw new NotFoundError(
          `la habilidad ${tituloHabilidad} no existe`,
          "HABILIDAD_NO_ENCONTRADA",
        );
      }

      return habilidad.titulo;
    });

    const colaborador = new Colaborador(
      datosColaborador.nombreFantasia,
      datosColaborador.usuarioGitHub,
      datosColaborador.nombre,
      datosColaborador.apellido,
      datosColaborador.presentacion,
      datosColaborador.pronombres ?? [],
      randomUUID(),
      habilidades,
      datosColaborador.mediosDeContacto ?? [],
      datosColaborador.aceptaMensajeria ?? false,
    );

    return await this.colaboradorRepository.save(colaborador);
  };

  async obtenerTodos() {
    return await this.colaboradorRepository.obtenerTodos();
  }

  obtenerPorId = (colaboradorId) => {
    return this.colaboradorRepository.encontrarPorId(colaboradorId);
  };
}
