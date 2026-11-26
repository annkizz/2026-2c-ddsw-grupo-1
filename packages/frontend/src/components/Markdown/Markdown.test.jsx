import React from "react";
import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import Markdown, { MarkdownEnLinea } from "./Markdown";
import { markdownATextoPlano, urlSegura } from "../../utils/markdown";

const dibujar = (texto, props) =>
  render(<Markdown texto={texto} {...props} />).container;

describe("Markdown", () => {
  it("da formato en línea: negrita, cursiva, tachado y código", () => {
    const contenedor = dibujar(
      "Hola **mundo**, *esto* es _cursiva_, ~~viejo~~ y `npm start`.",
    );

    expect(contenedor.querySelector("strong")).toHaveTextContent("mundo");
    expect(contenedor.querySelectorAll("em")).toHaveLength(2);
    expect(contenedor.querySelector("del")).toHaveTextContent("viejo");
    expect(contenedor.querySelector("code")).toHaveTextContent("npm start");
  });

  it("respeta los saltos de línea y separa párrafos", () => {
    const contenedor = dibujar("Línea uno\nLínea dos\n\nOtro párrafo");

    expect(contenedor.querySelectorAll("p")).toHaveLength(2);
    expect(contenedor.querySelector("p br")).toBeInTheDocument();
  });

  it("arma listas con viñetas, numeradas y anidadas", () => {
    const contenedor = dibujar(
      "- Uno\n- Dos\n  - Dos A\n\n1. Primero\n2. Segundo",
    );

    const [listaViñetas] = contenedor.querySelectorAll(".markdown > ul");
    expect(within(listaViñetas).getAllByRole("listitem")).toHaveLength(3);
    expect(listaViñetas.querySelector("li ul li")).toHaveTextContent("Dos A");
    expect(contenedor.querySelector("ol")).toHaveTextContent("PrimeroSegundo");
  });

  it("corre los títulos para no romper la jerarquía de la página", () => {
    dibujar("# Objetivo\n## Detalle", { nivelTitulo: 3 });

    expect(
      screen.getByRole("heading", { level: 3, name: "Objetivo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 4, name: "Detalle" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("muestra citas, bloques de código y separadores", () => {
    const contenedor = dibujar("> Una cita\n\n```js\nconst a = 1;\n```\n\n---");

    expect(contenedor.querySelector("blockquote")).toHaveTextContent(
      "Una cita",
    );
    expect(contenedor.querySelector("pre code")).toHaveTextContent(
      "const a = 1;",
    );
    expect(contenedor.querySelector("hr")).toBeInTheDocument();
  });

  it("crea enlaces seguros que avisan que se abren en otra pestaña", () => {
    dibujar(
      "Mirá [el repo](https://github.com/ejemplo) o https://ejemplo.org.",
    );

    const repo = screen.getByRole("link", { name: /el repo/ });
    expect(repo).toHaveAttribute("href", "https://github.com/ejemplo");
    expect(repo).toHaveAttribute("target", "_blank");
    expect(repo).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(
      screen.getByRole("link", { name: /https:\/\/ejemplo\.org/ }),
    ).toHaveAttribute("href", "https://ejemplo.org");
  });

  it("no ejecuta HTML ni acepta enlaces javascript: (sin XSS)", () => {
    const contenedor = dibujar(
      '<img src=x onerror="alert(1)"> [clic](javascript:alert(1)) <script>alert(2)</script>',
    );

    expect(contenedor.querySelector("img")).toBeNull();
    expect(contenedor.querySelector("script")).toBeNull();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(contenedor).toHaveTextContent('<img src=x onerror="alert(1)">');
    expect(contenedor).toHaveTextContent("clic");
    expect(urlSegura("data:text/html,hola")).toBeNull();
  });

  it("no confunde snake_case ni asteriscos sueltos con cursiva", () => {
    const contenedor = dibujar("Usar mi_variable_larga y 2 * 3 = 6");

    expect(contenedor.querySelector("em")).toBeNull();
    expect(contenedor).toHaveTextContent("Usar mi_variable_larga y 2 * 3 = 6");
  });

  it("permite escapar símbolos con barra invertida", () => {
    const contenedor = dibujar("\\*no es cursiva\\*");

    expect(contenedor.querySelector("em")).toBeNull();
    expect(contenedor).toHaveTextContent("*no es cursiva*");
  });

  it("versión en línea para títulos y texto plano para tarjetas", () => {
    render(
      <h3>
        <MarkdownEnLinea texto="Perfil **frontend**" />
      </h3>,
    );
    expect(
      screen
        .getByRole("heading", { name: "Perfil frontend" })
        .querySelector("strong"),
    ).toBeInTheDocument();
    expect(
      markdownATextoPlano(
        "## Hola\n\n**Mundo** con [enlace](https://a.org)\n- uno\n- dos",
      ),
    ).toBe("Hola Mundo con enlace uno · dos");
  });
});
