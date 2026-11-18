import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useLogto } from '@logto/react';
import { obtenerSesion } from '../service/usuariosService';
import { AuthProvider, RESOURCE, useAuth } from './useAuth.jsx';

jest.mock('@logto/react', () => ({
  useLogto: jest.fn(),
}));

jest.mock('../service/usuariosService', () => ({
  obtenerSesion: jest.fn(),
}));

const AccionesAuth = () => {
  const { iniciarSesion, registrarse, recargarSesion, errorSesion } = useAuth();

  return (
    <>
      <button onClick={iniciarSesion}>Iniciar sesión</button>
      <button onClick={registrarse}>Crear cuenta</button>
      <button onClick={recargarSesion}>Verificar sesión</button>
      {errorSesion && <output>{errorSesion}</output>}
    </>
  );
};

describe('flujo de autenticación', () => {
  const signIn = jest.fn();
  const getAccessToken = jest.fn();

  beforeEach(() => {
    sessionStorage.clear();
    jest.clearAllMocks();
    getAccessToken.mockResolvedValue('access-token');
    obtenerSesion.mockResolvedValue({ tienePerfil: true });
    useLogto.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      signIn,
      signOut: jest.fn(),
      getAccessToken,
    });
  });

  it('borra el tipo de alta anterior al iniciar sesión', () => {
    sessionStorage.setItem('tipoDeCuenta', 'colectivo');
    render(
      <AuthProvider>
        <AccionesAuth />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Iniciar sesión'));

    expect(sessionStorage.getItem('tipoDeCuenta')).toBeNull();
    expect(signIn).toHaveBeenCalledWith({
      redirectUri: `${window.location.origin}/callback`,
      firstScreen: 'identifier:sign_in',
      identifiers: ['email'],
      prompt: ['login', 'consent'],
    });
  });

  it('conserva el tipo elegido al comenzar un registro en Logto', () => {
    sessionStorage.setItem('tipoDeCuenta', 'colectivo');
    render(
      <AuthProvider>
        <AccionesAuth />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Crear cuenta'));

    expect(sessionStorage.getItem('tipoDeCuenta')).toBe('colectivo');
    expect(signIn).toHaveBeenCalledWith({
      redirectUri: `${window.location.origin}/callback`,
      interactionMode: 'signUp',
    });
  });

  it('solicita a Logto el token del recurso de la API para consultar el perfil', async () => {
    render(
      <AuthProvider>
        <AccionesAuth />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Verificar sesión'));

    await waitFor(() => expect(obtenerSesion).toHaveBeenCalledWith('access-token'));
    expect(getAccessToken).toHaveBeenCalledWith(RESOURCE);
  });

  it('no consulta /me si Logto no devuelve un token', async () => {
    getAccessToken.mockResolvedValue(undefined);
    render(
      <AuthProvider>
        <AccionesAuth />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Verificar sesión'));

    await waitFor(() => expect(obtenerSesion).not.toHaveBeenCalled());
  });

  it('muestra el error de autenticación devuelto por el servidor', async () => {
    obtenerSesion.mockRejectedValue({
      response: { data: { error: 'el token es invalido o vencio', codigo: 'TOKEN_INVALIDO' } },
    });
    render(
      <AuthProvider>
        <AccionesAuth />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Verificar sesión'));

    expect(await screen.findByText('el token es invalido o vencio (TOKEN_INVALIDO)')).toBeInTheDocument();
  });
});
