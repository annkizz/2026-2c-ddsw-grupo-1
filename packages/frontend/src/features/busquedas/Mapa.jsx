import { t } from '../../i18n/t';
import React, { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { FiMapPin, FiX } from 'react-icons/fi';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import CardProyecto from '../../components/CardProyecto/CardProyecto';
import EncabezadoPagina from '../../components/EncabezadoPagina/EncabezadoPagina.jsx';
import AlertaError from '../../components/AlertaError/AlertaError.jsx';
import EstadoVacio from '../../components/EstadoVacio/EstadoVacio.jsx';
import { EsqueletoDetalle } from '../../components/Esqueletos/Esqueletos.jsx';
import { PROVINCIAS } from '../../data/provincias';
import { obtenerUbicacionesProyectos } from '../../service/proyectosService';
import '../../components/Card.css';
import './Busquedas.css';
import './Mapa.css';

const CENTRO_ARGENTINA = [-38.4, -63.6];
const ICONO_PROYECTO = L.divIcon({
  className: 'mapa-marcador',
  html: '<span aria-hidden="true"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function Mapa() {
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [seleccionada, setSeleccionada] = useState(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);
    obtenerUbicacionesProyectos()
      .then((ubicaciones) => {
        if (!cancelado) setGrupos(ubicaciones);
      })
      .catch((fallo) => {
        if (!cancelado) setError(fallo);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [intento]);

  const grupoPorCodigo = Object.fromEntries(
    grupos.map((grupo) => [grupo.codigo, grupo]),
  );
  const proyectosGeolocalizados = grupos.flatMap((grupo) =>
    grupo.proyectos
      .filter(
        (proyecto) =>
          Number.isFinite(proyecto.latitud) &&
          Number.isFinite(proyecto.longitud),
      )
      .map((proyecto) => ({
        ...proyecto,
        codigoProvincia: grupo.codigo,
        provincia: grupo.nombre,
      })),
  );
  const totalProyectos = grupos.reduce(
    (total, grupo) => total + grupo.cantidad,
    0,
  );
  const regionSeleccionada = PROVINCIAS.find(
    (provincia) => provincia.codigo === seleccionada,
  );
  const grupoSeleccionado = grupoPorCodigo[seleccionada];

  const seleccionar = (codigo) => {
    setSeleccionada((actual) => (actual === codigo ? null : codigo));
  };

  return (
    <div className="contenedor-pagina">
      <EncabezadoPagina
        titulo={t('mapa.titulo')}
        migas={[
          { texto: t('navegacion.inicio'), to: '/' },
          { texto: t('navegacion.mapa') },
        ]}
      />

      {cargando && <EsqueletoDetalle etiqueta={t('mapa.cargandoElMapa')} />}
      {error && (
        <AlertaError
          error={error}
          titulo={t('mapa.noPudimosCargarElMapa')}
          onReintentar={() => setIntento((actual) => actual + 1)}
        />
      )}

      {!cargando && !error && (
        <>
          <p className="contador-resultados" role="status" aria-live="polite">
            {totalProyectos === 0
              ? t('mapa.sinUbicaciones')
              : t(
                  totalProyectos === 1
                    ? 'mapa.unProyectoConUbicacion'
                    : 'mapa.variosProyectosConUbicacion',
                  {
                    total: totalProyectos,
                    provincias: grupos.length,
                  },
                )}
          </p>
          <p className="texto-secundario">
            {t(
              proyectosGeolocalizados.length === 1
                ? 'mapa.unProyectoGeolocalizado'
                : 'mapa.variosProyectosGeolocalizados',
              { cantidad: proyectosGeolocalizados.length },
            )}
          </p>

          <div className="mapa-contenedor">
            <div className="mapa-columna mapa-tarjeta">
              <MapContainer
                center={CENTRO_ARGENTINA}
                zoom={4}
                minZoom={3}
                maxZoom={12}
                className="mapa"
                aria-label={t('mapa.etiquetaMapa')}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {proyectosGeolocalizados.map((proyecto) => (
                  <Marker
                    key={proyecto.id}
                    position={[proyecto.latitud, proyecto.longitud]}
                    title={proyecto.titulo}
                    icon={ICONO_PROYECTO}
                    eventHandlers={{
                      click: () => seleccionar(proyecto.codigoProvincia),
                    }}
                  >
                    <Popup>
                      <article className="mapa-popup">
                        <h3>
                          <Link to={`/proyectos/${proyecto.id}`}>
                            {proyecto.titulo}
                          </Link>
                        </h3>
                        <p>{proyecto.descripcion}</p>
                        <p>
                          {[
                            proyecto.direccion,
                            proyecto.ciudad,
                            proyecto.provincia,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                        {proyecto.colectivo?.nombre && (
                          <p>{proyecto.colectivo.nombre}</p>
                        )}
                      </article>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
              <p className="texto-caption mapa-fuente">
                {t('mapa.fuenteDelMapaOpenStreetMap')}
              </p>
            </div>

            <div className="mapa-columna mapa-lateral">
              <div className="mapa-seleccion" aria-live="polite">
                {regionSeleccionada ? (
                  <section
                    className="resultados"
                    aria-labelledby="mapa-seleccion-titulo"
                  >
                    <div className="resultados__encabezado resultados__encabezado--fila">
                      <h2 id="mapa-seleccion-titulo">
                        {t('mapa.proyectosEn', {
                          provincia: regionSeleccionada.nombre,
                        })}
                      </h2>
                      <Button
                        variant="outlined"
                        type="button"
                        startIcon={<FiX aria-hidden="true" />}
                        onClick={() => setSeleccionada(null)}
                      >
                        {t('mapa.quitarSeleccion')}
                      </Button>
                    </div>
                    {grupoSeleccionado?.proyectos?.length ? (
                      <ul className="tarjetas tarjetas--una-columna">
                        {grupoSeleccionado.proyectos.map((proyecto) => (
                          <CardProyecto
                            key={proyecto.id}
                            proyecto={{
                              id: proyecto.id,
                              titulo: proyecto.titulo,
                              ubicacion: {
                                nombreProvincia: regionSeleccionada.nombre,
                                ciudad: proyecto.ciudad,
                              },
                            }}
                            nombreColectivo={proyecto.colectivo?.nombre}
                          />
                        ))}
                      </ul>
                    ) : (
                      <EstadoVacio
                        icono={FiMapPin}
                        nivelTitulo="p"
                        titulo={t('mapa.sinProyectosProvincia')}
                      />
                    )}
                  </section>
                ) : (
                  <EstadoVacio
                    icono={FiMapPin}
                    nivelTitulo="h2"
                    titulo={t('mapa.elegiProvincia')}
                    descripcion={t('mapa.instruccionProvincia')}
                  />
                )}
              </div>

              <table className="tabla">
                <caption className="tabla__caption">
                  {t('mapa.tablaTitulo')}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">{t('mapa.provincia')}</th>
                    <th scope="col">{t('mapa.proyectos')}</th>
                  </tr>
                </thead>
                <tbody>
                  {PROVINCIAS.map((provincia) => {
                    const cantidad =
                      grupoPorCodigo[provincia.codigo]?.cantidad ?? 0;
                    return (
                      <tr
                        key={provincia.codigo}
                        className={
                          provincia.codigo === seleccionada
                            ? 'tabla__fila--activa'
                            : undefined
                        }
                      >
                        <td>
                          <Button
                            className="enlace-tabla"
                            type="button"
                            aria-pressed={provincia.codigo === seleccionada}
                            onClick={() => seleccionar(provincia.codigo)}
                          >
                            {provincia.nombre}
                          </Button>
                        </td>
                        <td>{cantidad}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
