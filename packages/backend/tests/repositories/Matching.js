import { describe, expect, it, jest } from "@jest/globals";
import { ProyectoRepository } from "../../repositories/ProyectoRepository.js";
import { PerfilRepository } from "../../repositories/PerfilRepository.js";
import { ColaboradorRepository } from "../../repositories/ColaboradorRepository.js";
import { ColaboradorModel } from "../../schemas/colaboradorSchema.js";
import { Estado } from "../../domain/Estado.js";

// Simula una consulta encadenable sin abrir conexiones a Mongo
function crearModelo() {
  const query = {
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  };
  return { query, find: jest.fn().mockReturnValue(query) };
}

describe("consultas de matching", () => {
  it("excluye proyectos ya anotados en Mongo y mantiene el orden", async () => {
    const model = crearModelo();
    await new ProyectoRepository(model).obtenerAbiertosParaMatching(["p1"]);
    expect(model.find).toHaveBeenCalledWith({
      estado: Estado.ACTIVO,
      _id: { $nin: ["p1"] },
    });
    expect(model.query.select).toHaveBeenCalledWith("_id titulo descripcion");
    expect(model.query.sort).toHaveBeenCalledWith({ fechaInicio: -1 });
    expect(model.query.exec).toHaveBeenCalledTimes(1);
  });

  it("filtra perfiles del conjunto candidato con alguna requerida en las habilidades", async () => {
    const model = crearModelo();
    await new PerfilRepository(model).obtenerCompatiblesPorProyectos(
      ["p1"],
      ["React", "SQL"],
    );
    expect(model.find).toHaveBeenCalledWith({
      idProyecto: { $in: ["p1"] },
      habilidadesRequeridas: { $in: ["React", "SQL"] },
    });
    expect(model.query.select).toHaveBeenCalledWith(
      "_id idProyecto descripcion compromiso habilidadesRequeridas habilidadesOpcionales",
    );
    expect(model.query.exec).toHaveBeenCalledTimes(1);
  });

  it("no consulta perfiles para conjuntos vacios", async () => {
    const model = crearModelo();
    const repository = new PerfilRepository(model);
    await expect(
      repository.obtenerCompatiblesPorProyectos([], ["React"]),
    ).resolves.toEqual([]);
    await expect(
      repository.obtenerCompatiblesPorProyectos(["p1"], []),
    ).resolves.toEqual([]);
    expect(model.find).not.toHaveBeenCalled();
  });

  it("busca candidatas con alguna de las habilidades requeridas sin seleccionar datos privados", async () => {
    const model = crearModelo();
    await new ColaboradorRepository(model).encontrarPorHabilidadesRequeridas([
      "React",
      "SQL",
    ]);
    expect(model.find).toHaveBeenCalledWith({
      habilidades: { $in: ["React", "SQL"] },
    });
    expect(model.query.select).toHaveBeenCalledWith(
      "_id nombreFantasia usuarioGitHub pronombres presentacion habilidades",
    );
    expect(model.query.exec).toHaveBeenCalledTimes(1);
  });

  it("no busca candidatas si no hay requeridas", async () => {
    const model = crearModelo();
    await expect(
      new ColaboradorRepository(model).encontrarPorHabilidadesRequeridas([]),
    ).resolves.toEqual([]);
    expect(model.find).not.toHaveBeenCalled();
  });

  it("declara un indice para buscar habilidades de las candidatas", () => {
    expect(ColaboradorModel.schema.indexes()).toContainEqual([
      { habilidades: 1 },
      {},
    ]);
  });
});
