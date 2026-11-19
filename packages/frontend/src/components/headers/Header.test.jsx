import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth.jsx';
import Header from './Header';

jest.mock('../../hooks/useAuth.jsx', () => ({ useAuth: jest.fn() }));
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ to, children, ...props }) => React.createElement('a', { href: to, ...props }, children),
    NavLink: ({ to, onClick, className, children }) => {
      const currentPath = global.window.location.pathname;
      const isActive = currentPath === to || currentPath.startsWith(`${to}/`);
      return React.createElement(
        'a',
        {
          href: to,
          onClick,
          'aria-current': isActive ? 'page' : undefined,
          className: typeof className === 'function' ? className({ isActive }) : className,
        },
        children,
      );
    },
  };
});

const renderHeader = (path = '/notificaciones') =>
  (() => {
    window.history.pushState({}, '', path);
    return render(<Header />);
  })();

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      isAuthenticated: true,
      sesion: { tienePerfil: true, rol: 'COLABORADOR' },
      cerrarSesion: jest.fn(),
    });
  });

  it('muestra la navegación autenticada con ruta activa y se cierra con Escape', async () => {
    renderHeader();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));

    expect(await screen.findByRole('dialog', { name: 'Menú' })).toBeInTheDocument();
    const navegacion = await waitFor(() => {
      const elemento = document.getElementById('header-navegacion-movil');
      expect(elemento).toBeInTheDocument();
      return elemento;
    });
    expect(within(navegacion).getByRole('link', { name: 'Notificaciones' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(navegacion).queryByRole('link', { name: 'Mapa' })).not.toBeInTheDocument();
    expect(within(navegacion).getByRole('button', { name: 'Salir' })).toBeInTheDocument();

    fireEvent.keyDown(document.activeElement, { key: 'Escape', code: 'Escape' });

    await waitFor(() => expect(document.getElementById('header-navegacion-movil')).toBeNull());
  });

  it('ofrece ayuda dentro del menú y lo cierra al hacer clic fuera', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      sesion: null,
      cerrarSesion: jest.fn(),
    });
    renderHeader('/');
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));

    const navegacion = await waitFor(() => {
      const elemento = document.getElementById('header-navegacion-movil');
      expect(elemento).toBeInTheDocument();
      return elemento;
    });
    expect(within(navegacion).getByRole('link', { name: '¿Necesitás ayuda?' })).toBeInTheDocument();

    fireEvent.click(document.querySelector('.MuiBackdrop-root'));

    await waitFor(() => expect(document.getElementById('header-navegacion-movil')).toBeNull());
  });

  it('deja Notificaciones y Mi perfil en el header del colectivo', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      sesion: { tienePerfil: true, rol: 'COLECTIVO' },
      cerrarSesion: jest.fn(),
    });

    renderHeader('/');

    expect(screen.getByRole('link', { name: 'Notificaciones' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mi perfil' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Proyectos' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Buscar colaboradores' })).not.toBeInTheDocument();
  });
});
