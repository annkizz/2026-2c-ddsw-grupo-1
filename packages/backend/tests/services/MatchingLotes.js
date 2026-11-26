import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { MatchingService } from "../../services/MatchingService.js";

// Matching guardado + cola de cambios procesada en lote por la tarea programada.

const AHORA = new Date("2026-11-26T12:00:00Z");
const minutosAntes = (minutos) => new Date(AHORA.getTime() - minutos * 60_000);

const perfil = (id, idProyecto, requeridas, opcionales = []) => ({
  _id: id,
  idProyecto,
  descripcion: `Perfil ${id}`,
  compromiso: { tipoCompromiso: "MENSUALES", horas: 4 },
  habilidadesRequeridas: requeridas,
  habilidadesOpcionales: opcionales,
});

const colaboradora = (id, habilidades, extra = {}) => ({
  _id: id,
  nombreFantasia: `Persona ${id}`,
  habilidades,
  aceptaMensajeria: true,
  ...extra,
});

describe("MatchingService: resultados guardados y cambios en lote", () => {
  let repos;
  let service;

  const crear = (config = {}) =>
    new MatchingService(
      repos.colaboradores,
      repos.proyectos,
      repos.perfiles,
      repos.colaboraciones,
      repos.recomendaciones,
      repos.candidatas,
      repos.cambios,
      config,
    );

  beforeEach(() => {
    repos = {
      colaboradores: {
        buscarPorId: jest.fn(),
        obtenerTodos: jest.fn(async () => []),
        obtenerPublicosPorIds: jest.fn(async () => []),
        encontrarPorHabilidadesRequeridas: jest.fn(async () => []),
      },
      proyectos: {
        buscarPorId: jest.fn(async () => ({
          _id: "p1",
          estaFinalizado: () => false,
        })),
        obtenerAbiertosPorIds: jest.fn(async () => []),
        obtenerAbiertosParaMatching: jest.fn(async () => []),
      },
      perfiles: {
        buscarPorId: jest.fn(),
        obtenerPorProyectos: jest.fn(async () => []),
      },
      colaboraciones: {
        obtenerIdsColaboradoresDeProyecto: jest.fn(async () => []),
        obtenerIdsProyectosDeColaborador: jest.fn(async () => []),
      },
      recomendaciones: {
        buscarPorColaborador: jest.fn(),
        obtenerTodos: jest.fn(async () => []),
        guardar: jest.fn(async (id, proyectos) => ({
          idColaborador: id,
          proyectos,
        })),
      },
      candidatas: {
        buscarPorPerfil: jest.fn(async () => null),
        obtenerTodos: jest.fn(async () => []),
        guardar: jest.fn(async (idPerfil, idProyecto, candidatas) => ({
          idPerfil,
          idProyecto,
          candidatas,
        })),
        eliminarPorPerfil: jest.fn(async () => {}),
        eliminarTodos: jest.fn(async () => {}),
      },
      cambios: {
        registrar: jest.fn(async () => {}),
        obtenerPendientes: jest.fn(async () => []),
        eliminarProcesados: jest.fn(async () => {}),
      },
    };
    service = crear();
  });

  describe("al cambiar un perfil", () => {
    it("no recalcula nada en el momento: descarta sus candidatas y lo anota en la cola", async () => {
      await service.registrarCambioPerfil("perfil-1", "p1");

      expect(repos.candidatas.eliminarPorPerfil).toHaveBeenCalledWith(
        "perfil-1",
      );
      expect(repos.cambios.registrar).toHaveBeenCalledWith({
        tipo: "PERFIL",
        idEntidad: "perfil-1",
        idProyecto: "p1",
      });
      expect(repos.colaboradores.obtenerTodos).not.toHaveBeenCalled();
      expect(repos.recomendaciones.guardar).not.toHaveBeenCalled();
    });
  });

  describe("al registrarse o cambiar habilidades una colaboradora", () => {
    it("calcula ya sus recomendaciones y la anota para actualizar las candidatas de los perfiles", async () => {
      repos.colaboradores.buscarPorId.mockResolvedValue(
        colaboradora("c1", ["React"]),
      );

      await service.registrarCambioColaboradora("c1");

      expect(repos.recomendaciones.guardar).toHaveBeenCalledWith("c1", []);
      expect(repos.cambios.registrar).toHaveBeenCalledWith({
        tipo: "COLABORADORA",
        idEntidad: "c1",
      });
    });
  });

  describe("procesarCambiosPendientes (tarea programada)", () => {
    it("sin cambios es una sola consulta y no hace nada", async () => {
      const resultado = await service.procesarCambiosPendientes({
        ahora: AHORA,
      });

      expect(resultado).toEqual({ procesado: false, pendientes: 0 });
      expect(repos.recomendaciones.obtenerTodos).not.toHaveBeenCalled();
    });

    it("espera a que se junten varios cambios si son recientes", async () => {
      repos.cambios.obtenerPendientes.mockResolvedValue([
        {
          _id: "x1",
          tipo: "PERFIL",
          idEntidad: "perfil-1",
          idProyecto: "p1",
          registradoEn: minutosAntes(2),
        },
      ]);

      const resultado = await service.procesarCambiosPendientes({
        ahora: AHORA,
      });

      expect(resultado).toEqual({ procesado: false, pendientes: 1 });
      expect(repos.cambios.eliminarProcesados).not.toHaveBeenCalled();
    });

    it("procesa cuando se llega al umbral de cambios", async () => {
      service = crear({ MATCHING_UMBRAL_CAMBIOS: "2" });
      repos.cambios.obtenerPendientes.mockResolvedValue([
        {
          _id: "x1",
          tipo: "PERFIL",
          idEntidad: "perfil-1",
          idProyecto: "p1",
          registradoEn: minutosAntes(1),
        },
        {
          _id: "x2",
          tipo: "PERFIL",
          idEntidad: "perfil-2",
          idProyecto: "p2",
          registradoEn: minutosAntes(1),
        },
      ]);

      const resultado = await service.procesarCambiosPendientes({
        ahora: AHORA,
      });

      expect(resultado).toMatchObject({
        procesado: true,
        perfiles: 2,
        colaboradoras: 0,
      });
      expect(repos.cambios.eliminarProcesados).toHaveBeenCalledWith(
        ["x1", "x2"],
        AHORA,
      );
    });

    it("procesa aunque haya un solo cambio si ya esperó el máximo", async () => {
      repos.cambios.obtenerPendientes.mockResolvedValue([
        {
          _id: "x1",
          tipo: "COLABORADORA",
          idEntidad: "c1",
          registradoEn: minutosAntes(31),
        },
      ]);

      const resultado = await service.procesarCambiosPendientes({
        ahora: AHORA,
      });

      expect(resultado).toMatchObject({ procesado: true, colaboradoras: 1 });
    });

    it("recalcula solo los proyectos cambiados y conserva el resto de las recomendaciones", async () => {
      repos.cambios.obtenerPendientes.mockResolvedValue([
        {
          _id: "x1",
          tipo: "PERFIL",
          idEntidad: "perfil-nuevo",
          idProyecto: "p-nuevo",
          registradoEn: minutosAntes(40),
        },
        {
          _id: "x2",
          tipo: "PERFIL",
          idEntidad: "perfil-borrado",
          idProyecto: "p-viejo",
          registradoEn: minutosAntes(40),
        },
      ]);
      // p-viejo ya no tiene perfiles compatibles (se borró el perfil); p-otro no cambió.
      repos.proyectos.obtenerAbiertosPorIds.mockResolvedValue([
        { _id: "p-nuevo", titulo: "Nuevo", descripcion: "" },
        { _id: "p-viejo", titulo: "Viejo", descripcion: "" },
      ]);
      repos.perfiles.obtenerPorProyectos.mockResolvedValue([
        perfil("perfil-nuevo", "p-nuevo", ["React"]),
      ]);
      repos.recomendaciones.obtenerTodos.mockResolvedValue([
        {
          idColaborador: "c1",
          proyectos: [
            {
              id: "p-otro",
              porcentajeRequeridas: 100,
              porcentajeCobertura: 100,
              puntaje: 3,
            },
            {
              id: "p-viejo",
              porcentajeRequeridas: 100,
              porcentajeCobertura: 100,
              puntaje: 3,
            },
          ],
        },
      ]);
      repos.colaboradores.obtenerPublicosPorIds.mockResolvedValue([
        colaboradora("c1", ["React"]),
      ]);

      await service.procesarCambiosPendientes({ ahora: AHORA });

      expect(repos.proyectos.obtenerAbiertosPorIds).toHaveBeenCalledWith([
        "p-nuevo",
        "p-viejo",
      ]);
      expect(
        repos.proyectos.obtenerAbiertosParaMatching,
      ).not.toHaveBeenCalled(); // no recorre todos los proyectos
      const [idColaborador, proyectos] =
        repos.recomendaciones.guardar.mock.calls[0];
      expect(idColaborador).toBe("c1");
      expect(proyectos.map((proyecto) => proyecto.id).sort()).toEqual([
        "p-nuevo",
        "p-otro",
      ]);
    });

    it("agrega a una colaboradora nueva y saca a la que ya no coincide de las candidatas guardadas", async () => {
      repos.cambios.obtenerPendientes.mockResolvedValue([
        {
          _id: "x1",
          tipo: "COLABORADORA",
          idEntidad: "c-nueva",
          registradoEn: minutosAntes(40),
        },
        {
          _id: "x2",
          tipo: "COLABORADORA",
          idEntidad: "c-cambio",
          registradoEn: minutosAntes(40),
        },
      ]);
      repos.candidatas.obtenerTodos.mockResolvedValue([
        {
          idPerfil: "perfil-1",
          idProyecto: "p1",
          candidatas: [
            { idColaborador: "c-cambio", puntaje: 2 },
            { idColaborador: "c-igual", puntaje: 1 },
          ],
        },
      ]);
      repos.perfiles.obtenerPorProyectos.mockResolvedValue([
        perfil("perfil-1", "p1", ["React"]),
      ]);
      repos.colaboradores.obtenerPublicosPorIds.mockResolvedValue([
        colaboradora("c-nueva", ["React"]),
        colaboradora("c-cambio", ["Python"]), // dejó de tener React
      ]);

      await service.procesarCambiosPendientes({ ahora: AHORA });

      const [, , candidatas] = repos.candidatas.guardar.mock.calls[0];
      expect(candidatas.map((candidata) => candidata.idColaborador)).toEqual([
        "c-nueva",
        "c-igual",
      ]);
    });
  });

  describe("buscarColaboradorasParaPerfil", () => {
    beforeEach(() => {
      repos.perfiles.buscarPorId.mockResolvedValue(
        perfil("perfil-1", "p1", ["React"], ["Node"]),
      );
    });

    it("la primera vez calcula y guarda; después lee lo guardado sin volver a recorrer colaboradoras", async () => {
      const ana = colaboradora("c1", ["React", "Node"]);
      repos.colaboradores.encontrarPorHabilidadesRequeridas.mockResolvedValue([
        ana,
        colaboradora("c2", ["Java"]),
      ]);
      repos.colaboradores.obtenerPublicosPorIds.mockResolvedValue([ana]);

      const primera = await service.buscarColaboradorasParaPerfil(
        "p1",
        "perfil-1",
        1,
        6,
      );
      expect(repos.candidatas.guardar).toHaveBeenCalledTimes(1);
      expect(primera).toMatchObject({
        total: 1,
        colaboradoras: [{ id: "c1", nombreFantasia: "Persona c1" }],
      });

      repos.candidatas.buscarPorPerfil.mockResolvedValue(
        repos.candidatas.guardar.mock.results[0].value,
      );
      repos.colaboradores.encontrarPorHabilidadesRequeridas.mockClear();
      const segunda = await service.buscarColaboradorasParaPerfil(
        "p1",
        "perfil-1",
        1,
        6,
      );

      expect(
        repos.colaboradores.encontrarPorHabilidadesRequeridas,
      ).not.toHaveBeenCalled();
      expect(segunda).toEqual(primera);
    });

    it("solo carga los datos de la página pedida y no muestra a quienes ya colaboran", async () => {
      repos.candidatas.buscarPorPerfil.mockResolvedValue({
        candidatas: ["c1", "c2", "c3"].map((id, i) => ({
          idColaborador: id,
          puntaje: 3 - i,
        })),
      });
      repos.colaboraciones.obtenerIdsColaboradoresDeProyecto.mockResolvedValue([
        "c1",
      ]);
      repos.colaboradores.obtenerPublicosPorIds.mockResolvedValue([
        colaboradora("c3", ["React"]),
      ]);

      const resultado = await service.buscarColaboradorasParaPerfil(
        "p1",
        "perfil-1",
        2,
        1,
      );

      expect(repos.colaboradores.obtenerPublicosPorIds).toHaveBeenCalledWith([
        "c3",
      ]);
      expect(resultado).toMatchObject({
        total: 2,
        pag: 2,
        totalPags: 2,
        colaboradoras: [{ id: "c3" }],
      });
    });
  });

  it("la reconstrucción semanal recalcula todo, descarta las candidatas guardadas y vacía la cola", async () => {
    repos.cambios.obtenerPendientes.mockResolvedValue([{ _id: "x1" }]);

    await service.reconstruirTodo(AHORA);

    expect(repos.colaboradores.obtenerTodos).toHaveBeenCalled();
    expect(repos.candidatas.eliminarTodos).toHaveBeenCalled();
    expect(repos.cambios.eliminarProcesados).toHaveBeenCalledWith(
      ["x1"],
      AHORA,
    );
  });
});
