import express from "express";
import request from "supertest";
import { describe, expect, it, jest } from "@jest/globals";
import { NotificacionController } from "../../controllers/NotificacionController.js";
import { crearNotificacionRouter } from "../../routes/notificacionRouter.js";
import { crearAutenticar } from "../../middlewares/authMiddleware.js";
import { errorHandler } from "../../middlewares/errorHandler.js";
import { notFoundHandler } from "../../middlewares/notFoundHandler.js";

const ID_COLECTIVO = "c00000000000000000000001";
const ID_COLABORADORA = "b00000000000000000000001";
const ID_USUARIO_COLECTIVO = "d00000000000000000000001";
const ID_USUARIO_COLABORADORA = "d00000000000000000000002";
const datosNotificacion = {
  idColectivo: ID_COLECTIVO,
  idColaborador: ID_COLABORADORA,
  contenido: "Hola, queremos contactarte.",
};

const crearApp = (service) => {
  const usuarios = {
    colectivo: { _id: ID_USUARIO_COLECTIVO, rol: "COLECTIVO" },
    colaboradora: { _id: ID_USUARIO_COLABORADORA, rol: "COLABORADOR" },
  };
  const autenticar = crearAutenticar(
    {
      buscarOCrearPorLogtoId: jest.fn(async (id) => usuarios[id]),
    },
    async (token) => ({ sub: token }),
  );
  const app = express();
  app.use(express.json());
  app.use(
    "/notificaciones",
    autenticar,
    crearNotificacionRouter(new NotificacionController(service)),
  );
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

const conUsuario = (usuario) => ({
  Authorization: `Bearer ${usuario}`,
});

describe("Notificaciones API - roles y destinatarios", () => {
  it("solo permite crear notificaciones a cuentas de colectivos", async () => {
    const service = { crear: jest.fn() };
    const app = crearApp(service);

    const response = await request(app)
      .post("/notificaciones")
      .set(conUsuario("colaboradora"))
      .send(datosNotificacion);

    expect(response.status).toBe(403);
    expect(response.body.codigo).toBe("ROL_NO_PERMITIDO");
    expect(service.crear).not.toHaveBeenCalled();
  });

  it("un colectivo puede enviar una notificación en el contexto de su cuenta", async () => {
    const notificacion = { id: "n-1", ...datosNotificacion };
    const service = { crear: jest.fn(async () => notificacion) };
    const app = crearApp(service);

    const response = await request(app)
      .post("/notificaciones")
      .set(conUsuario("colectivo"))
      .send(datosNotificacion);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(notificacion);
    expect(service.crear).toHaveBeenCalledWith(
      datosNotificacion,
      expect.objectContaining({
        _id: ID_USUARIO_COLECTIVO,
        rol: "COLECTIVO",
      }),
    );
  });

  it("solo permite listar notificaciones a cuentas colaboradoras", async () => {
    const service = { obtenerTodosPaginado: jest.fn() };
    const app = crearApp(service);

    const response = await request(app)
      .get("/notificaciones")
      .set(conUsuario("colectivo"));

    expect(response.status).toBe(403);
    expect(response.body.codigo).toBe("ROL_NO_PERMITIDO");
    expect(service.obtenerTodosPaginado).not.toHaveBeenCalled();
  });

  it("un colectivo no puede leer notificaciones de una colaboradora", async () => {
    const service = {
      obtenerPorId: jest.fn(),
      obtenerTodosPorColaboradora: jest.fn(),
    };
    const app = crearApp(service);

    const listado = await request(app)
      .get(`/notificaciones/colaboradora/${ID_COLABORADORA}`)
      .set(conUsuario("colectivo"));
    const detalle = await request(app)
      .get("/notificaciones/8f09d4b54eb34fc0a72a150")
      .set(conUsuario("colectivo"));

    expect(listado.status).toBe(403);
    expect(detalle.status).toBe(403);
    expect(service.obtenerTodosPorColaboradora).not.toHaveBeenCalled();
    expect(service.obtenerPorId).not.toHaveBeenCalled();
  });

  it("la lista de una colaboradora queda acotada a su usuario autenticado", async () => {
    const resultado = { notificaciones: [], total: 0, pag: 1, totalPags: 0 };
    const service = { obtenerTodosPaginado: jest.fn(async () => resultado) };
    const app = crearApp(service);

    const response = await request(app)
      .get("/notificaciones?pag=1&limite=8")
      .set(conUsuario("colaboradora"));

    expect(response.status).toBe(200);
    expect(service.obtenerTodosPaginado).toHaveBeenCalledWith(
      ID_USUARIO_COLABORADORA,
      1,
      8,
    );
  });
});
