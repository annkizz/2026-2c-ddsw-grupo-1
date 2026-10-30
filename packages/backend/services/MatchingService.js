import { ConflictError, NotFoundError } from "../errors/AppError.js";
import {
  crearEvaluadorCoincidencia,
  evaluarCoincidencia,
} from "../domain/Matching.js";

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
  // excluye anotadas y exige las habilidades requeridas del perfil

  async buscarColaboradorasParaPerfil(idProyecto, id) {
    const proyecto = await this.proyectoRepository.buscarPorId(idProyecto);
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

    const yaAnotadas = (
      await this.colaboracionRepository.obtenerIdsColaboradoresDeProyecto(
        idProyecto,
      )
    ).map(String);

    const candidatas =
      await this.colaboradorRepository.encontrarPorHabilidadesRequeridas(
        perfil.habilidadesRequeridas,
      );

    return candidatas
      .filter(
        (colaboradora) => !yaAnotadas.includes(String(colaboradora._id)),
      )
      .map((colaboradora) => ({
        colaboradora,
        evaluacion: evaluarCoincidencia(perfil, colaboradora.habilidades),
      }))
      .filter((sugerencia) => sugerencia.evaluacion.tieneCoincidencia)
      .map((sugerencia) => {
        const { colaboradora, evaluacion } = sugerencia;
        const dto = {
          // DTO publico, no se exponen nombre/apellido, colaboraciones ni medios de contacto.
          id: String(colaboradora._id),
          nombreFantasia: colaboradora.nombreFantasia,
          usuarioGitHub: colaboradora.usuarioGitHub,
          presentacion: colaboradora.presentacion,
          tieneCoincidencia: evaluacion.tieneCoincidencia,
          requeridasCoincidentes: evaluacion.requeridasCoincidentes,
          opcionalesCoincidentes: evaluacion.opcionalesCoincidentes,
        };
        if (colaboradora.pronombres?.length > 0) {
          dto.pronombres = colaboradora.pronombres;
        }
        return dto;
      });
  }

  // busqueda de potenciales proyectos segun habilidades de colaboradora.
  // proyectos donde esta anotada, proyectos abiertos y perfiles de esos

  async buscarProyectosParaColaboradora(idColaborador) {
    const colaboradora =
      await this.colaboradorRepository.buscarPorId(idColaborador);
    if (!colaboradora) {
      throw new NotFoundError(
        "La colaboradora no existe",
        "COLABORADORA_NO_ENCONTRADA",
      );
    }

    if (colaboradora.habilidades.length === 0) return [];
    const yaAnotadas =
      await this.colaboracionRepository.obtenerIdsProyectosDeColaborador(
        idColaborador,
      );
    const abiertos =
      await this.proyectoRepository.obtenerAbiertosParaMatching(yaAnotadas);
    if (abiertos.length === 0) return [];

    const perfiles = await this.perfilRepository.obtenerCompatiblesPorProyectos(
      abiertos.map((p) => p._id),
      colaboradora.habilidades,
    );
    const evaluar = crearEvaluadorCoincidencia(colaboradora.habilidades);

    const resultados = [];
    for (const proyecto of abiertos) {
      const perfilesDelProyecto = perfiles.filter(
        (perfil) => String(perfil.idProyecto) === String(proyecto._id),
      );
      const perfilesCompatibles = [];

      for (const perfil of perfilesDelProyecto) {
        const coincidencia = evaluar(perfil);
        if (!coincidencia.tieneCoincidencia) continue;

        perfilesCompatibles.push({
          id: idDe(perfil),
          descripcion: perfil.descripcion,
          compromiso: perfil.compromiso,
          requeridasCoincidentes: coincidencia.requeridasCoincidentes,
          opcionalesCoincidentes: coincidencia.opcionalesCoincidentes,
        });
      }

      if (perfilesCompatibles.length > 0) {
        resultados.push({
          id: String(proyecto._id),
          titulo: proyecto.titulo,
          descripcion: proyecto.descripcion,
          perfilesCompatibles,
        });
      }
    }

    return resultados;
  }
}
