import { ConflictError } from "../errors/AppError.js";
import { UsuarioRepository } from "../repositories/UsuarioRepository.js";
import { ColectivoRepository } from "../repositories/ColectivoRepository.js";
import { ColaboradorRepository } from "../repositories/ColaboradorRepository.js";

export class UsuarioService {
  constructor(
    usuarioRepository = new UsuarioRepository(),
    colectivoRepository = new ColectivoRepository(),
    colaboradorRepository = new ColaboradorRepository(),
  ) {
    this.usuarioRepository = usuarioRepository;
    this.colectivoRepository = colectivoRepository;
    this.colaboradorRepository = colaboradorRepository;
  }

  // Un usuario tiene un solo perfil: primero reserva el rol (operacion atomica, asi
  // dos registros simultaneos no pasan los dos) y recien despues crea el perfil.
  async registrarPerfil(usuario, rol, crearPerfil) {
    const conRol = await this.usuarioRepository.asignarRol(usuario._id, rol);
    if (!conRol) {
      throw new ConflictError(
        "el usuario ya tiene un perfil registrado",
        "PERFIL_YA_REGISTRADO",
      );
    }

    try {
      return await crearPerfil();
    } catch (error) {
      await this.usuarioRepository.quitarRol(usuario._id);
      throw error;
    }
  }

  // lo que necesita el front para saber a donde mandar a la persona al iniciar sesion
  async obtenerSesion(usuario) {
    const [colectivo, colaborador] = await Promise.all([
      this.colectivoRepository.buscarPorUsuario(usuario._id),
      this.colaboradorRepository.buscarPorUsuario(usuario._id),
    ]);

    return {
      usuarioId: String(usuario._id),
      nombreUsuario: usuario.nombreUsuario ?? null,
      rol: usuario.rol ?? null,
      tienePerfil: Boolean(colectivo || colaborador),
      idColectivo: colectivo ? String(colectivo._id) : null,
      idColaborador: colaborador ? String(colaborador._id) : null,
    };
  }
}
