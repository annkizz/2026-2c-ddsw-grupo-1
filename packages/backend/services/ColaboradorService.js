import { Colaborador } from "../domain/Colaborador.js";
import { Rol } from "../domain/Rol.js";
import { ColaboradorRepository } from "../repositories/ColaboradorRepository.js";
import {
  HabilidadRepository,
  normalizarHabilidad,
} from "../repositories/HabilidadRepository.js";
import { ColaboracionRepository } from "../repositories/ColaboracionRepository.js";
import { ProyectoRepository } from "../repositories/ProyectoRepository.js";
import { PostulacionRepository } from "../repositories/PostulacionRepository.js";
import { ForbiddenError, NotFoundError } from "../errors/AppError.js";
import { UsuarioService } from "./UsuarioService.js";

export class ColaboradorService {
  constructor(
    colaboradorRepository = new ColaboradorRepository(),
    habilidadRepository = new HabilidadRepository(),
    usuarioService = new UsuarioService(),
    colaboracionRepository = new ColaboracionRepository(),
    proyectoRepository = new ProyectoRepository(),
    postulacionRepository = new PostulacionRepository(),
    matchingService = null,
  ) {
    this.colaboradorRepository = colaboradorRepository;
    this.habilidadRepository = habilidadRepository;
    this.usuarioService = usuarioService;
    this.colaboracionRepository = colaboracionRepository;
    this.proyectoRepository = proyectoRepository;
    this.postulacionRepository = postulacionRepository;
    this.matchingService = matchingService;
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
    let guardado;
    if (!usuario) {
      guardado = await this.colaboradorRepository.save(colaborador);
    } else {
      guardado = await this.usuarioService.registrarPerfil(
        usuario,
        Rol.COLABORADOR,
        async () => {
          colaborador.usuario = usuario._id;
          return await this.colaboradorRepository.save(colaborador);
        },
      );
    }
    if (this.matchingService && guardado?._id) {
      await this.matchingService.registrarCambioColaboradora(guardado._id);
    }
    return guardado;
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
    const guardado = await this.colaboradorRepository.save(
      colaborador,
      existente._id,
    );
    if (this.matchingService) {
      await this.matchingService.registrarCambioColaboradora(guardado._id);
    }
    return guardado;
  };

  async obtenerTodos(pag = null, limite = null) {
    const colaboradores = await this.colaboradorRepository.obtenerTodos();
    if (pag === null || limite === null) return colaboradores;
    const inicio = (pag - 1) * limite;
    const pagina = colaboradores.slice(inicio, inicio + limite);
    return {
      colaboradores: pagina,
      total: colaboradores.length,
      pag,
      totalPags: Math.ceil(colaboradores.length / limite),
    };
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

  async obtenerMisColaboraciones(usuario) {
    const colaborador = await this.obtenerPorUsuario(usuario);
    const colaboraciones =
      await this.colaboracionRepository.obtenerPorColaborador(colaborador._id);
    if (colaboraciones.length === 0) return [];

    const idsProyectos = [
      ...new Set(
        colaboraciones.map((colaboracion) => String(colaboracion.idProyecto)),
      ),
    ];
    const proyectos = await this.proyectoRepository.obtenerPorIds(idsProyectos);
    const proyectosPorId = new Map(
      proyectos.map((proyecto) => [String(proyecto._id), proyecto]),
    );

    return colaboraciones.map((colaboracion) => {
      const idProyecto = String(colaboracion.idProyecto);
      const proyecto = proyectosPorId.get(idProyecto);
      if (!proyecto) {
        throw new NotFoundError(
          "No se encontró un proyecto de una colaboración",
          "PROYECTO_NO_ENCONTRADO",
        );
      }

      return {
        idProyecto,
        idPerfil: colaboracion.idPerfil ? String(colaboracion.idPerfil) : null,
        fecha: colaboracion.fecha,
        esAnonima: colaboracion.esAnonima ?? false,
        proyecto: {
          id: idProyecto,
          titulo: proyecto.titulo,
          descripcion: proyecto.descripcion,
          estado: proyecto.estado,
          fechaInicio: proyecto.fechaInicio,
          fechaLimiteCierre: proyecto.fechaLimiteCierre,
          porcentajeConcrecion: proyecto.porcentajeConcrecion,
        },
      };
    });
  }

  async obtenerMisPostulaciones(usuario) {
    const colaborador = await this.obtenerPorUsuario(usuario);
    const postulaciones =
      await this.postulacionRepository.obtenerPorColaborador(colaborador._id);
    if (postulaciones.length === 0) return [];

    const idsProyectos = [
      ...new Set(postulaciones.map((p) => String(p.idProyecto))),
    ];
    const proyectos = await this.proyectoRepository.obtenerPorIds(idsProyectos);
    const proyectosPorId = new Map(proyectos.map((p) => [String(p._id), p]));

    return postulaciones.map((postulacion) => {
      const idProyecto = String(postulacion.idProyecto);
      const proyecto = proyectosPorId.get(idProyecto);
      if (!proyecto) {
        throw new NotFoundError(
          "No se encontró un proyecto de una postulación",
          "PROYECTO_NO_ENCONTRADO",
        );
      }
      return {
        id: String(postulacion._id),
        idProyecto,
        idPerfil: String(postulacion.idPerfil),
        estado: postulacion.estado,
        fechaPostulacion: postulacion.fechaPostulacion,
        esAnonima: postulacion.esAnonima,
        proyecto: {
          id: idProyecto,
          titulo: proyecto.titulo,
          descripcion: proyecto.descripcion,
        },
      };
    });
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
