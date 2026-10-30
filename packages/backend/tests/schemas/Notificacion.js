import { describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";
import { NotificacionModel } from "../../schemas/notificacionSchema.js";
import { ColaboradorModel } from "../../schemas/colaboradorSchema.js";
import { EstadoEnvio } from "../../domain/EstadoEnvio.js";

describe("esquemas de persistencia de mensajería", () => {
  it("registra notificaciones en una colección propia con los campos persistidos", async () => {
    const notificacion = new NotificacionModel({
      fecha: new Date(),
      contenido: "Mensaje de prueba",
      idColectivo: "c00000000000000000000001",
      idColaborador: "b00000000000000000000001",
      envios: [
        {
          tipoDeContacto: "EMAIL",
          estado: EstadoEnvio.SIMULADO,
          detalle: "Sin proveedor",
        },
      ],
    });

    expect(NotificacionModel.collection.collectionName).toBe("notificaciones");
    expect(mongoose.isObjectIdOrHexString(notificacion._id)).toBe(true);
    expect(mongoose.isObjectIdOrHexString(notificacion.idColectivo)).toBe(true);
    expect(mongoose.isObjectIdOrHexString(notificacion.idColaborador)).toBe(
      true,
    );
    await expect(notificacion.validate()).resolves.toBeUndefined();
    expect(notificacion.envios[0].toObject()).toEqual({
      tipoDeContacto: "EMAIL",
      estado: EstadoEnvio.SIMULADO,
      detalle: "Sin proveedor",
    });
  });

  it("requiere consentimiento de mensajería y lo desactiva por defecto", async () => {
    const colaboradora = new ColaboradorModel({
      habilidades: ["React"],
    });

    expect(colaboradora.aceptaMensajeria).toBe(false);
    colaboradora.aceptaMensajeria = true;
    await expect(colaboradora.validate()).resolves.toBeUndefined();
  });
});
