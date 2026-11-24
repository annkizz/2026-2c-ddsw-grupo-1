import express from "express";
import { request } from "node:http";
import { describe, expect, it } from "@jest/globals";
import { PostulacionController } from "../../controllers/PostulacionController.js";
import { crearPostulacionRouter } from "../../routes/postulacionRouter.js";
import { errorHandler } from "../../middlewares/errorHandler.js";
import { PostulacionService } from "../../services/PostulacionService.js";

describe("invitaciones HTTP", () => {
  it("permite al colectivo invitar y solo a la destinataria aceptar", async () => {
    const colaboradoraId = "b00000000000000000000001";
    const proyecto = { _id: "proyecto", idColectivo: "colectivo", titulo: "Proyecto" };
    const perfil = { _id: "perfil", idProyecto: "proyecto", descripcion: "Tester" };
    let guardada;
    const colaboraciones = [];
    const notificaciones = {
      crearEventoSistema: async (datos) => {
        guardada = { ...datos, _id: "invitacion" };
        return { ...datos, id: "invitacion" };
      },
      toDTO: (datos) => ({ id: datos._id, estadoInvitacion: datos.estadoInvitacion }),
      notificacionRepository: {
        buscarPorId: async () => guardada,
        cambiarEstadoInvitacion: async (_id, _actor, anterior, nuevo) => {
          if (guardada.estadoInvitacion !== anterior) return null;
          guardada.estadoInvitacion = nuevo;
          return { ...guardada };
        },
      },
    };
    const service = new PostulacionService(
      { buscarPorId: async () => proyecto },
      { buscarPorId: async () => perfil },
      { obtenerPorId: async () => ({ _id: colaboradoraId, aceptaMensajeria: true }) },
      {
        existeColaboracion: async () => false,
        contarPorPerfil: async () => 0,
        crearDesdeInvitacion: async (colaboracion) => colaboraciones.push(colaboracion),
      },
      { existePendiente: async () => false },
      undefined,
      notificaciones,
    );
    const usuarios = {
      obtenerSesion: async (usuario) => usuario,
    };
    const autenticar = (req, _res, next) => {
      req.usuario = req.get("x-actor") === "colectivo"
        ? { rol: "COLECTIVO", idColectivo: "colectivo" }
        : { rol: "COLABORADOR", idColaborador: req.get("x-actor") };
      next();
    };
    const app = express();
    app.use(express.json());
    app.use("/proyectos/:idProyecto", crearPostulacionRouter(new PostulacionController(service, usuarios), autenticar));
    app.use(errorHandler);
    const server = await new Promise((resolve) => {
      const iniciado = app.listen(0, "127.0.0.1", () => resolve(iniciado));
    });
    const base = `http://127.0.0.1:${server.address().port}/proyectos/proyecto`;
    const enviar = (ruta, actor, method, datos) => new Promise((resolve, reject) => {
      const req = request(`${base}${ruta}`, {
        method, headers: { "content-type": "application/json", "x-actor": actor },
      }, (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => { body += chunk; });
        res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        res.on("error", reject);
      });
      req.on("error", reject);
      req.end(JSON.stringify(datos));
    });
    try {
      const enviada = await enviar("/perfiles/perfil/invitaciones", "colectivo", "POST", { idColaborador: colaboradoraId, mensaje: "Hola" });
      expect(enviada.status).toBe(201);
      expect(enviada.body).toMatchObject({ tipo: "INVITACION_PROYECTO", estadoInvitacion: "PENDIENTE" });
      const ajena = await enviar("/invitaciones/invitacion", "otra", "PATCH", { decision: "ACEPTADA" });
      expect(ajena.status).toBe(404);
      const aceptada = await enviar("/invitaciones/invitacion", colaboradoraId, "PATCH", { decision: "ACEPTADA" });
      expect(aceptada.status).toBe(200);
      expect(aceptada.body).toMatchObject({ estadoInvitacion: "ACEPTADA" });
      expect(colaboraciones).toHaveLength(1);
      expect(colaboraciones[0]).toMatchObject({ esAnonima: true, perfil });
      const repetida = await enviar("/invitaciones/invitacion", colaboradoraId, "PATCH", { decision: "ACEPTADA" });
      expect(repetida.status).toBe(409);
    } finally {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });
});
