import request from "supertest";
import { beforeEach, describe, expect, it } from "@jest/globals";
import { crearAppDeAutenticacion } from "./utils/buildAppAuth.js";

const colectivo = {
  nombre: "Manos Solidarias",
  descripcion: "Voluntariado barrial",
  tipoDeColectivo: "ONG",
};
const colaboradora = {
  nombreFantasia: "ada",
  habilidades: ["react"],
  aceptaMensajeria: true,
  mediosDeContacto: [{ tipoDeContacto: "EMAIL", contacto: "ada@example.org" }],
};
const como = (usuario) => ({ Authorization: `Bearer token-${usuario}` });

describe("Auth y perfiles - integracion HTTP (repos en memoria)", () => {
  let app;

  beforeEach(() => {
    ({ app } = crearAppDeAutenticacion());
  });

  describe("rutas privadas", () => {
    it("POST /colectivos sin token responde 401", async () => {
      const res = await request(app).post("/colectivos").send(colectivo);
      expect(res.status).toBe(401);
      expect(res.body.codigo).toBe("TOKEN_AUSENTE");
    });

    it("con un token invalido responde 401", async () => {
      const res = await request(app)
        .get("/me")
        .set("Authorization", "Bearer cualquiera");
      expect(res.status).toBe(401);
      expect(res.body.codigo).toBe("TOKEN_INVALIDO");
    });

    it("los listados y el detalle de colectivos son publicos", async () => {
      const creado = await request(app)
        .post("/colectivos")
        .set(como("ana"))
        .send(colectivo);

      expect((await request(app).get("/colectivos")).status).toBe(200);
      const detalle = await request(app).get(`/colectivos/${creado.body.id}`);
      expect(detalle.status).toBe(200);
      expect(detalle.body.nombre).toBe("Manos Solidarias");
    });
  });

  describe("GET /me", () => {
    it("un usuario nuevo no tiene rol ni perfil", async () => {
      const res = await request(app).get("/me").set(como("ana"));
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        rol: null,
        tienePerfil: false,
        idColectivo: null,
        idColaborador: null,
      });
    });

    it("despues de registrar un colectivo informa rol e id del perfil", async () => {
      const creado = await request(app)
        .post("/colectivos")
        .set(como("ana"))
        .send(colectivo);
      const res = await request(app).get("/me").set(como("ana"));

      expect(res.body).toMatchObject({
        rol: "COLECTIVO",
        tienePerfil: true,
        idColectivo: creado.body.id,
        idColaborador: null,
      });
    });
  });

  describe("registro", () => {
    it("registra un colectivo y una colaboradora, cada uno con su rol", async () => {
      const c = await request(app)
        .post("/colectivos")
        .set(como("ana"))
        .send(colectivo);
      const k = await request(app)
        .post("/colaboradoras")
        .set(como("beto"))
        .send(colaboradora);

      expect(c.status).toBe(201);
      expect(k.status).toBe(201);
      expect(k.body.habilidades).toEqual(["React"]);
      expect((await request(app).get("/me").set(como("beto"))).body.rol).toBe(
        "COLABORADOR",
      );
    });

    it("un usuario no puede registrar dos perfiles (409)", async () => {
      await request(app).post("/colectivos").set(como("ana")).send(colectivo);

      const otroColectivo = await request(app)
        .post("/colectivos")
        .set(como("ana"))
        .send(colectivo);
      const comoColaboradora = await request(app)
        .post("/colaboradoras")
        .set(como("ana"))
        .send(colaboradora);

      expect(otroColectivo.status).toBe(409);
      expect(otroColectivo.body.codigo).toBe("PERFIL_YA_REGISTRADO");
      expect(comoColaboradora.status).toBe(409);
    });

    it("si una habilidad no existe responde 404 y el usuario no queda con rol", async () => {
      const res = await request(app)
        .post("/colaboradoras")
        .set(como("beto"))
        .send({ ...colaboradora, habilidades: ["cocina molecular"] });
      expect(res.status).toBe(404);
      expect(res.body.codigo).toBe("HABILIDAD_NO_ENCONTRADA");

      const sesion = await request(app).get("/me").set(como("beto"));
      expect(sesion.body.rol).toBeNull();
      const reintento = await request(app)
        .post("/colaboradoras")
        .set(como("beto"))
        .send(colaboradora);
      expect(reintento.status).toBe(201);
    });

    it("los datos mal formados responden 400", async () => {
      const res = await request(app)
        .post("/colectivos")
        .set(como("ana"))
        .send({ nombre: "sin descripcion" });
      expect(res.status).toBe(400);
    });
  });

  describe("edicion", () => {
    it("el colectivo duenio puede editar su perfil", async () => {
      const creado = await request(app)
        .post("/colectivos")
        .set(como("ana"))
        .send(colectivo);
      const res = await request(app)
        .put(`/colectivos/${creado.body.id}`)
        .set(como("ana"))
        .send({ ...colectivo, nombre: "Manos Unidas" });

      expect(res.status).toBe(200);
      expect(res.body.nombre).toBe("Manos Unidas");
      expect(res.body.id).toBe(creado.body.id);
    });

    it("otro colectivo no puede editarlo (403 PERFIL_AJENO)", async () => {
      const creado = await request(app)
        .post("/colectivos")
        .set(como("ana"))
        .send(colectivo);
      await request(app).post("/colectivos").set(como("carla")).send(colectivo);

      const res = await request(app)
        .put(`/colectivos/${creado.body.id}`)
        .set(como("carla"))
        .send({ ...colectivo, nombre: "Hackeado" });

      expect(res.status).toBe(403);
      expect(res.body.codigo).toBe("PERFIL_AJENO");
    });

    it("una colaboradora no puede editar un colectivo (403 ROL_NO_PERMITIDO)", async () => {
      const creado = await request(app)
        .post("/colectivos")
        .set(como("ana"))
        .send(colectivo);
      await request(app)
        .post("/colaboradoras")
        .set(como("beto"))
        .send(colaboradora);

      const res = await request(app)
        .put(`/colectivos/${creado.body.id}`)
        .set(como("beto"))
        .send(colectivo);

      expect(res.status).toBe(403);
      expect(res.body.codigo).toBe("ROL_NO_PERMITIDO");
    });

    it("una colaboradora edita sus habilidades y medios de contacto", async () => {
      const creada = await request(app)
        .post("/colaboradoras")
        .set(como("beto"))
        .send(colaboradora);
      const res = await request(app)
        .put(`/colaboradoras/${creada.body.id}`)
        .set(como("beto"))
        .send({
          ...colaboradora,
          habilidades: ["react", "node.js"],
          mediosDeContacto: [
            { tipoDeContacto: "WHATSAPP", contacto: "+5491112345678" },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.habilidades).toEqual(["React", "Node.js"]);
      expect(res.body.mediosDeContacto).toEqual([
        { tipoDeContacto: "WHATSAPP", contacto: "+5491112345678" },
      ]);
    });

    it("una colaboradora no puede editar a otra (403) ni un id inexistente (404)", async () => {
      const ada = await request(app)
        .post("/colaboradoras")
        .set(como("beto"))
        .send(colaboradora);
      await request(app)
        .post("/colaboradoras")
        .set(como("dani"))
        .send({ ...colaboradora, nombreFantasia: "dani" });

      const ajena = await request(app)
        .put(`/colaboradoras/${ada.body.id}`)
        .set(como("dani"))
        .send(colaboradora);
      const inexistente = await request(app)
        .put("/colaboradoras/000000000000000000000999")
        .set(como("dani"))
        .send(colaboradora);

      expect(ajena.status).toBe(403);
      expect(inexistente.status).toBe(404);
    });
  });

  describe("datos de contacto", () => {
    it("el perfil propio incluye medios de contacto; el publico no", async () => {
      const creada = await request(app)
        .post("/colaboradoras")
        .set(como("beto"))
        .send(colaboradora);

      const propio = await request(app)
        .get("/colaboradoras/me")
        .set(como("beto"));
      const publico = await request(app).get(
        `/colaboradoras/${creada.body.id}`,
      );

      expect(propio.status).toBe(200);
      expect(propio.body.mediosDeContacto).toEqual(
        colaboradora.mediosDeContacto,
      );
      expect(propio.body.aceptaMensajeria).toBe(true);
      expect(publico.status).toBe(200);
      expect(publico.body.mediosDeContacto).toBeUndefined();
      expect(publico.body.aceptaMensajeria).toBeUndefined();
    });

    it("GET /colaboradoras/me exige ser colaboradora", async () => {
      await request(app).post("/colectivos").set(como("ana")).send(colectivo);
      const res = await request(app).get("/colaboradoras/me").set(como("ana"));
      expect(res.status).toBe(403);
    });
  });
});
