import React from "react";
import "@testing-library/jest-dom";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "../hooks/useAuth.jsx";
import { invitarAColaborar } from "../service/proyectosService";
import CardColaboradora from "./CardColaboradora/CardColaboradora";

jest.mock("../hooks/useAuth.jsx", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../service/proyectosService", () => ({
  invitarAColaborar: jest.fn(),
}));

describe("CardColaboradora - mensajería interna", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      getAccessToken: jest.fn().mockResolvedValue("token"),
    });
    invitarAColaborar.mockResolvedValue({ tipo: "INVITACION_PROYECTO" });
  });

  it("envía una invitación con mensaje opcional", async () => {
    render(
      <ul>
        <CardColaboradora
          idProyecto="proyecto-1"
          idPerfil="perfil-1"
          nombreProyecto="Huerta"
          descripcionPerfil="Diseñadora"
          colaboradora={{
            id: "colaboradora-1",
            nombreFantasia: "Ada",
            aceptaMensajeria: true,
          }}
        />
      </ul>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Contactar" }));
    expect(screen.getByText("Proyecto: Huerta")).toBeInTheDocument();
    expect(screen.getByText("Perfil: Diseñadora")).toBeInTheDocument();
    await userEvent.type(
      screen.getByRole("textbox", { name: "Mensaje opcional" }),
      "Hola, queremos invitarte.",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Enviar invitación" }),
    );

    await waitFor(() => {
      expect(invitarAColaborar).toHaveBeenCalledWith("token", "proyecto-1", "perfil-1", "colaboradora-1", "Hola, queremos invitarte.");
    });
    expect(
      await screen.findByText(
        "La invitación quedó enviada dentro de la plataforma.",
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
    expect(invitarAColaborar).not.toHaveBeenCalled();
  });

  it("permite enviar una invitación sin mensaje", async () => {
    render(
      <ul>
        <CardColaboradora
          idProyecto="proyecto-1"
          idPerfil="perfil-1"
          colaboradora={{
            id: "colaboradora-1",
            nombreFantasia: "Ada",
            aceptaMensajeria: true,
          }}
        />
      </ul>,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Contactar" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Enviar invitación" }));

    await waitFor(() => {
      expect(invitarAColaborar).toHaveBeenCalledWith(
        "token",
        "proyecto-1",
        "perfil-1",
        "colaboradora-1",
        "",
      );
    });

    expect(
      await screen.findByText(
        "La invitación quedó en la bandeja de notificaciones de la persona.",
      ),
    ).toBeInTheDocument();
  });

  it("mantiene el diálogo abierto durante el envío y muestra un error", async () => {
    let rechazar;
    invitarAColaborar.mockReturnValue(new Promise((_resolve, reject) => {
      rechazar = reject;
    }));
    render(
      <ul><CardColaboradora idProyecto="p" idPerfil="f" colaboradora={{
        id: "c", nombreFantasia: "Ada", aceptaMensajeria: true,
      }} /></ul>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Contactar" }));
    await userEvent.click(screen.getByRole("button", { name: "Enviar invitación" }));
    await waitFor(() => expect(invitarAColaborar).toHaveBeenCalled());
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    await act(async () => rechazar(new Error("falló")));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("asocia cada tarjeta de la misma persona con sus propios elementos", () => {
    const colaboradora = { id: "c", nombreFantasia: "Ada", aceptaMensajeria: true };
    render(<ul>
      <CardColaboradora colaboradora={colaboradora} idProyecto="p" idPerfil="f1" />
      <CardColaboradora colaboradora={colaboradora} idProyecto="p" idPerfil="f2" />
    </ul>);
    const tarjetas = screen.getAllByRole("listitem", { name: "Ada" });
    const titulos = tarjetas.map((tarjeta) => within(tarjeta).getByRole("heading", { name: "Ada" }).id);
    const descripciones = tarjetas.map((tarjeta) =>
      within(tarjeta).getByRole("button", { name: "Contactar" }).getAttribute("aria-describedby"),
    );
    expect(new Set(titulos).size).toBe(2);
    expect(new Set(descripciones).size).toBe(2);
    tarjetas.forEach((tarjeta, indice) => {
      expect(tarjeta).toHaveAttribute("aria-labelledby", titulos[indice]);
      expect(tarjeta.querySelector(`[id="${descripciones[indice]}"]`)).not.toBeNull();
    });
  });
});
