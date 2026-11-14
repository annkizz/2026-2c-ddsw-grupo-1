import { UnauthorizedError } from "../errors/AppError.js";

// La autenticación debe cargar req.auth con { rol, id }.
export function requireAuth(req, res, next) {
  if (!req.auth) {
    return next(
      new UnauthorizedError(
        "Se requiere una sesión autenticada",
        "AUTENTICACION_REQUERIDA",
      ),
    );
  }
  next();
}
