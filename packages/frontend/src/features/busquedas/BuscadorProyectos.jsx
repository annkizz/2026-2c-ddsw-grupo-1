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
  idColectivos: [],
  etiquetas: [],
  provincias: [],
};

function alternarEnLista(valores, valor) {
  return valores.includes(valor)
    ? valores.filter((uno) => uno !== valor)
    : [...valores, valor];
}

export default function BuscadorProyectos() {
  const { sesion } = useAuth();
  const idColaboradora = sesion?.idColaborador ?? null;
  const esColectivo = sesion?.rol === "COLECTIVO";

  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [filtrosAplicados, setFiltrosAplicados] = useState(null);

  const habilidadesState = useListado("/habilidades");
  const etiquetasState = useListado("/etiquetas");
  const colectivosState = useListado("/colectivos");
  const destacadosState = useListado("/proyectos/destacados");
  const coincidenciasState = useListado(
    idColaboradora ? `/colaboradoras/${idColaboradora}/proyectos` : null,
  );

  const urlBusqueda = useMemo(() => {
    if (!filtrosAplicados) return null;

    const parametros = new URLSearchParams({
      estado: "ACTIVO",
      modo: "cualquiera",
    });
    for (const habilidad of filtrosAplicados.habilidades) {
      parametros.append("habilidad", habilidad);
    }
    for (const etiqueta of filtrosAplicados.etiquetas) {
      parametros.append("etiqueta", etiqueta);
    }
    for (const provincia of filtrosAplicados.provincias) {
      parametros.append("provincia", provincia);
    }
    for (const idColectivo of filtrosAplicados.idColectivos) {
      parametros.append("idColectivo", idColectivo);
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

  const idsDestacados = useMemo(
    () => new Set(destacadosState.datos.map((proyecto) => proyecto.id)),
    [destacadosState.datos],
  );
  const recomendados = useMemo(
    () =>
      coincidenciasState.datos.filter(
        (proyecto) => !idsDestacados.has(proyecto.id),
      ),
    [coincidenciasState.datos, idsDestacados],
  );

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
    filtros.idColectivos.length > 0 ||
    filtros.provincias.length > 0;

  const filtrosPendientes =
    !filtrosAplicados ||
    JSON.stringify(filtros) !== JSON.stringify(filtrosAplicados);

  const alternarHabilidad = (habilidad) => {
    setFiltros((actual) => ({
      ...actual,
      habilidades: alternarEnLista(actual.habilidades, habilidad),
    }));
  };

  const alternarEtiqueta = (etiqueta) => {
    setFiltros((actual) => ({
      ...actual,
      etiquetas: alternarEnLista(actual.etiquetas, etiqueta),
    }));
  };

  const alternarColectivo = (idColectivo) => {
    setFiltros((actual) => ({
      ...actual,
      idColectivos: alternarEnLista(actual.idColectivos, idColectivo),
    }));
  };

  const alternarProvincia = (codigoProvincia) => {
    setFiltros((actual) => ({
      ...actual,
      provincias: alternarEnLista(actual.provincias, codigoProvincia),
    }));
  };

  const buscar = () => {
    setFiltrosAplicados({
      habilidades: [...filtros.habilidades],
      idColectivos: [...filtros.idColectivos],
      etiquetas: [...filtros.etiquetas],
      provincias: [...filtros.provincias],
    });
    if (filtrosAplicados) resultadosState.recargar();
  };

  const limpiarFiltros = () => {
    setFiltros(FILTROS_INICIALES);
    setFiltrosAplicados(null);
  };

  const verTodosLosProyectos = () => {
    setFiltros(FILTROS_INICIALES);
    setFiltrosAplicados({ ...FILTROS_INICIALES });
  };

  const opcionesHabilidades = habilidadesState.datos.map((habilidad) => ({
    valor: habilidad.titulo ?? habilidad,
    etiqueta: habilidad.titulo ?? habilidad,
  }));

  const opcionesEtiquetas = etiquetasState.datos.map((etiqueta) => ({
    valor: etiqueta,
    etiqueta: etiqueta.replaceAll("_", " "),
  }));

  const opcionesColectivos = colectivosState.datos.map((colectivo) => ({
    valor: colectivo.id,
    etiqueta: colectivo.nombre,
    secundario: colectivo.tipoDeColectivo
      ?.replaceAll("_", " ")
      .toLowerCase(),
  }));

  const opcionesProvincias = PROVINCIAS.map((provincia) => ({
    valor: provincia.codigo,
    etiqueta: provincia.nombre,
  }));

  return (
    <section className="pagina">
      <h1>Buscar proyectos</h1>
      <p className="pagina__bajada">
        Encontrá proyectos en los que puedas aportar tus conocimientos. Combiná
        habilidades, colectivos, etiquetas y provincias: verás los proyectos que
        coincidan con al menos uno de los valores elegidos, junto con el detalle
        de qué coincidió.
      </p>

      <div className="filtros filtros--busqueda">
        <div className="filtros__fila">
          <div className="filtros__grupo filtros__grupo--buscable">
            <CustomSelect
              id="habilidades"
              etiqueta="Habilidades (opcional)"
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
              etiqueta="Etiquetas (opcional)"
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

        <div className="filtros__avanzados" id="filtros-avanzados">
          <div className="filtros__grupo filtros__grupo--buscable">
            <CustomSelect
              id="colectivos"
              etiqueta="Colectivos (opcional)"
              opciones={opcionesColectivos}
              seleccion={filtros.idColectivos}
              multiple
              onSeleccionar={alternarColectivo}
              placeholder={
                colectivosState.cargando
                  ? "Cargando colectivos…"
                  : "Buscá colectivos"
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

          <div className="filtros__grupo filtros__grupo--buscable">
            <CustomSelect
              id="provincias"
              etiqueta="Provincias (opcional)"
              opciones={opcionesProvincias}
              seleccion={filtros.provincias}
              multiple
              onSeleccionar={alternarProvincia}
              placeholder="Buscá provincias"
              textoVacio="No hay provincias con ese texto."
            />
          </div>
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
            {filtros.idColectivos.length > 0 &&
              `${filtros.idColectivos.length} colectivo${
                filtros.idColectivos.length === 1 ? "" : "s"
              } · `}
            {filtros.provincias.length > 0 &&
              `${filtros.provincias.length} provincia${
                filtros.provincias.length === 1 ? "" : "s"
              } · `}
            {filtrosPendientes
              ? "presioná Buscar para aplicar"
              : "filtros aplicados"}
          </p>
        )}

        <div className="filtros__acciones">
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
      </div>

      {!filtrosAplicados && (
        <>
          <section className="resultados" aria-labelledby="destacados-titulo">
            <div className="resultados__encabezado">
              <div>
                <h2 id="destacados-titulo">Proyectos destacados</h2>
                <p className="resultados__bajada">
                  Proyectos seleccionados para que los conozcas primero.
                </p>
              </div>
            </div>

            {destacadosState.cargando && (
              <div className="tarjetas" aria-hidden="true">
                {[0, 1].map((indice) => (
                  <Skeleton key={indice} variant="rounded" height={190} />
                ))}
              </div>
            )}

            {destacadosState.error && (
              <div className="estado-bloque">
                <p className="estado estado--error">
                  No pudimos cargar los proyectos destacados.
                </p>
                <button
                  type="button"
                  className="boton boton--secundario"
                  onClick={destacadosState.recargar}
                >
                  Reintentar
                </button>
              </div>
            )}

            {!destacadosState.cargando &&
              !destacadosState.error &&
              destacadosState.datos.length === 0 && (
                <div className="estado-bloque">
                  <p className="estado">
                    Todavía no hay proyectos destacados vigentes.
                  </p>
                </div>
              )}

            {!destacadosState.cargando &&
              !destacadosState.error &&
              destacadosState.datos.length > 0 && (
                <ul className="tarjetas">
                  {destacadosState.datos.map((proyecto) => (
                    <CardProyecto key={proyecto.id} proyecto={proyecto} />
                  ))}
                </ul>
              )}
          </section>

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

          {(coincidenciasState.cargando || destacadosState.cargando) && (
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
            !destacadosState.cargando &&
            !coincidenciasState.error &&
            recomendados.length === 0 && (
              <div className="estado-bloque">
                <p className="estado">
                  {idColaboradora
                    ? coincidenciasState.datos.length > 0
                      ? "Los proyectos que coinciden con tus habilidades ya aparecen en destacados."
                      : "Todavía no encontramos proyectos activos que coincidan con tus habilidades."
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
            !destacadosState.cargando &&
            !coincidenciasState.error &&
            recomendados.length > 0 && (
              <ul className="tarjetas">
                {recomendados.map((proyecto) => (
                  <CardProyecto key={proyecto.id} proyecto={proyecto} />
                ))}
              </ul>
            )}
          </section>
        </>
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
                  ? "No encontramos proyectos activos que coincidan con al menos uno de los filtros."
                  : `${resultados.length} proyecto${
                      resultados.length === 1 ? "" : "s"
                    } activo${resultados.length === 1 ? "" : "s"} con al menos
                    una coincidencia.`}
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
