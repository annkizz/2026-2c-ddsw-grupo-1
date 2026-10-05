import { AppError } from "../errors/AppError.js";

// middleware de manejo de errores, express 5 reenvía automáticamente
// los errores lanzados en los controllers hasta acá,
// así que alcanza con registrarlo al final.
export function errorHandler(err, req, res, next) {
  if (err.esAppError) {
    return res.status(err.status).json({
      error: err.message,
      codigo: err.codigo,
      timestamp: err.timestamp,
    });
  }

  console.error(err);

  return res.status(500).json({
    error: "ocurrió un error interno en el servidor",
    timestamp: new Date().toISOString(),
  });
}
