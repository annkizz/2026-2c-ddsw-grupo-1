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
import { useModoColor } from "../../theme/ModoColorContext.jsx";
import "../../components/Card.css";
import "./Busquedas.css";
import "./Mapa.css";

const REGIONES = PROVINCIAS_MAPA.provincias.map((provincia) => ({
  codigo: provincia.codigoProvincia,
  nombre: provincia.nombreProvincia,
  path: provincia.path,
  labelX: provincia.labelX,
  labelY: provincia.labelY,
}));

// Escala secuencial de un solo tono (claro -> oscuro) del modo activo (normal o daltónico).
// Además del color, cada provincia muestra su número y hay una tabla equivalente.
function nivelDeRegion(cantidad, maximo) {
  if (cantidad === 0) return 0;
  if (maximo <= 1) return 5;
  return Math.min(5, Math.ceil((cantidad / maximo) * 5));
}

export default function Mapa() {
  const { tokens } = useModoColor();
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
        subtitulo={t('mapa.exploraComoSeDistribuyenLos')}
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
                      className={`provincia${activa ? " provincia--activa" : ""}`}
                      tabIndex={0}
                      role="button"
                      aria-pressed={activa}
                      aria-label={`${region.nombre}: ${cantidad} proyecto${cantidad === 1 ? "" : "s"}`}
                      onClick={() => seleccionar(region.codigo)}
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
                  Referencias
                </p>
                <ul className="leyenda__escala" aria-labelledby="leyenda-titulo">
                  <li>
                    <span className="leyenda__color leyenda__color--0" aria-hidden="true" />
                    Sin proyectos
                  </li>
                  <li>
                    <span className="leyenda__color leyenda__color--1" aria-hidden="true" />
                    Menos proyectos
                  </li>
                  <li className="leyenda__intermedios" aria-hidden="true">
                    <span className="leyenda__color leyenda__color--2" />
                    <span className="leyenda__color leyenda__color--3" />
                    <span className="leyenda__color leyenda__color--4" />
                  </li>
                  <li>
                    <span className="leyenda__color leyenda__color--5" aria-hidden="true" />
                    Más proyectos
                  </li>
                </ul>
                <p className="texto-secundario">{t('mapa.elNumeroEnCadaProvincia')}</p>
              </div>
            </div>

            <div className="mapa-columna">
              <h2>Provincias con proyectos activos</h2>
              {grupos.length === 0 ? (
                <EstadoVacio icono={FiMapPin} nivelTitulo="p" titulo="No hay proyectos activos con ubicación todavía." />
              ) : (
                <table className="tabla">
                  <caption className="tabla__caption">
                    Proyectos activos por provincia. Misma información que el mapa, en formato de tabla.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Provincia</th>
                      <th scope="col">Proyectos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupos.map((grupo) => (
                      <tr key={grupo.codigo} className={grupo.codigo === seleccionada ? "tabla__fila--activa" : undefined}>
                        <td>
                          <Button
                            variant="text"
                            type="button"
                            className="enlace-tabla"
                            aria-pressed={grupo.codigo === seleccionada}
                            onClick={() => seleccionar(grupo.codigo)}
                          >
                            {grupo.nombre}
                          </Button>
                        </td>
                        <td>{grupo.cantidad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {grupoSeleccionado && (
            <section className="resultados" aria-labelledby="mapa-seleccion-titulo">
              <div className="resultados__encabezado resultados__encabezado--fila">
                <h2 id="mapa-seleccion-titulo">Proyectos en {grupoSeleccionado.nombre}</h2>
                <Button
                  variant="outlined"
                  type="button"
                  startIcon={<FiX aria-hidden="true" />}
                  onClick={() => setSeleccionada(null)}
                >
                  Ver todas las provincias
                </Button>
              </div>
              <ul className="tarjetas">
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
          )}
        </>
      )}

      <p className="texto-caption mapa-fuente">{t('mapa.fuenteDelMapaGadm4')}</p>
    </div>
  );
}
