import { camposFaltantesPerfilColectivo } from "./perfilColectivo";

describe("campos requeridos del perfil colectivo", () => {
  it("detecta valores vacíos o solo con espacios y conserva los datos completos", () => {
    const faltantes = camposFaltantesPerfilColectivo({
      nombreColectivo: " ",
      tipoDeColectivo: "ONG",
      descripcion: "",
    });

    expect(faltantes.map(({ clave }) => clave)).toEqual([
      "nombreColectivo",
      "descripcion",
    ]);
  });
});
