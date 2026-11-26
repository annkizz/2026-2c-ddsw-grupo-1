import { PerfilRepository } from "../repositories/PerfilRepository.js";
import {
  HabilidadRepository,
  normalizarHabilidad,
} from "../repositories/HabilidadRepository.js";
import { ProyectoRepository } from "../repositories/ProyectoRepository.js";
import { ForbiddenError, NotFoundError } from "../errors/AppError.js";
import { Perfil } from "../domain/Perfil.js";
import { ColectivoRepository } from "../repositories/ColectivoRepository.js";

export class PerfilService {
  constructor(
    perfilRepository = new PerfilRepository(),
    proyectoRepository = new ProyectoRepository(),
    habilidadRepository = new HabilidadRepository(),
    colectivoRepository = new ColectivoRepository(),
    matchingService = null,
  ) {
    this.perfilRepository = perfilRepository;
    this.proyectoRepository = proyectoRepository;
    this.habilidadRepository = habilidadRepository;
    this.colectivoRepository = colectivoRepository;
    this.matchingService = matchingService;
  }

  toDTO(perfil) {
    return {
      id: String(perfil.id ?? perfil._id),
      idProyecto: String(perfil.idProyecto),
      descripcion: perfil.descripcion,
      habilidadesRequeridas: perfil.habilidadesRequeridas.slice(),
      habilidadesOpcionales: perfil.habilidadesOpcionales.slice(),
      limiteColaboraciones: perfil.limiteColaboraciones ?? null,
      tipoAceptacion: perfil.tipoAceptacion,
      compromiso: {
        tipoCompromiso: perfil.compromiso.tipoCompromiso,
        horas: perfil.compromiso.horas,
        tipoColaboracion: perfil.compromiso.tipoColaboracion,
      },
      limiteColaboraciones: perfil.limiteColaboraciones ?? null,
      tipoAceptacion: perfil.tipoAceptacion,
    };
  }

  async obtenerTodos(idProyecto) {
    await this.validarProyecto(idProyecto);
    const perfiles = await this.perfilRepository.obtenerTodos(idProyecto);
    return perfiles.map((perfil) => this.toDTO(perfil));
  }

  async crear(idProyecto, datos, usuario) {
    await this.validarPropietario(idProyecto, usuario);

    const habilidadesRequeridas = datos.habilidadesRequeridas;
    const habilidadesOpcionales = datos.habilidadesOpcionales ?? [];
    const habilidades = await this.validarHabilidades(
      habilidadesRequeridas.concat(habilidadesOpcionales),
    );
    const requeridas = habilidades.slice(0, habilidadesRequeridas.length);
    const opcionales = habilidades.slice(habilidadesRequeridas.length);

    const perfilNuevo = new Perfil(
      datos.descripcion,
      requeridas.map((h) => h.titulo),
      opcionales.map((h) => h.titulo),
      datos.compromiso,
      datos.limiteColaboraciones ?? null,
      datos.tipoAceptacion,
    );

    const guardado = await this.perfilRepository.save(perfilNuevo, idProyecto);

    await this.proyectoRepository.agregarPerfil(
      idProyecto,
      String(guardado.id),
    );
    // No se recalcula en el momento: se anota y lo procesa la tarea programada en lote.
    if (this.matchingService) {
      await this.matchingService.registrarCambioPerfil(
        String(guardado.id),
        idProyecto,
      );
    }
    return this.toDTO(guardado);
  }

  async obtenerPerfilDelProyecto(idProyecto, id, proyecto) {
    if (!proyecto) await this.validarProyecto(idProyecto);
    const perfil = await this.perfilRepository.buscarPorId(id);
    if (!perfil || String(perfil.idProyecto) !== String(idProyecto)) {
      throw new NotFoundError("perfil no encontrado", "PERFIL_NO_ENCONTRADO");
    }
    return perfil;
  }

  async obtenerPorId(idProyecto, id) {
    const perfil = await this.obtenerPerfilDelProyecto(idProyecto, id);
    return this.toDTO(perfil);
  }

  async actualizar(idProyecto, id, datos, usuario) {
    const proyecto = await this.validarPropietario(idProyecto, usuario);
    await this.obtenerPerfilDelProyecto(idProyecto, id, proyecto);

    const habilidadesRequeridas = datos.habilidadesRequeridas;
    const habilidadesOpcionales = datos.habilidadesOpcionales ?? [];
    const habilidades = await this.validarHabilidades(
      habilidadesRequeridas.concat(habilidadesOpcionales),
    );
    const requeridas = habilidades.slice(0, habilidadesRequeridas.length);
    const opcionales = habilidades.slice(habilidadesRequeridas.length);

    const actualizado = await this.perfilRepository.actualizar(id, {
      descripcion: datos.descripcion,
      habilidadesRequeridas: requeridas.map((h) => h.titulo),
      habilidadesOpcionales: opcionales.map((h) => h.titulo),
      compromiso: datos.compromiso,
      limiteColaboraciones: datos.limiteColaboraciones ?? null,
      tipoAceptacion: datos.tipoAceptacion,
    });
    if (!actualizado) {
      throw new NotFoundError("perfil no encontrado", "PERFIL_NO_ENCONTRADO");
    }
    if (this.matchingService) {
      await this.matchingService.registrarCambioPerfil(id, idProyecto);
    }
    return this.toDTO(actualizado);
  }

  async eliminar(idProyecto, id, usuario) {
    const proyecto = await this.validarPropietario(idProyecto, usuario);
    await this.obtenerPerfilDelProyecto(idProyecto, id, proyecto);
    await this.perfilRepository.eliminar(id);
    await this.proyectoRepository.quitarPerfil(idProyecto, id);
    if (this.matchingService) {
      await this.matchingService.registrarCambioPerfil(id, idProyecto);
    }
  }

  async validarPropietario(idProyecto, usuario) {
    const proyecto = await this.proyectoRepository.buscarPorId(idProyecto);
    if (!proyecto) {
      throw new NotFoundError(
        "proyecto no encontrado",
        "PROYECTO_NO_ENCONTRADO",
      );
    }

    const colectivo = usuario
      ? await this.colectivoRepository.buscarPorUsuario(
          usuario._id ?? usuario.id,
        )
      : null;
    if (
      !colectivo ||
      String(colectivo._id ?? colectivo.id) !== String(proyecto.idColectivo)
    ) {
      throw new ForbiddenError(
        "solo el colectivo dueño del proyecto puede gestionar sus perfiles",
        "ACCESO_DENEGADO",
      );
    }
    return proyecto;
  }

  async validarProyecto(idProyecto) {
    const existe = await this.proyectoRepository.existe(idProyecto);
    if (!existe) {
      throw new NotFoundError(
        "proyecto no encontrado",
        "PROYECTO_NO_ENCONTRADO",
      );
    }
  }

  async validarHabilidades(titulos = []) {
    if (titulos.length === 0) return [];

    const codigos = titulos
      .map((titulo) => normalizarHabilidad(titulo))
      .filter((codigo, indice, todos) => todos.indexOf(codigo) === indice);
    const habilidades =
      await this.habilidadRepository.encontrarPorCodigos(codigos);
    return titulos.map((titulo) => {
      const habilidad = habilidades.find(
        (hab) => hab.codigo === normalizarHabilidad(titulo),
      );
      if (!habilidad) {
        throw new NotFoundError(
          `la habilidad ${titulo} no existe`,
          "HABILIDAD_NO_ENCONTRADA",
        );
      }
      return habilidad;
    });
  }
}
