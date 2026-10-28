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
    const codigos = datosColaborador.habilidades
      .map((titulo) => normalizarHabilidad(titulo))
      .filter((codigo, indice, todos) => todos.indexOf(codigo) === indice);
    const encontradas =
      await this.habilidadRepository.encontrarPorCodigos(codigos);
    const habilidades = datosColaborador.habilidades.map((tituloHabilidad) => {
      const habilidad = encontradas.find(
        (hab) => hab.codigo === normalizarHabilidad(tituloHabilidad),
      );

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
    return this.colaboradorRepository.buscarPorId(colaboradorId);
  };
}
