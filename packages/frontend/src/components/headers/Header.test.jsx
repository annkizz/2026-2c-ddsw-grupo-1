import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useAuth, useAuthOpcional } from '../../hooks/useAuth.jsx';
import { obtenerNotificaciones } from '../../service/notificacionesService';
import Header from './Header';

jest.mock('../../hooks/useAuth.jsx', () => ({ useAuth: jest.fn(), useAuthOpcional: jest.fn() }));
jest.mock('../../service/notificacionesService', () => ({ obtenerNotificaciones: jest.fn() }));
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const React = require('react');
  const enlace = ({ to, onClick, className, children, ...props }) => {
    const currentPath = global.window.location.pathname;
    const isActive = currentPath === to || currentPath.startsWith(`${to}/`);
    return React.createElement(
      'a',
      {
        href: to,
        onClick,
        'aria-current': isActive ? 'page' : undefined,
        className: typeof className === 'function' ? className({ isActive }) : className,
        ...props,
      },
      children,
    );
  };
  return {
    Link: React.forwardRef(function LinkMock({ to, children, ...props }, ref) {
      return React.createElement('a', { href: to, ref, ...props }, children);
    }),
    NavLink: enlace,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: global.window.location.pathname }),
  };
});

const sesionBase = { tienePerfil: true, usuarioId: 'u-1', nombreUsuario: 'Ana Gómez' };

const configurar = (sesion, isAuthenticated = true) => {
  const valor = {
    isAuthenticated,
    sesion,
    cerrarSesion: jest.fn(),
    getAccessToken: jest.fn().mockResolvedValue('token'),
  };
  useAuth.mockReturnValue(valor);
  useAuthOpcional.mockReturnValue(valor);
  return valor;
};

const renderHeader = (path = '/notificaciones') => {
  window.history.pushState({}, '', path);
  return render(<Header />);
};

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    obtenerNotificaciones.mockResolvedValue({ notificaciones: [], total: 0, pag: 1, totalPags: 0 });
    configurar({ ...sesionBase, rol: 'COLABORADOR' });
  });

  it('usa el logo como único acceso a Inicio (sin botón "Inicio" duplicado)', () => {
    renderHeader('/');
    expect(screen.getByRole('link', { name: 'Código a Voluntad, ir al inicio' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('link', { name: 'Inicio' })).not.toBeInTheDocument();
  });

  it('agrupa perfil, notificaciones, ayuda y salir en el menú de usuario', async () => {
    const auth = configurar({ ...sesionBase, rol: 'COLABORADOR' });
    renderHeader('/buscar-proyectos');

    fireEvent.click(screen.getByRole('button', { name: /Menú de usuario/ }));
    const menu = await screen.findByRole('menu', { name: 'Menú de usuario' });
    expect(within(menu).getByRole('menuitem', { name: 'Mi perfil' })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: /Notificaciones/ })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: '¿Necesitás ayuda?' })).toBeInTheDocument();

    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Salir' }));
    expect(auth.cerrarSesion).toHaveBeenCalled();
  });

  it('muestra un número en la campana cuando llegan notificaciones nuevas', async () => {
    window.localStorage.setItem('notificaciones-vistas:u-1', '2');
    obtenerNotificaciones.mockResolvedValue({ notificaciones: [], total: 5, pag: 1, totalPags: 5 });
    renderHeader('/');

    expect(await screen.findByRole('link', { name: 'Notificaciones: 3 sin ver' })).toHaveAttribute('href', '/notificaciones');
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
  });

  it('muestra la navegación de la colaboradora en el menú móvil y se cierra con Escape', async () => {
    renderHeader('/mis-postulaciones');
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));

    expect(await screen.findByRole('dialog', { name: 'Menú' })).toBeInTheDocument();
    const navegacion = await waitFor(() => {
      const elemento = document.getElementById('header-navegacion-movil');
      expect(elemento).toBeInTheDocument();
      return elemento;
    });
    expect(within(navegacion).getByRole('link', { name: 'Mis postulaciones' })).toHaveAttribute('aria-current', 'page');
    expect(within(navegacion).getByRole('link', { name: 'Mis colaboraciones' })).toHaveAttribute('href', '/mis-colaboraciones');
    expect(within(navegacion).getByRole('link', { name: 'Mi perfil' })).toHaveAttribute('href', '/perfil');
    expect(within(navegacion).getByRole('button', { name: 'Salir' })).toBeInTheDocument();

    fireEvent.keyDown(document.activeElement, { key: 'Escape', code: 'Escape' });
    await waitFor(() => expect(document.getElementById('header-navegacion-movil')).toBeNull());
  });

  it('ofrece ayuda sin sesión y cierra el menú al hacer clic fuera', async () => {
    configurar(null, false);
    renderHeader('/');
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));

    const navegacion = await waitFor(() => {
      const elemento = document.getElementById('header-navegacion-movil');
      expect(elemento).toBeInTheDocument();
      return elemento;
    });
    expect(within(navegacion).getByRole('link', { name: '¿Necesitás ayuda?' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Menú de usuario/ })).not.toBeInTheDocument();

    fireEvent.click(document.querySelector('.MuiBackdrop-root'));
    await waitFor(() => expect(document.getElementById('header-navegacion-movil')).toBeNull());
  });

  it('el colectivo ve sus proyectos y la búsqueda de colaboradoras', () => {
    configurar({ ...sesionBase, rol: 'COLECTIVO' });
    renderHeader('/');

    const nav = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(within(nav).getByRole('link', { name: 'Mis proyectos' })).toHaveAttribute('href', '/proyectos');
    expect(within(nav).getByRole('link', { name: 'Buscar colaboradoras' })).toHaveAttribute('href', '/buscar-colaboradores');
    expect(within(nav).queryByRole('link', { name: 'Mis postulaciones' })).not.toBeInTheDocument();
  });
});
