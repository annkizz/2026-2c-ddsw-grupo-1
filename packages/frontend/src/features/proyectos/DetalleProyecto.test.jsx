import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '../../hooks/useAuth.jsx';
import {
  crearPostulacion,
  obtenerColaboraciones,
  obtenerLogros,
  obtenerPerfiles,
  obtenerProyectoPorId,
} from '../../service/proyectosService';
import DetalleProyecto from './DetalleProyecto';

jest.mock('../../hooks/useAuth.jsx', () => ({
  useAuth: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => jest.fn(),
  useParams: () => ({ id: 'proyecto-1' }),
}));

jest.mock('../../service/proyectosService', () => ({
  crearPostulacion: jest.fn(),
  obtenerColaboraciones: jest.fn(),
  obtenerLogros: jest.fn(),
  obtenerPerfiles: jest.fn(),
  obtenerProyectoPorId: jest.fn(),
}));

describe('DetalleProyecto - postulaciones', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      sesion: { idColaborador: 'colaborador-1', rol: 'COLABORADOR' },
      getAccessToken: jest.fn().mockResolvedValue('token'),
      isAuthenticated: true,
      cargando: false,
      iniciarSesion: jest.fn(),
    });
    obtenerProyectoPorId.mockResolvedValue({
      id: 'proyecto-1',
      idColectivo: 'colectivo-1',
      titulo: 'Proyecto solidario',
      descripcion: 'Descripción',
      estado: 'ACTIVO',
      busquedaVigente: true,
    });
    obtenerPerfiles.mockResolvedValue([
      {
        id: 'perfil-1',
        descripcion: 'Tester',
        habilidadesRequeridas: [],
        habilidadesOpcionales: [],
        compromiso: {
          tipoCompromiso: 'MENSUALES',
          horas: 4,
          tipoColaboracion: 'GRATUITA',
        },
        limiteColaboraciones: null,
      },
    ]);
    obtenerLogros.mockResolvedValue([]);
    obtenerColaboraciones.mockResolvedValue([]);
    crearPostulacion.mockResolvedValue({ id: 'postulacion-1', estado: 'PENDIENTE' });
  });

  it('envía una postulación con la preferencia de anonimato elegida', async () => {
    render(<DetalleProyecto />);

    await userEvent.click(await screen.findByRole('button', { name: 'Postularme' }));
    await userEvent.click(screen.getByLabelText('Registrar mi contribución de forma anónima'));
    await userEvent.click(screen.getByRole('button', { name: 'Enviar postulación' }));

    await waitFor(() => {
      expect(crearPostulacion).toHaveBeenCalledWith(
        'token',
        'proyecto-1',
        'perfil-1',
        { esAnonima: true }
      );
    });
    expect(await screen.findByText('Tu postulación fue enviada')).toBeInTheDocument();
  });

  it('deshabilita la postulación cuando el perfil ya no tiene vacantes', async () => {
    obtenerPerfiles.mockResolvedValueOnce([
      {
        id: 'perfil-1',
        descripcion: 'Tester',
        habilidadesRequeridas: [],
        habilidadesOpcionales: [],
        compromiso: {
          tipoCompromiso: 'MENSUALES',
          horas: 4,
          tipoColaboracion: 'GRATUITA',
        },
        limiteColaboraciones: 1,
      },
    ]);
    obtenerColaboraciones.mockResolvedValueOnce([{ idPerfil: 'perfil-1' }]);

    render(<DetalleProyecto />);

    expect(await screen.findByText('No quedan vacantes para este perfil')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Postularme' })).toBeDisabled();
  });

  it('mantiene la etiqueta de fecha flotada cuando la búsqueda está cerrada', async () => {
    useAuth.mockReturnValue({
      sesion: { idColectivo: 'colectivo-1', rol: 'COLECTIVO' },
      getAccessToken: jest.fn().mockResolvedValue('token'),
      isAuthenticated: true,
      cargando: false,
    });
    obtenerProyectoPorId.mockResolvedValueOnce({
      id: 'proyecto-1',
      idColectivo: 'colectivo-1',
      titulo: 'Proyecto solidario',
      descripcion: 'Descripción',
      estado: 'ACTIVO',
      busquedaAbierta: false,
      busquedaVigente: false,
      fechaLimiteBusqueda: null,
    });

    render(<DetalleProyecto />);

    fireEvent.click(await screen.findByRole('button', { name: 'Configurar búsqueda' }));

    const fecha = screen.getByLabelText(
      'Fecha límite de la búsqueda (opcional)',
    );
    expect(fecha).toBeDisabled();
    expect(
      screen.getByText('Fecha límite de la búsqueda (opcional)', {
        selector: 'label',
      }),
    ).toHaveClass('MuiInputLabel-shrink');
  });
});
