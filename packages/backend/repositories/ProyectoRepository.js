import mongoose from "mongoose";
import { ProyectoModel } from "../schemas/proyectoSchema.js";
import { Estado } from "../domain/Estado.js";

export class ProyectoRepository {
  constructor(proyectoModel = ProyectoModel) {
    this.proyectoModel = proyectoModel;
  }

  obtenerTodos(filtros = {}) {
    const query = {};
    // se filtra en la base, no se trae todo para memoria 
    if (filtros.etiquetas !== undefined && filtros.etiquetas.length > 0) {
      if (filtros.etiquetas.length === 1) {
        query.etiquetas = filtros.etiquetas[0];
      } else {
        query.etiquetas = { $in: filtros.etiquetas };
      }
    }
    if (filtros.provincia !== undefined && filtros.provincia !== null) {
      query["ubicacion.codigoProvincia"] = filtros.provincia;
    }

    if (filtros.idsProyectos !== undefined && filtros.idsProyectos !== null) {
      query._id = { $in: filtros.idsProyectos };
    }

    if (filtros.idColectivo !== undefined && filtros.idColectivo !== null) {
      query.idColectivo = filtros.idColectivo;
    }

    if (filtros.estado !== undefined && filtros.estado !== null) {
      query.estado = filtros.estado;
    }
    return this.proyectoModel.find(query).sort({ fechaInicio: -1 }).exec();
  }

  obtenerPorIds(ids) {
    if (ids.length === 0) return Promise.resolve([]);
    return this.proyectoModel.find({ _id: { $in: ids } }).exec();
  }

  buscarPorAlMenosUno(filtros = {}) {
    const condiciones = [];

    if (filtros.etiquetas !== undefined && filtros.etiquetas.length > 0) {
      condiciones.push({ etiquetas: { $in: filtros.etiquetas } });
    }
    if (filtros.provincias !== undefined && filtros.provincias.length > 0) {
      condiciones.push({
        "ubicacion.codigoProvincia": { $in: filtros.provincias },
      });
    }
    if (filtros.idColectivos !== undefined && filtros.idColectivos.length > 0) {
      condiciones.push({ idColectivo: { $in: filtros.idColectivos } });
    }
    if (Array.isArray(filtros.idsProyectos)) {
      condiciones.push({ _id: { $in: filtros.idsProyectos } });
    }

    const query = {};
    if (filtros.estado !== undefined && filtros.estado !== null) {
      query.estado = filtros.estado;
    }
    if (condiciones.length > 0) {
      query.$or = condiciones;
    } else if (filtros.hayFiltrosDeBusqueda) {
      // Se pidieron filtros pero ninguno puede coincidir: no hay resultados.
      return Promise.resolve([]);
    }

    return this.proyectoModel.find(query).sort({ fechaInicio: -1 }).exec();
  }

  obtenerDestacados(ahora = new Date()) {
    return this.proyectoModel
      .find({
        estado: Estado.ACTIVO,
        destacado: true,
        destacadoHasta: { $gt: ahora },
      })
      .sort({ destacadoHasta: 1, fechaInicio: -1 })
      .exec();
  }

  obtenerActivosParaMapa() {
    return this.proyectoModel
      .find({ estado: Estado.ACTIVO })
      .select("titulo descripcion ubicacion idColectivo")
      .populate("idColectivo", "nombre")
      .sort({ fechaInicio: -1 })
      .exec();
  }

  obtenerAbiertosParaMatching(idsExcluidos) {
    return this.proyectoModel
      .find({
        estado: Estado.ACTIVO,
        _id: { $nin: idsExcluidos },
      })
      .select("_id titulo descripcion")
      .sort({ fechaInicio: -1 })
      .exec();
  }

  async buscarPorId(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return await this.proyectoModel.findById(id).exec();
  }

  async existe(idProyecto) {
    if (!mongoose.isValidObjectId(idProyecto)) return false;
    const resultado = await this.proyectoModel.exists({ _id: idProyecto });
    return resultado !== null;
  }

  async agregarPerfil(idProyecto, id) {
    const proyecto = await this.proyectoModel.findById(idProyecto).exec();
    if (!proyecto) return null;

    const yaAgregado = proyecto.perfiles.some(
      (perfil) => String(perfil) === String(id),
    );
    if (!yaAgregado) {
      proyecto.perfiles.push(id);
      await proyecto.save();
    }
    return proyecto;
  }

  async quitarPerfil(idProyecto, id) {
    const proyecto = await this.proyectoModel.findById(idProyecto).exec();
    if (!proyecto) return null;

    proyecto.perfiles = proyecto.perfiles.filter(
      (perfil) => String(perfil) !== String(id),
    );
    await proyecto.save();
    return proyecto;
  }

  obtenerVencidos(ahora = new Date()) {
    return this.proyectoModel
      .find({
        estado: Estado.ACTIVO,
        fechaLimiteCierre: { $lte: ahora },
      })
      .exec();
  }

  save(unProyecto, id = unProyecto._id) {
    return this.proyectoModel
      .findOneAndUpdate(
        { _id: id ?? new mongoose.Types.ObjectId() },
        {
          idColectivo: unProyecto.idColectivo,
          titulo: unProyecto.titulo,
          descripcion: unProyecto.descripcion,
          perfiles: unProyecto.perfiles,
          estado: unProyecto.estado,
          fechaInicio: unProyecto.fechaInicio,
          fechaLimiteCierre: unProyecto.fechaLimiteCierre,
          porcentajeConcrecion: unProyecto.porcentajeConcrecion,
          enlaceSistema: unProyecto.enlaceSistema,
          enlaceCodigoFuente: unProyecto.enlaceCodigoFuente,
          busquedaAbierta: unProyecto.busquedaAbierta,
          fechaLimiteBusqueda: unProyecto.fechaLimiteBusqueda,
          etiquetas: unProyecto.etiquetas,
          ubicacion: unProyecto.ubicacion,
          destacado: unProyecto.destacado ?? false,
          destacadoHasta: unProyecto.destacadoHasta ?? null,
        },
        {
          upsert: true,
          returnDocument: "after",
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec();
  }
}
