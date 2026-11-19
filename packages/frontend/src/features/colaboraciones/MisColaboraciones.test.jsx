import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { obtenerMisColaboraciones } from '../../service/colaboradorasService';
import MisColaboraciones from './MisColaboraciones.jsx';

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('../../hooks/useAuth.jsx', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../service/colaboradorasService', () => ({
  obtenerMisColaboraciones: jest.fn(),
}));

describe('MisColaboraciones', () => {
  const navigate = jest.fn();
  const getAccessToken = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    getAccessToken.mockResolvedValue('token');
    useNavigate.mockReturnValue(navigate);
    useAuth.mockReturnValue({ getAccessToken });
  });

  it('muestra el avance y abre el detalle del proyecto', async () => {
    obtenerMisColaboraciones.mockResolvedValue([
      {
        idProyecto: 'p1',
        fecha: '2026-10-01T00:00:00.000Z',
        proyecto: {
          id: 'p1',
          titulo: 'Proyecto solidario',
          descripcion: 'Descripción del proyecto',
          estado: 'ACTIVO',
          porcentajeConcrecion: 35,
        },
      },
    ]);

    render(<MisColaboraciones />);

    expect(await screen.findByText('Proyecto solidario')).toBeInTheDocument();
    expect(screen.getByText('35 %')).toBeInTheDocument();
    expect(obtenerMisColaboraciones).toHaveBeenCalledWith('token');

    fireEvent.click(
      screen.getByRole('button', { name: 'Ver detalle y avance' })
    );
    expect(navigate).toHaveBeenCalledWith('/proyectos/p1', {
      state: { volverA: '/mis-colaboraciones' },
    });
  });

  it('ofrece buscar proyectos cuando todavía no tiene colaboraciones', async () => {
    obtenerMisColaboraciones.mockResolvedValue([]);

    render(<MisColaboraciones />);

    expect(
      await screen.findByText('Todavía no colaborás en ningún proyecto')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Buscar proyectos' }));

    expect(navigate).toHaveBeenCalledWith('/buscar-proyectos');
  });
});
