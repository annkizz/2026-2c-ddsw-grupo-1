import { notificacionFiltroSchema, notificacionSchema } from "../../schemas/zod/notificacionSchema.js";

describe("validaciones de notificaciones", () => {
  it("valida un mensaje con IDs UUID o IDs de seed", () => {
    expect(
      notificacionSchema.safeParse({
        idColectivo: "seed-colectivo-1",
        idColaborador: "seed-colaboradora-1",
        contenido: "Hola, queremos contactarte.",
      }).success,
    ).toBe(true);
  });

  it("rechaza campos de contacto enviados en el request", () => {
    expect(
      notificacionSchema.safeParse({
        idColectivo: "colectivo-1",
        idColaborador: "colaboradora-1",
        contenido: "Hola, queremos contactarte.",
        medioDeContacto: {
          tipoDeContacto: "EMAIL",
          contacto: "destino@example.org",
        },
      }).success,
    ).toBe(false);
  });

  it("solo acepta IDs de colectivo y colaboradora como filtros de listado", () => {
    expect(notificacionFiltroSchema.safeParse({ idColectivo: "colectivo-1" }).success).toBe(true);
    expect(notificacionFiltroSchema.safeParse({ $where: "true" }).success).toBe(false);
  });
});
