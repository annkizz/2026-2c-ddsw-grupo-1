import "dotenv/config";
import mongoose from "mongoose";
import { MongoDBClient } from "../config/database.js";
import { HabilidadRepository } from "../repositories/HabilidadRepository.js";
import { ColectivoRepository } from "../repositories/ColectivoRepository.js";
import { ProyectoRepository } from "../repositories/ProyectoRepository.js";
import { PerfilRepository } from "../repositories/PerfilRepository.js";
import { ColaboradorRepository } from "../repositories/ColaboradorRepository.js";
import { PerfilModel } from "../schemas/perfilSchema.js";
import { HabilidadProyecto } from "../domain/HabilidadProyecto.js";
import { Colectivo } from "../domain/Colectivo.js";
import { Proyecto } from "../domain/Proyecto.js";
import { Colaborador } from "../domain/Colaborador.js";
import { Colaboracion } from "../domain/Colaboracion.js";
import * as datos from "./datosIniciales.js";

await MongoDBClient.connect();

try {
  const habilidadRepository = new HabilidadRepository();
  const colectivoRepository = new ColectivoRepository();
  const proyectoRepository = new ProyectoRepository();
  const perfilRepository = new PerfilRepository();
  const colaboradorRepository = new ColaboradorRepository();

  for (const titulo of datos.habilidades) {
    await habilidadRepository.save(new HabilidadProyecto(titulo));
  }

  const colectivos = datos.colectivos.map(
    (c) =>
      new Colectivo(c.nombre, c.idColectivo, c.descripcion, c.ubicacion, c.tipoDeColectivo),
  );

  const proyectosGuardados = [];
  for (const p of datos.proyectos) {
    await PerfilModel.deleteMany({ proyecto: p.idProyecto });
    const idsPerfiles = [];
    for (const perfil of p.perfiles) {
      const guardado = await perfilRepository.save({ ...perfil, proyecto: p.idProyecto });
      idsPerfiles.push(String(guardado.id));
    }
    const proyecto = await proyectoRepository.save(
      new Proyecto(p.titulo, p.descripcion, idsPerfiles, p.estado, p.fechaInicio,
        p.idProyecto, p.fechaLimiteCierre, p.idColectivo),
    );
    proyectosGuardados.push(proyecto);
    colectivos.find((c) => c.idColectivo === p.idColectivo)?.agregarProyecto(p.idProyecto);
  }

  for (const colectivo of colectivos) {
    await colectivoRepository.save(colectivo);
  }

  for (const c of datos.colaboradoras) {
    await colaboradorRepository.save(
      new Colaborador(c.nombreFantasia, c.usuarioGitHub, c.nombre, c.apellido,
        c.presentacion, c.pronombres ?? [], c.idColaborador, c.habilidades),
    );
  }

  for (const c of datos.colaboraciones) {
    const proyecto = proyectosGuardados.find((p) => p.idProyecto === c.idProyecto);
    const colaborador = await colaboradorRepository.encontrarPorId(c.idColaborador);
    await proyectoRepository.saveColaboracion(new Colaboracion(proyecto, colaborador, c.fecha));
  }

  console.log(
    `Seed listo: ${datos.habilidades.length} habilidades, ${datos.colectivos.length} colectivos, ` +
      `${datos.proyectos.length} proyectos, ${datos.colaboradoras.length} colaboradoras, ` +
      `${datos.colaboraciones.length} colaboraciones`,
  );
} finally {
  await mongoose.disconnect();
}
