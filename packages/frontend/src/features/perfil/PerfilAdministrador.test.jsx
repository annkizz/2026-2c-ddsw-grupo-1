import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth.jsx';
import PerfilAdministrador from './PerfilAdministrador.jsx';

jest.mock('../../hooks/useAuth.jsx', () => ({
  useAuth: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }) =>
    require('react').createElement('a', { href: to, ...props }, children),
}));

describe('perfil de administración', () => {
  beforeEach(() => {
    process.env.REACT_APP_LOGTO_ENDPOINT = 'https://tenant.example/';
    useAuth.mockReturnValue({
      sesion: { nombreUsuario: 'admin' },
      obtenerDatosCuenta: jest.fn().mockResolvedValue({
        nombre: 'Ada Lovelace',
        email: 'ada@example.org',
      }),
    });
  });

  it('muestra la cuenta y enlaza las ediciones seguras de nombre, email y contraseña', async () => {
    render(<PerfilAdministrador />);

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('ada@example.org')).toBeInTheDocument();

    const ediciones = [
      ['Editar nombre', '/account/profile'],
      ['Cambiar email', '/account/email'],
      ['Cambiar contraseña', '/account/password'],
    ];

    for (const [etiqueta, ruta] of ediciones) {
      const enlace = screen.getByRole('link', { name: etiqueta });
      const url = new URL(enlace.href);
      expect(url.origin).toBe('https://tenant.example');
      expect(url.pathname).toBe(ruta);
      expect(url.searchParams.get('redirect')).toBe(`${window.location.origin}/perfil`);
    }
  });
});
