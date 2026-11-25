import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import RequiereAuth from './RequiereAuth.jsx';

jest.mock('react-router-dom', () => ({
  Navigate: jest.fn(() => null),
}));

jest.mock('../hooks/useAuth.jsx', () => ({
  useAuth: jest.fn(),
}));

const renderGuard = (estado) => {
  useAuth.mockReturnValue(estado);
  render(
    <RequiereAuth exigirPerfil={false} tipoRegistro="colaboradora">
      <p>Formulario de registro</p>
    </RequiereAuth>
  );
};

describe('RequiereAuth en rutas de registro', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  it('solo permite abrir el formulario autenticado y con el tipo elegido', () => {
    sessionStorage.setItem('tipoDeCuenta', 'colaboradora');
    renderGuard({
      isAuthenticated: true,
      cargando: false,
      sesion: { tienePerfil: false },
    });

    expect(screen.getByText('Formulario de registro')).toBeInTheDocument();
  });

  it('vuelve al inicio si no se eligió el tipo desde el flujo de alta', () => {
    renderGuard({
      isAuthenticated: true,
      cargando: false,
      sesion: { tienePerfil: false },
    });

    expect(screen.queryByText('Formulario de registro')).not.toBeInTheDocument();
    expect(Navigate.mock.calls[0][0]).toEqual({ to: '/', replace: true });
  });

  it('envía al inicio a quien ya completó su registro', () => {
    sessionStorage.setItem('tipoDeCuenta', 'colaboradora');
    renderGuard({
      isAuthenticated: true,
      cargando: false,
      sesion: { tienePerfil: true },
    });

    expect(Navigate.mock.calls[0][0]).toEqual({ to: '/', replace: true });
  });

  it('envía al administrador al panel si intenta registrarse', () => {
    renderGuard({
      isAuthenticated: true,
      cargando: false,
      sesion: { rol: 'ADMINISTRADOR', tienePerfil: false },
    });

    expect(Navigate.mock.calls[0][0]).toEqual({ to: '/administrador/destacados', replace: true });
  });

  it('permite al administrador acceder a rutas protegidas sin perfil', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      cargando: false,
      sesion: { rol: 'ADMINISTRADOR', tienePerfil: false },
    });
    render(<RequiereAuth><p>Panel</p></RequiereAuth>);
    expect(screen.getByText('Panel')).toBeInTheDocument();
  });
});
