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

// Valores por defecto del procesamiento en lote (se pueden cambiar con variables de entorno).
const UMBRAL_CAMBIOS = 5; // procesar apenas se juntan 5 perfiles/colaboradoras cambiados…
const ESPERA_MAXIMA_MIN = 30; // …o cuando el cambio más viejo lleva 30 minutos esperando

// 1) habilidades requeridas cubiertas, 2) cuánto cubre del proyecto en total, 3) puntos brutos
const ordenarProyectos = (uno, otro) => {
  const porRequeridas = otro.porcentajeRequeridas - uno.porcentajeRequeridas;
  if (porRequeridas !== 0) return porRequeridas;
  const porCobertura = otro.porcentajeCobertura - uno.porcentajeCobertura;
  if (porCobertura !== 0) return porCobertura;
  return otro.puntaje - uno.puntaje;
};

const ordenarCandidatas = (una, otra) => otra.puntaje - una.puntaje;

// DTO público: no se exponen nombre/apellido, colaboraciones ni medios de contacto.
const dtoCandidata = (colaboradora, evaluacion) => {
  const dto = {
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
};

// Los resultados del matching se calculan una vez y quedan guardados:
//  - matchingCaches: proyectos compatibles con cada colaboradora (su inicio y el buscador de proyectos).
//  - candidatasPorPerfil: colaboradoras compatibles con cada perfil (el buscador del colectivo).
// Cuando cambia un perfil o una colaboradora, el cambio se anota en una cola (cambiosMatching) y una
// tarea programada lo procesa en lote, recalculando solo lo afectado (ver procesarCambiosPendientes).
export class MatchingService {
  constructor(
    colaboradorRepository,
    proyectoRepository,
    perfilRepository,
    colaboracionRepository,
    matchingCacheRepository = null,
    candidatasRepository = null,
    cambiosRepository = null,
    config = process.env,
  ) {
    this.colaboradorRepository = colaboradorRepository;
    this.proyectoRepository = proyectoRepository;
    this.perfilRepository = perfilRepository;
    this.colaboracionRepository = colaboracionRepository;
    this.matchingCacheRepository = matchingCacheRepository;
    this.candidatasRepository = candidatasRepository;
    this.cambiosRepository = cambiosRepository;
    this.config = config;
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
    const yaAnotadas = new Set(
      (
        await this.colaboracionRepository.obtenerIdsColaboradoresDeProyecto(
          idProyecto,
        )
      ).map(String),
    );

    // Con resultados guardados: se leen de ahí (se calculan solo la primera vez).
    // Sin repositorio de guardado: se calculan en el momento, como antes.
    let evaluadas;
    let documentos = null;
    if (this.candidatasRepository) {
      const guardado =
        (await this.candidatasRepository.buscarPorPerfil(id)) ??
        (await this.guardarCandidatas(perfil));
      evaluadas = guardado.candidatas;
    } else {
      ({ evaluadas, documentos } = await this.calcularCandidatas(perfil));
    }

    const visibles = evaluadas.filter(
      (candidata) => !yaAnotadas.has(String(candidata.idColaborador)),
    );
    const paginar = pag !== undefined && limite !== undefined;
    const seleccion = paginar
      ? visibles.slice((pag - 1) * limite, (pag - 1) * limite + limite)
      : visibles;

    // Solo se leen los datos públicos de la página que se muestra, y se vuelve a evaluar con sus
    // habilidades actuales: si alguien cambió sus habilidades y el lote todavía no corrió, igual se
    // muestra bien (y si ya no coincide, no aparece).
    const docs =
      documentos ??
      (await this.colaboradorRepository.obtenerPublicosPorIds(
        seleccion.map((candidata) => candidata.idColaborador),
      ));
    const porId = new Map(docs.map((doc) => [String(doc._id), doc]));
    const resultados = seleccion
      .map((candidata) => porId.get(String(candidata.idColaborador)))
      .filter(Boolean)
      .map((colaboradora) => ({
        colaboradora,
        evaluacion: evaluarCoincidencia(perfil, colaboradora.habilidades ?? []),
      }))
      .filter(({ evaluacion }) => evaluacion.tieneCoincidencia)
      .map(({ colaboradora, evaluacion }) => dtoCandidata(colaboradora, evaluacion))
      .sort(ordenarCandidatas);

    if (!paginar) return resultados;
    return {
      colaboradoras: resultados,
      total: visibles.length,
      pag,
      totalPags: Math.ceil(visibles.length / limite),
    };
  }

  // Evalúa una colaboradora contra un perfil. Devuelve lo que se guarda, o null si no coincide.
  evaluarCandidata(perfil, colaboradora) {
    const evaluacion = evaluarCoincidencia(perfil, colaboradora.habilidades ?? []);
    if (!evaluacion.tieneCoincidencia) return null;
    return {
      idColaborador: String(colaboradora._id),
      requeridasCoincidentes: evaluacion.requeridasCoincidentes,
      opcionalesCoincidentes: evaluacion.opcionalesCoincidentes,
      puntaje: puntajeDeCoincidencia(evaluacion),
    };
  }

  async calcularCandidatas(perfil) {
    const documentos =
      await this.colaboradorRepository.encontrarPorHabilidadesRequeridas(
        perfil.habilidadesRequeridas,
      );
    const evaluadas = documentos
      .map((colaboradora) => this.evaluarCandidata(perfil, colaboradora))
      .filter(Boolean)
      .sort(ordenarCandidatas);
    return { evaluadas, documentos };
  }

  async guardarCandidatas(perfil) {
    const { evaluadas } = await this.calcularCandidatas(perfil);
    return this.candidatasRepository.guardar(
      idDe(perfil),
      perfil.idProyecto,
      evaluadas,
    );
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

    if (this.matchingCacheRepository) {
      let cache =
        await this.matchingCacheRepository.buscarPorColaborador(idColaborador);
      if (!cache) {
        const proyectos = await this.calcularProyectosParaColaboradora(
          colaboradora,
          [],
        );
        cache = await this.matchingCacheRepository.guardar(
          idColaborador,
          proyectos,
        );
      }

      const yaAnotadas =
        await this.colaboracionRepository.obtenerIdsProyectosDeColaborador(
          idColaborador,
        );
      const abiertos =
        await this.proyectoRepository.obtenerAbiertosParaMatching(yaAnotadas);
      const proyectosAbiertos = new Map(
        abiertos.map((proyecto) => [String(proyecto._id), proyecto]),
      );
      const proyectosActuales = cache.proyectos
        .filter((proyecto) => proyectosAbiertos.has(String(proyecto.id)))
        .map((proyecto) => {
          const actual = proyectosAbiertos.get(String(proyecto.id));
          return {
            ...proyecto,
            titulo: actual.titulo,
            descripcion: actual.descripcion,
          };
        });
      return this.paginarProyectos(proyectosActuales, pag, limite);
    }

    const yaAnotadas =
      await this.colaboracionRepository.obtenerIdsProyectosDeColaborador(
        idColaborador,
      );
    const resultados = await this.calcularProyectosParaColaboradora(
      colaboradora,
      yaAnotadas,
    );
    return this.paginarProyectos(resultados, pag, limite);
  }

  // ---------- Cambios y procesamiento en lote ----------

  // Se llama al crear, editar o borrar un perfil. No recalcula nada en el momento:
  //  - descarta las candidatas guardadas de ese perfil (el próximo pedido las calcula solo para él);
  //  - anota el cambio para que la tarea programada actualice las recomendaciones de las colaboradoras.
  async registrarCambioPerfil(idPerfil, idProyecto) {
    if (this.candidatasRepository) {
      await this.candidatasRepository.eliminarPorPerfil(idPerfil);
    }
    if (this.cambiosRepository) {
      await this.cambiosRepository.registrar({ tipo: "PERFIL", idEntidad: idPerfil, idProyecto });
    } else {
      await this.recalcularTodas(); // sin cola: comportamiento anterior
    }
  }

  // Se llama cuando una colaboradora se registra o cambia sus habilidades: sus propias
  // recomendaciones se calculan ya (es una sola persona) y el cambio se anota para que la tarea
  // programada la agregue o la quite de las candidatas de cada perfil.
  async registrarCambioColaboradora(idColaborador) {
    await this.recalcularColaboradora(idColaborador);
    if (this.cambiosRepository) {
      await this.cambiosRepository.registrar({ tipo: "COLABORADORA", idEntidad: idColaborador });
    }
  }

  // Lo ejecuta la tarea programada. Si no hay cambios, es una sola consulta y termina.
  // Procesa cuando se juntan MATCHING_UMBRAL_CAMBIOS cambios o el más viejo lleva
  // MATCHING_ESPERA_MAXIMA_MIN minutos esperando, y recalcula solo lo afectado.
  async procesarCambiosPendientes({ ahora = new Date(), forzar = false } = {}) {
    if (!this.cambiosRepository) return { procesado: false, pendientes: 0 };
    const pendientes = await this.cambiosRepository.obtenerPendientes();
    if (pendientes.length === 0) return { procesado: false, pendientes: 0 };

    const umbral = Number(this.config.MATCHING_UMBRAL_CAMBIOS) || UMBRAL_CAMBIOS;
    const esperaMs = (Number(this.config.MATCHING_ESPERA_MAXIMA_MIN) || ESPERA_MAXIMA_MIN) * 60_000;
    const masViejo = Math.min(...pendientes.map((cambio) => new Date(cambio.registradoEn).getTime()));
    const listo = pendientes.length >= umbral || ahora.getTime() - masViejo >= esperaMs;
    if (!forzar && !listo) return { procesado: false, pendientes: pendientes.length };

    const perfiles = pendientes.filter((cambio) => cambio.tipo === "PERFIL");
    const colaboradoras = pendientes.filter((cambio) => cambio.tipo === "COLABORADORA");

    if (perfiles.length > 0) {
      await this.actualizarProyectosEnRecomendaciones(
        new Set(perfiles.map((cambio) => String(cambio.idProyecto))),
      );
    }
    if (colaboradoras.length > 0) {
      await this.actualizarColaboradorasEnCandidatas(
        colaboradoras.map((cambio) => String(cambio.idEntidad)),
      );
    }

    await this.cambiosRepository.eliminarProcesados(
      pendientes.map((cambio) => cambio._id),
      ahora,
    );
    return {
      procesado: true,
      pendientes: pendientes.length,
      perfiles: perfiles.length,
      colaboradoras: colaboradoras.length,
    };
  }

  // Vuelve a evaluar SOLO los proyectos cambiados contra cada colaboradora y los reemplaza en sus
  // recomendaciones guardadas; el resto de sus recomendaciones no se toca.
  async actualizarProyectosEnRecomendaciones(idsProyectos) {
    if (!this.matchingCacheRepository) return;
    const abiertos = await this.proyectoRepository.obtenerAbiertosPorIds([...idsProyectos]);
    const perfiles = abiertos.length
      ? await this.perfilRepository.obtenerPorProyectos(abiertos.map((proyecto) => proyecto._id))
      : [];
    const datosPrecargados = { abiertos, perfiles };

    const caches = await this.matchingCacheRepository.obtenerTodos();
    if (caches.length === 0) return;
    const colaboradoras = await this.colaboradorRepository.obtenerPublicosPorIds(
      caches.map((cache) => cache.idColaborador),
    );
    const colaboradorasPorId = new Map(
      colaboradoras.map((colaboradora) => [idDe(colaboradora), colaboradora]),
    );

    for (const cache of caches) {
      const colaboradora = colaboradorasPorId.get(String(cache.idColaborador));
      const sinCambiados = cache.proyectos.filter(
        (proyecto) => !idsProyectos.has(String(proyecto.id)),
      );
      const nuevos = colaboradora
        ? await this.calcularProyectosParaColaboradora(colaboradora, [], datosPrecargados)
        : [];
      await this.matchingCacheRepository.guardar(
        String(cache.idColaborador),
        [...sinCambiados, ...nuevos].sort(ordenarProyectos),
      );
    }
  }

  // Agrega, actualiza o quita a las colaboradoras cambiadas en las candidatas guardadas de cada perfil.
  async actualizarColaboradorasEnCandidatas(idsColaboradoras) {
    if (!this.candidatasRepository) return;
    const caches = await this.candidatasRepository.obtenerTodos();
    if (caches.length === 0) return;

    const cambiadas = await this.colaboradorRepository.obtenerPublicosPorIds(idsColaboradoras);
    const ids = new Set(idsColaboradoras.map(String));
    const perfiles = await this.perfilRepository.obtenerPorProyectos([
      ...new Set(caches.map((cache) => String(cache.idProyecto))),
    ]);
    const perfilesPorId = new Map(perfiles.map((perfil) => [idDe(perfil), perfil]));

    for (const cache of caches) {
      const perfil = perfilesPorId.get(String(cache.idPerfil));
      if (!perfil) {
        await this.candidatasRepository.eliminarPorPerfil(cache.idPerfil); // el perfil ya no existe
        continue;
      }
      const sinCambiadas = cache.candidatas.filter(
        (candidata) => !ids.has(String(candidata.idColaborador)),
      );
      const nuevas = cambiadas
        .map((colaboradora) => this.evaluarCandidata(perfil, colaboradora))
        .filter(Boolean);
      await this.candidatasRepository.guardar(
        cache.idPerfil,
        cache.idProyecto,
        [...sinCambiadas, ...nuevas].sort(ordenarCandidatas),
      );
    }
  }

  // Reconstrucción completa (tarea semanal de seguridad): recalcula todas las recomendaciones,
  // descarta las candidatas guardadas (se recalculan al pedirlas) y vacía la cola.
  async reconstruirTodo(ahora = new Date()) {
    await this.recalcularTodas();
    if (this.candidatasRepository) await this.candidatasRepository.eliminarTodos();
    if (this.cambiosRepository) {
      const pendientes = await this.cambiosRepository.obtenerPendientes();
      await this.cambiosRepository.eliminarProcesados(
        pendientes.map((cambio) => cambio._id),
        ahora,
      );
    }
  }

  async recalcularColaboradora(idColaborador) {
    if (!this.matchingCacheRepository) return;
    const colaboradora =
      await this.colaboradorRepository.buscarPorId(idColaborador);
    if (!colaboradora) {
      throw new NotFoundError(
        "La colaboradora no existe",
        "COLABORADORA_NO_ENCONTRADA",
      );
    }
    const proyectos = await this.calcularProyectosParaColaboradora(
      colaboradora,
      [],
    );
    await this.matchingCacheRepository.guardar(idColaborador, proyectos);
  }

  async recalcularTodas() {
    if (!this.matchingCacheRepository) return;
    const colaboradoras = await this.colaboradorRepository.obtenerTodos();
    const abiertos =
      await this.proyectoRepository.obtenerAbiertosParaMatching([]);
    const perfiles = abiertos.length
      ? await this.perfilRepository.obtenerPorProyectos(
          abiertos.map((proyecto) => proyecto._id),
        )
      : [];
    const datosPrecargados = { abiertos, perfiles };

    for (const colaboradora of colaboradoras) {
      const proyectos = await this.calcularProyectosParaColaboradora(
        colaboradora,
        [],
        datosPrecargados,
      );
      await this.matchingCacheRepository.guardar(
        idDe(colaboradora),
        proyectos,
      );
    }
  }

  async calcularProyectosParaColaboradora(
    colaboradora,
    idsExcluidos,
    datosPrecargados = null,
  ) {
    if (colaboradora.habilidades.length === 0) return [];
    const abiertos =
      datosPrecargados?.abiertos ??
      (await this.proyectoRepository.obtenerAbiertosParaMatching(idsExcluidos));
    if (abiertos.length === 0) return [];

    const perfiles =
      datosPrecargados?.perfiles ??
      (await this.perfilRepository.obtenerPorProyectos(
        abiertos.map((p) => p._id),
      ));
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

    return resultados.sort(ordenarProyectos);
  }

  paginarProyectos(proyectos, pag, limite) {
    if (pag === undefined || limite === undefined) return proyectos;
    const inicio = (pag - 1) * limite;
    const pagina = proyectos.slice(inicio, inicio + limite);
    return {
      proyectos: pagina,
      total: proyectos.length,
      pag,
      totalPags: Math.ceil(proyectos.length / limite),
    };
  }
}
