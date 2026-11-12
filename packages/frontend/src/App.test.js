import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import App from "./App";
import {
  crearProyecto,
  obtenerColectivos,
  obtenerProyectos,
} from "./services/api";

jest.mock("./services/api");

beforeEach(() => {
  obtenerProyectos.mockResolvedValue([
    {
      id: "project-1",
      titulo: "Red de alimentos",
      descripcion: "Herramienta para coordinar donaciones.",
      estado: "ACTIVO",
      porcentajeConcrecion: 40,
      perfiles: [],
    },
    {
      id: "project-2",
      titulo: "Biblioteca abierta",
      descripcion: "Catálogo comunitario.",
      estado: "FINALIZADO",
      porcentajeConcrecion: 100,
      perfiles: [],
    },
  ]);
  obtenerColectivos.mockResolvedValue([]);
});

test("muestra proyectos y permite filtrar por título", async () => {
  render(<App />);

  expect(
    await screen.findByRole("heading", { name: "Red de alimentos" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Biblioteca abierta" }),
  ).toBeInTheDocument();

  fireEvent.change(screen.getByRole("textbox", { name: "Buscar por título" }), {
    target: { value: "biblioteca" },
  });

  expect(
    screen.getByRole("heading", { name: "Biblioteca abierta" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Red de alimentos" }),
  ).not.toBeInTheDocument();
});

test("valida los datos requeridos antes de crear un proyecto", async () => {
  render(<App />);
  await screen.findByRole("heading", { name: "Red de alimentos" });
  fireEvent.click(screen.getByRole("button", { name: "Crear proyecto" }));

  const dialog = screen.getByRole("dialog");
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Crear proyecto" }),
  );

  expect(
    await within(dialog).findByText(
      "Completá el título, la descripción y el colectivo.",
    ),
  ).toBeInTheDocument();
  expect(crearProyecto).not.toHaveBeenCalled();
});
