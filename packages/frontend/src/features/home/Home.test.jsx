import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useListado } from '../../hooks/useListado';
import { obtenerMiPerfilColaboradora } from '../../service/colaboradorasService';
import { obtenerMiPerfilColectivo } from '../../service/colectivosService';
import { obtenerProyectos } from '../../service/proyectosService';
import Home from './Home.jsx';

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    useNavigate: jest.fn(),
    Link: ({ to, children, ...props }) => React.createElement('a', { href: to, ...props }, children),
  };
});

jest.mock('../../hooks/useAuth.jsx', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../hooks/useListado', () => ({
  useListado: jest.fn(),
}));

jest.mock('../../service/colaboradorasService', () => ({
  obtenerMiPerfilColaboradora: jest.fn(),
}));

jest.mock('../../service/proyectosService', () => ({
  obtenerProyectos: jest.fn(),
}));

jest.mock('../../service/colectivosService', () => ({
  obtenerMiPerfilColectivo: jest.fn(),
}));

describe('acceso a inicio de sesión desde Home', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.clearAllMocks();
    useListado.mockReturnValue({
      datos: [],
      cargando: false,
      error: null,
      recargar: jest.fn(),
    });
    obtenerMiPerfilColectivo.mockResolvedValue({
      nombre: 'Colectivo de prueba',
      tipoDeColectivo: 'ONG',
      descripcion: 'Descripción de prueba',
    });
    obtenerMiPerfilColaboradora.mockResolvedValue({
      nombreFantasia: 'Ana',
      habilidades: ['Desarrollo'],
    });
  });

  it('mantiene disponible Ingresar cuando hay sesión Logto pero todavía no hay perfil', () => {
    const iniciarSesion = jest.fn();
    useNavigate.mockReturnValue(jest.fn());
    useAuth.mockReturnValue({
      cargando: false,
      isAuthenticated: true,
      sesion: { tienePerfil: false },
      errorLogto: undefined,
      iniciarSesion,
      registrarse: jest.fn(),
    });

    render(<Home />);
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(iniciarSesion).toHaveBeenCalledTimes(1);
  });

  it('no muestra un estado de ingreso mientras Logto restaura una sesión no autenticada', () => {
    useNavigate.mockReturnValue(jest.fn());
    useAuth.mockReturnValue({
      cargando: true,
      isAuthenticated: false,
      sesion: null,
      errorLogto: undefined,
      iniciarSesion: jest.fn(),
      registrarse: jest.fn(),
    });

    render(<Home />);

    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeEnabled();
  });

  it('muestra destacados en la portada pública', () => {
    useNavigate.mockReturnValue(jest.fn());
    useAuth.mockReturnValue({ cargando: false, sesion: null });
    useListado.mockImplementation((url) => ({
      datos: url === '/proyectos/destacados' ? [{ id: 'p1', titulo: 'Proyecto destacado' }] : [],
      cargando: false,
      error: null,
      recargar: jest.fn(),
    }));

    render(<Home />);
    expect(screen.getByRole('heading', { name: 'Proyectos destacados' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Proyecto destacado' })).toHaveAttribute('href', '/proyectos/p1');
  });

  it('dirige la cuenta administradora al panel', () => {
    const navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);
    useAuth.mockReturnValue({ cargando: false, sesion: { rol: 'ADMINISTRADOR', tienePerfil: false } });

    render(<Home />);
    expect(navigate).toHaveBeenCalledWith('/administrador/destacados', { replace: true });
  });

  it('envía directamente a Logto para crear la cuenta sin pedir antes un tipo de perfil', () => {
    const navigate = jest.fn();
    const registrarse = jest.fn();
    useNavigate.mockReturnValue(navigate);
    useAuth.mockReturnValue({
      cargando: false,
      isAuthenticated: true,
      sesion: { tienePerfil: false },
      errorLogto: undefined,
      iniciarSesion: jest.fn(),
      registrarse,
    });

    render(<Home />);
    fireEvent.click(screen.getByRole('button', { name: 'Crear una cuenta' }));

    expect(screen.queryByText('Represento a un colectivo')).not.toBeInTheDocument();
    expect(screen.queryByText('Soy una persona colaboradora')).not.toBeInTheDocument();
    expect(registrarse).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('muestra en el panel solo los estados de proyectos del colectivo autenticado', async () => {
    const navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);
    useAuth.mockReturnValue({
      cargando: false,
      isAuthenticated: true,
      sesion: { rol: 'COLECTIVO', tienePerfil: true, idColectivo: 7 },
      errorLogto: undefined,
      iniciarSesion: jest.fn(),
      registrarse: jest.fn(),
      getAccessToken: jest.fn().mockResolvedValue('token'),
    });
    obtenerProyectos.mockResolvedValue([
      { id: 1, idColectivo: 7, estado: 'ACTIVO' },
      { id: 2, idColectivo: 7, estado: 'FINALIZADO' },
      { id: 3, idColectivo: 8, estado: 'ACTIVO' },
    ]);

    render(<Home />);

    expect(await screen.findByText('Activos')).toBeInTheDocument();
    expect(screen.getByText('Estado de tus proyectos')).toBeInTheDocument();
    expect(screen.getByText('Finalizados')).toBeInTheDocument();
    expect(screen.getAllByText('1', { selector: 'strong' })).toHaveLength(2);
    expect(navigate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Publicar proyecto' }));
    expect(navigate).toHaveBeenCalledWith('/proyectos/nuevo');
  });

  it('orienta a crear el primer proyecto cuando el colectivo todavía no tiene proyectos', async () => {
    const navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);
    useAuth.mockReturnValue({
      cargando: false,
      isAuthenticated: true,
      sesion: { rol: 'COLECTIVO', tienePerfil: true, idColectivo: 7 },
      errorLogto: undefined,
      iniciarSesion: jest.fn(),
      registrarse: jest.fn(),
      getAccessToken: jest.fn().mockResolvedValue('token'),
    });
    obtenerProyectos.mockResolvedValue([]);

    render(<Home />);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Crear mi primer proyecto' }),
    );

    expect(screen.getByText(/Un proyecto cuenta qué necesita tu colectivo/)).toBeInTheDocument();
    expect(navigate).toHaveBeenCalledWith('/proyectos/nuevo');
  });

  it('permite reintentar la carga de proyectos después de un error', async () => {
    useNavigate.mockReturnValue(jest.fn());
    useAuth.mockReturnValue({
      cargando: false,
      isAuthenticated: true,
      sesion: { rol: 'COLECTIVO', tienePerfil: true, idColectivo: 7 },
      errorLogto: undefined,
      iniciarSesion: jest.fn(),
      registrarse: jest.fn(),
      getAccessToken: jest.fn().mockResolvedValue('token'),
    });
    obtenerProyectos
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce([]);

    render(<Home />);

    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText(/Cuando publiques el primero/)).toBeInTheDocument();
    expect(obtenerProyectos).toHaveBeenCalledTimes(2);
  });

  it('muestra el progreso y el acceso de completar perfil si faltan datos requeridos', async () => {
    const navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);
    useAuth.mockReturnValue({
      cargando: false,
      isAuthenticated: true,
      sesion: { rol: 'COLECTIVO', tienePerfil: true, idColectivo: 7 },
      errorLogto: undefined,
      iniciarSesion: jest.fn(),
      registrarse: jest.fn(),
      getAccessToken: jest.fn().mockResolvedValue('token'),
    });
    obtenerProyectos.mockResolvedValue([]);
    obtenerMiPerfilColectivo.mockResolvedValue({
      nombre: 'Colectivo de prueba',
      tipoDeColectivo: 'ONG',
      descripcion: '',
    });

    render(<Home />);

    expect(await screen.findByText('2 de 3 datos esenciales completos.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Completar mi perfil' }));

    expect(navigate).toHaveBeenCalledWith('/perfil');
  });

  it('muestra a la colaboradora recomendaciones y accesos de búsqueda y mapa', async () => {
    const navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);
    useAuth.mockReturnValue({
      cargando: false,
      isAuthenticated: true,
      sesion: { rol: 'COLABORADOR', tienePerfil: true, idColaborador: 12 },
      errorLogto: undefined,
      iniciarSesion: jest.fn(),
      registrarse: jest.fn(),
      getAccessToken: jest.fn().mockResolvedValue('token'),
    });
    useListado.mockImplementation((url) => ({
      datos: url === '/proyectos/destacados' ? [] : [{ id: 21, titulo: 'Huerta comunitaria', estado: 'ACTIVO' }],
      cargando: false,
      error: null,
      recargar: jest.fn(),
    }));

    render(<Home />);

    expect(await screen.findByRole('heading', { name: 'Huerta comunitaria' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Explorar proyectos' }));
    expect(navigate).toHaveBeenCalledWith('/buscar-proyectos');

    fireEvent.click(screen.getByRole('button', { name: 'Abrir mapa' }));
    expect(navigate).toHaveBeenCalledWith('/mapa');
  });

  it('orienta a explorar cuando no hay recomendaciones y ofrece completar el perfil', async () => {
    const navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);
    useAuth.mockReturnValue({
      cargando: false,
      isAuthenticated: true,
      sesion: { rol: 'COLABORADOR', tienePerfil: true, idColaborador: 12 },
      errorLogto: undefined,
      iniciarSesion: jest.fn(),
      registrarse: jest.fn(),
      getAccessToken: jest.fn().mockResolvedValue('token'),
    });
    obtenerMiPerfilColaboradora.mockResolvedValue({
      nombreFantasia: '',
      habilidades: [],
    });

    render(<Home />);

    fireEvent.click((await screen.findAllByRole('button', { name: 'Explorar proyectos' }))[0]);
    expect(screen.getByText('Todavía no encontramos coincidencias')).toBeInTheDocument();
    expect(screen.getByText('Un perfil completo ayuda a los colectivos a encontrarte.')).toBeInTheDocument();
    expect(navigate).toHaveBeenCalledWith('/buscar-proyectos');

    fireEvent.click(screen.getByRole('button', { name: 'Completar mi perfil' }));
    expect(navigate).toHaveBeenCalledWith('/perfil');
  });

  it('permite reintentar cargar recomendaciones después de un error', async () => {
    const recargar = jest.fn();
    useNavigate.mockReturnValue(jest.fn());
    useAuth.mockReturnValue({
      cargando: false,
      isAuthenticated: true,
      sesion: { rol: 'COLABORADOR', tienePerfil: true, idColaborador: 12 },
      errorLogto: undefined,
      iniciarSesion: jest.fn(),
      registrarse: jest.fn(),
      getAccessToken: jest.fn().mockResolvedValue('token'),
    });
    useListado.mockImplementation((url) => ({
      datos: [],
      cargando: false,
      error: url === '/proyectos/destacados' ? null : new Error('Network Error'),
      recargar,
    }));

    render(<Home />);

    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));
    expect(recargar).toHaveBeenCalledTimes(1);
  });
});
