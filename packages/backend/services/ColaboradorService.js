import { Colaborador } from "../domain/Colaborador.js";
import { Rol } from "../domain/Rol.js";
import { ColaboradorRepository } from "../repositories/ColaboradorRepository.js";
import {
  HabilidadRepository,
  normalizarHabilidad,
} from "../repositories/HabilidadRepository.js";
import { ForbiddenError, NotFoundError } from "../errors/AppError.js";
import { UsuarioService } from "./UsuarioService.js";

export class ColaboradorService {
  constructor(
    colaboradorRepository = new ColaboradorRepository(),
    habilidadRepository = new HabilidadRepository(),
    usuarioService = new UsuarioService(),
  ) {
    this.colaboradorRepository = colaboradorRepository;
    this.habilidadRepository = habilidadRepository;
    this.usuarioService = usuarioService;
  }

  // valida contra el catalogo y devuelve los titulos tal cual estan en el catalogo
  resolverHabilidades = async (titulosPedidos) => {
    const codigos = titulosPedidos
      .map((titulo) => normalizarHabilidad(titulo))
      .filter((codigo, indice, todos) => todos.indexOf(codigo) === indice);
    const encontradas =
      await this.habilidadRepository.encontrarPorCodigos(codigos);

    return titulosPedidos.map((tituloHabilidad) => {
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
  };

  armarColaborador(datosColaborador, habilidades) {
    return new Colaborador(
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
  }

  // con usuario: registra el perfil de la colaboradora para esa cuenta
  crear = async (datosColaborador, usuario) => {
    const habilidades = await this.resolverHabilidades(
      datosColaborador.habilidades,
    );
    const colaborador = this.armarColaborador(datosColaborador, habilidades);
    if (!usuario) {
      return await this.colaboradorRepository.save(colaborador);
    }

    return await this.usuarioService.registrarPerfil(
      usuario,
      Rol.COLABORADOR,
      async () => {
        colaborador.usuario = usuario._id;
        return await this.colaboradorRepository.save(colaborador);
      },
    );
  };

  actualizar = async (idColaborador, datosColaborador, usuario) => {
    const existente = await this.buscarOFallar(idColaborador);
    if (String(existente.usuario) !== String(usuario._id)) {
      throw new ForbiddenError(
        "solo podes modificar tu propio perfil",
        "PERFIL_AJENO",
      );
    }

    const habilidades = await this.resolverHabilidades(
      datosColaborador.habilidades,
    );
    const colaborador = this.armarColaborador(datosColaborador, habilidades);
    colaborador.usuario = existente.usuario;
    return await this.colaboradorRepository.save(colaborador, existente._id);
  };

  async obtenerTodos() {
    return await this.colaboradorRepository.obtenerTodos();
  }

  obtenerPorId = (colaboradorId) => {
    return this.colaboradorRepository.buscarPorId(colaboradorId);
  };

  async obtenerPorIdOFallar(colaboradorId) {
    return await this.buscarOFallar(colaboradorId);
  }

  async obtenerPorUsuario(usuario) {
    const colaborador = await this.colaboradorRepository.buscarPorUsuario(
      usuario._id,
    );
    if (!colaborador) {
      throw new NotFoundError(
        "todavia no registraste tu perfil de colaboradora",
        "PERFIL_NO_ENCONTRADO",
      );
    }
    return colaborador;
  }

  async buscarOFallar(colaboradorId) {
    const colaborador = await this.obtenerPorId(colaboradorId);
    if (!colaborador) {
      throw new NotFoundError(
        "la colaboradora no existe",
        "COLABORADOR_NO_ENCONTRADO",
      );
    }
    return colaborador;
  }
}
