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

  crear = (datosColaborador) => {
    const habilidades = datosColaborador.habilidades.map((tituloHabilidad) => {
      const habilidad =
        this.habilidadRepository.encontrarPorTitulo(tituloHabilidad);

      if (!habilidad) {
        throw new NotFoundError(`la habilidad ${tituloHabilidad} no existe`);
      }

      return habilidad;
    });

    const colaborador = new Colaborador(
      datosColaborador.nombreFantasia,
      datosColaborador.usuarioGitHub,
      datosColaborador.nombre,
      datosColaborador.apellido,
      datosColaborador.presentacion,
      datosColaborador.pronombres,
      randomUUID(),
      habilidades,
    );

    return this.colaboradorRepository.save(colaborador);
  };

  obtenerTodos() {
    return this.colaboradorRepository.obtenerTodos();
  }

  obtenerPorId = (colaboradorId) => {
    return this.obtenerTodos().find((c)=> c.idColaborador == colaboradorId);
  }
}