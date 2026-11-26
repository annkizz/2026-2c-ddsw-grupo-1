import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.jsx";
import { obtenerMisPostulaciones } from "../../service/colaboradorasService";
import MisPostulaciones from "./MisPostulaciones.jsx";

jest.mock("react-router-dom", () => ({ useNavigate: jest.fn() }));
jest.mock("../../hooks/useAuth.jsx", () => ({ useAuth: jest.fn() }));
jest.mock("../../service/colaboradorasService", () => ({
  obtenerMisPostulaciones: jest.fn(),
}));

describe("MisPostulaciones", () => {
  const navigate = jest.fn();
  const getAccessToken = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    getAccessToken.mockResolvedValue("token");
    useNavigate.mockReturnValue(navigate);
    useAuth.mockReturnValue({ getAccessToken });
  });

  it("muestra los estados y permite abrir el proyecto", async () => {
    obtenerMisPostulaciones.mockResolvedValue([
      {
        id: "1",
        idProyecto: "p1",
        estado: "PENDIENTE",
        proyecto: { titulo: "Proyecto uno" },
      },
      {
        id: "2",
        idProyecto: "p2",
        estado: "ACEPTADA",
        proyecto: { titulo: "Proyecto dos" },
      },
      {
        id: "3",
        idProyecto: "p3",
        estado: "RECHAZADA",
        proyecto: { titulo: "Proyecto tres" },
      },
    ]);

    render(<MisPostulaciones />);

    expect(await screen.findByText("Pendiente")).toBeInTheDocument();
    expect(screen.getByText("Aceptada")).toBeInTheDocument();
    expect(screen.getByText("Rechazada")).toBeInTheDocument();
    expect(obtenerMisPostulaciones).toHaveBeenCalledWith("token");
    fireEvent.click(screen.getAllByRole("button", { name: "Ver proyecto" })[0]);
    expect(navigate).toHaveBeenCalledWith("/proyectos/p1");
  });

  it("permite reintentar si falla la carga", async () => {
    obtenerMisPostulaciones
      .mockRejectedValueOnce(new Error("Error de conexión"))
      .mockResolvedValueOnce([]);

    render(<MisPostulaciones />);
    fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
    expect(
      await screen.findByText("Todavía no tenés postulaciones"),
    ).toBeInTheDocument();
    expect(obtenerMisPostulaciones).toHaveBeenCalledTimes(2);
  });
});
