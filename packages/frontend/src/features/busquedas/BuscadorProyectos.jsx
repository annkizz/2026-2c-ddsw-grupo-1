import React, { useMemo, useState } from "react";
import { Skeleton } from "@mui/material";
import CustomSelect from "../../components/CustomSelect/CustomSelect";
import CardProyecto from "../../components/CardProyecto/CardProyecto";
import { PROVINCIAS } from "../../data/provincias";
import { useAuth } from "../../hooks/useAuth.jsx";
import { useListado } from "../../hooks/useListado";
import "./Busquedas.css";
import "./BuscadorProyectos.css";

function ordenDeCoincidencia(proyecto) {
  const coincidencia = proyecto.coincidencia ?? proyecto;
  return [
    coincidencia.porcentajeRequeridas ?? 0,
    coincidencia.porcentajeCobertura ?? 0,
    coincidencia.puntaje ?? 0,
  ];
}

const FILTROS_INICIALES = {
  habilidades: [],
  idColectivo: "",
  etiquetas: [],
  provincia: "",
};

export default function BuscadorProyectos() {
  const { sesion } = useAuth();
  const idColaboradora = sesion?.idColaborador ?? null;
  const esColectivo = sesion?.rol === "COLECTIVO";

  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [filtrosAplicados, setFiltrosAplicados] = useState(null);
  const [mostrarMas, setMostrarMas] = useState(false);

  const habilidadesState = useListado("/habilidades");
  const etiquetasState = useListado("/etiquetas");
  const colectivosState = useListado("/colectivos");
  const coincidenciasState = useListado(
    idColaboradora ? `/colaboradoras/${idColaboradora}/proyectos` : null,
  );

  const urlBusqueda = useMemo(() => {
    if (!filtrosAplicados) return null;

    const parametros = new URLSearchParams({ estado: "ACTIVO" });
    for (const habilidad of filtrosAplicados.habilidades) {
      parametros.append("habilidad", habilidad);
    }
    for (const etiqueta of filtrosAplicados.etiquetas) {
      parametros.append("etiqueta", etiqueta);
    }
    if (filtrosAplicados.provincia !== "") {
      parametros.append("provincia", filtrosAplicados.provincia);
    }
    if (filtrosAplicados.idColectivo !== "") {
      parametros.append("idColectivo", filtrosAplicados.idColectivo);
    }
    return `/proyectos?${parametros.toString()}`;
  }, [filtrosAplicados]);

  const resultadosState = useListado(urlBusqueda);

  const colectivosPorId = useMemo(
    () =>
      new Map(
        colectivosState.datos.map((colectivo) => [
          colectivo.id,
          colectivo.nombre,
        ]),
      ),
    [colectivosState.datos],
  );

  const coincidenciasPorId = useMemo(
    () =>
      new Map(
        coincidenciasState.datos.map((proyecto) => [proyecto.id, proyecto]),
      ),
    [coincidenciasState.datos],
  );

  const recomendados = coincidenciasState.datos;

  const resultados = useMemo(() => {
    const activos = resultadosState.datos
      .filter((proyecto) => proyecto.estado === "ACTIVO")
      .map((proyecto, ordenOriginal) => ({
        ...proyecto,
        ordenOriginal,
        coincidencia: coincidenciasPorId.get(proyecto.id) ?? null,
      }));

    return activos.sort((uno, otro) => {
      const ordenUno = ordenDeCoincidencia(uno);
      const ordenOtro = ordenDeCoincidencia(otro);

      for (let indice = 0; indice < ordenUno.length; indice++) {
        const diferencia = ordenOtro[indice] - ordenUno[indice];
        if (diferencia !== 0) return diferencia;
      }

      return uno.ordenOriginal - otro.ordenOriginal;
    });
  }, [coincidenciasPorId, resultadosState.datos]);

  const cantidadCoincidencias = resultados.filter(
    (proyecto) => proyecto.coincidencia !== null,
  ).length;

  const hayFiltros =
    filtros.habilidades.length > 0 ||
    filtros.etiquetas.length > 0 ||
    filtros.idColectivo !== "" ||
    filtros.provincia !== "";

  const filtrosPendientes =
    !filtrosAplicados ||
    JSON.stringify(filtros) !== JSON.stringify(filtrosAplicados);

  const alternarHabilidad = (habilidad) => {
    setFiltros((actual) => ({
      ...actual,
      habilidades: actual.habilidades.includes(habilidad)
        ? actual.habilidades.filter((una) => una !== habilidad)
        : [...actual.habilidades, habilidad],
    }));
  };

  const alternarEtiqueta = (etiqueta) => {
    setFiltros((actual) => ({
      ...actual,
      etiquetas: actual.etiquetas.includes(etiqueta)
        ? actual.etiquetas.filter((una) => una !== etiqueta)
        : [...actual.etiquetas, etiqueta],
    }));
  };

  const buscar = () => {
    setFiltrosAplicados({
      habilidades: [...filtros.habilidades],
      idColectivo: filtros.idColectivo,
      etiquetas: [...filtros.etiquetas],
      provincia: filtros.provincia,
    });
    if (filtrosAplicados) resultadosState.recargar();
  };

  const limpiarFiltros = () => {
    setFiltros(FILTROS_INICIALES);
    setFiltrosAplicados(null);
    setMostrarMas(false);
  };

  const verTodosLosProyectos = () => {
    setFiltros(FILTROS_INICIALES);
    setFiltrosAplicados({ ...FILTROS_INICIALES });
    setMostrarMas(false);
  };

  const opcionesHabilidades = habilidadesState.datos.map((habilidad) => ({
    valor: habilidad.titulo ?? habilidad,
    etiqueta: habilidad.titulo ?? habilidad,
  }));

  const opcionesEtiquetas = etiquetasState.datos.map((etiqueta) => ({
    valor: etiqueta,
    etiqueta: etiqueta.replaceAll("_", " "),
  }));

  const opcionesColectivos = [
    {
      valor: "",
      etiqueta: "Todos los colectivos",
      secundario: "Sin filtrar por colectivo",
    },
    ...colectivosState.datos.map((colectivo) => ({
      valor: colectivo.id,
      etiqueta: colectivo.nombre,
      secundario: colectivo.tipoDeColectivo
        ?.replaceAll("_", " ")
        .toLowerCase(),
    })),
  ];

  return (
    <section className="pagina">
      <h1>Buscar proyectos</h1>
      <p className="pagina__bajada">
        Encontrá proyectos en los que puedas aportar tus conocimientos. Combiná
        habilidades, colectivos, etiquetas y provincias de tus preferencias.
      </p>

      <div className="filtros filtros--busqueda">
        <div className="filtros__fila">
          <div className="filtros__grupo filtros__grupo--buscable">
            <CustomSelect
              id="habilidades"
              etiqueta="Habilidades"
              opciones={opcionesHabilidades}
              seleccion={filtros.habilidades}
              multiple
              onSeleccionar={alternarHabilidad}
              placeholder={
                habilidadesState.cargando
                  ? "Cargando habilidades…"
                  : "Buscá una habilidad"
              }
              textoVacio={
                habilidadesState.cargando
                  ? "Cargando habilidades…"
                  : "No hay habilidades con ese texto."
              }
            />
            {habilidadesState.error && (
              <div className="estado-bloque estado-bloque--compacto">
                <p className="estado estado--error">
                  No pudimos cargar las habilidades.
                </p>
                <button
                  type="button"
                  className="boton boton--secundario"
                  onClick={habilidadesState.recargar}
                >
                  Reintentar
                </button>
              </div>
            )}
          </div>

          <div className="filtros__grupo filtros__grupo--buscable">
            <CustomSelect
              id="etiquetas"
              etiqueta="Etiquetas"
              opciones={opcionesEtiquetas}
              seleccion={filtros.etiquetas}
              multiple
              onSeleccionar={alternarEtiqueta}
              placeholder={
                etiquetasState.cargando
                  ? "Cargando etiquetas…"
                  : "Buscá y elegí etiquetas"
              }
              textoVacio={
                etiquetasState.cargando
                  ? "Cargando etiquetas…"
                  : "No hay etiquetas con ese texto."
              }
            />
            {etiquetasState.error && (
              <div className="estado-bloque estado-bloque--compacto">
                <p className="estado estado--error">
                  No pudimos cargar las etiquetas.
                </p>
                <button
                  type="button"
                  className="boton boton--secundario"
                  onClick={etiquetasState.recargar}
                >
                  Reintentar
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="filtros__ayuda">
          Podés elegir varias habilidades y etiquetas. Buscá por nombre.
        </p>

        <div className="filtros__acciones">
          <button
            type="button"
            className="boton boton--secundario"
            aria-expanded={mostrarMas}
            aria-controls="filtros-avanzados"
            onClick={() => setMostrarMas((actual) => !actual)}
          >
            {mostrarMas ? "Ocultar más filtros" : "Más filtros"}
          </button>
          <button
            type="button"
            className="boton boton--secundario"
            onClick={limpiarFiltros}
          >
            Limpiar filtros
          </button>
          <button type="button" className="boton" onClick={buscar}>
            Buscar
          </button>
        </div>

        {hayFiltros && (
          <p className="filtros__resumen">
            {filtros.habilidades.length > 0 &&
              `${filtros.habilidades.length} habilidad${
                filtros.habilidades.length === 1 ? "" : "es"
              } · `}
            {filtros.etiquetas.length > 0 &&
              `${filtros.etiquetas.length} etiqueta${
                filtros.etiquetas.length === 1 ? "" : "s"
              } · `}
            {filtros.idColectivo !== "" && "colectivo · "}
            {filtros.provincia !== "" && "provincia · "}
            {filtrosPendientes
              ? "presioná Buscar para aplicar"
              : "filtros aplicados"}
          </p>
        )}

        {mostrarMas && (
          <div className="filtros__avanzados" id="filtros-avanzados">
            <div className="filtros__grupo filtros__grupo--buscable">
              <CustomSelect
                id="colectivo"
                etiqueta="Colectivos"
                opciones={opcionesColectivos}
                seleccion={[filtros.idColectivo]}
                onSeleccionar={(valor) =>
                  setFiltros((actual) => ({ ...actual, idColectivo: valor }))
                }
                placeholder={
                  colectivosState.cargando
                    ? "Cargando colectivos…"
                    : "Todos los colectivos"
                }
                textoVacio={
                  colectivosState.cargando
                    ? "Cargando colectivos…"
                    : "No hay colectivos con ese texto."
                }
              />
              {colectivosState.error && (
                <div className="estado-bloque estado-bloque--compacto">
                  <p className="estado estado--error">
                    No pudimos cargar los colectivos.
                  </p>
                  <button
                    type="button"
                    className="boton boton--secundario"
                    onClick={colectivosState.recargar}
                  >
                    Reintentar
                  </button>
                </div>
              )}
            </div>

            <div className="filtros__grupo">
              <label className="selector__label" htmlFor="provincia">
                Provincia
              </label>
              <select
                id="provincia"
                value={filtros.provincia}
                onChange={(evento) =>
                  setFiltros((actual) => ({
                    ...actual,
                    provincia: evento.target.value,
                  }))
                }
              >
                <option value="">Todas las provincias</option>
                {PROVINCIAS.map((provincia) => (
                  <option key={provincia.codigo} value={provincia.codigo}>
                    {provincia.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {!filtrosAplicados && (
        <section className="resultados" aria-labelledby="recomendados-titulo">
          <div className="resultados__encabezado">
            <div>
              <h2 id="recomendados-titulo">
                {idColaboradora ? "Recomendados para vos" : "Proyectos activos"}
              </h2>
              <p className="resultados__bajada">
                {idColaboradora
                  ? "Proyectos activos que coinciden con tus habilidades. Usá los filtros y presioná Buscar para ver más."
                  : esColectivo
                    ? "Como colectivo podés buscar proyectos activos; las recomendaciones por habilidades son para colaboradoras."
                    : "Iniciá sesión como colaboradora para ver recomendaciones según tus habilidades. Mientras tanto, podés buscar proyectos activos."}
              </p>
            </div>
          </div>

          {coincidenciasState.cargando && (
            <>
              <p className="estado" role="status">
                Calculando recomendaciones…
              </p>
              <div className="tarjetas" aria-hidden="true">
                {[0, 1].map((indice) => (
                  <Skeleton key={indice} variant="rounded" height={190} />
                ))}
              </div>
            </>
          )}

          {coincidenciasState.error && (
            <div className="estado-bloque">
              <p className="estado estado--error">
                No pudimos calcular las recomendaciones. Podés buscar igual con
                los filtros.
              </p>
              <button
                type="button"
                className="boton boton--secundario"
                onClick={coincidenciasState.recargar}
              >
                Reintentar
              </button>
            </div>
          )}

          {!coincidenciasState.cargando &&
            !coincidenciasState.error &&
            recomendados.length === 0 && (
              <div className="estado-bloque">
                <p className="estado">
                  {idColaboradora
                    ? "Todavía no encontramos proyectos activos que coincidan con tus habilidades."
                    : esColectivo
                      ? "No hay recomendaciones para un colectivo. Podés ver todos los proyectos activos."
                      : "Iniciá sesión como colaboradora para ver recomendaciones. También podés ver todos los proyectos activos."}
                </p>
                <button
                  type="button"
                  className="boton boton--secundario"
                  onClick={verTodosLosProyectos}
                >
                  Ver todos los proyectos activos
                </button>
              </div>
            )}

          {!coincidenciasState.cargando &&
            !coincidenciasState.error &&
            recomendados.length > 0 && (
              <ul className="tarjetas">
                {recomendados.map((proyecto) => (
                  <CardProyecto key={proyecto.id} proyecto={proyecto} />
                ))}
              </ul>
            )}
        </section>
      )}

      {filtrosAplicados && (
        <section className="resultados" aria-labelledby="resultados-titulo">
          <div className="resultados__encabezado">
            <h2 id="resultados-titulo">Resultados</h2>
          </div>

          {resultadosState.cargando && (
            <>
              <p className="estado" role="status">
                Buscando proyectos activos…
              </p>
              <div className="tarjetas" aria-hidden="true">
                {[0, 1, 2].map((indice) => (
                  <Skeleton key={indice} variant="rounded" height={190} />
                ))}
              </div>
            </>
          )}

          {resultadosState.error && (
            <div className="estado-bloque">
              <p className="estado estado--error">
                No pudimos buscar proyectos. Revisá los filtros e intentá de
                nuevo.
              </p>
              <button
                type="button"
                className="boton boton--secundario"
                onClick={resultadosState.recargar}
              >
                Reintentar
              </button>
            </div>
          )}

          {!resultadosState.cargando && !resultadosState.error && (
            <>
              <p className="estado" role="status" aria-live="polite">
                {resultados.length === 0
                  ? "No encontramos proyectos activos con esos filtros."
                  : `${resultados.length} proyecto${
                      resultados.length === 1 ? "" : "s"
                    } activo${resultados.length === 1 ? "" : "s"} encontrado${
                      resultados.length === 1 ? "" : "s"
                    }.`}
                {resultados.length > 0 &&
                  cantidadCoincidencias > 0 &&
                  ` ${cantidadCoincidencias} coinciden con tus habilidades.`}
              </p>

              {resultados.length > 0 && (
                <ul className="tarjetas">
                  {resultados.map((proyecto) => (
                    <CardProyecto
                      key={proyecto.id}
                      proyecto={proyecto}
                      nombreColectivo={colectivosPorId.get(
                        proyecto.idColectivo,
                      )}
                    />
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      )}
    </section>
  );
}
