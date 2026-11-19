import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import UbicacionColectivo from './UbicacionColectivo';

const renderUbicacion = (props = {}) =>
  render(
    <UbicacionColectivo
      pais=""
      provincia=""
      ciudad=""
      onChange={jest.fn()}
      {...props}
    />,
  );

describe('UbicacionColectivo', () => {
  it('asocia labels superiores con sus controles cuando se solicita', () => {
    renderUbicacion({ labelsAbove: true, idPrefix: 'registro-colectivo-ubicacion' });

    expect(screen.getByText('País (opcional)')).toHaveClass('registro-campo__label');
    expect(
      screen.getByRole('combobox', { name: 'País (opcional)' }),
    ).toHaveAttribute('id', 'registro-colectivo-ubicacion-pais');
  });

  it('conserva los labels flotantes de MUI por defecto', () => {
    const { container } = renderUbicacion();

    expect(container.querySelector('.MuiInputLabel-root')).toHaveTextContent('País (opcional)');
  });
});
