import { HabilidadProyecto } from "../domain/HabilidadProyecto.js";
import { Colectivo } from "../domain/Colectivo.js";
import { Proyecto } from "../domain/Proyecto.js";
import { Colaborador } from "../domain/Colaborador.js";
import { Colaboracion } from "../domain/Colaboracion.js";
import { normalizarEtiquetas } from "../domain/etiquetas.js";
import { construirUbicacionDeProyecto } from "../domain/provincias.js";

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
  const perfilesGuardados = new Map();

  for (const p of datos.proyectos) {
    for (const perfil of p.perfiles) {
      const guardado = await db.guardarPerfil({
        ...perfil,
        idProyecto: p.id,
      });
      perfilesGuardados.set(String(perfil.id), guardado);
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
        // req 15: solo se guarda la ubicacion declarada por el proyecto.
        p.ubicacion !== undefined
          ? construirUbicacionDeProyecto({
              ...p.ubicacion,
              pais: p.ubicacion.pais ?? "Argentina",
            })
          : null,
        p.destacado ?? false,
        p.destacadoHasta ?? null,
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
    const perfil = c.idPerfil
      ? perfilesGuardados.get(String(c.idPerfil))
      : null;
    if (c.idPerfil && !perfil) {
      throw new Error(
        `No se encontró el perfil ${c.idPerfil} para la colaboración de seed`,
      );
    }
    await colaboracionRepository.save(
      new Colaboracion(proyecto, colaborador, perfil, c.fecha, c.esAnonima),
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
