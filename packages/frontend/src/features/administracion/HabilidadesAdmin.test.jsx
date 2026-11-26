import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useListado } from '../../hooks/useListado';
import { crearHabilidad } from '../../service/habilidadesService';
import HabilidadesAdmin from './HabilidadesAdmin';

jest.mock('../../hooks/useAuth.jsx', () => ({ useAuth: jest.fn() }));
jest.mock('../../hooks/useListado', () => ({ useListado: jest.fn() }));
jest.mock('../../service/habilidadesService', () => ({ crearHabilidad: jest.fn() }));
jest.mock('react-router-dom', () => ({ Link: () => null }));

describe('administración de habilidades', () => {
  const recargar = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ getAccessToken: jest.fn().mockResolvedValue('token') });
    useListado.mockReturnValue({ datos: [{ codigo: 'react', titulo: 'React' }], cargando: false, error: null, recargar });
    crearHabilidad.mockResolvedValue({});
  });

  it('crea una habilidad y actualiza el catálogo', async () => {
    render(<HabilidadesAdmin />);
    expect(screen.getByText('React')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: /Nombre de la habilidad/ }), { target: { value: '  SQL  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    await waitFor(() => expect(crearHabilidad).toHaveBeenCalledWith('token', { titulo: 'SQL' }));
    expect(await screen.findByText('Se agregó la habilidad “SQL”.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Nombre de la habilidad/ })).toHaveValue('');
    expect(recargar).toHaveBeenCalled();
  });

  it('rechaza un nombre vacío y muestra el conflicto sin anunciar éxito', async () => {
    crearHabilidad.mockRejectedValue({ response: { status: 409, data: { codigo: 'HABILIDAD_YA_EXISTE' } } });
    render(<HabilidadesAdmin />);
    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(screen.getByText('Ingresá un nombre para la habilidad.')).toBeInTheDocument();
    expect(crearHabilidad).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole('textbox', { name: /Nombre de la habilidad/ }), { target: { value: 'react' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(await screen.findByText('Ya existe una habilidad con ese nombre.')).toBeInTheDocument();
    expect(screen.queryByText(/Se agregó la habilidad/)).not.toBeInTheDocument();
    expect(recargar).not.toHaveBeenCalled();
  });
});
