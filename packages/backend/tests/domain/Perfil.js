import { Perfil } from "../../domain/Perfil.js";
import { Compromiso } from "../../domain/Compromiso.js";
import { TipoCompromiso } from "../../domain/TipoCompromiso.js";
import { TipoColaboracion } from "../../domain/TipoColaboracion.js";

describe("Dominio - Perfil", () => {
  const compromiso = new Compromiso(TipoCompromiso.MENSUALES, 5);

  it("se crea con todos sus atributos", () => {
    const perfil = new Perfil(
      "Tester",
      ["Testing E2E con Cypress"],
      ["Uso de Soap UI"],
      compromiso,
    );

    expect(perfil.descripcion).toBe("Tester");
    expect(perfil.habilidadesRequeridas).toEqual(["Testing E2E con Cypress"]);
    expect(perfil.habilidadesOpcionales).toEqual(["Uso de Soap UI"]);
    expect(perfil.compromiso).toBe(compromiso);
  });

  it("guarda el tipo y las horas del compromiso", () => {
    const perfil = new Perfil("Analista de Datos", ["Pandas"], [], compromiso);

    expect(perfil.compromiso.tipoCompromiso).toBe("MENSUALES");
    expect(perfil.compromiso.horas).toBe(5);
  });

  it("puede no tener habilidades opcionales", () => {
    const perfil = new Perfil("Backend", ["Node.js"], [], compromiso);

    expect(perfil.habilidadesOpcionales).toEqual([]);
  });
});

describe("Dominio - Compromiso y enums de perfil", () => {
  it("Compromiso guarda tipo y horas", () => {
    const compromiso = new Compromiso(TipoCompromiso.SEMANALES, 10);

    expect(compromiso.tipoCompromiso).toBe(TipoCompromiso.SEMANALES);
    expect(compromiso.horas).toBe(10);
  });

  it("TipoCompromiso tiene los tres tipos del enunciado", () => {
    expect(Object.values(TipoCompromiso).sort()).toEqual(
      ["MENSUALES", "SEMANALES", "TOTALES"],
    );
  });

  it("TipoColaboracion tiene las tres modalidades del enunciado", () => {
    expect(Object.values(TipoColaboracion).sort()).toEqual(
      ["CONTRATACION", "GRATUITA", "INCENTIVO"],
    );
  });
});