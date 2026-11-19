import { jest } from "@jest/globals";
import {
  crearAutenticar,
  requerirRol,
} from "../../middlewares/authMiddleware.js";
import { UnauthorizedError } from "../../errors/AppError.js";

describe("middleware de autenticacion", () => {
  let usuarioRepository;
  let verificarToken;
  let autenticar;
  const ejecutar = (headers) => {
    const req = { headers };
    const next = jest.fn();
    return { req, next, resultado: autenticar(req, {}, next) };
  };

  beforeEach(() => {
    usuarioRepository = {
      buscarOCrearPorLogtoId: jest.fn(async (logtoId) => ({
        _id: "u1",
        logtoId,
      })),
    };
    verificarToken = jest.fn(async () => ({ sub: "logto-1", username: "ada" }));
    autenticar = crearAutenticar(usuarioRepository, verificarToken);
  });

  it("sin header Authorization responde 401 TOKEN_AUSENTE", async () => {
    const { resultado, next } = ejecutar({});
    await expect(resultado).rejects.toMatchObject({
      status: 401,
      codigo: "TOKEN_AUSENTE",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("si el esquema no es Bearer responde 401 TOKEN_INVALIDO", async () => {
    const { resultado } = ejecutar({ authorization: "Basic abc" });
    await expect(resultado).rejects.toMatchObject({
      status: 401,
      codigo: "TOKEN_INVALIDO",
    });
  });

  it("si el token no se puede verificar no busca ni crea el usuario", async () => {
    verificarToken.mockRejectedValue(
      new UnauthorizedError("x", "TOKEN_INVALIDO"),
    );
    const { resultado } = ejecutar({ authorization: "Bearer malo" });

    await expect(resultado).rejects.toMatchObject({ status: 401 });
    expect(usuarioRepository.buscarOCrearPorLogtoId).not.toHaveBeenCalled();
  });

  it("con un token valido deja el usuario en req.usuario y sigue", async () => {
    const { req, next, resultado } = ejecutar({
      authorization: "Bearer bueno",
    });
    await resultado;

    expect(verificarToken).toHaveBeenCalledWith("bueno");
    expect(usuarioRepository.buscarOCrearPorLogtoId).toHaveBeenCalledWith(
      "logto-1",
      "ada",
    );
    expect(req.usuario).toEqual({ _id: "u1", logtoId: "logto-1" });
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("requerirRol", () => {
  it("deja pasar si el usuario tiene alguno de los roles", () => {
    const next = jest.fn();
    requerirRol("COLECTIVO")({ usuario: { rol: "COLECTIVO" } }, {}, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("responde 403 ROL_NO_PERMITIDO si tiene otro rol o ninguno", () => {
    const next = jest.fn();
    const guardia = requerirRol("COLECTIVO");

    expect(() =>
      guardia({ usuario: { rol: "COLABORADOR" } }, {}, next),
    ).toThrow(
      expect.objectContaining({ status: 403, codigo: "ROL_NO_PERMITIDO" }),
    );
    expect(() => guardia({ usuario: {} }, {}, next)).toThrow(
      expect.objectContaining({ status: 403 }),
    );
    expect(next).not.toHaveBeenCalled();
  });
});
