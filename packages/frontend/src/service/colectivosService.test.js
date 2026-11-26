import api, { conToken } from "./api";
import { crearColectivo, actualizarColectivo } from "./colectivosService";

jest.mock("./api", () => ({
  __esModule: true,
  default: { post: jest.fn(), put: jest.fn() },
  conToken: jest.fn((token) => ({
    headers: { Authorization: `Bearer ${token}` },
  })),
}));

describe("servicio de colectivos", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.post.mockResolvedValue({ data: {} });
    api.put.mockResolvedValue({ data: {} });
  });

  it("omite la ubicación cuando no se especifica", async () => {
    await crearColectivo("token", {
      nombre: "Colectivo",
      descripcion: "Descripción",
      tipoDeColectivo: "ONG",
    });

    expect(api.post.mock.calls[0][1]).not.toHaveProperty("ubicacion");
  });

  it("envía los tres datos de ubicación al crear o editar un perfil", async () => {
    const ubicacion = {
      pais: "Argentina",
      provincia: "Buenos Aires",
      ciudad: "Adrogué",
    };
    const datosComunes = {
      nombre: "Colectivo",
      descripcion: "Descripción",
      tipoDeColectivo: "ONG",
    };

    await crearColectivo("token", { ...datosComunes, ...ubicacion });
    await actualizarColectivo("token", "colectivo-1", {
      ...datosComunes,
      ubicacion,
    });

    expect(api.post.mock.calls[0][1].ubicacion).toEqual(ubicacion);
    expect(api.put.mock.calls[0][1].ubicacion).toEqual(ubicacion);
  });
});
