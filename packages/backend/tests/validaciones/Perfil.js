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

  it("rechaza campos que no forman parte del perfil (strict)", () => {
    const datos = { ...perfilValido(), campoExtra: "x" };
    expect(perfilSchema.safeParse(datos).success).toBe(false);
  });
});