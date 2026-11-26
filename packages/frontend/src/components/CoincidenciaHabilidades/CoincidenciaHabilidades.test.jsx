import "@testing-library/jest-dom";
import React from "react";
import { render, screen, within } from "@testing-library/react";
import CoincidenciaHabilidades from "./CoincidenciaHabilidades";

it("mantiene el estado accesible sin mostrar texto extra en las habilidades", () => {
  render(
    <CoincidenciaHabilidades
      perfil={{ habilidadesRequeridas: ["React", "Node"] }}
      habilidadesPersona={["React"]}
    />,
  );
  const react = screen.getByText("React").closest("li");
  const node = screen.getByText("Node").closest("li");
  expect(within(react).getByText("Cumple")).toHaveClass("visualmente-oculto");
  expect(within(node).getByText("Falta")).toHaveClass("visualmente-oculto");
  expect(react.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  expect(node.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
});
