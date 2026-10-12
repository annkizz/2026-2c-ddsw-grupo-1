import { logroSchema } from "../../controllers/LogroController.js";

const logroValido = () => ({
  titulo: "Primer prototipo",
  descripcion: "Se publicó una versión navegable del sistema",
  fecha: "2026-09-15",
});

describe("Validaciones - logroSchema (zod)", () => {
  it("acepta un logro válido", () => {
    expect(logroSchema.safeParse(logroValido()).success).toBe(true);
  });

  it("convierte la fecha recibida como texto en un objeto Date", () => {
    const resultado = logroSchema.safeParse(logroValido());

    expect(resultado.data.fecha).toBeInstanceOf(Date);
    expect(resultado.data.fecha.toISOString()).toBe("2026-09-15T00:00:00.000Z");
  });

  it("acepta una fecha que ya es un objeto Date", () => {
    const datos = { ...logroValido(), fecha: new Date("2026-09-15") };
    expect(logroSchema.safeParse(datos).success).toBe(true);
  });

  it.each(["titulo", "descripcion", "fecha"])("rechaza un logro sin %s", (campo) => {
    const datos = logroValido();
    delete datos[campo];
    expect(logroSchema.safeParse(datos).success).toBe(false);
  });

  it("rechaza título vacío", () => {
    const datos = { ...logroValido(), titulo: "" };
    expect(logroSchema.safeParse(datos).success).toBe(false);
  });

  it("rechaza descripción vacía", () => {
    const datos = { ...logroValido(), descripcion: "" };
    expect(logroSchema.safeParse(datos).success).toBe(false);
  });

  it("rechaza una fecha que no se puede interpretar", () => {
    const datos = { ...logroValido(), fecha: "no-es-una-fecha" };
    expect(logroSchema.safeParse(datos).success).toBe(false);
  });

  it("rechaza que el cliente mande el proyecto en el body (strict)", () => {
    const datos = { ...logroValido(), proyecto: "proyecto-1" };
    expect(logroSchema.safeParse(datos).success).toBe(false);
  });
});