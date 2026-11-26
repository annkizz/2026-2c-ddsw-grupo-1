import { ForbiddenError, UnauthorizedError } from "../errors/AppError.js";
import { Rol } from "../domain/Rol.js";

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
    } catch (error) {
      let codigo = "TOKEN_INVALIDO";
      let mensaje = "el token es invalido";

      if (error.code === "ERR_JWT_EXPIRED") {
        codigo = "TOKEN_VENCIDO";
        mensaje = "el token de Logto vencio";
      } else if (error.code === "ERR_JWT_CLAIM_VALIDATION_FAILED") {
        if (error.claim === "aud") {
          codigo = "TOKEN_AUDIENCIA_INVALIDA";
          mensaje = "la audiencia del token no corresponde a esta API";
        } else if (error.claim === "iss") {
          codigo = "TOKEN_EMISOR_INVALIDO";
          mensaje = "el emisor del token no corresponde a Logto";
        }
      } else if (error.code === "ERR_JWS_SIGNATURE_VERIFICATION_FAILED") {
        codigo = "TOKEN_FIRMA_INVALIDA";
        mensaje = "la firma del token no coincide con las claves de Logto";
      } else if (error.code === "ERR_JWKS_NO_MATCHING_KEY") {
        codigo = "CLAVE_LOGTO_NO_ENCONTRADA";
        mensaje =
          "no se encontro la clave de firma del token en el JWKS de Logto";
      } else if (
        error.code === "ERR_JWT_INVALID" ||
        error.code === "ERR_JWS_INVALID"
      ) {
        codigo = "TOKEN_FORMATO_INVALIDO";
        mensaje = "el token recibido no tiene un formato JWT valido";
      }

      throw new UnauthorizedError(mensaje, codigo);
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
export function crearAutenticar(
  usuarioRepository,
  verificarToken,
  env = process.env,
) {
  const idsAdministradores = new Set(
    (env.LOGTO_ADMIN_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );

  return async (req, res, next) => {
    const token = extraerToken(req.headers.authorization);
    const payload = await verificarToken(token);

    let usuario = await usuarioRepository.buscarOCrearPorLogtoId(
      payload.sub,
      payload.username,
    );
    if (idsAdministradores.has(payload.sub) && !usuario.rol) {
      usuario =
        (await usuarioRepository.asignarRol(usuario._id, Rol.ADMINISTRADOR)) ??
        (await usuarioRepository.buscarOCrearPorLogtoId(
          payload.sub,
          payload.username,
        ));
    }

    req.usuario = usuario;
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
