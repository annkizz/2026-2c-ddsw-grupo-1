import { ConflictError, NotFoundError } from "../errors/AppError.js";
import { evaluarCoincidencia } from "../domain/Matching.js";

const idDe = (documento) => String(documento.id ?? documento._id);

export class MatchingService {
  constructor(colaboradorRepository, proyectoRepository, perfilRepository) {
    this.colaboradorRepository = colaboradorRepository;
    this.proyectoRepository = proyectoRepository;
    this.perfilRepository = perfilRepository;
  }

  // busqueda de potenciales colaboradoras segun perfil del proyecto
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
      (await this.proyectoRepository.obtenerTodasColaboraciones())
        .filter((c) => c.proyecto?.idProyecto === idProyecto)
        .map((c) => c.colaborador?.idColaborador),
    );

    return (await this.colaboradorRepository.obtenerTodos())
      .filter((colaboradora) => !yaAnotadas.has(colaboradora.idColaborador))
      .map((colaboradora) => ({
        colaboradora,
        ...evaluarCoincidencia(perfil, colaboradora.habilidades),
      }))
      .filter((r) => r.tieneCoincidencia)
      .sort((a, b) => b.porcentajeCoincidencia - a.porcentajeCoincidencia)
      .map(({ colaboradora, ...coincidencia }) => ({
        // DTO publico, no se exponen nombre/apellido, colaboraciones ni medios de contacto.
        idColaborador: colaboradora.idColaborador,
        nombreFantasia: colaboradora.nombreFantasia,
        usuarioGitHub: colaboradora.usuarioGitHub,
        pronombres: colaboradora.pronombres,
        presentacion: colaboradora.presentacion,
        ...coincidencia,
      }));
  }

  // busqueda de potenciales proyectos segun habilidades de colaboradora.
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
      (await this.proyectoRepository.obtenerTodasColaboraciones())
        .filter((c) => c.colaborador?.idColaborador === idColaborador)
        .map((c) => c.proyecto?.idProyecto),
    );

    const abiertos = (await this.proyectoRepository.obtenerTodos()).filter(
      (p) => !p.estaFinalizado() && !yaAnotadas.has(p.idProyecto),
    );

    const resultados = await Promise.all(
      abiertos.map(async (proyecto) => {
        const perfiles = await this.perfilRepository.obtenerTodos(
          proyecto.idProyecto,
        );
        const perfilesCompatibles = perfiles
          .map((perfil) => ({
            idPerfil: idDe(perfil),
            descripcion: perfil.descripcion,
            compromiso: perfil.compromiso,
            ...evaluarCoincidencia(perfil, colaboradora.habilidades),
          }))
          .filter((p) => p.tieneCoincidencia)
          .map(({ idPerfil, descripcion, compromiso, requeridasCoincidentes, opcionalesCoincidentes, porcentajeCoincidencia }) => ({
            idPerfil,
            descripcion,
            compromiso,
            requeridasCoincidentes,
            opcionalesCoincidentes,
            porcentajeCoincidencia,
          }))
          .sort((a, b) => b.porcentajeCoincidencia - a.porcentajeCoincidencia);

        return {
          idProyecto: proyecto.idProyecto,
          titulo: proyecto.titulo,
          descripcion: proyecto.descripcion,
          perfilesCompatibles,
        };
      }),
    );

    return resultados
      .filter((r) => r.perfilesCompatibles.length > 0)
      .sort(
        (a, b) =>
          b.perfilesCompatibles[0].porcentajeCoincidencia -
          a.perfilesCompatibles[0].porcentajeCoincidencia,
      );
  }
}
