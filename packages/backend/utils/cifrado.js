import crypto from "node:crypto";

const ALGORITMO = "aes-256-gcm";

function clave(env) {
  const clave = Buffer.from(env.LINKEDIN_TOKEN_KEY ?? "", "base64");
  if (clave.length !== 32) {
    throw new Error("LINKEDIN_TOKEN_KEY debe ser de 32 bytes en base64");
  }
  return clave;
}

// guarda iv.tag.cifrado, todo en base64
export function cifrar(texto, env = process.env) {
  const iv = crypto.randomBytes(12);
  const cifrador = crypto.createCipheriv(ALGORITMO, clave(env), iv);
  const cifrado = Buffer.concat([cifrador.update(texto, "utf8"), cifrador.final()]);
  return [iv, cifrador.getAuthTag(), cifrado]
    .map((parte) => parte.toString("base64"))
    .join(".");
}

export function descifrar(valor, env = process.env) {
  const [iv, tag, cifrado] = valor.split(".").map((p) => Buffer.from(p, "base64"));
  const descifrador = crypto.createDecipheriv(ALGORITMO, clave(env), iv);
  descifrador.setAuthTag(tag);
  return Buffer.concat([descifrador.update(cifrado), descifrador.final()]).toString("utf8");
}

// para generar la clave: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"