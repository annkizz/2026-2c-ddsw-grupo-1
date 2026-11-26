import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import { BadRequestError } from "../../errors/AppError.js";

// Protección contra SSRF: el servidor hace requests a una URL que elige un usuario,
// así que no puede dejarlo apuntar a la red interna
const CODIGO = "WEBHOOK_URL_NO_PERMITIDA";

const bloqueadas = new BlockList();
[
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10], // CGNAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local + metadata cloud (169.254.169.254)
  ["172.16.0.0", 12], // redes de Docker
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4],
].forEach(([red, prefijo]) => bloqueadas.addSubnet(red, prefijo, "ipv4"));
bloqueadas.addAddress("::", "ipv6");
bloqueadas.addAddress("::1", "ipv6");
bloqueadas.addSubnet("fc00::", 7, "ipv6"); // unique local
bloqueadas.addSubnet("fe80::", 10, "ipv6"); // link-local
bloqueadas.addSubnet("ff00::", 8, "ipv6"); // multicast

const SUFIJOS_INTERNOS = [".localhost", ".local", ".internal", ".lan"];

export function esDireccionPrivada(direccion) {
  let ip = direccion;
  // IPv4 escrita como IPv6: ::ffff:127.0.0.1
  const mapeada = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip);
  if (mapeada) ip = mapeada[1];

  const familia = isIP(ip);
  if (familia === 0) return true; // si no se entiende, no se confía
  return bloqueadas.check(ip, familia === 4 ? "ipv4" : "ipv6");
}

function rechazar(mensaje) {
  throw new BadRequestError(mensaje, CODIGO);
}

// Validaciones que no necesitan red. Devuelve la URL parseada.
export function validarFormatoDeUrl(texto, env = process.env) {
  let url;
  try {
    url = new URL(texto);
  } catch {
    rechazar("la URL del webhook no es válida");
  }

  const permitirHttp = env.WEBHOOKS_PERMITIR_HTTP === "true";
  if (
    url.protocol !== "https:" &&
    !(permitirHttp && url.protocol === "http:")
  ) {
    rechazar("la URL del webhook debe usar https");
  }
  if (url.username || url.password) {
    rechazar("la URL del webhook no puede incluir usuario ni contraseña");
  }

  if (env.WEBHOOKS_PERMITIR_REDES_PRIVADAS === "true") return url;

  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || SUFIJOS_INTERNOS.some((s) => host.endsWith(s))) {
    rechazar("la URL del webhook no puede apuntar a una dirección interna");
  }
  if (isIP(host) !== 0 && esDireccionPrivada(host)) {
    rechazar("la URL del webhook no puede apuntar a una dirección interna");
  }
  return url;
}

export async function validarDestinoSeguro(texto, env = process.env) {
  const url = validarFormatoDeUrl(texto, env);
  if (env.WEBHOOKS_PERMITIR_REDES_PRIVADAS === "true") return url;

  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host) !== 0) return url; // ya se chequeó arriba

  let direcciones;
  try {
    direcciones = await lookup(host, { all: true });
  } catch {
    const error = new BadRequestError(
      "no se pudo resolver el dominio de la URL del webhook",
      CODIGO,
    );
    error.reintentable = true; // puede ser un fallo transitorio de DNS
    throw error;
  }
  if (direcciones.some(({ address }) => esDireccionPrivada(address))) {
    rechazar("la URL del webhook no puede apuntar a una dirección interna");
  }
  return url;
}

export function enmascararUrl(texto) {
  try {
    const url = new URL(texto);
    const cola = url.pathname.length > 4 ? url.pathname.slice(-4) : "";
    return `${url.origin}/…${cola}`;
  } catch {
    return "(url inválida)";
  }
}

export function hostDe(texto) {
  try {
    return new URL(texto).hostname;
  } catch {
    return "(url inválida)";
  }
}
