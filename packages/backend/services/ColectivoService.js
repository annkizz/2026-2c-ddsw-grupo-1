import { Colectivo } from "../domain/Colectivo.js";
import { normalizarEtiquetas } from "../domain/etiquetas.js";
import { Rol } from "../domain/Rol.js";
import { ColectivoRepository } from "../repositories/ColectivoRepository.js";
import { ForbiddenError, NotFoundError } from "../errors/AppError.js";
import { UsuarioService } from "./UsuarioService.js";

export class ColectivoService {
  constructor(
    colectivoRepository = new ColectivoRepository(),
    usuarioService = new UsuarioService(),
  ) {
    this.colectivoRepository = colectivoRepository;
    this.usuarioService = usuarioService;
  }

  toDTO(colectivo) {
    return {
      id: String(colectivo._id),
      nombre: colectivo.nombre,
      descripcion: colectivo.descripcion,
      tipoDeColectivo: colectivo.tipoDeColectivo,
      ubicacion: colectivo.ubicacion,
      etiquetas: colectivo.etiquetas ?? [],
      proyectos: (colectivo.proyectos ?? []).map((proyecto) =>
        String(proyecto),
      ),
    };
  }

  toPrivateDTO(colectivo) {
    return {
      ...this.toDTO(colectivo),
      aceptaMensajeria: colectivo.aceptaMensajeria ?? false,
      mediosDeContacto: colectivo.mediosDeContacto ?? [],
    };
  }

  armarColectivo(datosColectivo) {
    return new Colectivo(
      datosColectivo.nombre,
      datosColectivo.descripcion,
      datosColectivo.ubicacion,
      datosColectivo.tipoDeColectivo,
      normalizarEtiquetas(datosColectivo.etiquetas),
      datosColectivo.mediosDeContacto,
      datosColectivo.aceptaMensajeria,
    );
  }

  // con usuario: registra el perfil del colectivo para esa cuenta
  crear = async (datosColectivo, usuario) => {
    const colectivo = this.armarColectivo(datosColectivo);
    if (!usuario) {
      return this.toDTO(await this.colectivoRepository.save(colectivo));
    }

    return await this.usuarioService.registrarPerfil(
      usuario,
      Rol.COLECTIVO,
      async () => {
        colectivo.usuario = usuario._id;
        return this.toDTO(await this.colectivoRepository.save(colectivo));
      },
    );
  };

  actualizar = async (idColectivo, datosColectivo, usuario) => {
    const existente = await this.buscarOFallar(idColectivo);
    if (String(existente.usuario) !== String(usuario._id)) {
      throw new ForbiddenError(
        "solo podes modificar el perfil de tu propio colectivo",
        "PERFIL_AJENO",
      );
    }

    const colectivo = this.armarColectivo(datosColectivo);
    colectivo.usuario = existente.usuario;
    return this.toDTO(
      await this.colectivoRepository.save(colectivo, existente._id),
    );
  };

  async obtenerTodos(filtros = {}) {
    const filtrosNormalizados = { ...filtros };
    if (filtrosNormalizados.etiquetas !== undefined) {
      filtrosNormalizados.etiquetas = normalizarEtiquetas(
        filtrosNormalizados.etiquetas,
      );
    }
    const colectivos = await this.colectivoRepository.obtenerTodos(
      filtrosNormalizados,
    );
    return colectivos.map((colectivo) => this.toDTO(colectivo));
  }

  async obtenerPorId(idColectivo) {
    return this.toDTO(await this.buscarOFallar(idColectivo));
  }

  async obtenerPorUsuario(usuario) {
    const colectivo = await this.colectivoRepository.buscarPorUsuario(
      usuario._id,
    );
    if (!colectivo) {
      throw new NotFoundError(
        "todavia no registraste el perfil de tu colectivo",
        "PERFIL_NO_ENCONTRADO",
      );
    }
    return this.toPrivateDTO(colectivo);
  }

  async buscarOFallar(idColectivo) {
    const colectivo = await this.colectivoRepository.buscarPorId(idColectivo);
    if (!colectivo) {
      throw new NotFoundError(
        "el colectivo no existe",
        "COLECTIVO_NO_ENCONTRADO",
      );
    }
    return colectivo;
  }
}
