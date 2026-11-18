import { UsuarioService } from "../services/UsuarioService.js";

export class UsuarioController {
  constructor(usuarioService = new UsuarioService()) {
    this.usuarioService = usuarioService;
  }

  async obtenerSesion(req, res) {
    const sesion = await this.usuarioService.obtenerSesion(req.usuario);
    res.status(200).json(sesion);
  }
}
