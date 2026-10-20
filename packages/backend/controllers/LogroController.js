import { z } from "zod";
import { LogroService } from "../services/LogroService.js";

export const logroSchema = z
  .object({
    titulo: z.string().min(1),
    descripcion: z.string().min(1),
    fecha: z.coerce.date(),
  })
  .strict();

export class LogroController {
  constructor(logroService = new LogroService()) {
    this.logroService = logroService;
  }

  crear = async (req, res) => {
    const nuevo = await this.logroService.crear(req.params.id, req.body);
    res.status(201).json(nuevo);
  };

  obtenerPorProyecto = async (req, res) => {
    const logros = await this.logroService.obtenerPorProyecto(req.params.id);
    res.status(200).json(logros);
  };

  obtenerPorId = async (req, res) => {
    const logro = await this.logroService.obtenerPorId(
      req.params.id,
      req.params.idLogro,
    );
    res.status(200).json(logro);
  };

  actualizar = async (req, res) => {
    const actualizado = await this.logroService.actualizar(
      req.params.id,
      req.params.idLogro,
      req.body,
    );
    res.status(200).json(actualizado);
  };

  eliminar = async (req, res) => {
    await this.logroService.eliminar(req.params.id, req.params.idLogro);
    res.status(204).send();
  };
}
