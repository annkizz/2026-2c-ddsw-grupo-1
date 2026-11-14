import { ForbiddenError, UnauthorizedError } from "../errors/AppError.js";

// Verifica los JWT que emite Logto (firma contra su JWKS, issuer y audience).
// Las variables se leen recien en el primer request, asi el backend arranca sin Logto configurado.
// crearJwks es solo para tests: por defecto las claves se bajan de LOGTO_JWKS_URL.
export function crearVerificadorLogto(env = process.env, crearJwks) {
  let jwks;

  return async (token) => {
    const { createRemoteJWKSet, jwtVerify } = await import("jose");

    if (!env.LOGTO_JWKS_URL || !env.LOGTO_ISSUER || !env.LOGTO_AUDIENCE) {
      throw new Error(
        "falta configurar LOGTO_JWKS_URL, LOGTO_ISSUER y LOGTO_AUDIENCE",
      );
    }
    jwks ??= (crearJwks ?? createRemoteJWKSet)(new URL(env.LOGTO_JWKS_URL));

    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer: env.LOGTO_ISSUER,
        audience: env.LOGTO_AUDIENCE,
      });
      return payload;
    } catch {
      throw new UnauthorizedError(
        "el token es invalido o vencio",
        "TOKEN_INVALIDO",
      );
    }
  };
}

function extraerToken(authorization) {
  if (!authorization) {
    throw new UnauthorizedError(
      "falta el header Authorization",
      "TOKEN_AUSENTE",
    );
  }
  const [esquema, token] = authorization.split(" ");
  if (esquema !== "Bearer" || !token) {
    throw new UnauthorizedError(
      "el header Authorization debe ser 'Bearer <token>'",
      "TOKEN_INVALIDO",
    );
  }
  return token;
}

// Deja en req.usuario al usuario local (lo crea la primera vez que lo ve).
export function crearAutenticar(usuarioRepository, verificarToken) {
  return async (req, res, next) => {
    const token = extraerToken(req.headers.authorization);
    const payload = await verificarToken(token);

    req.usuario = await usuarioRepository.buscarOCrearPorLogtoId(
      payload.sub,
      payload.username,
    );
    next();
  };
}

// Se usa despues de autenticar: requerirRol(Rol.COLECTIVO)
export function requerirRol(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      throw new ForbiddenError(
        "tu usuario no tiene permisos para esta accion",
        "ROL_NO_PERMITIDO",
      );
    }
    next();
  };
}
