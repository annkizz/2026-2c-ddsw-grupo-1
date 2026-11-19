import { describe, expect, it, jest } from "@jest/globals";
import { ColectivoRepository } from "../../repositories/ColectivoRepository.js";

describe("ColectivoRepository", () => {
  it("obtiene solo los nombres de los colectivos indicados", async () => {
    const query = {
      select: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };
    const model = { find: jest.fn().mockReturnValue(query) };

    await new ColectivoRepository(model).obtenerPorIds(["c1", "c2"]);

    expect(model.find).toHaveBeenCalledWith({ _id: { $in: ["c1", "c2"] } });
    expect(query.select).toHaveBeenCalledWith("_id nombre");
    expect(query.exec).toHaveBeenCalledTimes(1);
  });

  it("no consulta si la lista de ids está vacía", async () => {
    const model = { find: jest.fn() };

    await expect(
      new ColectivoRepository(model).obtenerPorIds([]),
    ).resolves.toEqual([]);
    expect(model.find).not.toHaveBeenCalled();
  });
});
