import {
  clasificarError,
  describirError,
  mensajeDeError,
} from "./mensajeDeError";

const conStatus = (
  status,
  data = { error: "texto crudo del backend", codigo: "CODIGO_INTERNO" },
) => ({
  response: { status, data },
});

describe("mensajeDeError", () => {
  it.each([
    [
      { code: "ERR_NETWORK", message: "Network Error", request: {} },
      "sinConexion",
    ],
    [conStatus(401), "sesionVencida"],
    [conStatus(403), "sinPermisos"],
    [conStatus(404), "noEncontrado"],
    [conStatus(400), "validacion"],
    [conStatus(422), "validacion"],
    [conStatus(409), "conflicto"],
    [conStatus(500), "servidor"],
    [conStatus(503), "servidor"],
    [new Error("algo técnico"), "inesperado"],
    [undefined, "inesperado"],
  ])("clasifica %p como %s", (error, tipo) => {
    expect(clasificarError(error)).toBe(tipo);
  });

  it("nunca muestra el texto del backend, error.message ni códigos", () => {
    const texto = mensajeDeError(conStatus(500));
    expect(texto).not.toMatch(/texto crudo|CODIGO_INTERNO|status/i);
    expect(
      mensajeDeError(new Error("Request failed with status code 500")),
    ).not.toMatch(/Request failed/);
  });

  it("ofrece iniciar sesión ante 401 y reintentar ante errores transitorios", () => {
    expect(describirError(conStatus(401)).accion).toBe("iniciarSesion");
    expect(describirError(conStatus(500)).accion).toBe("reintentar");
    expect(describirError(conStatus(404)).accion).toBeNull();
  });

  it("antepone el contexto cuando se indica", () => {
    expect(
      mensajeDeError(conStatus(500), "No pudimos guardar el perfil."),
    ).toMatch(/^No pudimos guardar el perfil\. /);
  });
});
