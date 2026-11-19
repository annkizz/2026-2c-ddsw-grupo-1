import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "../hooks/useAuth.jsx";
import { crearNotificacion } from "../service/notificacionesService";
import CardColaboradora from "./CardColaboradora/CardColaboradora";

jest.mock("../hooks/useAuth.jsx", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../service/notificacionesService", () => ({
  crearNotificacion: jest.fn(),
}));

describe("CardColaboradora - mensajería interna", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      getAccessToken: jest.fn().mockResolvedValue("token"),
    });
    crearNotificacion.mockResolvedValue({
      envios: [{ tipoDeContacto: "EMAIL", estado: "SIMULADO" }],
    });
  });

  it("envía un mensaje solo a una colaboradora que aceptó mensajería", async () => {
    render(
      <ul>
        <CardColaboradora
          colaboradora={{
            id: "colaboradora-1",
            nombreFantasia: "Ada",
            aceptaMensajeria: true,
          }}
        />
      </ul>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Contactar" }));
    await userEvent.type(
      screen.getByRole("textbox", { name: "Mensaje" }),
      "Hola, queremos invitarte.",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Enviar mensaje" }),
    );

    await waitFor(() => {
      expect(crearNotificacion).toHaveBeenCalledWith("token", {
        idColaborador: "colaboradora-1",
        contenido: "Hola, queremos invitarte.",
      });
    });
    expect(
      await screen.findByText(
        "El mensaje quedó enviado dentro de la plataforma.",
      ),
    ).toBeInTheDocument();
  });

  it("deshabilita contacto si la persona no acepta mensajes internos", () => {
    render(
      <ul>
        <CardColaboradora
          colaboradora={{
            id: "colaboradora-2",
            nombreFantasia: "Luna",
            aceptaMensajeria: false,
          }}
        />
      </ul>,
    );

    expect(
      screen.getByRole("button", { name: "No acepta mensajes" }),
    ).toBeDisabled();
    expect(crearNotificacion).not.toHaveBeenCalled();
  });
});
