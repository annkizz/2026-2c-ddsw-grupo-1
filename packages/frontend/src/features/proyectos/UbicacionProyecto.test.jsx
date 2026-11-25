import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import UbicacionProyecto from './UbicacionProyecto';

let mockMapClick;

jest.mock('react-leaflet', () => {
  const React = require('react');
  const PropTypes = require('prop-types');
  const MapContainer = ({ children }) => (
    <div
      data-testid="selector-mapa"
      onClick={() =>
        mockMapClick?.({ latlng: { lat: -34.7, lng: -58.4 } })
      }
    >
      {children}
    </div>
  );
  MapContainer.propTypes = { children: PropTypes.node };
  const Marker = () => <span />;
  Marker.propTypes = { position: PropTypes.array };

  return {
    MapContainer,
    Marker,
    TileLayer: () => null,
    useMapEvents: (eventHandlers) => {
      mockMapClick = eventHandlers.click;
    },
  };
});

jest.mock('../../service/proyectosService', () => ({
  geocodificarDireccion: jest.fn(),
}));

describe('UbicacionProyecto', () => {
  it('permite elegir el punto exacto haciendo clic en el mapa', () => {
    const onChange = jest.fn();
    render(
      <UbicacionProyecto
        ubicacion={{
          pais: 'Argentina',
          provincia: 'AR-B',
          ciudad: 'Lanús',
          direccion: null,
          latitud: null,
          longitud: null,
        }}
        onChange={onChange}
        getAccessToken={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('selector-mapa'));

    expect(onChange).toHaveBeenCalledWith({
      direccion: null,
      latitud: -34.7,
      longitud: -58.4,
    });
  });
});
