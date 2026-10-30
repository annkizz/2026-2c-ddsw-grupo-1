import { describe, expect, it, jest } from "@jest/globals";
import { ColaboracionRepository } from "../../repositories/ColaboracionRepository.js";

describe("ColaboracionRepository", () => {
  it("limita la consulta y la población a los datos públicos necesarios", async () => {
    const idProyecto = "a00000000000000000000001";
    const resultado = [{ idProyecto }];
    const exec = jest.fn(async () => resultado);
    const populate = jest.fn(() => ({ exec }));
    const select = jest.fn(() => ({ populate }));
    const model = {
      find: jest.fn(() => ({ select })),
    };
    const repository = new ColaboracionRepository(model);

    await expect(repository.obtenerPorProyecto(idProyecto)).resolves.toBe(
      resultado,
    );

    expect(model.find).toHaveBeenCalledWith({ idProyecto });
    expect(select).toHaveBeenCalledWith(
      "idProyecto idColaborador fecha esAnonima",
    );
    expect(populate).toHaveBeenCalledWith(
      "idColaborador",
      "nombreFantasia usuarioGitHub nombre apellido",
    );
    expect(exec).toHaveBeenCalledTimes(1);
  });
});
