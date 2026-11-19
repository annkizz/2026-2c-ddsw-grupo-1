import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import DatosColectivo from './DatosColectivo';

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));

jest.mock('../../hooks/useAuth.jsx', () => ({
  useAuth: () => ({ getAccessToken: jest.fn(), recargarSesion: jest.fn() })
}));

jest.mock('../../hooks/useListado', () => ({
  useListado: () => ({ datos: [], cargando: false, error: null })
}));

jest.mock('../../service/colectivosService', () => ({
  TIPOS_COLECTIVO: [{ valor: 'ASOCIACION', texto: 'Asociación' }],
  crearColectivo: jest.fn()
}));

describe('DatosColectivo', () => {
  it('muestra placeholders en los selectores de tipo de colectivo y país', () => {
    render(<DatosColectivo />);

    const tipo = screen.getByRole('combobox', { name: 'Tipo de colectivo (obligatorio)' });
    const pais = screen.getByRole('combobox', { name: 'País (opcional)' });

    expect(tipo).toHaveTextContent('Seleccioná un tipo de colectivo');
    expect(tipo.querySelector('.select-placeholder')).toBeInTheDocument();
    expect(pais).toHaveTextContent('Seleccioná un país');
    expect(pais.querySelector('.select-placeholder')).toBeInTheDocument();
  });
});
