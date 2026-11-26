import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.jsx";
import { obtenerMisColaboraciones } from "../../service/colaboradorasService";
import { darDeBajaColaboracion } from "../../service/proyectosService";
import MisColaboraciones from "./MisColaboraciones.jsx";

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

jest.mock("../../hooks/useAuth.jsx", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../service/colaboradorasService", () => ({
  obtenerMisColaboraciones: jest.fn(),
}));

jest.mock("../../service/proyectosService", () => ({
  darDeBajaColaboracion: jest.fn(),
}));

describe("MisColaboraciones", () => {
  const navigate = jest.fn();
  const getAccessToken = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    getAccessToken.mockResolvedValue("token");
    useNavigate.mockReturnValue(navigate);
    useAuth.mockReturnValue({
      getAccessToken,
      sesion: { idColaborador: "c1" },
    });
  });

  it("muestra el avance y abre el detalle del proyecto", async () => {
    obtenerMisColaboraciones.mockResolvedValue([
      {
        idProyecto: "p1",
        fecha: "2026-10-01T00:00:00.000Z",
        proyecto: {
          id: "p1",
          titulo: "Proyecto solidario",
          descripcion: "Descripción del proyecto",
          estado: "ACTIVO",
          porcentajeConcrecion: 35,
        },
      },
    ]);

    render(<MisColaboraciones />);

    expect(await screen.findByText("Proyecto solidario")).toBeInTheDocument();
    expect(screen.getByText("35 %")).toBeInTheDocument();
    expect(obtenerMisColaboraciones).toHaveBeenCalledWith("token");

    fireEvent.click(
      screen.getByRole("button", { name: "Ver detalle y avance" }),
    );
    expect(navigate).toHaveBeenCalledWith("/proyectos/p1", {
      state: { volverA: "/mis-colaboraciones" },
    });
  });

  it("ofrece buscar proyectos cuando todavía no tiene colaboraciones", async () => {
    obtenerMisColaboraciones.mockResolvedValue([]);

    render(<MisColaboraciones />);

    expect(
      await screen.findByText("No tenés colaboraciones en proyectos activos"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Buscar proyectos" }));

    expect(navigate).toHaveBeenCalledWith("/buscar-proyectos");
  });

  it("muestra solo colaboraciones de proyectos activos", async () => {
    obtenerMisColaboraciones.mockResolvedValue([
      { idProyecto: "p1", proyecto: { titulo: "Activo", estado: "ACTIVO" } },
      {
        idProyecto: "p2",
        proyecto: { titulo: "Finalizado", estado: "FINALIZADO" },
      },
    ]);

    render(<MisColaboraciones />);

    expect(
      await screen.findByText("Activo", { selector: "h2" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Finalizado")).not.toBeInTheDocument();
  });

  it("solicita confirmación antes de dar de baja la colaboración", async () => {
    obtenerMisColaboraciones.mockResolvedValue([
      {
        idProyecto: "p1",
        proyecto: { titulo: "Proyecto solidario", estado: "ACTIVO" },
      },
    ]);
    darDeBajaColaboracion.mockResolvedValue({});

    render(<MisColaboraciones />);
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Dar de baja mi colaboración",
      }),
    );
    expect(
      screen.getByText("Esta acción es permanente y no se puede deshacer."),
    ).toBeInTheDocument();
    expect(darDeBajaColaboracion).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(darDeBajaColaboracion).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Dar de baja mi colaboración" }),
    );
    fireEvent.click(
      screen
        .getAllByRole("button", { name: "Dar de baja mi colaboración" })
        .pop(),
    );

    expect(
      await screen.findByText("Tu colaboración se dio de baja."),
    ).toBeInTheDocument();
    expect(darDeBajaColaboracion).toHaveBeenCalledWith("token", "p1", "c1");
    expect(screen.queryByText("Proyecto solidario")).not.toBeInTheDocument();
  });
});
