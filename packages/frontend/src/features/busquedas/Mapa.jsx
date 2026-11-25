import { t } from '../../i18n/t';
import React, { useEffect, useState } from "react";
import { Button } from "@mui/material";
import { FiMapPin, FiX } from "react-icons/fi";
import CardProyecto from "../../components/CardProyecto/CardProyecto";
import EncabezadoPagina from "../../components/EncabezadoPagina/EncabezadoPagina.jsx";
import AlertaError from "../../components/AlertaError/AlertaError.jsx";
import EstadoVacio from "../../components/EstadoVacio/EstadoVacio.jsx";
import { EsqueletoDetalle } from "../../components/Esqueletos/Esqueletos.jsx";
import { PROVINCIAS_MAPA } from "../../data/provinciasMapa";
import { obtenerUbicacionesProyectos } from "../../service/proyectosService";
import { tokensBase as tokens } from "../../designTokens.js";
import "../../components/Card.css";
import "./Busquedas.css";
import "./Mapa.css";

const REGIONES = PROVINCIAS_MAPA.provincias
  .filter((provincia) => provincia.codigoProvincia !== "AR-C")
  .map((provincia) => ({
    codigo: provincia.codigoProvincia,
    nombre: provincia.nombreProvincia,
    path: provincia.path,
    labelX: provincia.labelX,
    labelY: provincia.labelY,
  }));

// Escala secuencial de un solo tono (claro -> oscuro): se distingue por claridad, no solo por matiz.
// Además del color, cada provincia muestra su número.
function nivelDeRegion(cantidad, maximo) {
  if (cantidad === 0) return 0;
  if (maximo <= 1) return 5;
  return Math.min(5, Math.ceil((cantidad / maximo) * 5));
}

// Rangos reales de cada tono para la referencia ("1", "2 a 3", "4 a 6"…). Se omiten los tonos sin rango.
function rangosDeLeyenda(maximo) {
  if (maximo <= 0) return [];
  if (maximo === 1) return [{ nivel: 5, texto: t('mapa.unProyecto', { cantidad: 1 }) }];
  const rangos = [];
  for (let nivel = 1; nivel <= 5; nivel += 1) {
    const desde = Math.floor(((nivel - 1) * maximo) / 5) + 1;
    const hasta = Math.floor((nivel * maximo) / 5);
    if (desde > hasta) continue;
    rangos.push({
      nivel,
      texto: desde === hasta
        ? t(desde === 1 ? 'mapa.unProyecto' : 'mapa.variosProyectos', { cantidad: desde })
        : t('mapa.rangoProyectos', { desde, hasta }),
    });
  }
  return rangos;
}

export default function Mapa() {
  const colores = [
    tokens["--color-map-empty"],
    tokens["--color-map-1"],
    tokens["--color-map-2"],
    tokens["--color-map-3"],
    tokens["--color-map-4"],
    tokens["--color-map-5"],
  ];
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
      .then((datos) => {
        if (!cancelado) setGrupos(datos);
      })
      .catch((fallo) => {
        if (!cancelado) {
          setError(fallo);
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [intento]);

  // backend ya devuelve los grupos ordenados por cantidad, solo armo indice por codigo para pintar region
  const grupoPorCodigo = {};
  for (const grupo of grupos) {
    grupoPorCodigo[grupo.codigo] = grupo;
  }
  const maximo = grupos.reduce(
    (actual, grupo) => Math.max(actual, grupo.cantidad),
    0,
  );
  const totalProyectos = grupos.reduce(
    (total, grupo) => total + grupo.cantidad,
    0,
  );
  const grupoSeleccionado = grupos.find(
    (grupo) => grupo.codigo === seleccionada,
  );
  const regionSeleccionada = REGIONES.find((region) => region.codigo === seleccionada);
  const provincias = [...REGIONES].sort((a, b) => a.nombre.localeCompare(b.nombre));

  const seleccionar = (codigo) => {
    setSeleccionada((actual) => (actual === codigo ? null : codigo));
  };

  return (
    <div className="contenedor-pagina">
      <EncabezadoPagina
        titulo={t('mapa.titulo')}
        migas={[{ texto: t('navegacion.inicio'), to: "/" }, { texto: t('navegacion.mapa') }]}
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
              : t(totalProyectos === 1 ? 'mapa.unProyectoConUbicacion' : 'mapa.variosProyectosConUbicacion', {
                  total: totalProyectos, provincias: grupos.length,
                })}
          </p>

          <div className="mapa-contenedor">
            <div className="mapa-columna mapa-tarjeta">
              <svg
                className="mapa"
                viewBox={`0 0 ${PROVINCIAS_MAPA.ancho} ${PROVINCIAS_MAPA.alto}`}
                role="group"
                aria-label={t('mapa.etiquetaMapa')}
              >
                {REGIONES.map((region) => {
                  const grupo = grupoPorCodigo[region.codigo];
                  const cantidad = grupo ? grupo.cantidad : 0;
                  const activa = region.codigo === seleccionada;
                  return (
                    <path
                      key={region.codigo}
                      d={region.path}
                      fill={colores[nivelDeRegion(cantidad, maximo)]}
                      fillRule="evenodd"
                      className="provincia"
                      tabIndex={0}
                      role="button"
                      aria-pressed={activa}
                      aria-label={t(cantidad === 1 ? 'mapa.unProyectoProvincia' : 'mapa.variosProyectosProvincia', { provincia: region.nombre, cantidad })}
                      onMouseDown={(evento) => evento.preventDefault()}
                      onClick={(evento) => {
                        seleccionar(region.codigo);
                        if (evento.detail > 0) evento.currentTarget.blur();
                      }}
                      onKeyDown={(evento) => {
                        if (evento.key === "Enter" || evento.key === " ") {
                          evento.preventDefault();
                          seleccionar(region.codigo);
                        }
                      }}
                    >
                      <title>{`${region.nombre}: ${cantidad}`}</title>
                    </path>
                  );
                })}
                {/* Provincia elegida: contorno grueso y oscuro dibujado encima de las vecinas.
                    Se reconoce por la forma del borde, no por un cambio de color del relleno. */}
                {regionSeleccionada && (
                  <path
                    d={regionSeleccionada.path}
                    fillRule="evenodd"
                    className="provincia-seleccionada"
                    aria-hidden="true"
                  />
                )}
                {REGIONES.map((region) => {
                  const grupo = grupoPorCodigo[region.codigo];
                  const cantidad = grupo ? grupo.cantidad : 0;
                  return (
                    <text
                      key={`numero-${region.codigo}`}
                      x={region.labelX}
                      y={region.labelY}
                      className={`mapa__numero${cantidad === 0 ? " mapa__numero--cero" : ""}`}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      aria-hidden="true"
                    >
                      {cantidad}
                    </text>
                  );
                })}
              </svg>

              <div className="leyenda">
                <p className="leyenda__titulo" id="leyenda-titulo">
                  {t('mapa.referencia')}
                </p>
                <ul className="leyenda__escala" aria-labelledby="leyenda-titulo">
                  <li>
                    <span className="leyenda__color leyenda__color--0" aria-hidden="true" />
                    {t('mapa.sinProyectos')}
                  </li>
                  {rangosDeLeyenda(maximo).map(({ nivel, texto }) => (
                    <li key={nivel}>
                      <span className={`leyenda__color leyenda__color--${nivel}`} aria-hidden="true" />
                      {texto}
                    </li>
                  ))}
                </ul>
                <p className="texto-secundario">{t('mapa.descripcionReferencia')}</p>
              </div>
            </div>

            <div className="mapa-columna mapa-lateral">
              <div className="mapa-seleccion" aria-live="polite">
              {regionSeleccionada ? (
                <section className="resultados" aria-labelledby="mapa-seleccion-titulo">
                  <div className="resultados__encabezado resultados__encabezado--fila">
                    <h2 id="mapa-seleccion-titulo">{t('mapa.proyectosEn', { provincia: regionSeleccionada.nombre })}</h2>
                    <Button
                      variant="outlined"
                      type="button"
                      startIcon={<FiX aria-hidden="true" />}
                      onClick={() => setSeleccionada(null)}
                    >
                      {t('mapa.quitarSeleccion')}
                    </Button>
                  </div>
                  {grupoSeleccionado ? <ul className="tarjetas tarjetas--una-columna">
                    {grupoSeleccionado.proyectos.map((proyecto) => (
                      <CardProyecto
                        key={proyecto.id}
                        proyecto={{
                          ...proyecto,
                          ubicacion: {
                            nombreProvincia: grupoSeleccionado.nombre,
                            ciudad: proyecto.ciudad,
                          },
                        }}
                        nombreColectivo={proyecto.colectivo?.nombre}
                      />
                    ))}
                  </ul> : <EstadoVacio icono={FiMapPin} nivelTitulo="p" titulo={t('mapa.sinProyectosProvincia')} />}
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
                <caption className="tabla__caption">{t('mapa.tablaTitulo')}</caption>
                <thead><tr><th scope="col">{t('mapa.provincia')}</th><th scope="col">{t('mapa.proyectos')}</th></tr></thead>
                <tbody>
                  {provincias.map((provincia) => (
                    <tr key={provincia.codigo} className={provincia.codigo === seleccionada ? "tabla__fila--activa" : undefined}>
                      <td>
                        <Button className="enlace-tabla" type="button" aria-pressed={provincia.codigo === seleccionada} onClick={() => seleccionar(provincia.codigo)}>
                          {provincia.nombre}
                        </Button>
                      </td>
                      <td>{grupoPorCodigo[provincia.codigo]?.cantidad ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <p className="texto-caption mapa-fuente">{t('mapa.fuenteDelMapaGadm4')}</p>
    </div>
  );
}
