import { ConflictError, NotFoundError } from "../errors/AppError.js";
import {
  crearEvaluadorCoincidencia,
  evaluarCoincidencia,
  puntajeDeCoincidencia,
  puntajeMaximoDeCoincidencia,
  porcentajeDeCobertura,
  porcentajeDeCoberturaRequerida,
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

  async buscarColaboradorasParaPerfil(idProyecto, id, pag, limite) {
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

    const resultados = candidatas
      .filter((colaboradora) => !yaAnotadas.includes(String(colaboradora._id)))
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
          aceptaMensajeria: colaboradora.aceptaMensajeria === true,
          presentacion: colaboradora.presentacion,
          tieneCoincidencia: evaluacion.tieneCoincidencia,
          requeridasCoincidentes: evaluacion.requeridasCoincidentes,
          opcionalesCoincidentes: evaluacion.opcionalesCoincidentes,
          puntaje: puntajeDeCoincidencia(evaluacion),
        };
        if (colaboradora.pronombres?.length > 0) {
          dto.pronombres = colaboradora.pronombres;
        }
        return dto;
      })
      .sort((uno, otro) => otro.puntaje - uno.puntaje);

    if (pag === undefined || limite === undefined) return resultados;
    const inicio = (pag - 1) * limite;
    const pagina = resultados.slice(inicio, inicio + limite);
    return {
      colaboradoras: pagina,
      total: resultados.length,
      pag,
      totalPags: Math.ceil(resultados.length / limite),
    };
  }

  // busqueda de potenciales proyectos segun habilidades de colaboradora.
  // proyectos donde esta anotada, proyectos abiertos y perfiles de esos

  async buscarProyectosParaColaboradora(idColaborador, pag, limite) {
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

    const perfiles = await this.perfilRepository.obtenerPorProyectos(
      abiertos.map((p) => p._id),
    );
    const evaluar = crearEvaluadorCoincidencia(colaboradora.habilidades);
    const perfilesPorProyecto = new Map();
    for (const perfil of perfiles) {
      const idProyecto = String(perfil.idProyecto);
      const perfilesDelProyecto = perfilesPorProyecto.get(idProyecto) ?? [];
      perfilesDelProyecto.push(perfil);
      perfilesPorProyecto.set(idProyecto, perfilesDelProyecto);
    }

    const resultados = [];
    for (const proyecto of abiertos) {
      const perfilesDelProyecto =
        perfilesPorProyecto.get(String(proyecto._id)) ?? [];
      const perfilesCompatibles = [];
      let puntaje = 0;
      let puntajeMaximo = 0;
      let requeridasCoincidentes = 0;
      let requeridasTotales = 0;

      for (const perfil of perfilesDelProyecto) {
        const coincidencia = evaluar(perfil);

        if (coincidencia.requeridasTotales === 0) continue;

        const maximoDelPerfil = puntajeMaximoDeCoincidencia(coincidencia);
        puntajeMaximo += maximoDelPerfil;
        requeridasTotales += coincidencia.requeridasTotales;

        if (!coincidencia.tieneCoincidencia) continue;

        const puntajeDelPerfil = puntajeDeCoincidencia(coincidencia);
        puntaje += puntajeDelPerfil;
        requeridasCoincidentes += coincidencia.requeridasCoincidentes.length;

        perfilesCompatibles.push({
          id: idDe(perfil),
          descripcion: perfil.descripcion,
          compromiso: perfil.compromiso,
          requeridasCoincidentes: coincidencia.requeridasCoincidentes,
          opcionalesCoincidentes: coincidencia.opcionalesCoincidentes,
          puntaje: puntajeDelPerfil,
          puntajeMaximo: maximoDelPerfil,
          porcentajeCobertura: porcentajeDeCobertura({
            puntaje: puntajeDelPerfil,
            puntajeMaximo: maximoDelPerfil,
          }),
        });
      }

      if (perfilesCompatibles.length > 0) {
        resultados.push({
          id: String(proyecto._id),
          titulo: proyecto.titulo,
          descripcion: proyecto.descripcion,
          puntaje,
          puntajeMaximo,
          porcentajeCobertura: porcentajeDeCobertura({
            puntaje,
            puntajeMaximo,
          }),
          porcentajeRequeridas: porcentajeDeCoberturaRequerida({
            requeridasCoincidentes,
            requeridasTotales,
          }),
          perfilesCompatibles,
        });
      }
    }

    const ordenados = resultados.sort((uno, otro) => {
      // 1) habilidades req
      // 2) cuanto cubre del proyecto en total
      // 3) + puntos brutos
      const porRequeridas =
        otro.porcentajeRequeridas - uno.porcentajeRequeridas;
      if (porRequeridas !== 0) return porRequeridas;

      const porCobertura = otro.porcentajeCobertura - uno.porcentajeCobertura;
      if (porCobertura !== 0) return porCobertura;

      return otro.puntaje - uno.puntaje;
    });

    if (pag === undefined || limite === undefined) return ordenados;
    const inicio = (pag - 1) * limite;
    const pagina = ordenados.slice(inicio, inicio + limite);
    return {
      proyectos: pagina,
      total: ordenados.length,
      pag,
      totalPags: Math.ceil(ordenados.length / limite),
    };
  }
}
