import { perfilSchema } from "../../controllers/PerfilController.js";

const perfilValido = () => ({
  descripcion: "Tester",
  habilidadesRequeridas: ["Testing E2E con Cypress"],
  habilidadesOpcionales: ["Uso de Soap UI"],
  compromiso: {
    tipoCompromiso: "MENSUALES",
    horas: 5,
    tipoColaboracion: "GRATUITA",
  },
});

describe("Validaciones - perfilSchema (zod)", () => {
  it("acepta un perfil válido", () => {
    expect(perfilSchema.safeParse(perfilValido()).success).toBe(true);
  });

  it("si no vienen habilidades opcionales, las completa con []", () => {
    const { habilidadesOpcionales, ...datos } = perfilValido();
    const resultado = perfilSchema.safeParse(datos);

    expect(resultado.success).toBe(true);
    expect(resultado.data.habilidadesOpcionales).toEqual([]);
    expect(resultado.data.limiteColaboraciones).toBeNull();
  });

  it("acepta un límite de colaboraciones válido", () => {
    const resultado = perfilSchema.safeParse({
      ...perfilValido(),
      limiteColaboraciones: 3,
    });

    expect(resultado.success).toBe(true);
    expect(resultado.data.limiteColaboraciones).toBe(3);
  });

  it("rechaza datos de búsqueda que pertenecen al proyecto", () => {
    expect(
      perfilSchema.safeParse({
        ...perfilValido(),
        busquedaAbierta: true,
        fechaLimiteBusqueda: "2026-12-01T00:00:00.000Z",
      }).success,
    ).toBe(false);
  });

  it.each([0, -1, 1.5])("rechaza un límite inválido (%p)", (limite) => {
    expect(
      perfilSchema.safeParse({
        ...perfilValido(),
        limiteColaboraciones: limite,
      }).success,
    ).toBe(false);
  });

  it("rechaza descripción vacía", () => {
    const datos = { ...perfilValido(), descripcion: "" };
    expect(perfilSchema.safeParse(datos).success).toBe(false);
  });

  it("rechaza un perfil sin habilidades requeridas", () => {
    const datos = { ...perfilValido(), habilidadesRequeridas: [] };
    expect(perfilSchema.safeParse(datos).success).toBe(false);
  });

  it.each([0, -3, 2.5, "5"])("rechaza horas inválidas (%p)", (horas) => {
    const datos = perfilValido();
    datos.compromiso.horas = horas;
    expect(perfilSchema.safeParse(datos).success).toBe(false);
  });

  it("rechaza un tipo de compromiso desconocido", () => {
    const datos = perfilValido();
    datos.compromiso.tipoCompromiso = "DIARIAS";
    expect(perfilSchema.safeParse(datos).success).toBe(false);
  });

  it("rechaza una modalidad de colaboración desconocida", () => {
    const datos = perfilValido();
    datos.compromiso.tipoColaboracion = "SORTEO";
    expect(perfilSchema.safeParse(datos).success).toBe(false);
  });

  it("acepta un límite de colaboraciones entero", () => {
    const datos = { ...perfilValido(), limiteColaboraciones: 2 };
    expect(perfilSchema.safeParse(datos).success).toBe(true);
  });

  it("el límite de colaboraciones queda sin límite si se omite", () => {
    const resultado = perfilSchema.safeParse(perfilValido());

    expect(resultado.success).toBe(true);
    expect(resultado.data.limiteColaboraciones).toBeNull();
  });

  it.each([0, -1, 2.5, "3"])(
    "rechaza un límite de colaboraciones inválido (%p)",
    (limite) => {
      const datos = { ...perfilValido(), limiteColaboraciones: limite };
      expect(perfilSchema.safeParse(datos).success).toBe(false);
    },
  );

  it("rechaza campos que no forman parte del perfil (strict)", () => {
    const datos = { ...perfilValido(), campoExtra: "x" };
    expect(perfilSchema.safeParse(datos).success).toBe(false);
  });
});
