import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import BotonModoDaltonico from "./BotonModoDaltonico";
import {
  CLAVE_MODO_COLOR,
  ModoColorProvider,
  useModoColor,
} from "../../theme/ModoColorContext.jsx";

const ColorPrimario = () => {
  const { tokens } = useModoColor();
  return <span data-testid="color-primario">{tokens["--color-primary"]}</span>;
};

const renderizar = () =>
  render(
    <ModoColorProvider>
      <BotonModoDaltonico />
      <ColorPrimario />
    </ModoColorProvider>,
  );

describe("BotonModoDaltonico", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-modo-color");
  });

  it("activa el modo, lo marca con aria-pressed, en <html> y lo anuncia", () => {
    renderizar();
    const boton = screen.getByRole("button", { name: "Modo daltónico" });
    expect(boton).toHaveAttribute("aria-pressed", "false");
    expect(document.documentElement).not.toHaveAttribute("data-modo-color");

    fireEvent.click(boton);

    const activo = screen.getByRole("button", {
      name: "Modo daltónico: activado",
    });
    expect(activo).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement).toHaveAttribute(
      "data-modo-color",
      "daltonico",
    );
    expect(window.localStorage.getItem(CLAVE_MODO_COLOR)).toBe("daltonico");
    expect(screen.getByTestId("color-primario")).toHaveTextContent("#0072B2");
    expect(screen.getByTestId("anuncio-modo-color")).toHaveTextContent(
      "Modo daltónico activado",
    );
  });

  it("recuerda la preferencia al volver a cargar y permite desactivarla", () => {
    window.localStorage.setItem(CLAVE_MODO_COLOR, "daltonico");
    renderizar();

    const boton = screen.getByRole("button", {
      name: "Modo daltónico: activado",
    });
    expect(boton).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement).toHaveAttribute(
      "data-modo-color",
      "daltonico",
    );

    fireEvent.click(boton);

    expect(
      screen.getByRole("button", { name: "Modo daltónico" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(document.documentElement).not.toHaveAttribute("data-modo-color");
    expect(window.localStorage.getItem(CLAVE_MODO_COLOR)).toBe("normal");
    expect(screen.getByTestId("color-primario")).toHaveTextContent("#0F766E");
    expect(screen.getByTestId("anuncio-modo-color")).toHaveTextContent(
      "Modo daltónico desactivado",
    );
  });

  it("sigue funcionando si localStorage no está disponible", () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = () => {
      throw new Error("bloqueado");
    };
    try {
      renderizar();
      expect(
        screen.getByRole("button", { name: "Modo daltónico" }),
      ).toHaveAttribute("aria-pressed", "false");
    } finally {
      Storage.prototype.getItem = original;
    }
  });
});
