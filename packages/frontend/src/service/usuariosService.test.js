import api from "./api";
import { obtenerSesion } from "./usuariosService";

jest.mock("./api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
  conToken: (token) => ({
    headers: { Authorization: `Bearer ${token}` },
  }),
}));

describe("servicio de sesión", () => {
  it("limita el tiempo de espera al verificar /me", async () => {
    const sesion = { tienePerfil: true };
    api.get.mockResolvedValue({ data: sesion });

    await expect(obtenerSesion("token-de-prueba")).resolves.toEqual(sesion);

    const [, configuracion] = api.get.mock.calls[0];
    expect(configuracion.headers.Authorization).toBe("Bearer token-de-prueba");
    expect(configuracion.timeout).toBeGreaterThan(0);
  });
});
