import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, MenuItem, TextField } from '@mui/material';
import { FiMapPin, FiSearch } from 'react-icons/fi';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { PROVINCIAS } from '../../data/provincias';
import { t } from '../../i18n/t';
import { geocodificarDireccion } from '../../service/proyectosService';
import './UbicacionProyecto.css';

const CENTRO_ARGENTINA = [-38.4, -63.6];
const ICONO_PROYECTO = L.divIcon({
  className: 'mapa-marcador',
  html: '<span aria-hidden="true"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function SelectorDePunto({ ubicacion, onSeleccionar, disabled }) {
  useMapEvents({
    click(evento) {
      if (!disabled) {
        onSeleccionar({
          latitud: evento.latlng.lat,
          longitud: evento.latlng.lng,
        });
      }
    },
  });

  if (
    !Number.isFinite(ubicacion.latitud) ||
    !Number.isFinite(ubicacion.longitud)
  ) {
    return null;
  }

  return (
    <Marker
      position={[ubicacion.latitud, ubicacion.longitud]}
      icon={ICONO_PROYECTO}
    />
  );
}

SelectorDePunto.propTypes = {
  ubicacion: PropTypes.shape({
    latitud: PropTypes.number,
    longitud: PropTypes.number,
  }).isRequired,
  onSeleccionar: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default function UbicacionProyecto({
  ubicacion,
  onChange,
  errores = {},
  getAccessToken,
  disabled = false,
}) {
  const [consulta, setConsulta] = useState(ubicacion.direccion ?? '');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState('');
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);

  const cambiarPais = (evento) => {
    const pais = evento.target.value;
    setConsulta('');
    setResultados([]);
    setErrorBusqueda('');
    onChange({
      pais,
      provincia: '',
      ciudad: '',
      direccion: null,
      latitud: null,
      longitud: null,
    });
  };

  const cambiarProvincia = (evento) => {
    onChange({
      provincia: evento.target.value,
      ciudad: '',
      direccion: null,
      latitud: null,
      longitud: null,
    });
    setConsulta('');
    setResultados([]);
    setErrorBusqueda('');
  };

  const cambiarCiudad = (evento) => {
    onChange({
      ciudad: evento.target.value,
      direccion: null,
      latitud: null,
      longitud: null,
    });
    setConsulta('');
    setResultados([]);
    setErrorBusqueda('');
  };

  const cambiarConsulta = (evento) => {
    setConsulta(evento.target.value);
    setResultados([]);
    setErrorBusqueda('');
    setBusquedaRealizada(false);
    onChange({ direccion: null, latitud: null, longitud: null });
  };

  const buscarDireccion = async () => {
    setBuscando(true);
    setErrorBusqueda('');
    setResultados([]);
    setBusquedaRealizada(false);
    try {
      const token = await getAccessToken();
      const coincidencias = await geocodificarDireccion(token, {
        direccion: consulta.trim(),
        provincia: ubicacion.provincia,
        ciudad: ubicacion.ciudad.trim(),
      });
      setResultados(coincidencias);
      setBusquedaRealizada(true);
    } catch {
      setErrorBusqueda(t('formularioProyecto.errorBuscarDireccion'));
    } finally {
      setBuscando(false);
    }
  };

  const seleccionarResultado = (resultado) => {
    setConsulta(resultado.direccion);
    setResultados([]);
    setErrorBusqueda('');
    onChange({
      direccion: resultado.direccion,
      latitud: resultado.latitud,
      longitud: resultado.longitud,
    });
  };

  const seleccionarEnMapa = ({ latitud, longitud }) => {
    setConsulta('');
    setResultados([]);
    setErrorBusqueda('');
    setBusquedaRealizada(false);
    onChange({ direccion: null, latitud, longitud });
  };

  return (
    <fieldset className="form-proyecto-ubicacion" disabled={disabled}>
      <legend>{t('formularioProyecto.ubicacion')}</legend>
      <p className="texto-secundario">
        {t('formularioProyecto.ayudaUbicacionProyecto')}
      </p>

      <TextField
        id="proyecto-pais"
        select
        label={t('formularioProyecto.labelPaisUbicacion')}
        value={ubicacion.pais}
        onChange={cambiarPais}
        fullWidth
        slotProps={{ select: { displayEmpty: true } }}
      >
        <MenuItem value="">{t('formularioProyecto.sinUbicacion')}</MenuItem>
        <MenuItem value="Argentina">Argentina</MenuItem>
      </TextField>

      {ubicacion.pais === 'Argentina' && (
        <>
          <div className="form-proyecto-ubicacion__campos">
            <TextField
              id="proyecto-provincia"
              select
              label={t('formularioProyecto.labelProvinciaObligatoria')}
              value={ubicacion.provincia}
              onChange={cambiarProvincia}
              required
              error={Boolean(errores.provincia)}
              helperText={errores.provincia}
              fullWidth
              slotProps={{ select: { displayEmpty: true } }}
            >
              <MenuItem value="">{t('formularioProyecto.seleccionaProvincia')}</MenuItem>
              {PROVINCIAS.map(({ codigo, nombre }) => (
                <MenuItem key={codigo} value={codigo}>
                  {nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              id="proyecto-ciudad"
              label={t('formularioProyecto.labelLocalidadObligatoria')}
              placeholder={t('formularioProyecto.placeholderLocalidad')}
              value={ubicacion.ciudad}
              onChange={cambiarCiudad}
              disabled={!ubicacion.provincia}
              required
              error={Boolean(errores.ciudad)}
              helperText={errores.ciudad}
              fullWidth
            />
          </div>

          {ubicacion.provincia && ubicacion.ciudad.trim() && (
            <div className="selector-ubicacion">
              <div className="selector-ubicacion__busqueda">
                <TextField
                  id="proyecto-direccion"
                  label={t('formularioProyecto.labelDireccion')}
                  placeholder={t('formularioProyecto.placeholderDireccion')}
                  value={consulta}
                  onChange={cambiarConsulta}
                  error={Boolean(errores.punto)}
                  helperText={errores.punto || t('formularioProyecto.ayudaDireccion')}
                  fullWidth
                />
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={<FiSearch aria-hidden="true" />}
                  onClick={buscarDireccion}
                  disabled={buscando || consulta.trim().length < 3}
                >
                  {buscando
                    ? t('formularioProyecto.buscandoDireccion')
                    : t('formularioProyecto.buscarDireccion')}
                </Button>
              </div>

              {errorBusqueda && (
                <Alert severity="error" role="alert">
                  {errorBusqueda}
                </Alert>
              )}
              {busquedaRealizada && resultados.length === 0 && (
                <Alert severity="info" role="status">
                  {t('formularioProyecto.sinResultadosDireccion')}
                </Alert>
              )}
              {resultados.length > 0 && (
                <ul className="selector-ubicacion__resultados" aria-label={t('formularioProyecto.resultadosDireccion')}>
                  {resultados.map((resultado) => (
                    <li key={resultado.id}>
                      <Button
                        type="button"
                        variant="text"
                        onClick={() => seleccionarResultado(resultado)}
                      >
                        {resultado.direccion}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <p className="texto-secundario">
                {t('formularioProyecto.ayudaSeleccionarPunto')}
              </p>
              <MapContainer
                center={CENTRO_ARGENTINA}
                zoom={4}
                minZoom={3}
                maxZoom={17}
                className="selector-ubicacion__mapa"
                aria-label={t('formularioProyecto.etiquetaMapaUbicacion')}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <SelectorDePunto
                  ubicacion={ubicacion}
                  onSeleccionar={seleccionarEnMapa}
                  disabled={disabled}
                />
              </MapContainer>
              <p className="texto-caption">
                {t('formularioProyecto.avisoNominatim')}
                {' '}
                <a
                  href="https://operations.osmfoundation.org/policies/nominatim/"
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('formularioProyecto.politicaNominatim')}
                </a>
              </p>
              {Number.isFinite(ubicacion.latitud) &&
                Number.isFinite(ubicacion.longitud) && (
                  <p className="texto-secundario" role="status">
                    <FiMapPin aria-hidden="true" />{' '}
                    {t('formularioProyecto.puntoSeleccionado')}
                  </p>
                )}
            </div>
          )}
        </>
      )}
    </fieldset>
  );
}

UbicacionProyecto.propTypes = {
  ubicacion: PropTypes.shape({
    pais: PropTypes.string,
    provincia: PropTypes.string,
    ciudad: PropTypes.string,
    direccion: PropTypes.string,
    latitud: PropTypes.number,
    longitud: PropTypes.number,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  errores: PropTypes.object,
  getAccessToken: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
