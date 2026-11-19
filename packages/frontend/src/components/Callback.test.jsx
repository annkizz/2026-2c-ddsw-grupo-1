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
    useHandleSignInCallback.mockReturnValue({ error: undefined });
    useAuth.mockReturnValue({
      sesion: { tienePerfil: false },
      errorSesion: false,
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
      sesion: { tienePerfil: true },
      errorSesion: false,
      recargarSesion: jest.fn(),
      cerrarSesion: jest.fn(),
    });

    render(<Callback />);

    expect(navigate).toHaveBeenCalledWith('/perfil', { replace: true });
  });

  it('continúa el formulario elegido antes de registrarse en Logto', () => {
    sessionStorage.setItem('tipoDeCuenta', 'colectivo');
    render(<Callback />);

    expect(navigate).toHaveBeenCalledWith('/registro/colectivo', { replace: true });
  });

  it('muestra el error de verificación del servidor y permite reintentar', () => {
    const recargarSesion = jest.fn();
    useAuth.mockReturnValue({
      sesion: null,
      errorSesion: 'El servidor tardó demasiado. Reintentá.',
      recargarSesion,
      cerrarSesion: jest.fn(),
    });

    render(<Callback />);

    expect(
      screen.getByText(
        'No pudimos verificar tu sesión con el servidor: El servidor tardó demasiado. Reintentá.',
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByText('Reintentar'));
    expect(recargarSesion).toHaveBeenCalledTimes(1);
  });

  it('muestra los errores del callback de Logto', () => {
    useHandleSignInCallback.mockReturnValue({
      error: new Error('callback inválido'),
    });
    useAuth.mockReturnValue({
      sesion: null,
      errorSesion: null,
      recargarSesion: jest.fn(),
      cerrarSesion: jest.fn(),
    });

    render(<Callback />);

    expect(
      screen.getByText(
        'No pudimos completar el inicio de sesión con Logto: callback inválido',
      ),
    ).toBeTruthy();
    expect(screen.queryByText('Reintentar')).toBeNull();
  });
});
