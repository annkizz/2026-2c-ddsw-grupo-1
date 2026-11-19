import { UsuarioModel } from "../schemas/usuarioSchema.js";

const CLAVE_DUPLICADA = 11000;

export class UsuarioRepository {
  constructor(model = UsuarioModel) {
    this.model = model;
  }

  // primer request de una cuenta de Logto: se crea el usuario local
  async buscarOCrearPorLogtoId(logtoId, nombreUsuario) {
    const upsert = () =>
      this.model
        .findOneAndUpdate(
          { logtoId },
          { $setOnInsert: { nombreUsuario: nombreUsuario ?? null } },
          {
            upsert: true,
            returnDocument: "after",
            setDefaultsOnInsert: true,
          },
        )
        .exec();

    try {
      return await upsert();
    } catch (error) {
      // el front suele disparar varios requests en paralelo al iniciar sesion:
      // si dos upserts compiten, uno falla por clave duplicada y alcanza con reintentar
      if (error.code !== CLAVE_DUPLICADA) throw error;
      return await upsert();
    }
  }

  // devuelve null si el usuario ya tenia rol (lo que impide registrar dos perfiles)
  asignarRol(idUsuario, rol) {
    return this.model
      .findOneAndUpdate(
        { _id: idUsuario, rol: null },
        { rol },
        { returnDocument: "after" },
      )
      .exec();
  }

  quitarRol(idUsuario) {
    return this.model
      .updateOne({ _id: idUsuario }, { $unset: { rol: 1 } })
      .exec();
  }
}
