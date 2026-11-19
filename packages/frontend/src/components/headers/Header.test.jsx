import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth.jsx';
import Header from './Header.jsx';

jest.mock('../../hooks/useAuth.jsx', () => ({
  useAuth: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }) =>
    require('react').createElement('a', { href: to, ...props }, children),
}));

describe('menú de administración', () => {
  it('muestra solo destacados, perfil y salida', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      sesion: { rol: 'ADMINISTRADOR', tienePerfil: false },
      cerrarSesion: jest.fn(),
    });

    render(<Header />);

    expect(screen.getByRole('link', { name: 'Proyectos destacados' })).toHaveAttribute(
      'href',
      '/administrador/destacados',
    );
    expect(screen.getByRole('link', { name: 'Mi perfil' })).toHaveAttribute(
      'href',
      '/perfil',
    );
    expect(screen.getByRole('button', { name: 'Salir' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Notificaciones' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Buscar proyectos' })).not.toBeInTheDocument();
  });
});
