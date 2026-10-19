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

  async buscarColaboradorasParaPerfil(idProyecto, idPerfil) {
    const proyecto = await this.proyectoRepository.encontrarPorId(idProyecto);
    if (!proyecto) {
      throw new NotFoundError(
        "Proyecto no encontrado",
        "PROYECTO_NO_ENCONTRADO",
      );
    }

    const perfil = await this.perfilRepository.buscarPorId(idPerfil);
    if (!perfil || perfil.proyecto !== idProyecto) {
      throw new NotFoundError("Perfil no encontrado", "PERFIL_NO_ENCONTRADO");
    }

    if (proyecto.estaFinalizado()) {
      throw new ConflictError(
        "No se pueden buscar colaboradoras para un proyecto finalizado",
        "PROYECTO_FINALIZADO",
      );
    }

    const yaAnotadas = new Set(
      await this.colaboracionRepository.obtenerIdsColaboradoresDeProyecto(
        idProyecto,
      ),
    );

    const candidatas = await this.colaboradorRepository.encontrarPorHabilidades([
      ...perfil.habilidadesRequeridas,
      ...perfil.habilidadesOpcionales,
    ]);

    return candidatas
      .filter((colaboradora) => !yaAnotadas.has(colaboradora.idColaborador))
      .map((colaboradora) => ({
        colaboradora,
        ...evaluarCoincidencia(perfil, colaboradora.habilidades),
      }))
      .filter((r) => r.tieneCoincidencia)
      .map(({ colaboradora, ...coincidencia }) => ({
        // DTO publico, no se exponen nombre/apellido, colaboraciones ni medios de contacto.
        idColaborador: colaboradora.idColaborador,
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
      await this.colaboracionRepository.obtenerIdsProyectosDeColaborador(
        idColaborador,
      ),
    );

    const abiertos = (await this.proyectoRepository.obtenerAbiertos()).filter(
      (p) => !yaAnotadas.has(p.idProyecto),
    );

    const perfiles = await this.perfilRepository.obtenerPorProyectos(
      abiertos.map((p) => p.idProyecto),
    );
    const perfilesPorProyecto = new Map();
    for (const perfil of perfiles) {
      const ids = perfilesPorProyecto.get(perfil.proyecto) ?? [];
      ids.push(perfil);
      perfilesPorProyecto.set(perfil.proyecto, ids);
    }

    const resultados = abiertos.map((proyecto) => {
      const perfilesCompatibles = (
        perfilesPorProyecto.get(proyecto.idProyecto) ?? []
      )
        .map((perfil) => ({
          idPerfil: idDe(perfil),
          descripcion: perfil.descripcion,
          compromiso: perfil.compromiso,
          ...evaluarCoincidencia(perfil, colaboradora.habilidades),
        }))
        .filter((p) => p.tieneCoincidencia)
        .map(
          ({
            idPerfil,
            descripcion,
            compromiso,
            requeridasCoincidentes,
            opcionalesCoincidentes,
          }) => ({
            idPerfil,
            descripcion,
            compromiso,
            requeridasCoincidentes,
            opcionalesCoincidentes,
          }),
        );

      return {
        idProyecto: proyecto.idProyecto,
        titulo: proyecto.titulo,
        descripcion: proyecto.descripcion,
        perfilesCompatibles,
      };
    });

    return resultados.filter((r) => r.perfilesCompatibles.length > 0);
  }
}
