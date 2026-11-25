import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { obtenerUbicacionesProyectos } from '../../service/proyectosService';
import Mapa from './Mapa';

jest.mock('../../service/proyectosService', () => ({
  obtenerUbicacionesProyectos: jest.fn(),
}));
jest.mock('react-leaflet', () => {
  const React = require('react');
  const PropTypes = require('prop-types');
  const MapContainer = ({ children }) => (
    <div data-testid="mapa-interactivo">{children}</div>
  );
  MapContainer.propTypes = { children: PropTypes.node };
  const Marker = ({ children, eventHandlers, position, title }) => (
    <button
      type="button"
      data-testid="marcador-proyecto"
      data-position={position.join(',')}
      aria-label={title}
      onClick={eventHandlers.click}
    >
      {children}
    </button>
  );
  Marker.propTypes = {
    children: PropTypes.node,
    eventHandlers: PropTypes.shape({ click: PropTypes.func }).isRequired,
    position: PropTypes.arrayOf(PropTypes.number).isRequired,
    title: PropTypes.string.isRequired,
  };
  const Popup = ({ children }) => <span>{children}</span>;
  Popup.propTypes = { children: PropTypes.node };

  return {
    MapContainer,
    TileLayer: () => null,
    Marker,
    Popup,
  };
});
jest.mock('react-router-dom', () => {
  const PropTypes = require('prop-types');
  const Link = ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  );
  Link.propTypes = {
    children: PropTypes.node,
    to: PropTypes.string.isRequired,
  };
  return { Link };
});

it('muestra la distribución provincial y marca los proyectos con coordenadas', async () => {
  obtenerUbicacionesProyectos.mockResolvedValue([
    {
      codigo: 'AR-M',
      nombre: 'Mendoza',
      cantidad: 2,
      proyectos: [
        {
          id: 'proyecto-geolocalizado',
          titulo: 'Proyecto con coordenadas',
          descripcion: 'Descripción visible en el pin.',
          latitud: -32.89,
          longitud: -68.83,
          ciudad: 'Godoy Cruz',
          direccion: 'Plaza Godoy Cruz',
          colectivo: { nombre: 'Colectivo de prueba' },
        },
        {
          id: 'proyecto-sin-coordenadas',
          titulo: 'Proyecto solo provincial',
          ciudad: null,
          colectivo: { nombre: 'Colectivo de prueba' },
        },
      ],
    },
  ]);
  render(<Mapa />);

  expect(await screen.findByText(/2 proyectos activos/)).toBeInTheDocument();
  expect(
    screen.getByText('1 proyecto tiene coordenadas exactas. Los que no tienen coordenadas se incluyen en el recuento por provincia.'),
  ).toBeInTheDocument();
  expect(obtenerUbicacionesProyectos).toHaveBeenCalledWith();
  expect(screen.getAllByTestId('marcador-proyecto')).toHaveLength(1);
  expect(screen.getByTestId('marcador-proyecto')).toHaveAttribute(
    'data-position',
    '-32.89,-68.83',
  );
  expect(
    screen.getByRole('link', { name: 'Proyecto con coordenadas' }),
  ).toHaveAttribute('href', '/proyectos/proyecto-geolocalizado');
  expect(screen.getByText('Descripción visible en el pin.')).toBeInTheDocument();
  expect(
    screen.getByText('Plaza Godoy Cruz, Godoy Cruz, Mendoza'),
  ).toBeInTheDocument();

  const tabla = screen.getByRole('table');
  expect(within(tabla).getAllByRole('row')).toHaveLength(25);
  expect(within(tabla).getByRole('button', { name: 'Catamarca' })).toBeInTheDocument();
  expect(
    within(tabla).getByRole('button', { name: 'Ciudad Autónoma de Buenos Aires' }),
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Proyecto con coordenadas' }));
  expect(
    screen.getByRole('heading', { name: 'Proyectos en Mendoza' }),
  ).toBeInTheDocument();
  expect(screen.getByText('Proyecto solo provincial')).toBeInTheDocument();

  fireEvent.click(within(tabla).getByRole('button', { name: 'Catamarca' }));
  expect(
    screen.getByText('No hay proyectos activos en esta provincia.'),
  ).toBeInTheDocument();
});
