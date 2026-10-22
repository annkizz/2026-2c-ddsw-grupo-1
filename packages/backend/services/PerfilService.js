import { PerfilRepository } from "../repositories/PerfilRepository.js";
import {
  HabilidadRepository,
  normalizarHabilidad,
} from "../repositories/HabilidadRepository.js";
import { ProyectoRepository } from "../repositories/ProyectoRepository.js";
import { NotFoundError } from "../errors/AppError.js";
import { Perfil } from "../domain/Perfil.js";

export class PerfilService {
  constructor(
    perfilRepository = new PerfilRepository(),
    proyectoRepository = new ProyectoRepository(),
    habilidadRepository = new HabilidadRepository(),
  ) {
    this.perfilRepository = perfilRepository;
    this.proyectoRepository = proyectoRepository;
    this.habilidadRepository = habilidadRepository;
  }

  toDTO(perfil) {
    return {
      id: String(perfil.id ?? perfil._id),
      idProyecto: String(perfil.idProyecto),
      descripcion: perfil.descripcion,
      habilidadesRequeridas: [...perfil.habilidadesRequeridas],
      habilidadesOpcionales: [...perfil.habilidadesOpcionales],
      compromiso: {
        tipoCompromiso: perfil.compromiso.tipoCompromiso,
        horas: perfil.compromiso.horas,
        tipoColaboracion: perfil.compromiso.tipoColaboracion,
      },
    };
  }

  async obtenerTodos(idProyecto) {
    await this.validarProyecto(idProyecto);
    const perfiles = await this.perfilRepository.obtenerTodos(idProyecto);
    return perfiles.map((perfil) => this.toDTO(perfil));
  }

  async crear(idProyecto, datos) {
    await this.validarProyecto(idProyecto);

    const habilidadesRequeridas = datos.habilidadesRequeridas;
    const habilidadesOpcionales = datos.habilidadesOpcionales ?? [];
    const habilidades = await this.validarHabilidades([
      ...habilidadesRequeridas,
      ...habilidadesOpcionales,
    ]);
    const requeridas = habilidades.slice(0, habilidadesRequeridas.length);
    const opcionales = habilidades.slice(habilidadesRequeridas.length);

    const perfilNuevo = new Perfil(
      datos.descripcion,
      requeridas.map((h) => h.titulo),
      opcionales.map((h) => h.titulo),
      datos.compromiso,
    );

    const guardado = await this.perfilRepository.save(perfilNuevo, idProyecto);

    await this.proyectoRepository.agregarPerfil(
      idProyecto,
      String(guardado.id),
    );
    return this.toDTO(guardado);
  }

  async obtenerPerfilDelProyecto(idProyecto, id) {
    await this.validarProyecto(idProyecto);
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

  async actualizar(idProyecto, id, datos) {
    await this.obtenerPerfilDelProyecto(idProyecto, id);

    const habilidadesRequeridas = datos.habilidadesRequeridas;
    const habilidadesOpcionales = datos.habilidadesOpcionales ?? [];
    const habilidades = await this.validarHabilidades([
      ...habilidadesRequeridas,
      ...habilidadesOpcionales,
    ]);
    const requeridas = habilidades.slice(0, habilidadesRequeridas.length);
    const opcionales = habilidades.slice(habilidadesRequeridas.length);

    const actualizado = await this.perfilRepository.actualizar(id, {
      descripcion: datos.descripcion,
      habilidadesRequeridas: requeridas.map((h) => h.titulo),
      habilidadesOpcionales: opcionales.map((h) => h.titulo),
      compromiso: datos.compromiso,
    });
    return this.toDTO(actualizado);
  }

  async eliminar(idProyecto, id) {
    await this.obtenerPerfilDelProyecto(idProyecto, id);
    await this.perfilRepository.eliminar(id);
    await this.proyectoRepository.quitarPerfil(idProyecto, id);
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

    const codigos = [
      ...new Set(titulos.map((titulo) => normalizarHabilidad(titulo))),
    ];
    const habilidades =
      await this.habilidadRepository.encontrarPorCodigos(codigos);
    const habilidadesPorCodigo = new Map(
      habilidades.map((habilidad) => [habilidad.codigo, habilidad]),
    );

    return titulos.map((titulo) => {
      const habilidad = habilidadesPorCodigo.get(normalizarHabilidad(titulo));
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
