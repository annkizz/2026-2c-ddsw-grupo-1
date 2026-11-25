import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '../../hooks/useAuth.jsx';
import {
  actualizarProyecto,
  crearProyecto,
  geocodificarDireccion,
  obtenerProyectoPorId,
} from '../../service/proyectosService';
import FormularioProyecto from './FormularioProyecto';

let mockParams = {};
jest.setTimeout(15000);
jest.mock('../../hooks/useAuth.jsx', () => ({ useAuth: jest.fn() }));
jest.mock('../../hooks/useListado', () => ({
  useListado: () => ({ datos: [], cargando: false, error: null, recargar: jest.fn() }),
}));
jest.mock('react-router-dom', () => {
  const PropTypes = require('prop-types');
  const Link = ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  );
  Link.propTypes = {
    children: PropTypes.node,
    to: PropTypes.string.isRequired,
  };
  return {
    Link,
    useNavigate: () => jest.fn(),
    useParams: () => mockParams,
  };
});
jest.mock('react-leaflet', () => {
  const React = require('react');
  const PropTypes = require('prop-types');
  const MapContainer = ({ children }) => (
    <div data-testid="selector-mapa">{children}</div>
  );
  MapContainer.propTypes = { children: PropTypes.node };
  const Marker = () => <span data-testid="punto-geografico" />;
  Marker.propTypes = { position: PropTypes.array };

  return {
    MapContainer,
    Marker,
    TileLayer: () => null,
    useMapEvents: jest.fn(),
  };
});
jest.mock('../../service/proyectosService', () => ({
  crearProyecto: jest.fn(),
  actualizarProyecto: jest.fn(),
  geocodificarDireccion: jest.fn(),
  obtenerProyectoPorId: jest.fn(),
  configurarBusqueda: jest.fn(),
  programarCierre: jest.fn(),
}));

describe('FormularioProyecto por pasos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      sesion: { idColectivo: 'colectivo-1', rol: 'COLECTIVO' },
      getAccessToken: jest.fn().mockResolvedValue('token'),
    });
    crearProyecto.mockResolvedValue({ id: 'proyecto-1' });
    geocodificarDireccion.mockResolvedValue([
      {
        id: 'osm-1',
        direccion: 'Plaza Godoy Cruz, Mendoza, Argentina',
        latitud: -32.89,
        longitud: -68.83,
      },
    ]);
    mockParams = {};
  });

  it('muestra un paso a la vez y no avanza sin los datos obligatorios', async () => {
    render(<FormularioProyecto />);

    expect(screen.getByRole('heading', { name: 'Lo básico' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Fecha de cierre automático (opcional)')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente: Etiquetas y ubicación' }));
    expect(await screen.findByText('Revisá 2 campos antes de continuar')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Lo básico' })).toBeInTheDocument();
  });

  it('recorre los tres pasos con Siguiente y crea al final', async () => {
    render(<FormularioProyecto />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Título (obligatorio)' }), 'Huerta');
    await userEvent.type(screen.getByRole('textbox', { name: 'Descripción (obligatoria)' }), 'Turnos de la huerta');
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente: Etiquetas y ubicación' }));

    expect(await screen.findByRole('heading', { name: 'Etiquetas y ubicación' })).toBeInTheDocument();
    expect(crearProyecto).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente: Fechas y búsqueda' }));

    expect(await screen.findByLabelText('Fecha de cierre automático (opcional)')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Crear proyecto' }));

    await waitFor(() =>
      expect(crearProyecto).toHaveBeenCalledWith(
        'token',
        expect.objectContaining({ idColectivo: 'colectivo-1', titulo: 'Huerta', descripcion: 'Turnos de la huerta' }),
      ),
    );
  });

  it('busca una dirección y envía el punto elegido al crear', async () => {
    render(<FormularioProyecto />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Título (obligatorio)' }), {
      target: { value: 'Huerta' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Descripción (obligatoria)' }), {
      target: { value: 'Turnos' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente: Etiquetas y ubicación' }));
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'País (opcional)' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Argentina' }));
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Provincia (obligatoria)' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Mendoza' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Localidad (obligatoria)' }), {
      target: { value: 'Godoy Cruz' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Dirección o referencia (opcional)' }), {
      target: { value: 'Plaza Godoy Cruz' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Buscar dirección' }));
    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Plaza Godoy Cruz, Mendoza, Argentina',
      }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Crear proyecto' }));

    await waitFor(() =>
      expect(crearProyecto).toHaveBeenCalledWith(
        'token',
        expect.objectContaining({
          ubicacion: {
            pais: 'Argentina',
            provincia: 'AR-M',
            ciudad: 'Godoy Cruz',
            direccion: 'Plaza Godoy Cruz, Mendoza, Argentina',
            latitud: -32.89,
            longitud: -68.83,
          },
        }),
      ),
    );
    expect(geocodificarDireccion).toHaveBeenCalledWith('token', {
      direccion: 'Plaza Godoy Cruz',
      provincia: 'AR-M',
      ciudad: 'Godoy Cruz',
    });
  });

  it('permite volver a un paso anterior y crear sin recorrer los opcionales', async () => {
    render(<FormularioProyecto />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Título (obligatorio)' }), 'Huerta');
    await userEvent.type(screen.getByRole('textbox', { name: 'Descripción (obligatoria)' }), 'Turnos');
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente: Etiquetas y ubicación' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Anterior' }));
    expect(screen.getByRole('textbox', { name: 'Título (obligatorio)' })).toHaveValue('Huerta');

    fireEvent.click(screen.getByRole('tab', { name: /Etiquetas y ubicación/ }));
    expect(await screen.findByRole('heading', { name: 'Etiquetas y ubicación' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /Lo básico/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Crear proyecto' }));

    await waitFor(() => expect(crearProyecto).toHaveBeenCalledTimes(1));
  });

  it('en el paso 3 deja abrir la búsqueda sin crear el proyecto antes de tiempo', async () => {
    render(<FormularioProyecto />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Título (obligatorio)' }), 'Huerta');
    await userEvent.type(screen.getByRole('textbox', { name: 'Descripción (obligatoria)' }), 'Turnos');
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente: Etiquetas y ubicación' }));
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente: Fechas y búsqueda' }));

    expect(crearProyecto).not.toHaveBeenCalled();
    const interruptor = await screen.findByRole('switch', { name: 'Búsqueda abierta' });
    await userEvent.click(interruptor);
    expect(interruptor).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Crear proyecto' }));

    await waitFor(() =>
      expect(crearProyecto).toHaveBeenCalledWith('token', expect.objectContaining({ busquedaAbierta: true })),
    );
  });

  it('al editar conserva una ubicación propia si no se modifica', async () => {
    mockParams = { id: 'proyecto-1' };
    obtenerProyectoPorId.mockResolvedValue({
      id: 'proyecto-1',
      titulo: 'Huerta',
      descripcion: 'Turnos',
      etiquetas: [],
      estado: 'ACTIVO',
      ubicacion: {
        codigoPais: 'AR',
        nombrePais: 'Argentina',
        codigoProvincia: 'AR-B',
        nombreProvincia: 'Buenos Aires',
        ciudad: 'Lanús',
        latitud: -34.7,
        longitud: -58.4,
      },
    });
    actualizarProyecto.mockResolvedValue({});
    render(<FormularioProyecto />);

    const nav = await screen.findByRole('navigation', { name: 'Partes del proyecto' });
    expect(screen.queryByRole('list', { name: 'Pasos para cargar el proyecto' })).not.toBeInTheDocument();
    await userEvent.click(within(nav).getByRole('button', { name: /Etiquetas y ubicación/ }));
    expect(screen.getByRole('textbox', { name: 'Localidad (obligatoria)' })).toHaveValue('Lanús');
    expect(screen.getByRole('combobox', { name: 'Provincia (obligatoria)' })).toBeInTheDocument();

    await userEvent.click(within(nav).getByRole('button', { name: /Fecha de cierre/ }));
    expect(screen.queryByText('Búsqueda de colaboradoras abierta')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() =>
      expect(actualizarProyecto).toHaveBeenCalledWith(
        'token',
        'proyecto-1',
        expect.not.objectContaining({ ubicacion: expect.anything() }),
      ),
    );
  });
});
