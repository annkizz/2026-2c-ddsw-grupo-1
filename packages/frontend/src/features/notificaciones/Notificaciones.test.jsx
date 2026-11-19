import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '../../hooks/useAuth.jsx';
import { obtenerNotificacionesDeColaboradora } from '../../service/notificacionesService';
import Notificaciones from './Notificaciones';

jest.mock('../../hooks/useAuth.jsx', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../service/notificacionesService', () => ({
  obtenerNotificacionesDeColaboradora: jest.fn(),
}));

describe('Notificaciones', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      sesion: { idColaborador: 'colaborador-1' },
      getAccessToken: jest.fn().mockResolvedValue('token'),
    });
  });

  it('muestra el estado vacío cuando no hay notificaciones', async () => {
    obtenerNotificacionesDeColaboradora.mockResolvedValue({
      notificaciones: [],
      totalPags: 0,
      pag: 1,
    });

    render(<Notificaciones />);

    expect(await screen.findByText('Aún no tenés notificaciones')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cargar más' })).not.toBeInTheDocument();
  });

  it('carga la página siguiente y agrega sus notificaciones', async () => {
    obtenerNotificacionesDeColaboradora
      .mockResolvedValueOnce({
        notificaciones: [{ id: 'n-1', contenido: 'Te invitaron al proyecto', leida: false }],
        totalPags: 2,
        pag: 1,
      })
      .mockResolvedValueOnce({
        notificaciones: [{ id: 'n-2', contenido: 'Aceptaron tu postulación', leida: true }],
        totalPags: 2,
        pag: 2,
      });

    render(<Notificaciones />);

    expect(await screen.findByText('Te invitaron al proyecto')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cargar más' }));

    expect(await screen.findByText('Aceptaron tu postulación')).toBeInTheDocument();
    expect(screen.getByText('Te invitaron al proyecto')).toBeInTheDocument();
    await waitFor(() => {
      expect(obtenerNotificacionesDeColaboradora).toHaveBeenLastCalledWith(
        'token',
        'colaborador-1',
        { pag: 2, limite: 8 },
      );
    });
  });
});
