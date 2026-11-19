import { describe, expect, it, jest } from "@jest/globals";
import { ProyectoRepository } from "../../repositories/ProyectoRepository.js";

describe("ProyectoRepository.obtenerDestacados", () => {
  it("filtra activos no vencidos y ordena primero los que vencen antes", async () => {
    const ahora = new Date();
    const exec = jest.fn(async () => []);
    const sort = jest.fn(() => ({ exec }));
    const find = jest.fn(() => ({ sort }));
    const repository = new ProyectoRepository({ find });

    await repository.obtenerDestacados(ahora);

    expect(find).toHaveBeenCalledWith({
      estado: "ACTIVO",
      destacado: true,
      destacadoHasta: { $gt: ahora },
    });
    expect(sort).toHaveBeenCalledWith({ destacadoHasta: 1, fechaInicio: -1 });
  });
});
