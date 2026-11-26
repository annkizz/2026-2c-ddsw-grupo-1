import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "../../hooks/useAuth.jsx";
import {
  actualizarProyecto,
  crearProyecto,
  obtenerProyectoPorId,
} from "../../service/proyectosService";
import FormularioProyecto from "./FormularioProyecto";

let mockParams = {};
jest.mock("../../hooks/useAuth.jsx", () => ({ useAuth: jest.fn() }));
jest.mock("../../hooks/useListado", () => ({
  useListado: () => ({
    datos: [],
    cargando: false,
    error: null,
    recargar: jest.fn(),
  }),
}));
jest.mock("react-router-dom", () => ({
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => jest.fn(),
  useParams: () => mockParams,
}));
jest.mock("../../service/proyectosService", () => ({
  crearProyecto: jest.fn(),
  actualizarProyecto: jest.fn(),
  obtenerProyectoPorId: jest.fn(),
  configurarBusqueda: jest.fn(),
  programarCierre: jest.fn(),
}));

describe("FormularioProyecto por pasos", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      sesion: { idColectivo: "colectivo-1", rol: "COLECTIVO" },
      getAccessToken: jest.fn().mockResolvedValue("token"),
    });
    crearProyecto.mockResolvedValue({ id: "proyecto-1" });
    mockParams = {};
  });

  it("muestra un paso a la vez y no avanza sin los datos obligatorios", async () => {
    render(<FormularioProyecto />);

    expect(
      screen.getByRole("heading", { name: "Lo básico" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Fecha de cierre automático (opcional)"),
    ).not.toBeInTheDocument();
    // En el primer paso todavía no se puede crear: el botón aparece recién en el último.
    expect(
      screen.queryByRole("button", { name: "Crear proyecto" }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Siguiente: Etiquetas y ubicación" }),
    );
    expect(
      await screen.findByText("Revisá 2 campos antes de continuar"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Lo básico" }),
    ).toBeInTheDocument();
  });

  it("recorre los tres pasos con Siguiente y crea al final", async () => {
    render(<FormularioProyecto />);

    await userEvent.type(
      screen.getByRole("textbox", { name: "Título (obligatorio)" }),
      "Huerta",
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "Descripción (obligatoria)" }),
      "Turnos de la huerta",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Siguiente: Etiquetas y ubicación" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Etiquetas y ubicación" }),
    ).toBeInTheDocument();
    expect(crearProyecto).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Crear proyecto" }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Siguiente: Fechas y búsqueda" }),
    );

    expect(
      await screen.findByLabelText("Fecha de cierre automático (opcional)"),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Crear proyecto" }),
    );

    await waitFor(() =>
      expect(crearProyecto).toHaveBeenCalledWith(
        "token",
        expect.objectContaining({
          idColectivo: "colectivo-1",
          titulo: "Huerta",
          descripcion: "Turnos de la huerta",
        }),
      ),
    );
  });

  it("no deja saltear pasos que no se vieron, pero sí volver a los ya vistos", async () => {
    render(<FormularioProyecto />);

    // Desde el primer paso no se puede saltar directo al último.
    expect(
      screen.getByRole("tab", { name: /Fechas y búsqueda/ }),
    ).toBeDisabled();

    await userEvent.type(
      screen.getByRole("textbox", { name: "Título (obligatorio)" }),
      "Huerta",
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "Descripción (obligatoria)" }),
      "Turnos",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Siguiente: Etiquetas y ubicación" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Siguiente: Fechas y búsqueda" }),
    );

    // Ya vio los tres pasos: puede volver al primero, corregir y saltar de nuevo al último.
    await userEvent.click(screen.getByRole("tab", { name: /Lo básico/ }));
    expect(
      screen.getByRole("textbox", { name: "Título (obligatorio)" }),
    ).toHaveValue("Huerta");
    expect(
      screen.queryByRole("button", { name: "Crear proyecto" }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("tab", { name: /Fechas y búsqueda/ }),
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Crear proyecto" }),
    );

    await waitFor(() => expect(crearProyecto).toHaveBeenCalledTimes(1));
  });

  it("en el paso 3 deja abrir la búsqueda sin crear el proyecto antes de tiempo", async () => {
    render(<FormularioProyecto />);

    await userEvent.type(
      screen.getByRole("textbox", { name: "Título (obligatorio)" }),
      "Huerta",
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "Descripción (obligatoria)" }),
      "Turnos",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Siguiente: Etiquetas y ubicación" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Siguiente: Fechas y búsqueda" }),
    );

    expect(crearProyecto).not.toHaveBeenCalled();
    const interruptor = await screen.findByRole("switch", {
      name: "Búsqueda abierta",
    });
    await userEvent.click(interruptor);
    expect(interruptor).toBeChecked();
    await userEvent.click(
      screen.getByRole("button", { name: "Crear proyecto" }),
    );

    await waitFor(() =>
      expect(crearProyecto).toHaveBeenCalledWith(
        "token",
        expect.objectContaining({ busquedaAbierta: true }),
      ),
    );
  });

  it("al editar usa un menú lateral, sin búsqueda y con la ubicación solo de lectura", async () => {
    mockParams = { id: "proyecto-1" };
    obtenerProyectoPorId.mockResolvedValue({
      id: "proyecto-1",
      idColectivo: "colectivo-1",
      titulo: "Huerta",
      descripcion: "Turnos",
      etiquetas: [],
      estado: "ACTIVO",
      ubicacion: { codigoProvincia: "AR-B", ciudad: "Lanús" },
    });
    actualizarProyecto.mockResolvedValue({});
    render(<FormularioProyecto />);

    const nav = await screen.findByRole("navigation", {
      name: "Partes del proyecto",
    });
    expect(
      screen.queryByRole("list", { name: "Pasos para cargar el proyecto" }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      within(nav).getByRole("button", { name: /Etiquetas y ubicación/ }),
    );
    expect(screen.getByText(/Lanús/)).toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: /Provincia/ }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      within(nav).getByRole("button", { name: /Fecha de cierre/ }),
    );
    expect(
      screen.queryByText("Búsqueda de colaboradoras abierta"),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Guardar cambios" }),
    );
    await waitFor(() => expect(actualizarProyecto).toHaveBeenCalledTimes(1));
  });

  it("si el proyecto es de otro colectivo muestra un 404, como si la página no existiera", async () => {
    mockParams = { id: "proyecto-ajeno" };
    obtenerProyectoPorId.mockResolvedValue({
      id: "proyecto-ajeno",
      idColectivo: "otro-colectivo",
      titulo: "Ajeno",
    });
    render(<FormularioProyecto />);

    expect(await screen.findByText("Error 404")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "No encontramos esta página",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Ajeno")).not.toBeInTheDocument();
  });
});
