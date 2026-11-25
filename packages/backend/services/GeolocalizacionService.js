import { BadGatewayError, BadRequestError } from "../errors/AppError.js";
import { normalizarProvincia } from "../domain/provincias.js";

const URL_BUSQUEDA_POR_DEFECTO =
  "https://nominatim.openstreetmap.org/search";
const INTERVALO_MINIMO_MS = 1000;
const VIGENCIA_CACHE_MS = 30 * 24 * 60 * 60 * 1000;
const TAMANIO_MAXIMO_CACHE = 500;

const esperar = (milisegundos) =>
  new Promise((resolver) => setTimeout(resolver, milisegundos));

export class GeolocalizacionService {
  constructor({
    fetcher = globalThis.fetch,
    urlBusqueda = process.env.NOMINATIM_SEARCH_URL ?? URL_BUSQUEDA_POR_DEFECTO,
    userAgent =
      process.env.NOMINATIM_USER_AGENT ??
      "Codigo a Voluntad/1.0 (https://github.com/annkizz/2026-2c-ddsw-grupo-1)",
  } = {}) {
    this.fetcher = fetcher;
    this.urlBusqueda = urlBusqueda;
    this.userAgent = userAgent;
    this.cache = new Map();
    this.pendientes = new Map();
    this.colaSolicitudes = Promise.resolve();
    this.ultimaSolicitud = 0;
  }

  async buscarDirecciones({ direccion, ciudad, provincia }) {
    const provinciaNormalizada = normalizarProvincia(provincia);
    if (!provinciaNormalizada) {
      throw new BadRequestError(
        "la provincia ingresada no es válida",
        "PROVINCIA_INVALIDA",
      );
    }

    const direccionNormalizada =
      typeof direccion === "string" ? direccion.trim() : "";
    const ciudadNormalizada = typeof ciudad === "string" ? ciudad.trim() : "";
    if (direccionNormalizada.length < 3 || ciudadNormalizada === "") {
      throw new BadRequestError(
        "ingresá una dirección y una localidad",
        "DIRECCION_REQUERIDA",
      );
    }

    const consulta = [
      direccionNormalizada,
      ciudadNormalizada,
      provinciaNormalizada.nombreProvincia,
      "Argentina",
    ].join(", ");
    const clave = consulta.normalize("NFD").toLowerCase();
    const ahora = Date.now();
    const enCache = this.cache.get(clave);
    if (enCache && enCache.vence > ahora) {
      return enCache.resultados;
    }
    if (this.pendientes.has(clave)) {
      return this.pendientes.get(clave);
    }

    const solicitud = this.consultarNominatim(consulta)
      .then((resultados) => {
        this.cache.set(clave, {
          resultados,
          vence: Date.now() + VIGENCIA_CACHE_MS,
        });
        if (this.cache.size > TAMANIO_MAXIMO_CACHE) {
          this.cache.delete(this.cache.keys().next().value);
        }
        return resultados;
      })
      .finally(() => this.pendientes.delete(clave));
    this.pendientes.set(clave, solicitud);
    return solicitud;
  }

  async consultarNominatim(consulta) {
    await this.esperarTurno();

    const url = new URL(this.urlBusqueda);
    url.search = new URLSearchParams({
      q: consulta,
      format: "jsonv2",
      addressdetails: "1",
      countrycodes: "ar",
      limit: "5",
    }).toString();

    let respuesta;
    try {
      respuesta = await this.fetcher(url, {
        headers: {
          "Accept-Language": "es",
          "User-Agent": this.userAgent,
        },
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      throw new BadGatewayError(
        "El servicio de búsqueda de direcciones no está disponible",
        "GEOCODIFICADOR_NO_DISPONIBLE",
      );
    }

    if (!respuesta.ok) {
      throw new BadGatewayError(
        "El servicio de búsqueda de direcciones respondió con un error",
        "GEOCODIFICADOR_NO_DISPONIBLE",
      );
    }

    let resultados;
    try {
      resultados = await respuesta.json();
    } catch {
      throw new BadGatewayError(
        "El servicio de búsqueda de direcciones devolvió una respuesta inválida",
        "GEOCODIFICADOR_RESPUESTA_INVALIDA",
      );
    }
    if (!Array.isArray(resultados)) {
      throw new BadGatewayError(
        "El servicio de búsqueda de direcciones devolvió una respuesta inválida",
        "GEOCODIFICADOR_RESPUESTA_INVALIDA",
      );
    }

    return resultados
      .filter(
        (resultado) =>
          resultado &&
          resultado.place_id != null &&
          typeof resultado.display_name === "string" &&
          Number.isFinite(Number(resultado.lat)) &&
          Number.isFinite(Number(resultado.lon)),
      )
      .map((resultado) => ({
        id: String(resultado.place_id),
        direccion: resultado.display_name,
        latitud: Number(resultado.lat),
        longitud: Number(resultado.lon),
      }));
  }

  async esperarTurno() {
    const turnoAnterior = this.colaSolicitudes;
    let liberarTurno;
    this.colaSolicitudes = new Promise((resolver) => {
      liberarTurno = resolver;
    });

    await turnoAnterior;
    try {
      const tiempoRestante =
        INTERVALO_MINIMO_MS - (Date.now() - this.ultimaSolicitud);
      if (tiempoRestante > 0) {
        await esperar(tiempoRestante);
      }
      this.ultimaSolicitud = Date.now();
    } finally {
      liberarTurno();
    }
  }
}
