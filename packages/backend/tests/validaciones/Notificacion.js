import { describe, expect, it } from "@jest/globals";
import {
  notificacionFiltroSchema,
  notificacionSchema,
} from "../../schemas/zod/notificacionSchema.js";

describe("validaciones de notificaciones", () => {
  it("valida un mensaje con ObjectIds de Mongo", () => {
    expect(
      notificacionSchema.safeParse({
        idColectivo: "c00000000000000000000001",
        idColaborador: "b00000000000000000000001",
        contenido: "Hola, queremos contactarte.",
      }).success,
    ).toBe(true);
  });

  it("rechaza identificadores que no sean ObjectIds de Mongo", () => {
    expect(
      notificacionSchema.safeParse({
        idColectivo: "colectivo-1",
        idColaborador: "colaboradora-1",
        contenido: "Hola, queremos contactarte.",
      }).success,
    ).toBe(false);
  });

  it("rechaza campos de contacto enviados en el request", () => {
    expect(
      notificacionSchema.safeParse({
        idColectivo: "c00000000000000000000001",
        idColaborador: "b00000000000000000000001",
        contenido: "Hola, queremos contactarte.",
        medioDeContacto: {
          tipoDeContacto: "EMAIL",
          contacto: "destino@example.org",
        },
      }).success,
    ).toBe(false);
  });

  it("solo acepta IDs de colectivo y colaboradora como filtros de listado", () => {
    expect(
      notificacionFiltroSchema.safeParse({
        idColectivo: "c00000000000000000000001",
      })
        .success,
    ).toBe(true);
    expect(notificacionFiltroSchema.safeParse({ $where: "true" }).success).toBe(
      false,
    );
  });
});
