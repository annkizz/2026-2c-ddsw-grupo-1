import { ConflictError, NotFoundError } from "../errors/AppError.js";
import { evaluarCoincidencia } from "../domain/Matching.js";

const idDe = (documento) => String(documento.id ?? documento._id);

export class MatchingService {
  constructor(
    colaboradorRepository,
    proyectoRepository,
    perfilRepository,
    colaboracionRepository,
  ) {
    this.colaboradorRepository = colaboradorRepository;
    this.proyectoRepository = proyectoRepository;
    this.perfilRepository = perfilRepository;
    this.colaboracionRepository = colaboracionRepository;
  }

  // busqueda de potenciales colaboradoras segun perfil del proyecto
  //las q estan anotadas al proyecto y las q comparten alguna habilidad del perfil

  async buscarColaboradorasParaPerfil(idProyecto, id) {
    const proyecto = await this.proyectoRepository.encontrarPorId(idProyecto);
    if (!proyecto) {
      throw new NotFoundError(
        "Proyecto no encontrado",
        "PROYECTO_NO_ENCONTRADO",
      );
    }

    const perfil = await this.perfilRepository.buscarPorId(id);
    if (!perfil || String(perfil.idProyecto) !== String(idProyecto)) {
      throw new NotFoundError("Perfil no encontrado", "PERFIL_NO_ENCONTRADO");
    }

    if (proyecto.estaFinalizado()) {
      throw new ConflictError(
        "No se pueden buscar colaboradoras para un proyecto finalizado",
        "PROYECTO_FINALIZADO",
      );
    }

    const yaAnotadas = new Set(
      (
        await this.colaboracionRepository.obtenerIdsColaboradoresDeProyecto(
          idProyecto,
        )
      ).map(String),
    );

    const candidatas = await this.colaboradorRepository.encontrarPorHabilidades([
      ...perfil.habilidadesRequeridas,
      ...perfil.habilidadesOpcionales,
    ]);

    return candidatas
      .filter((colaboradora) => !yaAnotadas.has(String(colaboradora._id)))
      .map((colaboradora) => ({
        colaboradora,
        ...evaluarCoincidencia(perfil, colaboradora.habilidades),
      }))
      .filter((r) => r.tieneCoincidencia)
      .map(({ colaboradora, ...coincidencia }) => ({
        // DTO publico, no se exponen nombre/apellido, colaboraciones ni medios de contacto.
        id: String(colaboradora._id),
        nombreFantasia: colaboradora.nombreFantasia,
        usuarioGitHub: colaboradora.usuarioGitHub,
        ...(colaboradora.pronombres?.length > 0 && {
          pronombres: colaboradora.pronombres,
        }),
        presentacion: colaboradora.presentacion,
        ...coincidencia,
      }));
  }

  // busqueda de potenciales proyectos segun habilidades de colaboradora.
  // proyectos donde esta anotada, proyectos abiertos y perfiles de esos 

  async buscarProyectosParaColaboradora(idColaborador) {
    const colaboradora =
      await this.colaboradorRepository.encontrarPorId(idColaborador);
    if (!colaboradora) {
      throw new NotFoundError(
        "La colaboradora no existe",
        "COLABORADORA_NO_ENCONTRADA",
      );
    }

    const yaAnotadas = new Set(
      (
        await this.colaboracionRepository.obtenerIdsProyectosDeColaborador(
          idColaborador,
        )
      ).map(String),
    );

    const abiertos = (await this.proyectoRepository.obtenerAbiertos()).filter(
      (p) => !yaAnotadas.has(String(p._id)),
    );

    const perfiles = await this.perfilRepository.obtenerPorProyectos(
      abiertos.map((p) => p._id),
    );
    const perfilesPorProyecto = new Map();
    for (const perfil of perfiles) {
      const idProyecto = String(perfil.idProyecto);
      const ids = perfilesPorProyecto.get(idProyecto) ?? [];
      ids.push(perfil);
      perfilesPorProyecto.set(idProyecto, ids);
    }

    const resultados = abiertos.map((proyecto) => {
      const perfilesCompatibles = (
        perfilesPorProyecto.get(String(proyecto._id)) ?? []
      )
        .map((perfil) => ({
          id: idDe(perfil),
          descripcion: perfil.descripcion,
          compromiso: perfil.compromiso,
          ...evaluarCoincidencia(perfil, colaboradora.habilidades),
        }))
        .filter((p) => p.tieneCoincidencia)
        .map(
          ({
            id,
            descripcion,
            compromiso,
            requeridasCoincidentes,
            opcionalesCoincidentes,
          }) => ({
            id,
            descripcion,
            compromiso,
            requeridasCoincidentes,
            opcionalesCoincidentes,
          }),
        );

      return {
        id: String(proyecto._id),
        titulo: proyecto.titulo,
        descripcion: proyecto.descripcion,
        perfilesCompatibles,
      };
    });

    return resultados.filter((r) => r.perfilesCompatibles.length > 0);
  }
}
