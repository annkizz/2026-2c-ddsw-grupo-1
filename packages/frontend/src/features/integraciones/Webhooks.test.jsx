import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useAuth } from "../../hooks/useAuth.jsx";
import { useNotificar } from "../../components/Notificador/Notificador.jsx";
import {
  actualizarWebhook,
  crearWebhook,
  listarWebhooks,
  probarWebhook,
} from "../../service/webhooksService";
import Webhooks from "./Webhooks";

jest.mock("../../hooks/useAuth.jsx", () => ({ useAuth: jest.fn() }));
jest.mock("../../components/Notificador/Notificador.jsx", () => ({
  useNotificar: jest.fn(),
}));
jest.mock("../../components/EncabezadoPagina/EncabezadoPagina.jsx", () => {
  const React = require("react");
  return function EncabezadoPagina({ titulo, subtitulo }) {
    return React.createElement(
      "header",
      null,
      React.createElement("h1", null, titulo),
      React.createElement("p", null, subtitulo),
    );
  };
});
jest.mock("../../service/webhooksService", () => ({
  actualizarWebhook: jest.fn(),
  crearWebhook: jest.fn(),
  eliminarWebhook: jest.fn(),
  listarWebhooks: jest.fn(),
  probarWebhook: jest.fn(),
  regenerarSecretoWebhook: jest.fn(),
}));

const webhook = {
  id: "webhook-1",
  url: "https://hooks.example/…path",
  eventos: ["POSTULACION_CREADA"],
  formato: "GENERICO",
  activo: true,
  ultimaEntrega: null,
};

describe("administración de webhooks", () => {
  const notificar = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      sesion: { idColectivo: "colectivo-1" },
      getAccessToken: jest.fn().mockResolvedValue("token"),
    });
    useNotificar.mockReturnValue(notificar);
  });

  it("muestra la integración y el resultado de una prueba de entrega", async () => {
    listarWebhooks.mockResolvedValue([webhook]);
    probarWebhook.mockResolvedValue({ estado: "ENVIADO", httpStatus: 204 });

    render(<Webhooks />);

    expect(await screen.findByText(webhook.url)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Probar envío" }));

    expect(await screen.findByText("Enviado")).toBeInTheDocument();
    expect(probarWebhook).toHaveBeenCalledWith(
      "token",
      "colectivo-1",
      "webhook-1",
    );
  });

  it("crea el webhook con eventos elegidos y muestra el secreto una sola vez", async () => {
    listarWebhooks.mockResolvedValue([]);
    const creado = {
      ...webhook,
      secreto: "secreto-de-prueba",
    };
    crearWebhook.mockResolvedValue(creado);

    render(<Webhooks />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Agregar webhook" }),
    );
    fireEvent.change(screen.getByRole("textbox", { name: /URL de destino/ }), {
      target: { value: "https://hooks.example/receiver" },
    });
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Nueva postulación" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Crear webhook" }));

    await waitFor(() => {
      expect(crearWebhook).toHaveBeenCalledWith("token", "colectivo-1", {
        url: "https://hooks.example/receiver",
        eventos: ["POSTULACION_CREADA"],
        formato: "GENERICO",
        activo: true,
      });
    });
    expect(await screen.findByText("secreto-de-prueba")).toBeInTheDocument();
  });

  it("edita eventos sin reenviar la URL que la API devuelve enmascarada", async () => {
    listarWebhooks.mockResolvedValue([webhook]);
    actualizarWebhook.mockResolvedValue({
      ...webhook,
      eventos: ["POSTULACION_CREADA", "PROYECTO_CERRADO"],
    });

    render(<Webhooks />);
    fireEvent.click(await screen.findByRole("button", { name: "Editar" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Proyecto cerrado" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => {
      expect(actualizarWebhook).toHaveBeenCalledWith(
        "token",
        "colectivo-1",
        "webhook-1",
        {
          eventos: ["POSTULACION_CREADA", "PROYECTO_CERRADO"],
          formato: "GENERICO",
          activo: true,
        },
      );
    });
  });
});
