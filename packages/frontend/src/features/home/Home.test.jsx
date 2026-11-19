import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import Home from './Home.jsx';

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('../../hooks/useAuth.jsx', () => ({
  useAuth: jest.fn(),
}));

describe('acceso a inicio de sesión desde Home', () => {
  beforeEach(() => {
    sessionStorage.clear();
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

  it.each([
    ['colectivo', 'Represento a un colectivo'],
    ['colaboradora', 'Soy una persona colaboradora'],
  ])('envía a Logto al elegir registro de %s, incluso si hay sesión activa', (tipo, opcion) => {
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
    fireEvent.click(screen.getByText(opcion));

    expect(sessionStorage.getItem('tipoDeCuenta')).toBe(tipo);
    expect(registrarse).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('redirige a la colaboradora con perfil a sus colaboraciones', () => {
    const navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);
    useAuth.mockReturnValue({
      cargando: false,
      isAuthenticated: true,
      sesion: { tienePerfil: true, rol: 'COLABORADOR' },
      errorLogto: undefined,
      iniciarSesion: jest.fn(),
      registrarse: jest.fn(),
    });

    render(<Home />);

    expect(navigate).toHaveBeenCalledWith('/mis-colaboraciones', {
      replace: true,
    });
  });

  it('redirige a la administradora a su panel al entrar al inicio', () => {
    const navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);
    useAuth.mockReturnValue({
      cargando: false,
      isAuthenticated: true,
      sesion: { tienePerfil: false, rol: 'ADMINISTRADOR' },
      errorLogto: undefined,
      iniciarSesion: jest.fn(),
      registrarse: jest.fn(),
    });

    render(<Home />);

    expect(navigate).toHaveBeenCalledWith('/administrador/destacados', {
      replace: true,
    });
  });
});
