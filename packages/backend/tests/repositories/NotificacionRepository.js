import { describe, expect, it, jest } from "@jest/globals";
import { NotificacionRepository } from "../../repositories/NotificacionRepository.js";

const ID_NOTIFICACION = "8f09d4b54eb34fc0a72a150";
const ID_COLECTIVO = "c00000000000000000000001";
const ID_COLABORADORA = "b00000000000000000000001";

describe("NotificacionRepository", () => {
  it("crea la notificación sin asignar su identificador", async () => {
    const datos = {
      fecha: new Date("2026-10-15T00:00:00.000Z"),
      contenido: "Mensaje de prueba",
      idColectivo: ID_COLECTIVO,
      idColaborador: ID_COLABORADORA,
      envios: [{ tipoDeContacto: "EMAIL", estado: "FALLIDO" }],
    };
    const documentoGuardado = { ...datos, id: ID_NOTIFICACION };
    let instancia;
    const save = jest.fn(async function () {
      return documentoGuardado;
    });
    function Model(documento) {
      instancia = this;
      Object.assign(this, documento);
      this.save = save;
    }
    const repository = new NotificacionRepository(Model);

    await expect(repository.save(datos)).resolves.toBe(documentoGuardado);

    expect(save).toHaveBeenCalledTimes(1);
    expect(instancia).toMatchObject(datos);
  });

  it("actualiza por el ObjectId asignado y conserva los campos del mensaje", async () => {
    const resultado = { id: ID_NOTIFICACION };
    const exec = jest.fn(async () => resultado);
    const model = {
      findByIdAndUpdate: jest.fn(() => ({ exec })),
    };
    const repository = new NotificacionRepository(model);
    const notificacion = {
      id: ID_NOTIFICACION,
      fecha: new Date("2026-10-15T00:00:00.000Z"),
      contenido: "Mensaje de prueba",
      idColectivo: ID_COLECTIVO,
      idColaborador: ID_COLABORADORA,
      envios: [{ tipoDeContacto: "EMAIL", estado: "FALLIDO" }],
    };

    await expect(repository.save(notificacion)).resolves.toBe(resultado);

    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      ID_NOTIFICACION,
      {
        $set: {
          fecha: notificacion.fecha,
          contenido: notificacion.contenido,
          idColectivo: ID_COLECTIVO,
          idColaborador: ID_COLABORADORA,
          envios: notificacion.envios,
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );
    expect(exec).toHaveBeenCalledTimes(1);
  });
});
