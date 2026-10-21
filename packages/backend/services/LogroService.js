import { Logro } from "../domain/Logro.js";
import { LogroRepository } from "../repositories/LogroRepository.js";
import { ProyectoRepository } from "../repositories/ProyectoRepository.js";
import { NotFoundError } from "../errors/AppError.js";

export class LogroService {
  constructor(
    logroRepository = new LogroRepository(),
    proyectoRepository = new ProyectoRepository(),
  ) {
    this.logroRepository = logroRepository;
    this.proyectoRepository = proyectoRepository;
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
    const proyecto = await this.proyectoRepository.encontrarPorId(idProyecto);
    if (!proyecto) {
      throw new NotFoundError(
        "proyecto no encontrado",
        "PROYECTO_NO_ENCONTRADO",
      );
    }
    return proyecto;
  }

  async crear(idProyecto, datosLogro) {
    await this.validarProyecto(idProyecto);

    const logro = new Logro(
      datosLogro.titulo,
      datosLogro.descripcion,
      datosLogro.fecha,
      idProyecto,
    );

    const guardado = await this.logroRepository.save(logro);
    return this.toDTO(guardado);
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
