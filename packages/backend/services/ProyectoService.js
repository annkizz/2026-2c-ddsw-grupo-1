import { Estado } from "../domain/Estado.js";
import { Proyecto } from "../domain/Proyecto.js";
import { ProyectoRepository } from "../repositories/ProyectoRepository.js";
import { HabilidadRepository } from "../repositories/HabilidadRepository.js";
import { normalizarEtiquetas } from "../domain/etiquetas.js";
import {
  construirUbicacionDeProyecto,
  normalizarProvincia,
  PAIS_ARGENTINA,
  ubicacionHeredadaDeColectivo,
} from "../domain/provincias.js";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../errors/AppError.js";
import { ColaboradorService } from "./ColaboradorService.js";
import { ColectivoRepository } from "../repositories/ColectivoRepository.js";
import { PerfilRepository } from "../repositories/PerfilRepository.js";
import { ColaboracionRepository } from "../repositories/ColaboracionRepository.js";
import { EventoWebhook } from "../domain/EventoWebhook.js";
import { despachadorNulo } from "./webhooks/DespachadorWebhooks.js";

const NIVELES_MAPA = new Set(["provincia", "pais"]);
const ESTADOS_VALIDOS = new Set(Object.values(Estado));

export class ProyectoService {
  constructor(
    proyectoRepository = new ProyectoRepository(),
    habilidadRepository = new HabilidadRepository(),
    colaboradorService = new ColaboradorService(),
    colectivoRepository = new ColectivoRepository(),
    colaboracionRepository = new ColaboracionRepository(),
    perfilRepository = new PerfilRepository(),
    despachadorWebhooks = despachadorNulo,
  ) {
    this.proyectoRepository = proyectoRepository;
    this.habilidadRepository = habilidadRepository;
    this.colaboradorService = colaboradorService;
    this.colectivoRepository = colectivoRepository;
    this.colaboracionRepository = colaboracionRepository;
    this.perfilRepository = perfilRepository;
    this.despachadorWebhooks = despachadorWebhooks;
  }

  crear = async (datosProyecto, usuario) => {
    const colectivo = await this.colectivoRepository.buscarPorId(
      datosProyecto.idColectivo,
    );

    if (!colectivo) {
      throw new NotFoundError(
        "el colectivo no existe",
        "COLECTIVO_NO_ENCONTRADO",
      );
    }

    //  VALIDACIÓN DE PROPIEDAD AL CREAR
    const colectivoUsuario = await this.colectivoRepository.buscarPorUsuario(usuario._id ?? usuario.id);
    if (!colectivoUsuario || String(colectivoUsuario._id ?? colectivoUsuario.id) !== String(colectivo._id)) {
      throw new ForbiddenError("No podés crear proyectos para otro colectivo", "ACCESO_DENEGADO");
    }

    const fechaLimiteCierre = datosProyecto.fechaLimiteCierre ?? null;
    if (fechaLimiteCierre !== null) {
      this.validarFechaLimite(fechaLimiteCierre);
    }

    let ubicacion;
    if (datosProyecto.ubicacion === undefined) {
      ubicacion = ubicacionHeredadaDeColectivo(colectivo);
    } else {
      ubicacion = construirUbicacionDeProyecto(datosProyecto.ubicacion);
      if (ubicacion === null) {
        throw new BadRequestError(
          "la provincia ingresada no es válida",
          "PROVINCIA_INVALIDA",
        );
      }
    }

    const busquedaAbierta = datosProyecto.busquedaAbierta ?? false;
    const fechaLimiteBusqueda = datosProyecto.fechaLimiteBusqueda ?? null;
    this.validarBusqueda(busquedaAbierta, fechaLimiteBusqueda);

    const proyecto = new Proyecto(
      datosProyecto.titulo,
      datosProyecto.descripcion,
      [], // perfiles
      Estado.ACTIVO,
      new Date(),
      fechaLimiteCierre,
      colectivo._id,
      0,
      null,
      null,
      busquedaAbierta,
      fechaLimiteBusqueda,
      normalizarEtiquetas(datosProyecto.etiquetas),
      ubicacion,
    );

    const proyectoGuardado = await this.proyectoRepository.save(proyecto);
    await this.colectivoRepository.agregarProyecto(
      colectivo._id,
      proyectoGuardado._id,
    );
    return this.toDTO(proyectoGuardado);
  };

  toDTO(proyecto) {
    return {
      id: String(proyecto._id),
      titulo: proyecto.titulo,
      descripcion: proyecto.descripcion,
      estado: proyecto.estado,
      fechaInicio: proyecto.fechaInicio,
      fechaLimiteCierre: proyecto.fechaLimiteCierre,
      idColectivo: String(proyecto.idColectivo),
      perfiles: (proyecto.perfiles ?? []).map((perfil) => String(perfil)),
      porcentajeConcrecion: proyecto.porcentajeConcrecion,
      enlaceSistema: proyecto.enlaceSistema,
      enlaceCodigoFuente: proyecto.enlaceCodigoFuente,
      busquedaAbierta: proyecto.busquedaAbierta ?? false,
      fechaLimiteBusqueda: proyecto.fechaLimiteBusqueda ?? null,
      busquedaVigente: proyecto.busquedaVigente(),
      etiquetas: proyecto.etiquetas ?? [],
      ubicacion: proyecto.ubicacion ?? null,
      destacado: proyecto.destacado ?? false,
      destacadoHasta: proyecto.destacadoHasta ?? null,
    };
  }

  async obtenerDestacados(ahora = new Date()) {
    const proyectos = await this.proyectoRepository.obtenerDestacados(ahora);
    return proyectos.map((proyecto) => this.toDTO(proyecto));
  }

  async configurarDestacado(idProyecto, { destacado, destacadoHasta }) {
    const proyecto = await this.buscarProyectoOFallar(idProyecto);

    if (destacado) {
      if (proyecto.estaFinalizado()) {
        throw new ConflictError(
          "No se puede destacar un proyecto finalizado",
          "PROYECTO_FINALIZADO",
        );
      }

      if (
        !(destacadoHasta instanceof Date) ||
        Number.isNaN(destacadoHasta.getTime()) ||
        destacadoHasta <= new Date()
      ) {
        throw new BadRequestError(
          "La fecha de vencimiento del destacado debe ser futura",
          "FECHA_DESTACADO_INVALIDA",
        );
      }
    }

    proyecto.configurarDestacado(destacado, destacado ? destacadoHasta : null);
    return this.toDTO(await this.proyectoRepository.save(proyecto));
  }

  validarFechaLimite(fechaLimiteCierre, ahora = new Date()) {
    if (fechaLimiteCierre <= ahora) {
      throw new BadRequestError(
        "La fecha límite de cierre debe ser futura",
        "FECHA_LIMITE_INVALIDA",
      );
    }
  }

  async programarCierre(idProyecto, fechaLimite) {
    const proyecto = await this.buscarProyectoOFallar(idProyecto);

    if (proyecto.estaFinalizado()) {
      throw new ConflictError(
        "No se puede programar el cierre de un proyecto finalizado",
        "PROYECTO_FINALIZADO",
      );
    }

    this.validarFechaLimite(fechaLimite);
    proyecto.programarCierre(fechaLimite);
    const guardado = await this.proyectoRepository.save(proyecto);
    return this.toDTO(guardado);
  }

  async cerrarSiVencido(proyecto, ahora = new Date()) {
    if (!proyecto.cierreVencido(ahora)) {
      return false;
    }
    await this.finalizar(proyecto, "AUTOMATICO");
    return true;
  }

  async buscarProyectoOFallar(idProyecto) {
    const proyecto = await this.obtenerProyectoPorId(idProyecto);

    if (!proyecto) {
      throw new NotFoundError(
        "Proyecto no encontrado",
        "PROYECTO_NO_ENCONTRADO",
      );
    }
    return proyecto;
  }

  async finalizar(proyecto, motivo = "MANUAL") {
    const yaEstabaFinalizado = proyecto.estaFinalizado();
    proyecto.cerrar();
    const guardado = await this.proyectoRepository.save(proyecto);
    if (!yaEstabaFinalizado) {
      this.despachadorWebhooks.emitir(
        EventoWebhook.PROYECTO_CERRADO,
        proyecto.idColectivo,
        {
          idProyecto: String(proyecto._id),
          titulo: proyecto.titulo,
          motivo,
          fecha: new Date().toISOString(),
        },
      );
    }
    return guardado;
  }

  async cerrarProyectosVencidos(ahora = new Date()) {
    const vencidos = await this.proyectoRepository.obtenerVencidos(ahora);
    const cerrados = [];
    const fallidos = [];

    for (const proyecto of vencidos) {
      try {
        await this.finalizar(proyecto, "AUTOMATICO");
        cerrados.push(String(proyecto._id));
      } catch (error) {
        fallidos.push({
          idProyecto: String(proyecto._id),
          error: error.message,
        });
      }
    }

    return { cerrados, fallidos };
  }

  async obtenerTodos(filtros = {}) {
    if (filtros.modo !== undefined) {
      const modo = String(filtros.modo).trim().toLowerCase();
      if (modo !== "cualquiera") {
        throw new BadRequestError(
          "el modo de búsqueda no es válido",
          "MODO_BUSQUEDA_INVALIDO",
        );
      }
      return this.buscarPorAlMenosUno(filtros);
    }

    const filtrosNormalizados = { ...filtros };
    delete filtrosNormalizados.modo;
    delete filtrosNormalizados.provincias;
    delete filtrosNormalizados.idColectivos;
    if (filtrosNormalizados.etiquetas !== undefined) {
      filtrosNormalizados.etiquetas = normalizarEtiquetas(
        filtrosNormalizados.etiquetas,
      );
    }
    if (filtrosNormalizados.provincia !== undefined) {
      const provincia = normalizarProvincia(filtrosNormalizados.provincia);
      if (provincia === null) {
        throw new BadRequestError(
          "la provincia ingresada no es válida",
          "PROVINCIA_INVALIDA",
        );
      }
      filtrosNormalizados.provincia = provincia.codigoProvincia;
    }
    if (filtrosNormalizados.estado !== undefined) {
      filtrosNormalizados.estado = this.normalizarEstadoDeBusqueda(
        filtrosNormalizados.estado,
      );
    }
    if (filtrosNormalizados.idColectivo !== undefined) {
      filtrosNormalizados.idColectivo = this.normalizarIdColectivoDeBusqueda(
        filtrosNormalizados.idColectivo,
      );
    }
    if (filtrosNormalizados.habilidades !== undefined) {
  
      const habilidades = (
        Array.isArray(filtrosNormalizados.habilidades)
          ? filtrosNormalizados.habilidades
          : [filtrosNormalizados.habilidades]
      )
        .map((habilidad) => String(habilidad).trim())
        .filter((habilidad) => habilidad !== "");

      delete filtrosNormalizados.habilidades;
      if (habilidades.length > 0) {
        const idsProyectos =
          await this.perfilRepository.obtenerProyectosPorHabilidades(
            habilidades,
          );
        if (idsProyectos.length === 0) return [];
        filtrosNormalizados.idsProyectos = idsProyectos;
      }
    }

    const proyectos = await this.proyectoRepository.obtenerTodos(
      filtrosNormalizados,
    );
    return proyectos.map((proyecto) => this.toDTO(proyecto));
  }

  async buscarPorAlMenosUno(filtros = {}) {
    const estado = this.normalizarEstadoDeBusqueda(filtros.estado);
    const provincias = this.normalizarProvinciasDeBusqueda(
      filtros.provincias ?? filtros.provincia,
    );
    const idColectivos = this.normalizarColectivosDeBusqueda(
      filtros.idColectivos ?? filtros.idColectivo,
    );
    const etiquetas = normalizarEtiquetas(
      this.comoLista(filtros.etiquetas).filter(
        (etiqueta) => String(etiqueta).trim() !== "",
      ),
    );
    const habilidades = this.comoLista(filtros.habilidades)
      .map((habilidad) => String(habilidad).trim())
      .filter((habilidad) => habilidad !== "");

    // null = no se pidio habilidad; [] = se pidio y no la tiene ningun perfil
    let idsProyectos = null;
    if (habilidades.length > 0) {
      idsProyectos = (
        await this.perfilRepository.obtenerProyectosPorHabilidades(habilidades)
      ).map((id) => String(id));
    }

    const proyectos = await this.proyectoRepository.buscarPorAlMenosUno({
      estado,
      etiquetas,
      provincias,
      idColectivos,
      idsProyectos,
      hayFiltrosDeBusqueda:
        etiquetas.length > 0 ||
        provincias.length > 0 ||
        idColectivos.length > 0 ||
        habilidades.length > 0,
    });

    const habilidadesPorProyecto =
      await this.habilidadesCoincidentesPorProyecto(proyectos, habilidades);
    const nombresDeColectivo = await this.nombresDeColectivoPorId(idColectivos);

    return proyectos.map((proyecto) =>
      this.toDTOConCoincidencias(proyecto, {
        habilidades: habilidadesPorProyecto.get(String(proyecto._id)) ?? [],
        etiquetas,
        provincias,
        idColectivos,
        nombresDeColectivo,
      }),
    );
  }

  // que habilidades pedidas tiene cada proyecto (a traves de sus perfiles)
  async habilidadesCoincidentesPorProyecto(proyectos, habilidades) {
    const coincidencias = new Map();
    if (habilidades.length === 0 || proyectos.length === 0) {
      return coincidencias;
    }

    const perfiles = await this.perfilRepository.obtenerPorProyectos(
      proyectos.map((proyecto) => proyecto._id),
    );

    for (const perfil of perfiles) {
      const delPerfil = new Set([
        ...(perfil.habilidadesRequeridas ?? []),
        ...(perfil.habilidadesOpcionales ?? []),
      ]);
      const coincidentes = habilidades.filter((habilidad) =>
        delPerfil.has(habilidad),
      );
      if (coincidentes.length === 0) continue;

      const clave = String(perfil.idProyecto);
      const acumuladas = coincidencias.get(clave) ?? [];
      for (const habilidad of coincidentes) {
        if (!acumuladas.includes(habilidad)) acumuladas.push(habilidad);
      }
      coincidencias.set(clave, acumuladas);
    }

    return coincidencias;
  }

  async nombresDeColectivoPorId(idColectivos) {
    const nombres = new Map();
    if (idColectivos.length === 0) return nombres;

    const colectivos = await this.colectivoRepository.obtenerPorIds(
      idColectivos,
    );
    for (const colectivo of colectivos) {
      nombres.set(String(colectivo._id), colectivo.nombre);
    }
    return nombres;
  }

  toDTOConCoincidencias(
    proyecto,
    { habilidades, etiquetas, provincias, idColectivos, nombresDeColectivo },
  ) {
    const coincidencias = habilidades.map((habilidad) => ({
      tipo: "HABILIDAD",
      valor: habilidad,
    }));

    const etiquetasDelProyecto = proyecto.etiquetas ?? [];
    for (const etiqueta of etiquetas) {
      if (etiquetasDelProyecto.includes(etiqueta)) {
        coincidencias.push({ tipo: "ETIQUETA", valor: etiqueta });
      }
    }

    const ubicacion = proyecto.ubicacion;
    if (ubicacion && provincias.includes(ubicacion.codigoProvincia)) {
      coincidencias.push({
        tipo: "PROVINCIA",
        valor: ubicacion.nombreProvincia ?? ubicacion.codigoProvincia,
      });
    }

    const idColectivo = String(proyecto.idColectivo);
    if (idColectivos.includes(idColectivo)) {
      coincidencias.push({
        tipo: "COLECTIVO",
        valor: nombresDeColectivo.get(idColectivo) ?? idColectivo,
      });
    }

    return { ...this.toDTO(proyecto), coincidencias };
  }

  comoLista(valor) {
    if (valor === undefined || valor === null) return [];
    return Array.isArray(valor) ? valor : [valor];
  }

  normalizarEstadoDeBusqueda(estado) {
    if (estado === undefined) return undefined;

    const valor = String(estado).trim().toUpperCase();
    if (!ESTADOS_VALIDOS.has(valor)) {
      throw new BadRequestError(
        "el estado ingresado no es válido",
        "ESTADO_INVALIDO",
      );
    }
    return valor;
  }

  normalizarProvinciasDeBusqueda(valores) {
    const codigos = [];
    for (const valor of this.comoLista(valores)) {
      if (String(valor).trim() === "") continue;

      const provincia = normalizarProvincia(String(valor));
      if (provincia === null) {
        throw new BadRequestError(
          "la provincia ingresada no es válida",
          "PROVINCIA_INVALIDA",
        );
      }
      if (!codigos.includes(provincia.codigoProvincia)) {
        codigos.push(provincia.codigoProvincia);
      }
    }
    return codigos;
  }

  normalizarColectivosDeBusqueda(valores) {
    const ids = [];
    for (const valor of this.comoLista(valores)) {
      const id = String(valor).trim();
      if (id === "") continue;

      const idNormalizado = this.normalizarIdColectivoDeBusqueda(id);
      if (!ids.includes(idNormalizado)) ids.push(idNormalizado);
    }
    return ids;
  }

  normalizarIdColectivoDeBusqueda(valor) {
    const id = String(valor).trim();
    if (!this.colectivoRepository.esIdValido(id)) {
      throw new BadRequestError(
        "el colectivo ingresado no es válido",
        "COLECTIVO_INVALIDO",
      );
    }
    return id.toLowerCase();
  }

  async obtenerUbicaciones(nivel = "provincia") {
    if (!NIVELES_MAPA.has(nivel)) {
      throw new BadRequestError(
        "el nivel del mapa no es válido",
        "NIVEL_MAPA_INVALIDO",
      );
    }

    const proyectos = await this.proyectoRepository.obtenerActivosParaMapa();
    const grupos = new Map();

    for (const proyecto of proyectos) {
      const region = this.regionDeUbicacion(proyecto.ubicacion, nivel);
      if (region === null) {
        continue;
      }

      let grupo = grupos.get(region.codigo);
      if (grupo === undefined) {
        grupo = {
          nivel,
          codigo: region.codigo,
          nombre: region.nombre,
          cantidad: 0,
          proyectos: [],
        };
        grupos.set(region.codigo, grupo);
      }

      const colectivo = proyecto.idColectivo;
      grupo.cantidad += 1;
      grupo.proyectos.push({
        id: String(proyecto._id),
        titulo: proyecto.titulo,
        ciudad: proyecto.ubicacion.ciudad ?? null,
        colectivo: {
          id: colectivo ? String(colectivo._id ?? colectivo) : null,
          nombre: colectivo?.nombre ?? null,
        },
      });
    }

    const resultado = [...grupos.values()];
    resultado.sort((a, b) => {
      if (b.cantidad !== a.cantidad) {
        return b.cantidad - a.cantidad;
      }
      return a.nombre.localeCompare(b.nombre);
    });

    return resultado;
  }

  regionDeUbicacion(ubicacion, nivel) {
    if (!ubicacion) {
      return null;
    }

    if (nivel === "pais") {
      const codigo =
        ubicacion.codigoPais ??
        (ubicacion.codigoProvincia ? PAIS_ARGENTINA.codigoPais : null);
      if (!codigo) {
        return null;
      }
      return {
        codigo,
        nombre: ubicacion.nombrePais ?? PAIS_ARGENTINA.nombrePais,
      };
    }

    if (!ubicacion.codigoProvincia) {
      return null;
    }

    return {
      codigo: ubicacion.codigoProvincia,
      nombre: ubicacion.nombreProvincia ?? ubicacion.codigoProvincia,
    };
  }

  obtenerProyectoPorId(id) {
    return this.proyectoRepository.buscarPorId(id);
  }

  toContribucionPublica({
    idProyecto,
    idPerfil,
    idColaborador,
    fecha,
    esAnonima = false,
  }) {
    const contribucion = {
      idProyecto: String(idProyecto),
      idPerfil: idPerfil ? String(idPerfil) : null,
      fecha,
      esAnonima,
    };

    if (!esAnonima && idColaborador) {
      contribucion.colaborador = {
        id: String(idColaborador._id),
        nombreFantasia: idColaborador.nombreFantasia,
        usuarioGitHub: idColaborador.usuarioGitHub,
        nombre: idColaborador.nombre,
        apellido: idColaborador.apellido,
      };
    }

    return contribucion;
  }

  obtenerColaboracionesPublicas = async (idProyecto) => {
    await this.buscarProyectoOFallar(idProyecto);
    const colaboraciones =
      await this.colaboracionRepository.obtenerPorProyecto(idProyecto);
    return colaboraciones.map((colaboracion) =>
      this.toContribucionPublica(colaboracion),
    );
  };

  async cerrarProyecto(idProyecto, usuario) {
    const proyecto = await this.validarPropietario(idProyecto, usuario, this.colectivoRepository);
    return this.toDTO(await this.finalizar(proyecto));
  }

  async actualizarAvance(idProyecto, datosAvance, usuario) {
    const proyecto = await this.validarPropietario(idProyecto, usuario, this.colectivoRepository);

    if (Object.keys(datosAvance).length === 0) {
      throw new BadRequestError(
        "indicá al menos un dato de avance",
        "AVANCE_VACIO",
      );
    }

    proyecto.actualizarAvance(datosAvance);
    const guardado = await this.proyectoRepository.save(proyecto);
    return this.toAvanceDTO(guardado);
  }

  toAvanceDTO(proyecto) {
    return {
      id: String(proyecto._id),
      porcentajeConcrecion: proyecto.porcentajeConcrecion,
      enlaceSistema: proyecto.enlaceSistema,
      enlaceCodigoFuente: proyecto.enlaceCodigoFuente,
    };
  }

  validarBusqueda(busquedaAbierta, fechaLimiteBusqueda, ahora = new Date()) {
    if (fechaLimiteBusqueda === null) return;
    if (!busquedaAbierta) {
      throw new BadRequestError(
        "No se puede indicar una fecha límite si la búsqueda no está abierta",
        "BUSQUEDA_CERRADA_CON_FECHA",
      );
    }
    if (fechaLimiteBusqueda <= ahora) {
      throw new BadRequestError(
        "La fecha límite de la búsqueda debe ser futura",
        "FECHA_LIMITE_BUSQUEDA_INVALIDA",
      );
    }
  }

  async obtenerPorId(idProyecto) {
    const proyecto = await this.buscarProyectoOFallar(idProyecto);
    return this.toDTO(proyecto);
  }

  async actualizar(idProyecto, datos, usuario) {
    const proyecto = await this.validarPropietario(idProyecto, usuario, this.colectivoRepository);
    const datosNormalizados = { ...datos };
    if (datosNormalizados.etiquetas !== undefined) {
      datosNormalizados.etiquetas = normalizarEtiquetas(
        datosNormalizados.etiquetas,
      );
    }
    proyecto.editarDatos(datosNormalizados);
    return this.toDTO(await this.proyectoRepository.save(proyecto));
  }

  async validarPropietario(idProyecto, usuario, colectivoRepository) {
    const proyecto = await this.proyectoRepository.buscarPorId(idProyecto);
    if (!proyecto) {
      throw new NotFoundError("Proyecto no encontrado", "PROYECTO_NO_ENCONTRADO");
    }

    const colectivoUsuario = await colectivoRepository.buscarPorUsuario(usuario._id ?? usuario.id);
    if (!colectivoUsuario) {
      throw new ForbiddenError("El usuario no tiene un colectivo asociado", "COLECTIVO_NO_ENCONTRADO");
    }

    if (String(colectivoUsuario._id ?? colectivoUsuario.id) !== String(proyecto.idColectivo)) {
      throw new ForbiddenError("No tenés permisos sobre este proyecto", "ACCESO_DENEGADO");
    }

    return proyecto;
  }

  async configurarBusqueda(idProyecto, { busquedaAbierta, fechaLimiteBusqueda }, usuario) {
    const proyecto = await this.validarPropietario(idProyecto, usuario, this.colectivoRepository);

    if (proyecto.estaFinalizado()) {
      throw new ConflictError(
        "No se puede configurar la búsqueda de un proyecto finalizado",
        "PROYECTO_FINALIZADO",
      );
    }

    const fechaLimite = fechaLimiteBusqueda ?? null;
    this.validarBusqueda(busquedaAbierta, fechaLimite);
    proyecto.configurarBusqueda(busquedaAbierta, fechaLimite);
    return this.toDTO(await this.proyectoRepository.save(proyecto));
  }
}
