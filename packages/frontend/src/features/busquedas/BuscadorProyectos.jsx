import { t } from "../../i18n/t";
import React, { useMemo, useState } from "react";
import { Button } from "@mui/material";
import { FiRotateCcw, FiSearch } from "react-icons/fi";
import EncabezadoPagina from "../../components/EncabezadoPagina/EncabezadoPagina.jsx";
import AlertaError from "../../components/AlertaError/AlertaError.jsx";
import EstadoVacio from "../../components/EstadoVacio/EstadoVacio.jsx";
import { EsqueletoGrilla } from "../../components/Esqueletos/Esqueletos.jsx";
import "../../components/Card.css";
import "../proyectos/ListaProyectos.css";

import CustomSelect from "../../components/CustomSelect/CustomSelect";
import CardProyecto from "../../components/CardProyecto/CardProyecto";
import { PROVINCIAS } from "../../data/provincias";
import { useAuth } from "../../hooks/useAuth.jsx";
import { useListado } from "../../hooks/useListado";
import { usePaginacion } from "../../hooks/usePaginacion";
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
  const coincidenciasState = usePaginacion(
    idColaboradora ? `/colaboradoras/${idColaboradora}/proyectos` : null,
    "proyectos",
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

  const resultadosState = usePaginacion(urlBusqueda, "proyectos");

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
    secundario: [
      "FUNDACIONES",
      "ASOCIACIONES_BARRIALES",
      "ONG",
      "ASAMBLEA",
    ].includes(colectivo.tipoDeColectivo)
      ? t(`tiposColectivoBusqueda.${colectivo.tipoDeColectivo}`)
      : colectivo.tipoDeColectivo?.replaceAll("_", " ").toLowerCase(),
  }));

  const opcionesProvincias = PROVINCIAS.map((provincia) => ({
    valor: provincia.codigo,
    etiqueta: provincia.nombre,
  }));

  return (
    <div className="contenedor-pagina">
      <EncabezadoPagina
        titulo={t("navegacion.buscarProyectos")}
        migas={[
          { texto: t("navegacion.inicio"), to: "/" },
          { texto: t("navegacion.buscarProyectos") },
        ]}
      />

      {/* Filtros en un panel lateral: la página ya no queda larga antes de llegar a los resultados. */}
      <div className="con-lateral buscador-disposicion">
        <aside className="lateral">
          <div
            className="filtros filtros--busqueda filtros--lateral"
            role="search"
            aria-label={t("buscadorProyectos.filtrosDeProyectos")}
          >
            <h2 className="filtros__titulo">
              {t("buscadorProyectos.filtros")}
            </h2>
            <div className="filtros__fila">
              <div className="filtros__grupo filtros__grupo--buscable">
                <CustomSelect
                  id="habilidades"
                  etiqueta={t("registro.habilidades")}
                  opciones={opcionesHabilidades}
                  seleccion={filtros.habilidades}
                  multiple
                  onSeleccionar={alternarHabilidad}
                  placeholder={
                    habilidadesState.cargando
                      ? t("registro.cargandoHabilidades")
                      : t("buscadorProyectos.buscarHabilidad")
                  }
                  textoVacio={
                    habilidadesState.cargando
                      ? t("registro.cargandoHabilidades")
                      : t("registro.sinHabilidadesTexto")
                  }
                />
                {habilidadesState.error && (
                  <AlertaError
                    error={habilidadesState.error}
                    titulo={t(
                      "buscadorProyectos.noPudimosCargarLasHabilidades",
                    )}
                    onReintentar={habilidadesState.recargar}
                  />
                )}
              </div>

              <div className="filtros__grupo filtros__grupo--buscable">
                <CustomSelect
                  id="etiquetas"
                  etiqueta={t("tarjetas.etiquetas")}
                  opciones={opcionesEtiquetas}
                  seleccion={filtros.etiquetas}
                  multiple
                  onSeleccionar={alternarEtiqueta}
                  placeholder={
                    etiquetasState.cargando
                      ? t("registro.cargandoEtiquetas")
                      : t("buscadorProyectos.ejSalud")
                  }
                  textoVacio={
                    etiquetasState.cargando
                      ? t("registro.cargandoEtiquetas")
                      : t("buscadorProyectos.sinEtiquetasTexto")
                  }
                />
                {etiquetasState.error && (
                  <AlertaError
                    error={etiquetasState.error}
                    titulo={t("buscadorProyectos.noPudimosCargarLasEtiquetas")}
                    onReintentar={etiquetasState.recargar}
                  />
                )}
              </div>
            </div>

            <div className="filtros__avanzados" id="filtros-avanzados">
              <div className="filtros__grupo filtros__grupo--buscable">
                <CustomSelect
                  id="colectivos"
                  etiqueta={t("buscadorProyectos.colectivos")}
                  opciones={opcionesColectivos}
                  seleccion={filtros.idColectivos}
                  multiple
                  onSeleccionar={alternarColectivo}
                  placeholder={
                    colectivosState.cargando
                      ? t("buscadorProyectos.cargandoColectivos")
                      : t("buscadorProyectos.buscarColectivos")
                  }
                  textoVacio={
                    colectivosState.cargando
                      ? t("buscadorProyectos.cargandoColectivos")
                      : t("buscadorProyectos.sinColectivosTexto")
                  }
                />
                {colectivosState.error && (
                  <AlertaError
                    error={colectivosState.error}
                    titulo={t("buscadorProyectos.noPudimosCargarLosColectivos")}
                    onReintentar={colectivosState.recargar}
                  />
                )}
              </div>

              <div className="filtros__grupo filtros__grupo--buscable">
                <CustomSelect
                  id="provincias"
                  etiqueta={t("buscadorProyectos.provincias")}
                  opciones={opcionesProvincias}
                  seleccion={filtros.provincias}
                  multiple
                  onSeleccionar={alternarProvincia}
                  placeholder={t("buscadorProyectos.buscarProvincia")}
                  textoVacio={t("buscadorProyectos.sinProvinciasTexto")}
                />
              </div>
            </div>
            <div className="filtros__acciones">
              <Button
                type="button"
                variant="text"
                startIcon={<FiRotateCcw aria-hidden="true" />}
                onClick={limpiarFiltros}
              >
                {t("buscadorProyectos.limpiarFiltros")}
              </Button>
              <Button
                variant="contained"
                color="secondary"
                type="button"
                onClick={buscar}
                startIcon={<FiSearch aria-hidden="true" />}
              >
                {t("buscadorProyectos.buscar")}
              </Button>
            </div>

            {hayFiltros && (
              <p className="filtros__resumen">
                {filtros.habilidades.length > 0 &&
                  t(
                    filtros.habilidades.length === 1
                      ? "buscadorProyectos.unFiltroHabilidad"
                      : "buscadorProyectos.variosFiltrosHabilidad",
                    { cantidad: filtros.habilidades.length },
                  )}
                {filtros.etiquetas.length > 0 &&
                  t(
                    filtros.etiquetas.length === 1
                      ? "buscadorProyectos.unFiltroEtiqueta"
                      : "buscadorProyectos.variosFiltrosEtiqueta",
                    { cantidad: filtros.etiquetas.length },
                  )}
                {filtros.idColectivos.length > 0 &&
                  t(
                    filtros.idColectivos.length === 1
                      ? "buscadorProyectos.unFiltroColectivo"
                      : "buscadorProyectos.variosFiltrosColectivo",
                    { cantidad: filtros.idColectivos.length },
                  )}
                {filtros.provincias.length > 0 &&
                  t(
                    filtros.provincias.length === 1
                      ? "buscadorProyectos.unFiltroProvincia"
                      : "buscadorProyectos.variosFiltrosProvincia",
                    { cantidad: filtros.provincias.length },
                  )}
                {filtrosPendientes
                  ? t("buscadorProyectos.filtrosPendientes")
                  : t("buscadorProyectos.filtrosAplicados")}
              </p>
            )}
          </div>
        </aside>

        <div className="buscador-resultados">
          {!filtrosAplicados && (
            <section
              className="resultados"
              aria-labelledby="recomendados-titulo"
            >
              <div className="resultados__encabezado">
                <div>
                  <h2 id="recomendados-titulo">
                    {idColaboradora
                      ? t("inicio.recomendados")
                      : t("buscadorProyectos.proyectosActivos")}
                  </h2>
                  <p className="resultados__bajada">
                    {idColaboradora
                      ? t("buscadorProyectos.recomendadosDescripcion")
                      : esColectivo
                        ? t("buscadorProyectos.descripcionColectivo")
                        : t("buscadorProyectos.descripcionSinSesion")}
                  </p>
                </div>
              </div>

              {coincidenciasState.cargando && (
                <EsqueletoGrilla
                  cantidad={3}
                  etiqueta={t("buscadorProyectos.calculandoRecomendaciones")}
                />
              )}

              {coincidenciasState.error && (
                <AlertaError
                  error={coincidenciasState.error}
                  titulo={t(
                    "buscadorProyectos.noPudimosCalcularLasRecomendaciones",
                  )}
                  onReintentar={coincidenciasState.recargar}
                />
              )}

              {!coincidenciasState.cargando &&
                !coincidenciasState.error &&
                recomendados.length === 0 && (
                  <EstadoVacio
                    nivelTitulo="p"
                    titulo={
                      idColaboradora
                        ? t("buscadorProyectos.sinRecomendaciones")
                        : esColectivo
                          ? t("buscadorProyectos.sinRecomendacionesColectivo")
                          : t("buscadorProyectos.sinRecomendacionesSesion")
                    }
                    accion={
                      <Button
                        variant="outlined"
                        type="button"
                        onClick={verTodosLosProyectos}
                      >
                        {t("buscadorProyectos.verTodosLosProyectosActivos")}
                      </Button>
                    }
                  />
                )}

              {!coincidenciasState.cargando &&
                !coincidenciasState.error &&
                recomendados.length > 0 && (
                  <>
                    <ul className="tarjetas">
                      {recomendados.map((proyecto) => (
                        <CardProyecto key={proyecto.id} proyecto={proyecto} />
                      ))}
                    </ul>
                    {coincidenciasState.hayMas && (
                      <Button
                        variant="outlined"
                        type="button"
                        disabled={coincidenciasState.cargandoMas}
                        onClick={coincidenciasState.cargarMas}
                      >
                        {coincidenciasState.cargandoMas
                          ? t("notificaciones.cargandoMas")
                          : t("notificaciones.cargarMas")}
                      </Button>
                    )}
                  </>
                )}
            </section>
          )}

          {filtrosAplicados && (
            <section className="resultados" aria-labelledby="resultados-titulo">
              <div className="resultados__encabezado">
                <h2 id="resultados-titulo">
                  {t("buscadorProyectos.resultados")}
                </h2>
              </div>

              {resultadosState.cargando && (
                <EsqueletoGrilla
                  cantidad={3}
                  etiqueta={t("buscadorProyectos.buscandoProyectosActivos")}
                />
              )}

              {resultadosState.error && (
                <AlertaError
                  error={resultadosState.error}
                  titulo={t("buscadorProyectos.noPudimosBuscarProyectos")}
                  onReintentar={resultadosState.recargar}
                />
              )}

              {!resultadosState.cargando && !resultadosState.error && (
                <>
                  <p
                    className="contador-resultados"
                    role="status"
                    aria-live="polite"
                  >
                    {resultados.length === 0
                      ? t("buscadorProyectos.sinResultados")
                      : t(
                          resultados.length === 1
                            ? "buscadorProyectos.unResultado"
                            : "buscadorProyectos.variosResultados",
                          { cantidad: resultados.length },
                        )}
                    {resultados.length > 0 &&
                      cantidadCoincidencias > 0 &&
                      t("buscadorProyectos.coincidenciasHabilidades", {
                        cantidad: cantidadCoincidencias,
                      })}
                  </p>

                  {resultados.length > 0 && (
                    <>
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
                      {resultadosState.hayMas && (
                        <Button
                          variant="outlined"
                          type="button"
                          disabled={resultadosState.cargandoMas}
                          onClick={resultadosState.cargarMas}
                        >
                          {resultadosState.cargandoMas
                            ? t("notificaciones.cargandoMas")
                            : t("notificaciones.cargarMas")}
                        </Button>
                      )}
                    </>
                  )}
                </>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
