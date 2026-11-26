import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { LogroController } from "../../controllers/LogroController.js";
import { crearLogroRouter } from "../../routes/logroRouter.js";
import { errorHandler } from "../../middlewares/errorHandler.js";
import { LogroService } from "../../services/LogroService.js";
import { PublicacionLinkedinService } from "../../services/PublicacionLinkedinService.js";

describe("publicación de logros HTTP", () => {
  let app;
  let logros;
  let repositorio;
  let cliente;
  let config;
  const datos = {
    titulo: "Prototipo",
    descripcion: "Ya funciona",
    fecha: "2026-11-18",
  };

  beforeEach(() => {
    logros = [];
    repositorio = {
      save: jest.fn(async (logro) => {
        const guardado = { ...logro, _id: String(logros.length + 1) };
        logros.push(guardado);
        return guardado;
      }),
      buscarPorId: jest.fn(async (idProyecto, id) =>
        logros.find(
          (logro) => logro.idProyecto === idProyecto && logro._id === id,
        ),
      ),
      registrarPublicacion: jest.fn(async (id, publicacion) => {
        const logro = logros.find((item) => item._id === id);
        if (!logro) return null;
        logro.publicacionLinkedin = publicacion;
        return logro;
      }),
    };
    const proyecto = {
      _id: "proyecto",
      idColectivo: "colectivo",
      titulo: "Proyecto",
    };
    const proyectos = {
      existe: async () => true,
      buscarPorId: async () => proyecto,
    };
    const conexion = {
      obtenerColectivoDe: async () => ({ _id: "colectivo" }),
      obtenerCredenciales: async () => ({
        accessToken: "token",
        personUrn: "urn:li:person:123",
      }),
    };
    cliente = { publicar: jest.fn(async () => "urn:li:share:123") };
    config = { FRONTEND_URL: "https://ejemplo.test" };
    const publicacion = new PublicacionLinkedinService(
      conexion,
      cliente,
      config,
    );
    const service = new LogroService(repositorio, proyectos, publicacion);
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.usuario = { _id: "usuario" };
      next();
    });
    app.use("/proyectos", crearLogroRouter(new LogroController(service)));
    app.use(errorHandler);
  });

  it("solo publica al crear si se selecciona y permite compartir un logro existente", async () => {
    const sinPublicar = await request(app)
      .post("/proyectos/proyecto/logros")
      .send(datos);
    expect(sinPublicar.status).toBe(201);
    expect(cliente.publicar).not.toHaveBeenCalled();

    const creado = await request(app)
      .post("/proyectos/proyecto/logros")
      .send({ ...datos, publicarEnLinkedin: true });
    expect(creado.status).toBe(201);
    expect(creado.body.publicacionLinkedin).toMatchObject({
      estado: "ENVIADO",
      urnPost: "urn:li:share:123",
    });
    expect(cliente.publicar).toHaveBeenCalledWith(
      "token",
      "urn:li:person:123",
      expect.stringContaining("https://ejemplo.test/proyectos/proyecto"),
    );

    const compartido = await request(app)
      .post(`/proyectos/proyecto/logros/${sinPublicar.body.id}/linkedin`)
      .send({});
    expect(compartido.status).toBe(200);
    expect(compartido.body.publicacionLinkedin.estado).toBe("ENVIADO");
    const repetido = await request(app)
      .post(`/proyectos/proyecto/logros/${sinPublicar.body.id}/linkedin`)
      .send({});
    expect(repetido.status).toBe(409);
    expect(cliente.publicar).toHaveBeenCalledTimes(2);
  });

  it("guarda el logro y el resultado fallido si LinkedIn rechaza la publicación", async () => {
    cliente.publicar.mockRejectedValue({ status: 401 });
    const respuesta = await request(app)
      .post("/proyectos/proyecto/logros")
      .send({ ...datos, publicarEnLinkedin: true });
    expect(respuesta.status).toBe(201);
    expect(respuesta.body.publicacionLinkedin).toMatchObject({
      estado: "FALLIDO",
      detalle: expect.any(String),
    });
    expect(logros[0].publicacionLinkedin.estado).toBe("FALLIDO");
  });

  it("informa si no puede registrar el resultado después de publicar", async () => {
    repositorio.registrarPublicacion.mockRejectedValue(
      new Error("base no disponible"),
    );
    const respuesta = await request(app)
      .post("/proyectos/proyecto/logros")
      .send({ ...datos, publicarEnLinkedin: true });
    expect(respuesta.status).toBe(500);
    expect(respuesta.body.codigo).toBe("LINKEDIN_RESULTADO_NO_REGISTRADO");
    expect(logros).toHaveLength(1);
    expect(cliente.publicar).toHaveBeenCalledTimes(1);
  });

  it("rechaza la publicación sin URL válida antes de guardar el logro", async () => {
    config.FRONTEND_URL = "";
    const respuesta = await request(app)
      .post("/proyectos/proyecto/logros")
      .send({ ...datos, publicarEnLinkedin: true });
    expect(respuesta.status).toBe(503);
    expect(respuesta.body.codigo).toBe("LINKEDIN_URL_INVALIDA");
    expect(logros).toHaveLength(0);
    expect(cliente.publicar).not.toHaveBeenCalled();
  });
});
