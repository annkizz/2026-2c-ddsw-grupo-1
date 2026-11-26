import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { obtenerProyectos } from '../../service/proyectosService';
import ListaProyectos from './ListaProyectos';

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));
jest.mock('../../hooks/useAuth.jsx', () => ({ useAuth: jest.fn() }));
jest.mock('../../service/proyectosService', () => ({
  obtenerProyectos: jest.fn(),
  cerrarProyecto: jest.fn(),
}));
jest.mock('../../components/Notificador/Notificador.jsx', () => ({ useNotificar: () => jest.fn() }));

it('permite ver y cerrar el proyecto propio sin mostrar la edición en la tarjeta', async () => {
  useAuth.mockReturnValue({ sesion: { idColectivo: 'colectivo-1' } });
  obtenerProyectos.mockResolvedValue([{
    id: 'proyecto-1', idColectivo: 'colectivo-1', titulo: 'El sur', estado: 'ACTIVO',
    busquedaVigente: true,
  }]);

  render(<ListaProyectos />);

  expect(await screen.findByRole('button', { name: 'Ver proyecto: El sur' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Cerrar proyecto: El sur' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /editar proyecto/i })).not.toBeInTheDocument();
});
