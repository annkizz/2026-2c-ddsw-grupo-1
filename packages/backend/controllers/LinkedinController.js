import { z } from "zod";

export const conexionSchema = z
  .object({ code: z.string().min(1), state: z.string().min(1) })
  .strict();

export class LinkedinController {
  constructor(conexionService) {
    this.conexionService = conexionService;
  }

  obtenerEstado = async (req, res) => {
    res.status(200).json(await this.conexionService.obtenerEstado(req.usuario));
  };

  iniciarAutorizacion = async (req, res) => {
    res
      .status(200)
      .json(await this.conexionService.iniciarAutorizacion(req.usuario));
  };

  conectar = async (req, res) => {
    res
      .status(201)
      .json(
        await this.conexionService.completarConexion(req.usuario, req.body),
      );
  };

  desconectar = async (req, res) => {
    await this.conexionService.desconectar(req.usuario);
    res.status(204).send();
  };
}
