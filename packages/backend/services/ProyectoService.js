import { Estado } from "../domain/Estado.js";
import { Proyecto } from "../domain/Proyecto.js";
import { ProyectoRepository } from "../repositories/ProyectoRepository.js";
import { HabilidadRepository } from "../repositories/HabilidadRepository.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../errors/AppError.js";
import { ColectivoRepository } from "../repositories/ColectivoRepository.js";
import { PerfilRepository } from "../repositories/PerfilRepository.js";
import { ColaboracionRepository } from "../repositories/ColaboracionRepository.js";

export class ProyectoService {
  constructor(
    proyectoRepository = new ProyectoRepository(),
    habilidadRepository = new HabilidadRepository(),
    colectivoRepository = new ColectivoRepository(),
    colaboracionRepository = new ColaboracionRepository(),
    perfilRepository = new PerfilRepository(),
  ) {
    this.proyectoRepository = proyectoRepository;
    this.habilidadRepository = habilidadRepository;
    this.colectivoRepository = colectivoRepository;
    this.colaboracionRepository = colaboracionRepository;
    this.perfilRepository = perfilRepository;
  }

  crear = async (datosProyecto) => {
    const colectivo = await this.colectivoRepository.buscarPorId(
      datosProyecto.idColectivo,
    );

    if (!colectivo) {
      throw new NotFoundError(
        "el colectivo no existe",
        "COLECTIVO_NO_ENCONTRADO",
      );
    }

    const fechaLimiteCierre = datosProyecto.fechaLimiteCierre ?? null;
    if (fechaLimiteCierre !== null) {
      this.validarFechaLimite(fechaLimiteCierre);
    }

    const proyecto = new Proyecto(
      datosProyecto.titulo,
      datosProyecto.descripcion,
      [], // perfiles
      Estado.ACTIVO,
      new Date(),
      fechaLimiteCierre,
      colectivo._id,
      0,
      null,
      null,
      datosProyecto.busquedaAbierta ?? true,
      datosProyecto.fechaLimiteBusqueda ?? null,
    );

    const proyectoGuardado = await this.proyectoRepository.save(proyecto);
    await this.colectivoRepository.agregarProyecto(
      colectivo._id,
      proyectoGuardado._id,
    );
    return this.toDTO(proyectoGuardado);
  };

  toDTO(proyecto) {
    return {
      id: String(proyecto._id),
      titulo: proyecto.titulo,
      descripcion: proyecto.descripcion,
      estado: proyecto.estado,
      fechaInicio: proyecto.fechaInicio,
      fechaLimiteCierre: proyecto.fechaLimiteCierre,
      busquedaAbierta: proyecto.busquedaAbierta ?? true,
      fechaLimiteBusqueda: proyecto.fechaLimiteBusqueda ?? null,
      idColectivo: String(proyecto.idColectivo),
      perfiles: (proyecto.perfiles ?? []).map((perfil) => String(perfil)),
      porcentajeConcrecion: proyecto.porcentajeConcrecion,
      enlaceSistema: proyecto.enlaceSistema,
      enlaceCodigoFuente: proyecto.enlaceCodigoFuente,
    };
  }

  validarFechaLimite(fechaLimiteCierre, ahora = new Date()) {
    if (fechaLimiteCierre <= ahora) {
      throw new BadRequestError(
        "La fecha límite de cierre debe ser futura",
        "FECHA_LIMITE_INVALIDA",
      );
    }
  }

  async programarCierre(idProyecto, fechaLimite) {
    const proyecto = await this.buscarProyectoOFallar(idProyecto);

    if (proyecto.estaFinalizado()) {
      throw new ConflictError(
        "No se puede programar el cierre de un proyecto finalizado",
        "PROYECTO_FINALIZADO",
      );
    }

    this.validarFechaLimite(fechaLimite);
    proyecto.programarCierre(fechaLimite);
    const guardado = await this.proyectoRepository.save(proyecto);
    return this.toDTO(guardado);
  }

  async cerrarSiVencido(proyecto, ahora = new Date()) {
    if (!proyecto.cierreVencido(ahora)) {
      return false;
    }
    await this.finalizar(proyecto);
    return true;
  }

  async buscarProyectoOFallar(idProyecto) {
    const proyecto = await this.obtenerProyectoPorId(idProyecto);

    if (!proyecto) {
      throw new NotFoundError(
        "Proyecto no encontrado",
        "PROYECTO_NO_ENCONTRADO",
      );
    }
    return proyecto;
  }

  async finalizar(proyecto) {
    proyecto.cerrar();
    return this.proyectoRepository.save(proyecto);
  }

  async cerrarProyectosVencidos(ahora = new Date()) {
    const vencidos = await this.proyectoRepository.obtenerVencidos(ahora);
    const cerrados = [];
    const fallidos = [];

    for (const proyecto of vencidos) {
      try {
        await this.finalizar(proyecto);
        cerrados.push(String(proyecto._id));
      } catch (error) {
        fallidos.push({
          idProyecto: String(proyecto._id),
          error: error.message,
        });
      }
    }

    return { cerrados, fallidos };
  }

  async obtenerTodos() {
    const proyectos = await this.proyectoRepository.obtenerTodos();
    return proyectos.map((proyecto) => this.toDTO(proyecto));
  }

  obtenerProyectoPorId(id) {
    return this.proyectoRepository.buscarPorId(id);
  }

  toContribucionPublica({
    idProyecto,
    idPerfil,
    idColaborador,
    fecha,
    esAnonima = false,
  }) {
    const contribucion = {
      idProyecto: String(idProyecto),
      idPerfil: idPerfil ? String(idPerfil) : null,
      fecha,
      esAnonima,
    };

    if (!esAnonima && idColaborador) {
      contribucion.colaborador = {
        id: String(idColaborador._id),
        nombreFantasia: idColaborador.nombreFantasia,
        usuarioGitHub: idColaborador.usuarioGitHub,
        nombre: idColaborador.nombre,
        apellido: idColaborador.apellido,
      };
    }

    return contribucion;
  }

  obtenerColaboracionesPublicas = async (idProyecto) => {
    await this.buscarProyectoOFallar(idProyecto);
    const colaboraciones =
      await this.colaboracionRepository.obtenerPorProyecto(idProyecto);
    return colaboraciones.map((colaboracion) =>
      this.toContribucionPublica(colaboracion),
    );
  };

  async cerrarProyecto(idProyecto) {
    const proyecto = await this.buscarProyectoOFallar(idProyecto);
    return this.toDTO(await this.finalizar(proyecto));
  }

  async actualizarAvance(idProyecto, datosAvance) {
    const proyecto = await this.buscarProyectoOFallar(idProyecto);

    if (Object.keys(datosAvance).length === 0) {
      throw new BadRequestError(
        "indicá al menos un dato de avance",
        "AVANCE_VACIO",
      );
    }

    proyecto.actualizarAvance(datosAvance);
    const guardado = await this.proyectoRepository.save(proyecto);
    return this.toAvanceDTO(guardado);
  }

  toAvanceDTO(proyecto) {
    return {
      id: String(proyecto._id),
      porcentajeConcrecion: proyecto.porcentajeConcrecion,
      enlaceSistema: proyecto.enlaceSistema,
      enlaceCodigoFuente: proyecto.enlaceCodigoFuente,
    };
  }
}
