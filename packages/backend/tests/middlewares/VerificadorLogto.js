import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { crearVerificadorLogto } from "../../middlewares/authMiddleware.js";

// Verifica de verdad firma, issuer, audience y vencimiento, con un JWKS local que hace de Logto.
// (Descargar el JWKS por red no se prueba aca: el entorno de jest no trae fetch.)
describe("verificador de tokens de Logto", () => {
  const ISSUER = "https://tenant.logto.app/oidc";
  const AUDIENCE = "https://api.codigo-a-voluntad";
  const env = {
    LOGTO_JWKS_URL: "https://tenant.logto.app/oidc/jwks",
    LOGTO_ISSUER: ISSUER,
    LOGTO_AUDIENCE: AUDIENCE,
  };
  let claves;
  let verificar;

  const firmar = async ({
    issuer = ISSUER,
    audience = AUDIENCE,
    exp = "5m",
    key,
    kid = "k1",
  } = {}) =>
    new SignJWT({ scope: "read" })
      .setProtectedHeader({ alg: "ES384", kid })
      .setSubject("logto-ana")
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime(exp)
      .sign(key ?? claves.privateKey);

  beforeAll(async () => {
    claves = await generateKeyPair("ES384");
    const jwk = {
      ...(await exportJWK(claves.publicKey)),
      kid: "k1",
      alg: "ES384",
    };
    verificar = crearVerificadorLogto(env, () =>
      createLocalJWKSet({ keys: [jwk] }),
    );
  });

  it("acepta un token bien firmado y devuelve su payload", async () => {
    const payload = await verificar(await firmar());
    expect(payload.sub).toBe("logto-ana");
  });

  it("identifica vencimiento, claims, firma, clave y formato invalidos", async () => {
    const otraClave = (await generateKeyPair("ES384")).privateKey;

    for (const [token, codigo] of [
      [await firmar({ exp: "-1m" }), "TOKEN_VENCIDO"],
      [await firmar({ issuer: "https://otro/oidc" }), "TOKEN_EMISOR_INVALIDO"],
      [
        await firmar({ audience: "https://otra-api" }),
        "TOKEN_AUDIENCIA_INVALIDA",
      ],
      [await firmar({ key: otraClave }), "TOKEN_FIRMA_INVALIDA"],
      [await firmar({ kid: "unknown" }), "CLAVE_LOGTO_NO_ENCONTRADA"],
      ["esto.no.es-un-jwt", "TOKEN_FORMATO_INVALIDO"],
    ]) {
      await expect(verificar(token)).rejects.toMatchObject({
        status: 401,
        codigo,
      });
    }
  });

  it("si falta configurar Logto falla con un error claro (no un 401)", async () => {
    const sinConfigurar = crearVerificadorLogto({});
    await expect(sinConfigurar("a.b.c")).rejects.toThrow(/LOGTO_JWKS_URL/);
  });
});
