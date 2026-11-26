import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useAuth } from "../../hooks/useAuth.jsx";
import { useListado } from "../../hooks/useListado";
import { configurarDestacado } from "../../service/proyectosService";
import ProyectosDestacados from "./ProyectosDestacados.jsx";

jest.mock("../../hooks/useAuth.jsx", () => ({ useAuth: jest.fn() }));
jest.mock("../../hooks/useListado", () => ({ useListado: jest.fn() }));
jest.mock("../../service/proyectosService", () => ({
  configurarDestacado: jest.fn(),
}));
jest.mock("react-router-dom", () => {
  const React = require("react");
  return {
    Link: ({ to, children, ...props }) =>
      React.createElement("a", { href: to, ...props }, children),
  };
});

describe("administración de destacados", () => {
  const recargar = jest.fn();
  const proyecto = {
    id: "p1",
    titulo: "Proyecto uno",
    descripcion: "Descripción",
    destacado: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      getAccessToken: jest.fn().mockResolvedValue("token"),
    });
    useListado.mockReturnValue({
      datos: [proyecto],
      cargando: false,
      error: null,
      recargar,
    });
    configurarDestacado.mockResolvedValue({});
  });

  const mostrar = () => render(<ProyectosDestacados />);

  it("destaca un proyecto con fecha futura y vuelve a cargar la lista", async () => {
    mostrar();
    fireEvent.change(screen.getByLabelText(/Destacar hasta: Proyecto uno/), {
      target: { value: "2099-12-01T10:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Destacar" }));

    await waitFor(() =>
      expect(configurarDestacado).toHaveBeenCalledWith("token", "p1", {
        destacado: true,
        destacadoHasta: new Date("2099-12-01T10:00").toISOString(),
      }),
    );
    expect(
      await screen.findByText("Se destacó “Proyecto uno”."),
    ).toBeInTheDocument();
    expect(recargar).toHaveBeenCalled();
  });

  it("rechaza una fecha vencida sin llamar al servidor", () => {
    mostrar();
    fireEvent.change(screen.getByLabelText(/Destacar hasta: Proyecto uno/), {
      target: { value: "2000-01-01T10:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Destacar" }));

    expect(
      screen.getByText("Elegí una fecha y hora futuras para el vencimiento."),
    ).toBeInTheDocument();
    expect(configurarDestacado).not.toHaveBeenCalled();
  });

  it("permite quitar un destacado vencido", async () => {
    useListado.mockReturnValue({
      datos: [
        {
          ...proyecto,
          destacado: true,
          destacadoHasta: "2000-01-01T10:00:00Z",
        },
      ],
      cargando: false,
      error: null,
      recargar,
    });
    mostrar();
    expect(screen.getByText(/El destacado venció/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Quitar destacado" }));
    await waitFor(() =>
      expect(configurarDestacado).toHaveBeenCalledWith("token", "p1", {
        destacado: false,
      }),
    );
  });

  it("muestra errores al guardar sin anunciar éxito", async () => {
    configurarDestacado.mockRejectedValue(new Error("Network Error"));
    mostrar();
    fireEvent.click(screen.getByRole("button", { name: "Destacar" }));
    expect(
      await screen.findByText("No pudimos actualizar el destacado"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Se destacó “Proyecto uno”."),
    ).not.toBeInTheDocument();
  });
});
