import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { useAuth } from "../hooks/useAuth.jsx";
import RequiereRol from "./RequiereRol.jsx";

jest.mock("../hooks/useAuth.jsx", () => ({ useAuth: jest.fn() }));
jest.mock("react-router-dom", () => ({
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

const renderConRol = (rol) => {
  useAuth.mockReturnValue({ cargando: false, sesion: { rol } });
  render(
    <RequiereRol roles={["COLECTIVO"]}>
      <p>Página de colectivos</p>
    </RequiereRol>,
  );
};

describe("RequiereRol", () => {
  it("muestra la página a quien tiene el rol", () => {
    renderConRol("COLECTIVO");
    expect(screen.getByText("Página de colectivos")).toBeInTheDocument();
  });

  it("a quien no tiene acceso le muestra un 404, sin revelar que la página existe", () => {
    renderConRol("COLABORADOR");

    expect(screen.queryByText("Página de colectivos")).not.toBeInTheDocument();
    expect(screen.getByText("Error 404")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "No encontramos esta página",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/403/)).not.toBeInTheDocument();
  });
});
