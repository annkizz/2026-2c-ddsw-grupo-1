import { HabilidadProyecto } from "../domain/HabilidadProyecto.js";
import { Colectivo } from "../domain/Colectivo.js";
import { Proyecto } from "../domain/Proyecto.js";
import { Colaborador } from "../domain/Colaborador.js";
import { Colaboracion } from "../domain/Colaboracion.js";

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
      c.idColaborador,
    );
  }

  const idsProyectosSeed = datos.proyectos.map((p) => p.idProyecto);
  await db.borrarDatosDeProyectos(idsProyectosSeed);

  for (const p of datos.proyectos) {
    for (const perfil of p.perfiles) {
      await db.guardarPerfil({ ...perfil, proyecto: p.idProyecto });
    }

    await proyectoRepository.save(
      new Proyecto(
        p.titulo,
        p.descripcion,
        p.perfiles.map((perfil) => perfil.idPerfil),
        p.estado,
        p.fechaInicio,
        p.fechaLimiteCierre,
        p.idColectivo,
        p.porcentajeConcrecion,
        p.enlaceSistema,
        p.enlaceCodigoFuente,
      ),
      p.idProyecto,
    );

    for (const logro of p.logros) {
      await db.guardarLogro({ ...logro, proyecto: p.idProyecto });
    }
  }

  for (const c of datos.colectivos) {
    await colectivoRepository.save(
      new Colectivo(c.nombre, c.descripcion, c.ubicacion, c.tipoDeColectivo),
      c.idColectivo,
    );
  }

  for (const p of datos.proyectos) {
    await colectivoRepository.agregarProyecto(p.idColectivo, p.idProyecto);
  }

  for (const c of datos.colaboraciones) {
    const proyecto = await proyectoRepository.encontrarPorId(c.idProyecto);
    const colaborador = await colaboradorRepository.encontrarPorId(
      c.idColaborador,
    );
    await colaboracionRepository.save(
      new Colaboracion(proyecto, colaborador, c.fecha, c.esAnonima),
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
