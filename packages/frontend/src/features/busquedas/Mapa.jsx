import React, { useEffect, useState } from "react";
import { Button } from "@mui/material";
import CardProyecto from "../../components/CardProyecto/CardProyecto";
import { PROVINCIAS_MAPA } from "../../data/provinciasMapa";
import { obtenerUbicacionesProyectos } from "../../service/proyectosService";
import designTokens from "../../designTokens.js";
import "./Busquedas.css";
import "./Mapa.css";

const REGIONES = PROVINCIAS_MAPA.provincias.map((provincia) => ({
  codigo: provincia.codigoProvincia,
  nombre: provincia.nombreProvincia,
  path: provincia.path,
  labelX: provincia.labelX,
  labelY: provincia.labelY,
}));

const COLOR_SIN_PROYECTOS = designTokens["--color-map-empty"];
// Escala de 5 tonos (claro -> oscuro) segun cantidad de proyectos.
const COLORES = [
  designTokens["--color-map-1"],
  designTokens["--color-map-2"],
  designTokens["--color-map-3"],
  designTokens["--color-map-4"],
  designTokens["--color-map-5"],
];

function colorDeRegion(cantidad, maximo) {
  if (cantidad === 0) return COLOR_SIN_PROYECTOS;
  if (maximo <= 1) return COLORES[4];
  const nivel = Math.min(5, Math.ceil((cantidad / maximo) * 5));
  return COLORES[nivel - 1];
}

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
      .then((datos) => {
        if (!cancelado) setGrupos(datos);
      })
      .catch(() => {
        if (!cancelado) {
          setError("No pudimos cargar el mapa. ¿Está corriendo el backend?");
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
    <section className="pagina">
      <h1>Proyectos por provincia</h1>
      <p className="pagina__bajada">
        Explorá cómo se distribuyen los proyectos activos en el país. Hacé clic
        en una provincia para ver sus proyectos.
      </p>

      {cargando && <p className="estado">Cargando el mapa…</p>}
      {error && (
        <div className="estado-bloque">
          <p className="estado estado--error">{error}</p>
          <Button
            variant="outlined"
            type="button"
            className="boton boton--secundario"
            onClick={() => setIntento((actual) => actual + 1)}
          >
            Reintentar
          </Button>
        </div>
      )}

      {!cargando && !error && (
        <>
          <p className="estado" role="status" aria-live="polite">
            {totalProyectos === 0
              ? "Todavía no hay proyectos activos con ubicación."
              : `${totalProyectos} proyecto${
                  totalProyectos === 1 ? "" : "s"
                } activo${
                  totalProyectos === 1 ? "" : "s"
                } con ubicación en ${grupos.length} provincias.`}
          </p>

          <div className="mapa-contenedor">
            <div className="mapa-columna">
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
                      fill={colorDeRegion(cantidad, maximo)}
                      fillRule="evenodd"
                      className={`provincia${
                        activa ? " provincia--activa" : ""
                      }`}
                      tabIndex={0}
                      role="button"
                      aria-label={`${region.nombre}: ${cantidad} proyecto${
                        cantidad === 1 ? "" : "s"
                      }`}
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
                      className={`mapa__numero${
                        cantidad === 0 ? " mapa__numero--cero" : ""
                      }`}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      aria-hidden="true"
                    >
                      {cantidad}
                    </text>
                  );
                })}
              </svg>

              <div className="leyenda" aria-hidden="true">
                <span>Menos proyectos</span>
                {COLORES.map((color) => (
                  <span
                    key={color}
                    className="leyenda__color"
                    style={{ backgroundColor: color }}
                  />
                ))}
                <span>Más proyectos</span>
              </div>
            </div>

            <div className="mapa-columna">
              <h2>Provincias con proyectos activos</h2>
              {grupos.length === 0 ? (
                <p>No hay proyectos activos con ubicación todavía.</p>
              ) : (
                <table className="tabla">
                  <caption className="tabla__caption">
                    Proyectos activos por provincia. Misma información que el
                    mapa, en formato de tabla.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Provincia</th>
                      <th scope="col">Proyectos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupos.map((grupo) => (
                      <tr key={grupo.codigo}>
                        <td>
                          <Button
                            variant="text"
                            color="primary"
                            type="button"
                            className="enlace-tabla"
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
            <section className="resultados">
              <div className="resultados__encabezado">
                <h2>Proyectos en {grupoSeleccionado.nombre}</h2>
                <Button
                  variant="outlined"
                  type="button"
                  className="boton boton--secundario"
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

      <p className="nota">
        Fuente del mapa: GADM 4.1 (gadm.org), uso académico con atribución.
      </p>
    </section>
  );
}
