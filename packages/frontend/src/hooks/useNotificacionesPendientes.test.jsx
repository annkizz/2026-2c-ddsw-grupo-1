import { renderHook, waitFor } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { useAuthOpcional } from './useAuth.jsx';
import { obtenerNotificaciones } from '../service/notificacionesService';
import { useNotificacionesPendientes } from './useNotificacionesPendientes';

jest.mock('react-router-dom', () => ({ useLocation: jest.fn() }));
jest.mock('./useAuth.jsx', () => ({ useAuthOpcional: jest.fn() }));
jest.mock('../service/notificacionesService', () => ({ obtenerNotificaciones: jest.fn() }));

it('ajusta las vistas si el total disminuye y cuenta las notificaciones posteriores', async () => {
  window.localStorage.setItem('notificaciones-vistas:colectivo', '4');
  useAuthOpcional.mockReturnValue({
    isAuthenticated: true,
    sesion: { tienePerfil: true, idColectivo: 'colectivo' },
    getAccessToken: jest.fn().mockResolvedValue('token'),
  });
  useLocation.mockReturnValue({ pathname: '/inicio' });
  obtenerNotificaciones.mockResolvedValueOnce({ total: 2 }).mockResolvedValueOnce({ total: 3 });
  const { result, rerender, unmount } = renderHook(() => useNotificacionesPendientes());
  await waitFor(() => expect(window.localStorage.getItem('notificaciones-vistas:colectivo')).toBe('2'));
  expect(result.current.pendientes).toBe(0);
  useLocation.mockReturnValue({ pathname: '/proyectos' });
  rerender();
  await waitFor(() => expect(result.current.pendientes).toBe(1));
  unmount();
  window.localStorage.removeItem('notificaciones-vistas:colectivo');
});
