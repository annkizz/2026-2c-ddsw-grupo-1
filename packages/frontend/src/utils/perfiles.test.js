import { describirCompromiso, listarHabilidades } from "./perfiles";

describe("resúmenes de perfiles", () => {
  it("muestra el compromiso con singular y plural", () => {
    expect(
      describirCompromiso({
        horas: 1,
        tipoCompromiso: "SEMANALES",
        tipoColaboracion: "GRATUITA",
      }),
    ).toBe("1 hora semanales · colaboración gratuita");
    expect(
      describirCompromiso({
        horas: 2,
        tipoCompromiso: "TOTALES",
        tipoColaboracion: "INCENTIVO",
      }),
    ).toBe("2 horas totales · colaboración incentivo");
  });

  it("mantiene los datos no reconocidos y muestra los faltantes", () => {
    expect(describirCompromiso(null)).toBe("Compromiso no informado");
    expect(
      describirCompromiso({ tipoCompromiso: "OTRO", tipoColaboracion: "OTRA" }),
    ).toBe("? horas otro · colaboración otra");
    expect(listarHabilidades([])).toBe("ninguna");
    expect(listarHabilidades(["React", "Diseño"])).toBe("React, Diseño");
  });
});
