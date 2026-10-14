import { randomUUID } from "node:crypto";
import { Colaborador } from "../domain/Colaborador.js";
import { ColaboradorRepository } from "../repositories/ColaboradorRepository.js";
import { HabilidadRepository } from "../repositories/HabilidadRepository.js";
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
    const habilidades = await Promise.all(
      datosColaborador.habilidades.map(async (tituloHabilidad) => {
        const habilidad = await this.habilidadRepository.encontrarPorTitulo(
          tituloHabilidad,
        );

        if (!habilidad) {
          throw new NotFoundError(
            `la habilidad ${tituloHabilidad} no existe`,
            "HABILIDAD_NO_ENCONTRADA",
          );
        }

        return habilidad.titulo;
      }),
    );

    const colaborador = new Colaborador(
      datosColaborador.nombreFantasia,
      datosColaborador.usuarioGitHub,
      datosColaborador.nombre,
      datosColaborador.apellido,
      datosColaborador.presentacion,
      datosColaborador.pronombres ?? [],
      randomUUID(),
      habilidades,
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