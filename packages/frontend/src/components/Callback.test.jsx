import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { useHandleSignInCallback } from '@logto/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import Callback from './Callback.jsx';

jest.mock('@logto/react', () => ({
  useHandleSignInCallback: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('../hooks/useAuth.jsx', () => ({
  useAuth: jest.fn(),
}));

describe('destino del callback de Logto', () => {
  const navigate = jest.fn();

  beforeEach(() => {
    sessionStorage.clear();
    jest.clearAllMocks();
    useNavigate.mockReturnValue(navigate);
    useHandleSignInCallback.mockReturnValue({});
    useAuth.mockReturnValue({
      isAuthenticated: true,
      sesion: { tienePerfil: false },
      errorSesion: null,
      cargando: false,
      recargarSesion: jest.fn(),
      cerrarSesion: jest.fn(),
    });
  });

  it('lleva a elegir tipo si Logto autentica una cuenta sin perfil ni tipo pendiente', () => {
    render(<Callback />);

    expect(navigate).toHaveBeenCalledWith('/registro/tipo', { replace: true });
  });

  it('lleva directamente al perfil si la cuenta ya tiene uno', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      sesion: { tienePerfil: true },
      errorSesion: null,
      cargando: false,
      recargarSesion: jest.fn(),
      cerrarSesion: jest.fn(),
    });

    render(<Callback />);

    expect(navigate).toHaveBeenCalledWith('/perfil', { replace: true });
  });

  it('lleva al inicio del colectivo cuando la cuenta ya tiene perfil', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      sesion: { rol: 'COLECTIVO', tienePerfil: true },
      errorSesion: null,
      cargando: false,
      recargarSesion: jest.fn(),
      cerrarSesion: jest.fn(),
    });

    render(<Callback />);

    expect(navigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('lleva al inicio de la colaboradora cuando la cuenta ya tiene perfil', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      sesion: { rol: 'COLABORADOR', tienePerfil: true },
      errorSesion: null,
      cargando: false,
      recargarSesion: jest.fn(),
      cerrarSesion: jest.fn(),
    });

    render(<Callback />);

    expect(navigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('continúa el formulario elegido antes de registrarse en Logto', () => {
    sessionStorage.setItem('tipoDeCuenta', 'colectivo');
    render(<Callback />);

    expect(navigate).toHaveBeenCalledWith('/registro/colectivo', { replace: true });
  });

  it('muestra el error de verificación del backend y permite reintentar', () => {
    const recargarSesion = jest.fn();
    useAuth.mockReturnValue({
      isAuthenticated: true,
      sesion: null,
      errorSesion: 'No pudimos conectarnos con el servidor',
      cargando: false,
      recargarSesion,
      cerrarSesion: jest.fn(),
    });

    render(<Callback />);

    expect(screen.getByText('No pudimos conectarnos con el servidor')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(recargarSesion).toHaveBeenCalledTimes(1);
  });

  it('muestra el estado de carga mientras Logto verifica la sesión', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      sesion: null,
      errorSesion: null,
      cargando: true,
      recargarSesion: jest.fn(),
      cerrarSesion: jest.fn(),
    });

    render(<Callback />);

    expect(screen.getByText('Estamos verificando tus datos. Esperá un momento.')).toBeInTheDocument();
  });
});
