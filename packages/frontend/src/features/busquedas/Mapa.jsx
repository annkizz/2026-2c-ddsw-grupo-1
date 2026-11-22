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
  if (maximo === 1) return [{ nivel: 5, texto: "1 proyecto" }];
  const rangos = [];
  for (let nivel = 1; nivel <= 5; nivel += 1) {
    const desde = Math.floor(((nivel - 1) * maximo) / 5) + 1;
    const hasta = Math.floor((nivel * maximo) / 5);
    if (desde > hasta) continue;
    rangos.push({
      nivel,
      texto: desde === hasta
        ? `${desde} proyecto${desde === 1 ? "" : "s"}`
        : `De ${desde} a ${hasta} proyectos`,
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

  const seleccionar = (codigo) => {
    setSeleccionada((actual) => (actual === codigo ? null : codigo));
  };

  return (
    <div className="contenedor-pagina">
      <EncabezadoPagina
        titulo="Proyectos por provincia"
        migas={[{ texto: t('navegacion.inicio'), to: "/" }, { texto: "Mapa" }]}
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
              ? "Todavía no hay proyectos activos con ubicación."
              : `${totalProyectos} proyecto${totalProyectos === 1 ? "" : "s"} activo${
                  totalProyectos === 1 ? "" : "s"
                } con ubicación en ${grupos.length} provincias.`}
          </p>

          <div className="mapa-contenedor">
            <div className="mapa-columna mapa-tarjeta">
              <svg
                className="mapa"
                viewBox={`0 0 ${PROVINCIAS_MAPA.ancho} ${PROVINCIAS_MAPA.alto}`}
                role="group"
                aria-label="Mapa coroplético de proyectos por provincia"
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
                      aria-label={`${region.nombre}: ${cantidad} proyecto${cantidad === 1 ? "" : "s"}`}
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
                  Referencia: cantidad de proyectos activos
                </p>
                <ul className="leyenda__escala" aria-labelledby="leyenda-titulo">
                  <li>
                    <span className="leyenda__color leyenda__color--0" aria-hidden="true" />
                    Sin proyectos
                  </li>
                  {rangosDeLeyenda(maximo).map(({ nivel, texto }) => (
                    <li key={nivel}>
                      <span className={`leyenda__color leyenda__color--${nivel}`} aria-hidden="true" />
                      {texto}
                    </li>
                  ))}
                </ul>
                <p className="texto-secundario">Cuanto más oscuro, más proyectos. El número sobre cada provincia es la cantidad exacta.</p>
              </div>
            </div>

            <div className="mapa-columna mapa-seleccion" aria-live="polite">
              {grupos.length === 0 ? (
                <EstadoVacio icono={FiMapPin} nivelTitulo="p" titulo="No hay proyectos activos con ubicación todavía." />
              ) : grupoSeleccionado ? (
                <section className="resultados" aria-labelledby="mapa-seleccion-titulo">
                  <div className="resultados__encabezado resultados__encabezado--fila">
                    <h2 id="mapa-seleccion-titulo">Proyectos en {grupoSeleccionado.nombre}</h2>
                    <Button
                      variant="outlined"
                      type="button"
                      startIcon={<FiX aria-hidden="true" />}
                      onClick={() => setSeleccionada(null)}
                    >
                      Quitar selección
                    </Button>
                  </div>
                  <ul className="tarjetas tarjetas--una-columna">
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
                  </ul>
                </section>
              ) : (
                <EstadoVacio
                  icono={FiMapPin}
                  nivelTitulo="h2"
                  titulo="Elegí una provincia"
                  descripcion="Tocá una provincia del mapa para ver sus proyectos activos acá."
                />
              )}
            </div>
          </div>
        </>
      )}

      <p className="texto-caption mapa-fuente">{t('mapa.fuenteDelMapaGadm4')}</p>
    </div>
  );
}
