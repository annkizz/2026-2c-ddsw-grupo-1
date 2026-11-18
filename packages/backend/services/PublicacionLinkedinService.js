import { EstadoEnvio } from "../domain/EstadoEnvio.js";
import { ForbiddenError } from "../errors/AppError.js";
import { LinkedInClient } from "./linkedin/LinkedinClient.js";

const MAX_TITULO = 200;
const MAX_DESCRIPCION = 1000;

// LinkedIn interpreta estos caracteres como formato: si no se escapan, el post se trunca
const RESERVADOS = /[\\|{}@[\]()<>#*_~]/g;
const escapar = (texto, max) => texto.slice(0, max).replace(RESERVADOS, "\\$&");

export class PublicacionLinkedInService {
  constructor(conexionService, cliente = new LinkedInClient(), config = process.env) {
    this.conexionService = conexionService;
    this.cliente = cliente;
    this.config = config;
  }

  // lanza 403 (no es el dueño) o 409 (no conectó / venció); devuelve lo necesario para publicar
  async validarPuedePublicar(proyecto, usuario) {
    const colectivo = await this.conexionService.obtenerColectivoDe(usuario);
    if (String(colectivo._id) !== String(proyecto.idColectivo)) {
      throw new ForbiddenError(
        "Solo el colectivo dueño del proyecto puede publicar en LinkedIn",
        "ACCESO_PROYECTO_DENEGADO",
      );
    }
    return await this.conexionService.obtenerCredenciales(colectivo._id);
  }

  textoLogro(proyecto, logro) {
    const url = `${this.config.FRONTEND_URL}/proyectos/${proyecto._id}`; // ajustá a la ruta del front
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
            ? "LinkedIn rechazó el token: reconectá la cuenta"
            : "No se pudo publicar en LinkedIn",
      };
    }
  }
}