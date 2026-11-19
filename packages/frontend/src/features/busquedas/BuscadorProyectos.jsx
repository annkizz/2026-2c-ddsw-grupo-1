import { t } from '../../i18n/t';
import React, { useMemo, useState } from "react";
import { Button, MenuItem, TextField } from "@mui/material";
import { FiFilter, FiRotateCcw, FiSearch } from "react-icons/fi";
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
    <div className="contenedor-pagina">
      <EncabezadoPagina
        titulo="Buscar proyectos"
        subtitulo={t('buscadorProyectos.encontraProyectosEnLosQue')}
        migas={[{ texto: t('navegacion.inicio'), to: "/" }, { texto: "Buscar proyectos" }]}
      />

      <div className="filtros filtros--busqueda" role="search" aria-label={t('buscadorProyectos.filtrosDeProyectos')}>
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
              <AlertaError error={habilidadesState.error} titulo={t('buscadorProyectos.noPudimosCargarLasHabilidades')} onReintentar={habilidadesState.recargar} />
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
                  : t('buscadorProyectos.ejSalud')
              }
              textoVacio={
                etiquetasState.cargando
                  ? "Cargando etiquetas…"
                  : "No hay etiquetas con ese texto."
              }
            />
            {etiquetasState.error && (
              <AlertaError error={etiquetasState.error} titulo={t('buscadorProyectos.noPudimosCargarLasEtiquetas')} onReintentar={etiquetasState.recargar} />
            )}
          </div>
        </div>

        <p className="filtros__ayuda">
          Podés elegir varias habilidades y etiquetas. Buscá por nombre.
        </p>

        <div className="filtros__acciones">
          <Button
            variant="outlined"
            type="button"
            aria-expanded={mostrarMas}
            aria-controls="filtros-avanzados"
            startIcon={<FiFilter aria-hidden="true" />}
            onClick={() => setMostrarMas((actual) => !actual)}
          >
            {mostrarMas ? "Ocultar más filtros" : "Más filtros"}
          </Button>
          <Button
            type="button"
            variant="text"
            startIcon={<FiRotateCcw aria-hidden="true" />}
            onClick={limpiarFiltros}
          >
            Limpiar filtros
          </Button>
          <Button variant="contained" type="button" onClick={buscar} startIcon={<FiSearch aria-hidden="true" />}>
            Buscar proyectos
          </Button>
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
                <AlertaError error={colectivosState.error} titulo={t('buscadorProyectos.noPudimosCargarLosColectivos')} onReintentar={colectivosState.recargar} />
              )}
            </div>

            <div className="filtros__grupo">
              <TextField
                id="provincia"
                select
                label="Provincia"
                className="filtros__provincia"
                slotProps={{ select: { displayEmpty: true } }}
                fullWidth
                value={filtros.provincia}
                onChange={(evento) =>
                  setFiltros((actual) => ({
                    ...actual,
                    provincia: evento.target.value,
                  }))
                }
              >
                <MenuItem value="">Todas las provincias</MenuItem>
                {PROVINCIAS.map((provincia) => (
                  <MenuItem key={provincia.codigo} value={provincia.codigo}>
                    {provincia.nombre}
                  </MenuItem>
                ))}
              </TextField>
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
            <EsqueletoGrilla cantidad={3} etiqueta={t('buscadorProyectos.calculandoRecomendaciones')} />
          )}

          {coincidenciasState.error && (
            <AlertaError error={coincidenciasState.error} titulo={t('buscadorProyectos.noPudimosCalcularLasRecomendaciones')} onReintentar={coincidenciasState.recargar} />
          )}

          {!coincidenciasState.cargando &&
            !coincidenciasState.error &&
            recomendados.length === 0 && (
              <EstadoVacio nivelTitulo="p" titulo={idColaboradora
                    ? "Todavía no encontramos proyectos activos que coincidan con tus habilidades."
                    : esColectivo
                      ? "No hay recomendaciones para un colectivo. Podés ver todos los proyectos activos."
                      : "Iniciá sesión como colaboradora para ver recomendaciones. También podés ver todos los proyectos activos."} accion={<Button
                  variant="outlined"
                  type="button"
                  onClick={verTodosLosProyectos}
                >{t('buscadorProyectos.verTodosLosProyectosActivos')}</Button>} />
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
            <EsqueletoGrilla cantidad={3} etiqueta={t('buscadorProyectos.buscandoProyectosActivos')} />
          )}

          {resultadosState.error && (
            <AlertaError error={resultadosState.error} titulo={t('buscadorProyectos.noPudimosBuscarProyectos')} onReintentar={resultadosState.recargar} />
          )}

          {!resultadosState.cargando && !resultadosState.error && (
            <>
              <p className="contador-resultados" role="status" aria-live="polite">
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
    </div>
  );
}
