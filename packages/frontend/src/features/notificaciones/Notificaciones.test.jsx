import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '../../hooks/useAuth.jsx';
import { obtenerNotificaciones } from '../../service/notificacionesService';
import Notificaciones from './Notificaciones';

jest.mock('../../hooks/useAuth.jsx', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../service/notificacionesService', () => ({
  obtenerNotificaciones: jest.fn(),
}));

describe('Notificaciones', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      sesion: { rol: 'COLABORADOR', idColaborador: 'colaborador-1' },
      getAccessToken: jest.fn().mockResolvedValue('token'),
    });
  });

  it('muestra el estado vacío en la bandeja de una persona colaboradora', async () => {
    obtenerNotificaciones.mockResolvedValue({
      notificaciones: [],
      totalPags: 0,
      pag: 1,
    });

    render(<Notificaciones />);

    expect(await screen.findByText('Aún no recibiste mensajes')).toBeInTheDocument();
    expect(obtenerNotificaciones).toHaveBeenCalledWith('token', {
      pag: 1,
      limite: 8,
    });
  });

  it('carga más mensajes recibidos y conserva los ya mostrados', async () => {
    obtenerNotificaciones
      .mockResolvedValueOnce({
        notificaciones: [
          {
            id: 'n-1',
            contenido: 'Te invitamos a participar.',
            nombreColectivo: 'Fundación',
            leida: false,
          },
        ],
        totalPags: 2,
        pag: 1,
      })
      .mockResolvedValueOnce({
        notificaciones: [
          {
            id: 'n-2',
            contenido: 'Nos gustaría conversar.',
            nombreColectivo: 'Asamblea',
            leida: true,
          },
        ],
        totalPags: 2,
        pag: 2,
      });

    render(<Notificaciones />);

    expect(await screen.findByText('Te invitamos a participar.')).toBeInTheDocument();
    expect(screen.getByText('De Fundación')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cargar más' }));

    expect(await screen.findByText('Nos gustaría conversar.')).toBeInTheDocument();
    expect(screen.getByText('Te invitamos a participar.')).toBeInTheDocument();
    await waitFor(() => {
      expect(obtenerNotificaciones).toHaveBeenLastCalledWith('token', {
        pag: 2,
        limite: 8,
      });
    });
  });

  it('muestra mensajes enviados y estado de los canales externos al colectivo', async () => {
    useAuth.mockReturnValue({
      sesion: { rol: 'COLECTIVO', idColectivo: 'colectivo-1' },
      getAccessToken: jest.fn().mockResolvedValue('token'),
    });
    obtenerNotificaciones.mockResolvedValue({
      notificaciones: [
        {
          id: 'n-3',
          contenido: 'Te invitamos al proyecto.',
          nombreColaborador: 'Ada',
          envios: [{ tipoDeContacto: 'EMAIL', estado: 'SIMULADO' }],
        },
      ],
      totalPags: 1,
      pag: 1,
    });

    render(<Notificaciones />);

    expect(await screen.findByText('Para Ada')).toBeInTheDocument();
    expect(screen.getByText('EMAIL: SIMULADO')).toBeInTheDocument();
  });
});
