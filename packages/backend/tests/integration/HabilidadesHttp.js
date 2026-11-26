import express from "express";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import { HabilidadController } from "../../controllers/HabilidadController.js";
import { HabilidadService } from "../../services/HabilidadService.js";
import { HabilidadRepository } from "../../repositories/HabilidadRepository.js";
import { ColaboradorService } from "../../services/ColaboradorService.js";
import { PerfilService } from "../../services/PerfilService.js";
import { HabilidadModel } from "../../schemas/habilidadSchema.js";
import { crearHabilidadRouter } from "../../routes/habilidadRouter.js";
import { crearAutenticar } from "../../middlewares/authMiddleware.js";
import { errorHandler } from "../../middlewares/errorHandler.js";
import { conectarALaBaseDePrueba, desconectarDeLaBaseDePrueba, limpiarLaBase } from "./utils/baseDeDatosDePrueba.js";

describe("catálogo de habilidades HTTP", () => {
  let app;
  beforeAll(async () => {
    await conectarALaBaseDePrueba();
    await HabilidadModel.init();
    const autenticar = crearAutenticar(
      { buscarOCrearPorLogtoId: async (rol) => ({ rol }) },
      async (token) => ({ sub: token }),
      {},
    );
    app = express();
    app.use(express.json());
    app.use("/habilidades", (req, res, next) =>
      req.method === "GET" ? next() : autenticar(req, res, next),
    );
    app.use("/habilidades", crearHabilidadRouter(new HabilidadController(new HabilidadService(new HabilidadRepository()))));
    app.use(errorHandler);
  });
  beforeEach(async () => limpiarLaBase());
  afterAll(async () => desconectarDeLaBaseDePrueba());

  it("permite crear solo al administrador y consultar el catálogo sin sesión", async () => {
    expect((await request(app).post("/habilidades").send({ titulo: "React" })).status).toBe(401);
    for (const rol of ["COLABORADOR", "COLECTIVO"]) {
      expect((await request(app).post("/habilidades").set("Authorization", `Bearer ${rol}`).send({ titulo: "React" })).status).toBe(403);
    }
    expect((await request(app).post("/habilidades").set("Authorization", "Bearer ADMINISTRADOR").send({ titulo: " React " })).status).toBe(201);
    const catalogo = await request(app).get("/habilidades");
    expect(catalogo.status).toBe(200);
    expect(catalogo.body).toEqual([expect.objectContaining({ titulo: "React", codigo: "react" })]);
    const repository = new HabilidadRepository();
    expect(await new ColaboradorService(undefined, repository).resolverHabilidades(["React"])).toEqual(["React"]);
    expect((await new PerfilService(undefined, undefined, repository).validarHabilidades(["React"]))[0].titulo).toBe("React");
  });

  it("evita duplicados normalizados incluso en solicitudes simultáneas", async () => {
    const crear = (titulo) => request(app).post("/habilidades")
      .set("Authorization", "Bearer ADMINISTRADOR").send({ titulo });
    const respuestas = await Promise.all([crear("React"), crear("réact")]);
    expect(respuestas.map((respuesta) => respuesta.status).sort()).toEqual([201, 409]);
    expect(respuestas.find((respuesta) => respuesta.status === 409).body.codigo).toBe("HABILIDAD_YA_EXISTE");
    expect(await HabilidadModel.countDocuments()).toBe(1);
  });

  it("rechaza un nombre sin letras ni números", async () => {
    const respuesta = await request(app).post("/habilidades")
      .set("Authorization", "Bearer ADMINISTRADOR").send({ titulo: "!!!" });
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.codigo).toBe("HABILIDAD_TITULO_INVALIDO");
    expect(await HabilidadModel.countDocuments()).toBe(0);
  });
});
