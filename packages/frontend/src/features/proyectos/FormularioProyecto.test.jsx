import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '../../hooks/useAuth.jsx';
import { crearProyecto } from '../../service/proyectosService';
import FormularioProyecto from './FormularioProyecto';

jest.mock('../../hooks/useAuth.jsx', () => ({ useAuth: jest.fn() }));
jest.mock('../../hooks/useListado', () => ({
  useListado: () => ({ datos: [], cargando: false, error: null, recargar: jest.fn() }),
}));
jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
}));
jest.mock('../../service/proyectosService', () => ({
  crearProyecto: jest.fn(),
  actualizarProyecto: jest.fn(),
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
  });

  it('muestra un paso a la vez y no avanza sin los datos obligatorios', async () => {
    render(<FormularioProyecto />);

    expect(screen.getByRole('heading', { name: 'Lo básico' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Fecha de cierre automático (opcional)')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente: Etiquetas y ubicación' }));
    expect(await screen.findByText('Revisá 2 campos antes de continuar')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Lo básico' })).toBeInTheDocument();
  });

  it('recorre los pasos y crea el proyecto recién en el último', async () => {
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
});
