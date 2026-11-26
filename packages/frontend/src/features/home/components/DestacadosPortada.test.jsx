import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { useListado } from "../../../hooks/useListado";
import DestacadosPortada from "./DestacadosPortada.jsx";

jest.mock("../../../hooks/useListado", () => ({ useListado: jest.fn() }));
jest.mock("react-router-dom", () => {
  const React = require("react");
  return {
    Link: ({ to, children, ...props }) =>
      React.createElement("a", { href: to, ...props }, children),
  };
});

describe("destacados en la portada", () => {
  it("muestra los proyectos en el orden recibido del servidor", () => {
    useListado.mockReturnValue({
      datos: [
        { id: "p2", titulo: "Segundo" },
        { id: "p1", titulo: "Primero" },
      ],
      cargando: false,
      error: null,
      recargar: jest.fn(),
    });
    render(<DestacadosPortada />);
    expect(useListado).toHaveBeenCalledWith("/proyectos/destacados");
    const lista = screen.getByRole("list");
    expect(
      within(lista)
        .getAllByRole("heading")
        .map((titulo) => titulo.textContent),
    ).toEqual(["Segundo", "Primero"]);
    expect(
      within(lista).getByRole("link", { name: "Segundo" }),
    ).toHaveAttribute("href", "/proyectos/p2");
  });

  it("permite reintentar si no se pudieron cargar", () => {
    const recargar = jest.fn();
    useListado.mockReturnValue({
      datos: [],
      cargando: false,
      error: new Error("Network Error"),
      recargar,
    });
    render(<DestacadosPortada />);
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(recargar).toHaveBeenCalled();
  });
});
