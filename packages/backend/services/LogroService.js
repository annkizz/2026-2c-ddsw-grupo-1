import { Logro } from "../domain/Logro.js";
import { LogroRepository } from "../repositories/LogroRepository.js";
import { ProyectoRepository } from "../repositories/ProyectoRepository.js";
import { NotFoundError } from "../errors/AppError.js";
import { EstadoEnvio } from "../domain/EstadoEnvio.js";
import { ConflictError } from "../errors/AppError.js"; 
export class LogroService {
  constructor(
    logroRepository = new LogroRepository(),
    proyectoRepository = new ProyectoRepository(),
    publicacionLinkedinService = null,
  ) {
    this.logroRepository = logroRepository;
    this.proyectoRepository = proyectoRepository;
    this.publicacionLinkedinService = publicacionLinkedinService;
  }

  toDTO(logro) {
    return {
      id: String(logro.id ?? logro._id),
      idProyecto: String(logro.idProyecto),
      titulo: logro.titulo,
      descripcion: logro.descripcion,
      fecha: logro.fecha,
    };
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

  async crear(idProyecto,  { publicarEnLinkedin = false, ...datosLogro }, usuario) {
    await this.validarProyecto(idProyecto);

    // si pide publicar, se valida TODO antes de guardar
    let proyecto = null;
    let credenciales = null;
    if (publicarEnLinkedin) {
      proyecto = await this.proyectoRepository.buscarPorId(idProyecto);
      credenciales = await this.publicacionLinkedinService.validarPuedePublicar(proyecto, usuario);
    }

    const logro = new Logro(datosLogro.titulo, datosLogro.descripcion, datosLogro.fecha, idProyecto);

    const guardado = await this.logroRepository.save(logro);
    if (!credenciales) return this.toDTO(guardado);

    const publicacion = await this.publicarYRegistrar(proyecto, guardado, credenciales);
    return this.toDTO({ ...(guardado.toObject?.() ?? guardado), publicacionLinkedin: publicacion });
}

  async publicarYRegistrar(proyecto, logro, credenciales) {
    const resultado = await this.publicacionLinkedinService.publicarLogro(proyecto, logro, credenciales);
    try {
      await this.logroRepository.registrarPublicacion(logro._id ?? logro.id, resultado);
    } catch (error) {
      console.error(`[linkedin] no se pudo registrar el resultado: ${error.message}`);
    }
    return resultado;
}

// botón "Compartir en Linkedin" de un logro ya creado (también sirve para reintentar un FALLIDO)
  async publicarEnLinkedin(idProyecto, idLogro, usuario) {
    await this.validarProyecto(idProyecto);
    const logro = await this.logroRepository.buscarPorId(idProyecto, idLogro);
    if (!logro) {
      throw new NotFoundError("logro no encontrado", "LOGRO_NO_ENCONTRADO");
    }
    if (logro.publicacionLinkedin?.estado === EstadoEnvio.ENVIADO) {
      throw new ConflictError("El logro ya fue publicado en Linkedin", "LOGRO_YA_PUBLICADO");
    }

    const proyecto = await this.proyectoRepository.buscarPorId(idProyecto);
    const credenciales = await this.publicacionLinkedinService.validarPuedePublicar(proyecto, usuario);
    const publicacion = await this.publicarYRegistrar(proyecto, logro, credenciales);
    return this.toDTO({ ...(logro.toObject?.() ?? logro), publicacionLinkedin: publicacion });
}

  async obtenerPorProyecto(idProyecto) {
    await this.validarProyecto(idProyecto);
    const logros = await this.logroRepository.obtenerPorProyecto(idProyecto);
    return logros.map((logro) => this.toDTO(logro));
  }

  async obtenerPorId(idProyecto, idLogro) {
    await this.validarProyecto(idProyecto);

    const logro = await this.logroRepository.buscarPorId(idProyecto, idLogro);
    if (!logro) {
      throw new NotFoundError("logro no encontrado", "LOGRO_NO_ENCONTRADO");
    }
    return this.toDTO(logro);
  }

  async actualizar(idProyecto, idLogro, datosLogro) {
    await this.validarProyecto(idProyecto);

    const actualizado = await this.logroRepository.actualizar(
      idProyecto,
      idLogro,
      datosLogro,
    );
    if (!actualizado) {
      throw new NotFoundError("logro no encontrado", "LOGRO_NO_ENCONTRADO");
    }
    return this.toDTO(actualizado);
  }

  async eliminar(idProyecto, idLogro) {
    await this.validarProyecto(idProyecto);

    const eliminado = await this.logroRepository.eliminar(idProyecto, idLogro);
    if (!eliminado) {
      throw new NotFoundError("logro no encontrado", "LOGRO_NO_ENCONTRADO");
    }
  }
}
