import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '../../hooks/useAuth.jsx';
import {
  crearPostulacion,
  obtenerColaboraciones,
  obtenerLogros,
  obtenerPostulaciones,
  obtenerPerfiles,
  obtenerProyectoPorId,
  resolverPostulacion,
} from '../../service/proyectosService';
import { obtenerMisColaboraciones } from '../../service/colaboradorasService';
import DetalleProyecto from './DetalleProyecto';

jest.mock('../../hooks/useAuth.jsx', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../components/Markdown.jsx', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../hooks/useLinkedin.js', () => ({
  useLinkedin: () => ({
    estado: null,
    conectar: jest.fn(),
    recargar: jest.fn(),
  }),
}));

jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ state: null }),
  useParams: () => ({ id: 'proyecto-1' }),
}));

jest.mock('../../service/proyectosService', () => ({
  crearPostulacion: jest.fn(),
  obtenerColaboraciones: jest.fn(),
  obtenerLogros: jest.fn(),
  obtenerPostulaciones: jest.fn(),
  obtenerPerfiles: jest.fn(),
  obtenerProyectoPorId: jest.fn(),
  resolverPostulacion: jest.fn(),
}));

jest.mock('../../service/colaboradorasService', () => ({
  obtenerMisColaboraciones: jest.fn(),
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
    obtenerPostulaciones.mockResolvedValue([]);
    obtenerMisColaboraciones.mockResolvedValue([]);
    crearPostulacion.mockResolvedValue({ id: 'postulacion-1', estado: 'PENDIENTE' });
    resolverPostulacion.mockResolvedValue({});
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
    expect(
      await screen.findByRole('button', { name: 'Postularme' }),
    ).toBeDisabled();
  });

  it('no ofrece postularse a quien ya colabora en el proyecto', async () => {
    obtenerMisColaboraciones.mockResolvedValue([
      { idProyecto: 'proyecto-1', idPerfil: 'perfil-1' },
    ]);

    render(<DetalleProyecto />);

    expect(
      await screen.findByRole('button', {
        name: 'Ya colaborás en este proyecto',
      }),
    ).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'Postularme' }),
    ).not.toBeInTheDocument();
  });

  it('permite al colectivo aceptar una postulación y revela los datos de contacto', async () => {
    const colaboradoraAceptada = {
      id: 'postulacion-1',
      idProyecto: 'proyecto-1',
      idPerfil: 'perfil-1',
      estado: 'ACEPTADA',
      colaborador: {
        id: 'colaboradora-1',
        nombre: 'Ana',
        apellido: 'Gómez',
        mediosDeContacto: [
          { tipoDeContacto: 'EMAIL', contacto: 'ana@example.com' },
        ],
      },
    };
    useAuth.mockReturnValue({
      sesion: { idColectivo: 'colectivo-1', rol: 'COLECTIVO' },
      getAccessToken: jest.fn().mockResolvedValue('token'),
      isAuthenticated: true,
      cargando: false,
    });
    obtenerPostulaciones
      .mockResolvedValueOnce([
        {
          id: 'postulacion-1',
          idProyecto: 'proyecto-1',
          idPerfil: 'perfil-1',
          estado: 'PENDIENTE',
          fechaPostulacion: '2026-11-18T00:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([colaboradoraAceptada]);
    resolverPostulacion.mockResolvedValue(colaboradoraAceptada);

    render(<DetalleProyecto />);

    expect(
      await screen.findByText(
        'La identidad y los datos de contacto se habilitan al aceptar.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Ana Gómez')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));

    await waitFor(() => {
      expect(resolverPostulacion).toHaveBeenCalledWith(
        'token',
        'proyecto-1',
        'postulacion-1',
        'ACEPTADA',
      );
    });
    expect(await screen.findByText(/Colaboradora aceptada: Ana Gómez/)).toBeInTheDocument();
    expect(screen.getByText('EMAIL: ana@example.com')).toBeInTheDocument();
  });

  it('permite al colectivo rechazar una postulación pendiente', async () => {
    useAuth.mockReturnValue({
      sesion: { idColectivo: 'colectivo-1', rol: 'COLECTIVO' },
      getAccessToken: jest.fn().mockResolvedValue('token'),
      isAuthenticated: true,
      cargando: false,
    });
    const postulacionPendiente = {
      id: 'postulacion-1',
      idProyecto: 'proyecto-1',
      idPerfil: 'perfil-1',
      estado: 'PENDIENTE',
    };
    obtenerPostulaciones
      .mockResolvedValueOnce([postulacionPendiente])
      .mockResolvedValueOnce([{ ...postulacionPendiente, estado: 'RECHAZADA' }]);
    resolverPostulacion.mockResolvedValue({
      id: 'postulacion-1',
      estado: 'RECHAZADA',
    });

    render(<DetalleProyecto />);
    fireEvent.click(await screen.findByRole('button', { name: 'Rechazar' }));

    await waitFor(() => {
      expect(resolverPostulacion).toHaveBeenCalledWith(
        'token',
        'proyecto-1',
        'postulacion-1',
        'RECHAZADA',
      );
    });
    expect(await screen.findByText('Rechazada')).toBeInTheDocument();
  });

  it('deshabilita la aceptación cuando el perfil ya alcanzó el cupo', async () => {
    useAuth.mockReturnValue({
      sesion: { idColectivo: 'colectivo-1', rol: 'COLECTIVO' },
      getAccessToken: jest.fn().mockResolvedValue('token'),
      isAuthenticated: true,
      cargando: false,
    });
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
    obtenerPostulaciones.mockResolvedValue([
      {
        id: 'postulacion-1',
        idProyecto: 'proyecto-1',
        idPerfil: 'perfil-1',
        estado: 'PENDIENTE',
      },
    ]);

    render(<DetalleProyecto />);

    expect(
      await screen.findByText(
        'No se puede aceptar: el perfil ya alcanzó su límite de colaboraciones.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aceptar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Rechazar' })).toBeEnabled();
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
