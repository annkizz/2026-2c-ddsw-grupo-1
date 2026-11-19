import { ConexionLinkedinModel } from "../schemas/conexionLinkedinSchema.js";

export class ConexionLinkedinRepository {
  constructor(model = ConexionLinkedinModel) {
    this.model = model;
  }

  // sin el token: alcanza para mostrar el estado
  async buscarPorColectivo(idColectivo) {
    return await this.model.findOne({ idColectivo });
  }

  // con el token cifrado: solo para publicar
  async buscarPorColectivoConToken(idColectivo) {
    return await this.model.findOne({ idColectivo }).select("+accessToken");
  }

  // upsert: reconectar reemplaza la conexión anterior
  async guardar(conexion) {
    return await this.model.findOneAndUpdate(
      { idColectivo: conexion.idColectivo },
      { ...conexion },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
    );
  }

  async eliminar(idColectivo) {
    return await this.model.deleteOne({ idColectivo });
  }
}