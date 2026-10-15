import { NotificacionModel } from "../../schemas/notificacionSchema.js";
import { ColaboradorModel } from "../../schemas/colaboradorSchema.js";
import { EstadoEnvio } from "../../domain/EstadoEnvio.js";

describe("esquemas de persistencia de mensajería", () => {
  it("registra notificaciones en una colección propia con los campos persistidos", async () => {
    const notificacion = new NotificacionModel({
      idNotificacion: "notification-1",
      fecha: new Date(),
      contenido: "Mensaje de prueba",
      idColectivo: "colectivo-1",
      idColaborador: "colaboradora-1",
      envios: [
        {
          tipoDeContacto: "EMAIL",
          estado: EstadoEnvio.SIMULADO,
          detalle: "Sin proveedor",
        },
      ],
    });

    expect(NotificacionModel.collection.collectionName).toBe("notificaciones");
    await expect(notificacion.validate()).resolves.toBeUndefined();
    expect(notificacion.envios[0].toObject()).toEqual({
      tipoDeContacto: "EMAIL",
      estado: EstadoEnvio.SIMULADO,
      detalle: "Sin proveedor",
    });
  });

  it("requiere consentimiento de mensajería y lo desactiva por defecto", async () => {
    const colaboradora = new ColaboradorModel({
      idColaborador: "colaboradora-1",
      habilidades: ["React"],
    });

    expect(colaboradora.aceptaMensajeria).toBe(false);
    colaboradora.aceptaMensajeria = true;
    await expect(colaboradora.validate()).resolves.toBeUndefined();
  });
});
