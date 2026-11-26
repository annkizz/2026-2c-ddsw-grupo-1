import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useAuth, useAuthOpcional } from '../../hooks/useAuth.jsx';
import { obtenerNotificaciones } from '../../service/notificacionesService';
import { cambiarIdioma } from '../../i18n/t';
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
    cambiarIdioma('es');
    window.localStorage.clear();
    obtenerNotificaciones.mockResolvedValue({ notificaciones: [], total: 0, pag: 1, totalPags: 0 });
    configurar({ ...sesionBase, rol: 'COLABORADOR' });
  });

  it('usa el logo como único acceso a Inicio (sin botón "Inicio" duplicado)', () => {
    renderHeader('/');
    expect(screen.getByRole('link', { name: 'Código a Voluntad, ir al inicio' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('link', { name: 'Inicio' })).not.toBeInTheDocument();
  });

  it('el menú de usuario solo tiene Mi perfil y Salir, y muestra el rol', async () => {
    const auth = configurar({ ...sesionBase, rol: 'COLABORADOR' });
    renderHeader('/buscar-proyectos');

    expect(screen.getAllByText('Colaborador').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /Menú de usuario/ }));
    const menu = await screen.findByRole('menu', { name: 'Menú de usuario' });
    const items = within(menu).getAllByRole('menuitem').map((item) => item.textContent);
    expect(items).toEqual(['Mi perfil', 'Salir']);

    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Salir' }));
    expect(auth.cerrarSesion).toHaveBeenCalled();
  });

  it('no muestra "¿Necesitás ayuda?" en ningún lado', () => {
    renderHeader('/');
    expect(screen.queryByText('¿Necesitás ayuda?')).not.toBeInTheDocument();
  });

  it('muestra un número en la campana cuando llegan notificaciones nuevas', async () => {
    window.localStorage.setItem('notificaciones-vistas:u-1', '2');
    obtenerNotificaciones.mockResolvedValue({ notificaciones: [], total: 5, pag: 1, totalPags: 5 });
    renderHeader('/');

    expect(await screen.findByRole('link', { name: 'Notificaciones: 3 sin ver' })).toHaveAttribute('href', '/notificaciones');
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
  });

  it('muestra la navegación de la colaboradora en el menú móvil y se cierra al tocar afuera', async () => {
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

    fireEvent.click(document.querySelector('.MuiBackdrop-root'));
    await waitFor(() => expect(document.getElementById('header-navegacion-movil')).toBeNull());
  });

  it('sin sesión no muestra menú de usuario ni menú móvil vacío', () => {
    configurar(null, false);
    renderHeader('/');

    expect(screen.queryByRole('button', { name: /Menú de usuario/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Abrir menú' })).not.toBeInTheDocument();
  });

  it('permite elegir portugués sin iniciar sesión y recuerda la elección', async () => {
    configurar(null, false);
    renderHeader('/');

    fireEvent.click(screen.getByRole('button', { name: 'Idioma' }));
    fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Português do Brasil (em revisão)' }));

    expect(screen.getByRole('button', { name: 'Idioma' })).toHaveTextContent('PT');
    expect(window.localStorage.getItem('idioma')).toBe('pt');
  });

  it('permite elegir guaraní sin iniciar sesión y recuerda la elección', async () => {
    configurar(null, false);
    renderHeader('/');

    fireEvent.click(screen.getByRole('button', { name: 'Idioma' }));
    fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Guarani' }));

    expect(screen.getByRole('button', { name: 'Ñe\'ẽ' })).toHaveTextContent('GN');
    expect(window.localStorage.getItem('idioma')).toBe('gr');
  });

  it('el colectivo ve sus proyectos y la búsqueda de colaboradoras', () => {
    configurar({ ...sesionBase, rol: 'COLECTIVO' });
    renderHeader('/');

    const nav = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(within(nav).getByRole('link', { name: 'Mis proyectos' })).toHaveAttribute('href', '/proyectos');
    expect(within(nav).getByRole('link', { name: 'Buscar colaboradoras' })).toHaveAttribute('href', '/buscar-colaboradores');
    expect(within(nav).getByRole('link', { name: 'Integraciones' })).toHaveAttribute('href', '/integraciones/webhooks');
    expect(within(nav).queryByRole('link', { name: 'Mis postulaciones' })).not.toBeInTheDocument();
  });

  it('el administrador accede al panel y puede cerrar sesión sin un perfil', async () => {
    const auth = configurar({ rol: 'ADMINISTRADOR', tienePerfil: false, nombreUsuario: 'Admin' });
    renderHeader('/');

    expect(screen.getByRole('link', { name: 'Proyectos destacados' })).toHaveAttribute('href', '/administrador/destacados');
    expect(screen.queryByRole('link', { name: /Notificaciones/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Menú de usuario/ }));
    const menu = await screen.findByRole('menu', { name: 'Menú de usuario' });
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Salir' }));
    expect(auth.cerrarSesion).toHaveBeenCalled();
  });
});
