import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useListado } from '../../hooks/useListado';
import BuscadorProyectos from './BuscadorProyectos.jsx';

jest.mock('../../hooks/useAuth.jsx', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../hooks/useListado', () => ({
  useListado: jest.fn(),
}));

jest.mock('../../components/CustomSelect/CustomSelect', () => () => null);

jest.mock('../../components/CardProyecto/CardProyecto', () => ({
  __esModule: true,
  default: ({ proyecto }) => <li>{proyecto.titulo}</li>,
}));

describe('búsqueda inicial de proyectos para colaboradoras', () => {
  const destacado = { id: 'p-1', titulo: 'Proyecto destacado' };
  const recomendado = { id: 'p-2', titulo: 'Proyecto recomendado' };

  beforeEach(() => {
    useAuth.mockReturnValue({
      sesion: { rol: 'COLABORADOR', idColaborador: 'c-1' },
    });
    useListado.mockImplementation((url) => {
      const datos =
        url === '/proyectos/destacados'
          ? [destacado]
          : url === '/colaboradoras/c-1/proyectos'
            ? [destacado, recomendado]
            : [];
      return {
        datos,
        cargando: false,
        error: null,
        recargar: jest.fn(),
      };
    });
  });

  it('muestra destacados arriba y evita repetirlos entre las recomendaciones', () => {
    render(<BuscadorProyectos />);

    const destacados = screen.getByRole('region', { name: 'Proyectos destacados' });
    const recomendados = screen.getByRole('region', { name: 'Recomendados para vos' });

    expect(within(destacados).getByText('Proyecto destacado')).toBeInTheDocument();
    expect(within(recomendados).getByText('Proyecto recomendado')).toBeInTheDocument();
    expect(within(recomendados).queryByText('Proyecto destacado')).not.toBeInTheDocument();
    expect(
      destacados.compareDocumentPosition(recomendados) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
