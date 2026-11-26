import express from "express";
import request from "supertest";
import { describe, expect, it } from "@jest/globals";
import { PostulacionController } from "../../controllers/PostulacionController.js";
import { EstadoPostulacion } from "../../domain/EstadoPostulacion.js";
import { TipoAceptacion } from "../../domain/TipoAceptacion.js";
import { errorHandler } from "../../middlewares/errorHandler.js";
import { notFoundHandler } from "../../middlewares/notFoundHandler.js";
import { crearPostulacionRouter } from "../../routes/postulacionRouter.js";
import { PostulacionService } from "../../services/PostulacionService.js";

const ID_PROYECTO = "proyecto-1";
const ID_PERFIL = "perfil-1";
const ID_COLECTIVO = "colectivo-1";

function crearAppDePostulaciones(tipoAceptacion, limiteColaboraciones = null) {
  const proyecto = {
    _id: ID_PROYECTO,
    idColectivo: ID_COLECTIVO,
    busquedaAbierta: true,
    estaFinalizado: () => false,
    cierreVencido: () => false,
  };
  const perfil = {
    _id: ID_PERFIL,
    idProyecto: ID_PROYECTO,
    tipoAceptacion,
    limiteColaboraciones,
    busquedaAbierta: true,
  };
  const postulaciones = new Map();
  const colaboraciones = [];
  let secuenciaPostulacion = 0;

  const proyectoRepository = {
    buscarPorId: async () => proyecto,
  };
  const perfilRepository = {
    buscarPorId: async () => perfil,
    actualizar: async (_id, datos) => {
      Object.assign(perfil, datos);
      return perfil;
    },
  };
  const colaboradorService = {
    obtenerPorId: async (id) => ({
      _id: id,
      nombreFantasia: `Colaboradora ${id}`,
    }),
  };
  const colaboracionRepository = {
    existeColaboracion: async (idProyecto, idColaborador) =>
      colaboraciones.some(
        (colaboracion) =>
          colaboracion.idProyecto === idProyecto &&
          colaboracion.idColaborador === idColaborador,
      ),
    contarPorPerfil: async (idPerfil) =>
      colaboraciones.filter(
        (colaboracion) => colaboracion.idPerfil === String(idPerfil),
      ).length,
    crearDesdePostulacion: async (colaboracion) => {
      colaboraciones.push({
        idProyecto: String(colaboracion.proyecto._id),
        idPerfil: String(colaboracion.perfil._id),
        idColaborador: String(colaboracion.colaborador._id),
      });
    },
    darDeBaja: async (idProyecto, idColaborador) => {
      const indice = colaboraciones.findIndex(
        (colaboracion) =>
          colaboracion.idProyecto === idProyecto &&
          colaboracion.idColaborador === idColaborador,
      );
      if (indice < 0) return null;
      return colaboraciones.splice(indice, 1)[0];
    },
  };
  const postulacionRepository = {
    save: async (postulacion) => {
      const guardada = {
        ...postulacion,
        _id: `postulacion-${++secuenciaPostulacion}`,
      };
      postulaciones.set(guardada._id, guardada);
      return guardada;
    },
    existePendiente: async (idProyecto, idPerfil, idColaborador) =>
      [...postulaciones.values()].some(
        (postulacion) =>
          String(postulacion.idProyecto) === idProyecto &&
          String(postulacion.idPerfil) === idPerfil &&
          String(postulacion.idColaborador) === idColaborador &&
          postulacion.estado === EstadoPostulacion.PENDIENTE,
      ),
    buscarPorId: async (id) => postulaciones.get(id) ?? null,
    actualizarEstadoSiPendiente: async (id, estado) => {
      const postulacion = postulaciones.get(id);
      if (!postulacion || postulacion.estado !== EstadoPostulacion.PENDIENTE) {
        return null;
      }
      postulacion.estado = estado;
      return { ...postulacion };
    },
    reabrirSiAceptada: async (id) => {
      const postulacion = postulaciones.get(id);
      if (!postulacion || postulacion.estado !== EstadoPostulacion.ACEPTADA) {
        return { modifiedCount: 0 };
      }
      postulacion.estado = EstadoPostulacion.PENDIENTE;
      return { modifiedCount: 1 };
    },
    rechazarPendientesPorPerfil: async (idPerfil) => {
      const rechazadas = [];
      for (const postulacion of postulaciones.values()) {
        if (
          String(postulacion.idPerfil) === String(idPerfil) &&
          postulacion.estado === EstadoPostulacion.PENDIENTE
        ) {
          postulacion.estado = EstadoPostulacion.RECHAZADA;
          rechazadas.push(postulacion);
        }
      }
      return rechazadas;
    },
    obtenerPorProyecto: async (idProyecto) =>
      [...postulaciones.values()].filter(
        (postulacion) => String(postulacion.idProyecto) === idProyecto,
      ),
  };

  const notificacionService = {
    crearEventoSistema: async () => {},
    notificarResolucionPostulacion: async () => {},
  };
  const service = new PostulacionService(
    proyectoRepository,
    perfilRepository,
    colaboradorService,
    colaboracionRepository,
    postulacionRepository,
    undefined,
    notificacionService,
  );
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.usuario = {
      _id: req.get("x-actor-id"),
      rol: req.get("x-actor-role"),
    };
    next();
  });
  const usuarioService = {
    obtenerSesion: async (usuario) => ({
      rol: usuario.rol,
      idColectivo: usuario.rol === "COLECTIVO" ? usuario._id : null,
      idColaborador: usuario.rol === "COLABORADOR" ? usuario._id : null,
    }),
  };
  const autenticar = (_req, _res, next) => next();
  app.use(
    "/proyectos/:idProyecto",
    crearPostulacionRouter(
      new PostulacionController(service, usuarioService),
      autenticar,
    ),
  );
  app.use(notFoundHandler);
  app.use(errorHandler);

  return { app, perfil, postulaciones, colaboraciones };
}

const urlDePostulacion = `/proyectos/${ID_PROYECTO}/perfiles/${ID_PERFIL}/postulaciones`;

describe("Postulaciones y modos de aceptación - integración HTTP", () => {
  it("acepta automáticamente todas las postulaciones en modo SIN_LIMITE", async () => {
    const { app, colaboraciones } = crearAppDePostulaciones(
      TipoAceptacion.SIN_LIMITE,
    );

    for (const idColaborador of ["colaboradora-1", "colaboradora-2"]) {
      const response = await request(app)
        .post(urlDePostulacion)
        .set("x-actor-role", "COLABORADOR")
        .set("x-actor-id", idColaborador)
        .send({});

      expect(response.status).toBe(201);
      expect(response.body.estado).toBe(EstadoPostulacion.ACEPTADA);
    }

    expect(colaboraciones).toHaveLength(2);
  });

  it("deja la aceptación manual y cierra el perfil al alcanzar el límite", async () => {
    const { app, perfil, postulaciones, colaboraciones } =
      crearAppDePostulaciones(TipoAceptacion.LLENAR_VACANTES, 1);
    postulaciones.set("postulacion-previa", {
      _id: "postulacion-previa",
      idProyecto: ID_PROYECTO,
      idPerfil: ID_PERFIL,
      idColaborador: "colaboradora-previa",
      estado: EstadoPostulacion.PENDIENTE,
    });

    const response = await request(app)
      .post(urlDePostulacion)
      .set("x-actor-role", "COLABORADOR")
      .set("x-actor-id", "colaboradora-1")
      .send({});

    expect(response.status).toBe(201);
    expect(response.body.estado).toBe(EstadoPostulacion.PENDIENTE);
    expect(perfil.busquedaAbierta).toBe(true);
    expect(colaboraciones).toHaveLength(0);
    expect(postulaciones.get("postulacion-previa").estado).toBe(
      EstadoPostulacion.PENDIENTE,
    );

    const aceptada = await request(app)
      .patch(`/proyectos/${ID_PROYECTO}/postulaciones/${response.body.id}`)
      .set("x-actor-role", "COLECTIVO")
      .set("x-actor-id", ID_COLECTIVO)
      .send({ decision: EstadoPostulacion.ACEPTADA });

    expect(aceptada.status).toBe(200);
    expect(aceptada.body.estado).toBe(EstadoPostulacion.ACEPTADA);
    expect(perfil.busquedaAbierta).toBe(false);
    expect(postulaciones.get("postulacion-previa").estado).toBe(
      EstadoPostulacion.RECHAZADA,
    );
    expect(colaboraciones).toHaveLength(1);

    const siguientePostulacion = await request(app)
      .post(urlDePostulacion)
      .set("x-actor-role", "COLABORADOR")
      .set("x-actor-id", "colaboradora-2")
      .send({});

    expect(siguientePostulacion.status).toBe(409);
    expect(siguientePostulacion.body.codigo).toBe("BUSQUEDA_CERRADA");
  });

  it("mantiene las postulaciones pendientes en modo MANUAL", async () => {
    const { app, colaboraciones, postulaciones } = crearAppDePostulaciones(
      TipoAceptacion.MANUAL,
    );

    const response = await request(app)
      .post(urlDePostulacion)
      .set("x-actor-role", "COLABORADOR")
      .set("x-actor-id", "colaboradora-1")
      .send({});

    expect(response.status).toBe(201);
    expect(response.body.estado).toBe(EstadoPostulacion.PENDIENTE);
    expect(colaboraciones).toHaveLength(0);
    expect(postulaciones.get(response.body.id).estado).toBe(
      EstadoPostulacion.PENDIENTE,
    );
  });
});
