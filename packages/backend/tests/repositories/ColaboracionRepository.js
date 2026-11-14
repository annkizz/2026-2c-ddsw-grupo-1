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
      "idProyecto idPerfil idColaborador fecha esAnonima",
    );
    expect(populate).toHaveBeenCalledWith(
      "idColaborador",
      "nombreFantasia usuarioGitHub nombre apellido",
    );
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it("conecta la colaboración creada con su postulación aceptada", async () => {
    const colaboracion = {
      proyecto: { _id: "proyecto-1" },
      perfil: { _id: "perfil-1" },
      postulacion: { _id: "postulacion-1" },
      colaborador: { _id: "colaboradora-1" },
      fecha: new Date(),
      esAnonima: false,
    };
    const model = { create: jest.fn(async (datos) => datos) };

    await new ColaboracionRepository(model).crearDesdePostulacion(colaboracion);

    expect(model.create).toHaveBeenCalledWith({
      idProyecto: "proyecto-1",
      idPerfil: "perfil-1",
      idPostulacion: "postulacion-1",
      idColaborador: "colaboradora-1",
      fecha: colaboracion.fecha,
      esAnonima: false,
    });
  });
});
