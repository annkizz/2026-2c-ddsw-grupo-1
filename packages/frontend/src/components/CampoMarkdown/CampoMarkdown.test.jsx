import React, { useState } from "react";
import PropTypes from "prop-types";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CampoMarkdown from "./CampoMarkdown";

const Campo = (props) => {
  const [valor, setValor] = useState(props.inicial ?? "");
  return (
    <CampoMarkdown
      id="descripcion"
      label="Descripción"
      value={valor}
      onChange={(e) => setValor(e.target.value)}
      multiline
      {...props}
    />
  );
};

Campo.propTypes = { inicial: PropTypes.string };

describe("CampoMarkdown", () => {
  it("se usa como un campo de texto común", async () => {
    render(<Campo />);
    await userEvent.type(
      screen.getByRole("textbox", { name: "Descripción" }),
      "Hola",
    );
    expect(screen.getByRole("textbox", { name: "Descripción" })).toHaveValue(
      "Hola",
    );
  });

  it("el botón Negrita envuelve el texto elegido", async () => {
    render(<Campo inicial="Hola mundo" />);
    const campo = screen.getByRole("textbox", { name: "Descripción" });
    campo.setSelectionRange(5, 10);

    await userEvent.click(screen.getByRole("button", { name: "Negrita" }));
    expect(campo).toHaveValue("Hola **mundo**");
  });

  it("Lista agrega viñetas y Enlace arma la sintaxis", async () => {
    render(<Campo inicial="uno" />);
    const campo = screen.getByRole("textbox", { name: "Descripción" });
    campo.setSelectionRange(0, 3);
    await userEvent.click(screen.getByRole("button", { name: "Lista" }));
    expect(campo).toHaveValue("- uno");

    campo.setSelectionRange(2, 5);
    await userEvent.click(screen.getByRole("button", { name: "Enlace" }));
    expect(campo).toHaveValue("- [uno](https://)");
  });

  it("muestra la vista previa con el formato aplicado", async () => {
    render(<Campo inicial={"## Objetivo\n\n**Turnos** para la huerta"} />);
    const boton = screen.getByRole("button", { name: "Vista previa" });
    expect(boton).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(boton);
    const vista = screen.getByRole("region", { name: "Vista previa" });
    expect(vista.querySelector("strong")).toHaveTextContent("Turnos");
    expect(
      screen.getByRole("heading", { name: "Objetivo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ocultar vista previa" }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("en modo en línea no ofrece listas", () => {
    render(<Campo enLinea />);
    expect(
      screen.queryByRole("button", { name: "Lista" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Negrita" })).toBeInTheDocument();
  });
});
