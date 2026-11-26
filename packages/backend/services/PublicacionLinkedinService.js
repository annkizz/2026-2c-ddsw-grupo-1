import { EstadoEnvio } from "../domain/EstadoEnvio.js";
import { ForbiddenError, ServiceUnavailableError } from "../errors/AppError.js";
import { LinkedinClient } from "./linkedin/LinkedinClient.js";

const MAX_TITULO = 200;
const MAX_DESCRIPCION = 1000;

// Linkedin interpreta estos caracteres como formato: si no se escapan, el post se trunca
const RESERVADOS = /[\\|{}@[\]()<>#*_~]/g;
const escapar = (texto, max) => texto.slice(0, max).replace(RESERVADOS, "\\$&");

export class PublicacionLinkedinService {
  constructor(conexionService, cliente = new LinkedinClient(), config = process.env) {
    this.conexionService = conexionService;
    this.cliente = cliente;
    this.config = config;
  }

  // lanza 403 (no es el dueño) o 409 (no conectó / venció); devuelve lo necesario para publicar
  async validarPuedePublicar(proyecto, usuario) {
    const colectivo = await this.conexionService.obtenerColectivoDe(usuario);
    if (String(colectivo._id) !== String(proyecto.idColectivo)) {
      throw new ForbiddenError(
        "Solo el colectivo dueño del proyecto puede publicar en Linkedin",
        "ACCESO_PROYECTO_DENEGADO",
      );
    }
    this.validarFrontendUrl();
    return await this.conexionService.obtenerCredenciales(colectivo._id);
  }

  validarFrontendUrl() {
    let url;
    try {
      url = new URL(this.config.FRONTEND_URL);
    } catch {
      throw new ServiceUnavailableError("La URL del frontend no está configurada", "LINKEDIN_URL_INVALIDA");
    }
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
      throw new ServiceUnavailableError("La URL del frontend no es válida", "LINKEDIN_URL_INVALIDA");
    }
    return url.toString().replace(/\/+$/, "");
  }

  textoLogro(proyecto, logro) {
    const url = `${this.validarFrontendUrl()}/proyectos/${proyecto._id}`;
    return (
      `🏆 Nuevo logro en "${escapar(proyecto.titulo, MAX_TITULO)}": ` +
      `${escapar(logro.titulo, MAX_TITULO)}\n\n` +
      `${escapar(logro.descripcion, MAX_DESCRIPCION)}\n\n` +
      `${url}\n\n#CodigoAVoluntad #SoftwareLibre`
    );
  }

  async publicarLogro(proyecto, logro, credenciales) {
    const fecha = new Date();
    try {
      const urnPost = await this.cliente.publicar(
        credenciales.accessToken,
        credenciales.personUrn,
        this.textoLogro(proyecto, logro),
      );
      return { estado: EstadoEnvio.ENVIADO, fecha, urnPost };
    } catch (error) {
      console.error(`[linkedin] falló la publicación (${error.status ?? error.name})`);
      return {
        estado: EstadoEnvio.FALLIDO,
        fecha,
        detalle:
          error.status === 401
            ? "Linkedin rechazó el token: reconectá la cuenta"
            : "No se pudo publicar en Linkedin",
      };
    }
  }
}