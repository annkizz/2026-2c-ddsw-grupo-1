import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { useListado } from '../../hooks/useListado';
import Habilidades from './Habilidades.jsx';

jest.mock('../../hooks/useListado', () => ({
  useListado: jest.fn(),
}));

const FormularioHabilidades = ({ onSiguiente }) => {
  const [datos, setDatos] = useState({ habilidades: [] });
  return (
    <Habilidades
      datos={datos}
      setDatos={setDatos}
      onVolver={jest.fn()}
      onSiguiente={onSiguiente}
    />
  );
};

describe('Habilidades del registro de colaboradora', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useListado.mockReturnValue({
      datos: [{ titulo: 'React' }],
      cargando: false,
      error: null,
      recargar: jest.fn(),
    });
  });

  it('solo permite continuar con una habilidad disponible en el catálogo', () => {
    const onSiguiente = jest.fn();
    render(<FormularioHabilidades onSiguiente={onSiguiente} />);

    fireEvent.focus(screen.getByRole('combobox', { name: 'Habilidades' }));
    fireEvent.click(screen.getByRole('option', { name: 'React' }));
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(onSiguiente).toHaveBeenCalledTimes(1);
  });

  it('bloquea el avance si no se seleccionó una habilidad disponible', () => {
    const onSiguiente = jest.fn();
    render(<FormularioHabilidades onSiguiente={onSiguiente} />);

    fireEvent.change(screen.getByRole('combobox', { name: 'Habilidades' }), {
      target: { value: 'Habilidad inventada' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(onSiguiente).not.toHaveBeenCalled();
    expect(screen.getByText('Elegí al menos una habilidad disponible.')).toBeInTheDocument();
  });
});
