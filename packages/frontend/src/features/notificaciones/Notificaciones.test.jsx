import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '../../hooks/useAuth.jsx';
import { obtenerNotificaciones } from '../../service/notificacionesService';
import { resolverInvitacion } from '../../service/proyectosService';
import Notificaciones from './Notificaciones';

jest.mock('../../hooks/useAuth.jsx', () => ({
  useAuth: jest.fn(),
}));

jest.mock('react-router-dom', () => {
  const ReactActual = jest.requireActual('react');
  return {
    Link: ({ to, children, ...props }) =>
      ReactActual.createElement('a', { href: to, ...props }, children),
  };
});

jest.mock('../../service/notificacionesService', () => ({
  obtenerNotificaciones: jest.fn(),
}));
jest.mock('../../service/proyectosService', () => ({ resolverInvitacion: jest.fn() }));

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

    expect(await screen.findByText('Aún no recibiste notificaciones')).toBeInTheDocument();
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

  it('muestra decisiones de postulación e invitaciones con enlaces útiles', async () => {
    obtenerNotificaciones.mockResolvedValue({
      notificaciones: [
        {
          id: 'n-1',
          tipo: 'POSTULACION_ACEPTADA',
          contenido: 'Tu postulación fue aceptada.',
          nombreColectivo: 'Fundación',
          idProyecto: 'proyecto-1',
        },
        {
          id: 'n-2',
          tipo: 'INVITACION_POSTULACION',
          contenido: 'Te invitaron a postularte.',
          nombreColectivo: 'Asamblea',
          idProyecto: 'proyecto-2',
        },
      ],
      totalPags: 1,
      pag: 1,
    });

    render(<Notificaciones />);

    expect(
      await screen.findByText('Postulación aceptada'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Ver mis colaboraciones' }),
    ).toHaveAttribute('href', '/mis-colaboraciones');
    expect(
      screen.getByRole('link', { name: 'Ver proyecto' }),
    ).toHaveAttribute('href', '/proyectos/proyecto-2');
  });

  it('permite aceptar una invitación con participación anónima por defecto', async () => {
    obtenerNotificaciones.mockResolvedValue({
      notificaciones: [{
        id: 'inv-1', tipo: 'INVITACION_PROYECTO', contenido: 'Invitación para el perfil Tester',
        idProyecto: 'proyecto-1', estadoInvitacion: 'PENDIENTE',
      }],
      totalPags: 1, pag: 1,
    });
    resolverInvitacion.mockResolvedValue({ estadoInvitacion: 'ACEPTADA' });
    render(<Notificaciones />);
    await userEvent.click(await screen.findByRole('button', { name: 'Aceptar' }));
    await waitFor(() => expect(resolverInvitacion).toHaveBeenCalledWith(
      'token', 'proyecto-1', 'inv-1', 'ACEPTADA', true,
    ));
    expect(await screen.findByText('Invitación aceptada')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aceptar' })).not.toBeInTheDocument();
  });

  it('conserva el contenido y las acciones de una invitación con mensaje', async () => {
    obtenerNotificaciones.mockResolvedValue({
      notificaciones: [{
        id: 'inv-2', tipo: 'INVITACION_PROYECTO',
        contenido: 'Invitación para Tester.\n\nMensaje: Hola',
        idProyecto: 'proyecto-1', estadoInvitacion: 'PENDIENTE',
      }],
      totalPags: 1, pag: 1,
    });
    render(<Notificaciones />);
    const mensaje = await screen.findByText(/Invitación para Tester/);
    expect(mensaje).toHaveTextContent('Mensaje: Hola');
    expect(mensaje).toHaveClass('notificaciones-mensaje');
    expect(screen.getByRole('button', { name: 'Rechazar' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver proyecto' })).toHaveAttribute('href', '/proyectos/proyecto-1');
  });
});
