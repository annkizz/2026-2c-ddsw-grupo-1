import { describe, expect, it, jest } from "@jest/globals";
import { Rol } from "../../domain/Rol.js";
import { requerirRol } from "../../middlewares/authMiddleware.js";

describe("rol administrador", () => {
  const middleware = requerirRol(Rol.ADMINISTRADOR);

  it("permite a usuarios con rol ADMINISTRADOR", () => {
    const req = { usuario: { rol: Rol.ADMINISTRADOR } };
    const next = jest.fn();

    middleware(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("rechaza usuarios con otro rol", () => {
    const req = { usuario: { rol: Rol.COLABORADOR } };

    expect(() => middleware(req, {}, jest.fn())).toThrow(
      expect.objectContaining({
        status: 403,
        codigo: "ROL_NO_PERMITIDO",
      }),
    );
  });
});
