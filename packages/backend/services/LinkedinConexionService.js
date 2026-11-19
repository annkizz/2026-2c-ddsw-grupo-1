import { SignJWT, jwtVerify } from "jose";
import { ConexionLinkedin } from "../domain/ConexionLinkedin.js";
import { ConexionLinkedinRepository } from "../repositories/ConexionLinkedinRepository.js";
import { ColectivoRepository } from "../repositories/ColectivoRepository.js";
import { LinkedinClient } from "./linkedin/LinkedinClient.js";
import { cifrar, descifrar } from "../utils/cifrado.js";
import {
  BadGatewayError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  ServiceUnavailableError,
} from "../errors/AppError.js";

export class LinkedinConexionService {
  constructor(
    conexionRepository = new ConexionLinkedinRepository(),
    colectivoRepository = new ColectivoRepository(),
    cliente = new LinkedinClient(),
    config = process.env,
  ) {
    this.conexionRepository = conexionRepository;
    this.colectivoRepository = colectivoRepository;
    this.cliente = cliente;
    this.config = config;
  }

  async obtenerColectivoDe(usuario) {
    const colectivo = await this.colectivoRepository.buscarPorUsuario(usuario._id);
    if (!colectivo) {
      throw new ForbiddenError(
        "Solo un colectivo puede usar la integración con Linkedin",
        "ROL_NO_PERMITIDO",
      );
    }
    return colectivo;
  }

  validarConfiguracion() {
    if (!this.cliente.estaConfigurado() || !this.config.LINKEDIN_STATE_SECRET) {
      throw new ServiceUnavailableError(
        "La integración con Linkedin no está configurada",
        "LINKEDIN_NO_CONFIGURADO",
      );
    }
  }

  claveState() {
    return new TextEncoder().encode(this.config.LINKEDIN_STATE_SECRET);
  }

  async iniciarAutorizacion(usuario) {
    this.validarConfiguracion();
    const colectivo = await this.obtenerColectivoDe(usuario);
    const state = await new SignJWT({ idColectivo: String(colectivo._id) })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("10m")
      .sign(this.claveState());
    return { url: this.cliente.urlAutorizacion(state) };
  }

  async validarState(state, colectivo) {
    let payload;
    try {
      ({ payload } = await jwtVerify(state, this.claveState(), { algorithms: ["HS256"] }));
    } catch {
      throw new BadRequestError("el state es inválido o venció", "LINKEDIN_STATE_INVALIDO");
    }
    // el flujo lo tiene que completar el mismo colectivo que lo inicio
    if (payload.idColectivo !== String(colectivo._id)) {
      throw new ForbiddenError(
        "el state no corresponde a este colectivo",
        "LINKEDIN_STATE_INVALIDO",
      );
    }
  }

  async completarConexion(usuario, { code, state }) {
    this.validarConfiguracion();
    const colectivo = await this.obtenerColectivoDe(usuario);
    await this.validarState(state, colectivo);

    let token;
    let perfil;
    try {
      token = await this.cliente.intercambiarCodigo(code);
      perfil = await this.cliente.obtenerPerfil(token.accessToken);
    } catch (error) {
      if (error.status >= 400 && error.status < 500) {
        throw new BadRequestError(
          "Linkedin rechazó el código de autorización",
          "LINKEDIN_CODIGO_INVALIDO",
        );
      }
      throw new BadGatewayError("No se pudo comunicar con Linkedin", "LINKEDIN_NO_DISPONIBLE");
    }

    await this.conexionRepository.guardar(
      new ConexionLinkedin(
        colectivo._id,
        perfil.personUrn,
        perfil.nombre,
        cifrar(token.accessToken, this.config),
        token.expiraEn,
      ),
    );
    return this.obtenerEstado(usuario);
  }

  async obtenerEstado(usuario) {
    const colectivo = await this.obtenerColectivoDe(usuario);
    const conexion = await this.conexionRepository.buscarPorColectivo(colectivo._id);
    if (!conexion) return { conectado: false };
    return {
      conectado: conexion.estaVigente(),
      vencida: !conexion.estaVigente(),
      nombre: conexion.nombre,
      expiraEn: conexion.expiraEn,
    };
  }

  async desconectar(usuario) {
    const colectivo = await this.obtenerColectivoDe(usuario);
    await this.conexionRepository.eliminar(colectivo._id);
  }

  // lo usa la publicacion: falla ANTES de guardar nada si no se puede publicar
  async obtenerCredenciales(idColectivo) {
    const conexion = await this.conexionRepository.buscarPorColectivoConToken(idColectivo);
    if (!conexion) {
      throw new ConflictError(
        "El colectivo todavía no conectó su cuenta de Linkedin",
        "LINKEDIN_NO_CONECTADO",
      );
    }
    if (!conexion.estaVigente()) {
      throw new ConflictError(
        "La conexión con Linkedin venció, volvé a conectarla",
        "LINKEDIN_CONEXION_VENCIDA",
      );
    }
    return {
      accessToken: descifrar(conexion.accessToken, this.config),
      personUrn: conexion.personUrn,
    };
  }
}