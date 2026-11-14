import { Rol } from "../domain/Rol.js";
import { ForbiddenError } from "../errors/AppError.js";

export function crearContextoPostulaciones(usuarioService) {
  return async (req, res, next) => {
    const sesion = await usuarioService.obtenerSesion(req.usuario);

    if (sesion.rol === Rol.COLECTIVO && sesion.idColectivo) {
      req.auth = { rol: Rol.COLECTIVO, id: sesion.idColectivo };
    } else if (sesion.rol === Rol.COLABORADOR && sesion.idColaborador) {
      req.auth = { rol: "COLABORADORA", id: sesion.idColaborador };
    } else {
      throw new ForbiddenError(
        "El usuario debe registrar un perfil para realizar esta acción",
        "PERFIL_REQUERIDO",
      );
    }

    next();
  };
}
