import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useListado } from '../../hooks/useListado';
import { configurarDestacado } from '../../service/proyectosService';
import ProyectosDestacados from './ProyectosDestacados.jsx';

jest.mock('../../hooks/useAuth.jsx', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../hooks/useListado', () => ({
  useListado: jest.fn(),
}));

jest.mock('../../service/proyectosService', () => ({
  configurarDestacado: jest.fn(),
}));

jest.mock('../../service/api', () => ({
  mensajeDeError: (error) => error.message,
}));

describe('panel de proyectos destacados', () => {
  const recargar = jest.fn();
  const proyecto = {
    id: 'p-1',
    titulo: 'Proyecto activo',
    descripcion: 'Descripción',
    destacado: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ getAccessToken: jest.fn().mockResolvedValue('token') });
    useListado.mockReturnValue({
      datos: [proyecto],
      cargando: false,
      error: null,
      recargar,
    });
    configurarDestacado.mockResolvedValue({});
  });

  it('permite destacar un proyecto con fecha de vencimiento y actualiza la lista', async () => {
    render(<ProyectosDestacados />);
    fireEvent.click(screen.getByRole('button', { name: 'Destacar' }));

    await waitFor(() => {
      expect(configurarDestacado).toHaveBeenCalledWith(
        'token',
        'p-1',
        expect.objectContaining({ destacado: true }),
      );
    });
    expect(
      new Date(configurarDestacado.mock.calls[0][2].destacadoHasta).getTime(),
    ).toBeGreaterThan(Date.now());
    expect(recargar).toHaveBeenCalledTimes(1);
  });
});
