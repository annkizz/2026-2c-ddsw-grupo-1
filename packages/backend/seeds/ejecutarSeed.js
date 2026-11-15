import { HabilidadProyecto } from "../domain/HabilidadProyecto.js";
import { Colectivo } from "../domain/Colectivo.js";
import { Proyecto } from "../domain/Proyecto.js";
import { Colaborador } from "../domain/Colaborador.js";
import { Colaboracion } from "../domain/Colaboracion.js";
import { normalizarEtiquetas } from "../domain/etiquetas.js";
import {
  construirUbicacionDeProyecto,
  ubicacionHeredadaDeColectivo,
} from "../domain/provincias.js";

//recibe los datos iniciales y los inserta usando repo real

export async function ejecutarSeed(
  {
    habilidadRepository,
    colectivoRepository,
    proyectoRepository,
    colaboradorRepository,
    colaboracionRepository,
    db,
  },
  datos,
) {
  for (const titulo of datos.habilidades) {
    await habilidadRepository.save(new HabilidadProyecto(titulo));
  }

  for (const c of datos.colaboradoras) {
    await colaboradorRepository.save(
      new Colaborador(
        c.nombreFantasia,
        c.usuarioGitHub,
        c.nombre,
        c.apellido,
        c.presentacion,
        c.pronombres ?? [],
        c.habilidades,
      ),
      c.id,
    );
  }

  const idsProyectosSeed = datos.proyectos.map((p) => p.id);
  await db.borrarDatosDeProyectos(idsProyectosSeed);

  // req 15: la seed crea los colectivos despues de los proyectos, asi que el
  // fallback de ubicacion se resuelve con un lookup en memoria de los datos.
  const colectivosPorId = {};
  for (const c of datos.colectivos) {
    colectivosPorId[c.id] = c;
  }

  for (const p of datos.proyectos) {
    for (const perfil of p.perfiles) {
      await db.guardarPerfil({ ...perfil, idProyecto: p.id });
    }

    await proyectoRepository.save(
      new Proyecto(
        p.titulo,
        p.descripcion,
        p.perfiles.map((perfil) => perfil.id),
        p.estado,
        p.fechaInicio,
        p.fechaLimiteCierre,
        p.idColectivo,
        p.porcentajeConcrecion,
        p.enlaceSistema,
        p.enlaceCodigoFuente,
        p.busquedaAbierta ?? false,
        p.fechaLimiteBusqueda ?? null,
        normalizarEtiquetas(p.etiquetas), // req 34
        // req 15: ubicacion propia o heredada del colectivo
        p.ubicacion !== undefined
          ? construirUbicacionDeProyecto(p.ubicacion)
          : ubicacionHeredadaDeColectivo(colectivosPorId[p.idColectivo]),
      ),
      p.id,
    );

    for (const logro of p.logros) {
      await db.guardarLogro({ ...logro, idProyecto: p.id });
    }
  }

  for (const c of datos.colectivos) {
    await colectivoRepository.save(
      new Colectivo(
        c.nombre,
        c.descripcion,
        c.ubicacion,
        c.tipoDeColectivo,
        normalizarEtiquetas(c.etiquetas), // req 34
      ),
      c.id,
    );
  }

  for (const p of datos.proyectos) {
    await colectivoRepository.agregarProyecto(p.idColectivo, p.id);
  }

  for (const c of datos.colaboraciones) {
    const proyecto = await proyectoRepository.buscarPorId(c.idProyecto);
    const colaborador = await colaboradorRepository.buscarPorId(
      c.idColaborador,
    );
    await colaboracionRepository.save(
      new Colaboracion(proyecto, colaborador, null, c.fecha, c.esAnonima),
    );
  }

  return {
    habilidades: datos.habilidades.length,
    colectivos: datos.colectivos.length,
    proyectos: datos.proyectos.length,
    perfiles: datos.proyectos.reduce((n, p) => n + p.perfiles.length, 0),
    logros: datos.proyectos.reduce((n, p) => n + p.logros.length, 0),
    colaboradoras: datos.colaboradoras.length,
    colaboraciones: datos.colaboraciones.length,
  };
}
