// se ejecuta cuando ninguna ruta matchea. sin esto, express devuelve un 404 en HTML por defecto.
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: `la ruta ${req.method} ${req.originalUrl} no existe`,
    timestamp: new Date().toISOString(),
  });
}
