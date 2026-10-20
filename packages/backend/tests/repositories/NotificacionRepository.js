import { jest } from "@jest/globals";
import { NotificacionRepository } from "../../repositories/NotificacionRepository.js";

describe("NotificacionRepository", () => {
  it("persiste el mensaje y sus resultados de envío por ID estable", async () => {
    const resultado = { idNotificacion: "notification-1" };
    const exec = jest.fn(async () => resultado);
    const model = {
      findOneAndUpdate: jest.fn(() => ({ exec })),
    };
    const repository = new NotificacionRepository(model);
    const notificacion = {
      idNotificacion: "notification-1",
      fecha: new Date("2026-10-15T00:00:00.000Z"),
      contenido: "Mensaje de prueba",
      idColectivo: "colectivo-1",
      idColaborador: "colaboradora-1",
      envios: [{ tipoDeContacto: "EMAIL", estado: "FALLIDO" }],
    };

    await expect(repository.save(notificacion)).resolves.toBe(resultado);

    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { idNotificacion: "notification-1" },
      {
        $set: {
          fecha: notificacion.fecha,
          contenido: notificacion.contenido,
          idColectivo: "colectivo-1",
          idColaborador: "colaboradora-1",
          envios: notificacion.envios,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
    expect(exec).toHaveBeenCalledTimes(1);
  });
});
