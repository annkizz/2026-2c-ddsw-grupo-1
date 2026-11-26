import "@testing-library/jest-dom";
import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { obtenerUbicacionesProyectos } from "../../service/proyectosService";
import Mapa from "./Mapa";

jest.mock("../../service/proyectosService", () => ({
  obtenerUbicacionesProyectos: jest.fn(),
}));
jest.mock("react-router-dom", () => ({
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

it("muestra la escala real, todas las provincias y el detalle de la selección", async () => {
  obtenerUbicacionesProyectos.mockResolvedValue([
    { codigo: "AR-B", nombre: "Buenos Aires", cantidad: 2, proyectos: [] },
  ]);
  render(<Mapa />);

  expect(await screen.findByText("2 proyectos")).toBeInTheDocument();
  const tabla = screen.getByRole("table");
  expect(
    within(tabla).getByRole("button", { name: "Buenos Aires" }),
  ).toBeInTheDocument();
  expect(
    within(tabla).getByRole("button", { name: "Catamarca" }),
  ).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Buenos Aires: 2 proyectos" }),
  );
  expect(
    screen.getByRole("heading", { name: "Proyectos en Buenos Aires" }),
  ).toBeInTheDocument();
  fireEvent.click(within(tabla).getByRole("button", { name: "Catamarca" }));
  expect(
    screen.getByText("No hay proyectos activos en esta provincia."),
  ).toBeInTheDocument();
});
