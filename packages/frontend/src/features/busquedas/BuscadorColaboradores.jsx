import { t } from '../../i18n/t';
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@mui/material";
import { FiRotateCcw, FiSearch } from "react-icons/fi";
import PropTypes from "prop-types";
import EncabezadoPagina from "../../components/EncabezadoPagina/EncabezadoPagina.jsx";
import AlertaError from "../../components/AlertaError/AlertaError.jsx";
import EstadoVacio from "../../components/EstadoVacio/EstadoVacio.jsx";
import { EsqueletoGrilla, EsqueletoLista } from "../../components/Esqueletos/Esqueletos.jsx";
import "../../components/Card.css";
import "../proyectos/ListaProyectos.css";

import CustomSelect from "../../components/CustomSelect/CustomSelect";
import CardColaboradora from "../../components/CardColaboradora/CardColaboradora";
import { useAuth } from "../../hooks/useAuth.jsx";
import { useCandidatas } from "../../hooks/useCandidatas";
import { useListado } from "../../hooks/useListado";
import "./Busquedas.css";
import "./BuscadorColaboradores.css";

function describirCompromiso(compromiso) {
  if (!compromiso) return "Compromiso no informado";
  const horas = compromiso.horas ?? "?";
  const frecuencia = (compromiso.tipoCompromiso ?? "").toLowerCase();
  const colaboracion = (compromiso.tipoColaboracion ?? "").toLowerCase();
  return `${horas} ${horas === 1 ? "hora" : "horas"} ${frecuencia} · colaboración ${colaboracion}`;
}

function listarHabilidades(habilidades) {
  return habilidades?.length > 0 ? habilidades.join(", ") : "ninguna";
}
//lo uso solo aca asi q vive aca en vez de en otra carpeta a components/

function ResumenPerfil({ perfil }) {
  return (
    <div className="resumen-perfil">
      <h3>{perfil.descripcion}</h3>
      <p className="tarjeta__meta">
        Proyecto:{" "}
        <Link to={`/proyectos/${perfil.idProyecto}`}>
          {perfil.proyecto?.titulo ?? "Ver proyecto"}
        </Link>
      </p>
      <p className="tarjeta__meta">{describirCompromiso(perfil.compromiso)}</p>
      <p>
        <strong>Requeridas:</strong>{" "}
        {listarHabilidades(perfil.habilidadesRequeridas)}
      </p>
      <p>
        <strong>Opcionales:</strong>{" "}
        {listarHabilidades(perfil.habilidadesOpcionales)}
      </p>
    </div>
  );
}

ResumenPerfil.propTypes = {
  perfil: PropTypes.shape({
    descripcion: PropTypes.string,
    idProyecto: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    proyecto: PropTypes.shape({ titulo: PropTypes.string }),
    compromiso: PropTypes.object,
    habilidadesRequeridas: PropTypes.arrayOf(PropTypes.string),
    habilidadesOpcionales: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
};

export default function BuscadorColaboradores() {
  const { sesion } = useAuth();
  const idColectivo = sesion?.idColectivo ?? "";

  // proyecto propio -> perfiles de ese proyecto -> candidatas
  const proyectosState = useListado(
    idColectivo
      ? `/proyectos?estado=ACTIVO&idColectivo=${idColectivo}`
      : null,
  );
  const [idProyecto, setIdProyecto] = useState("");
  const [idPerfil, setIdPerfil] = useState("");
  const [idPerfilAplicado, setIdPerfilAplicado] = useState("");
  const [busquedaIniciada, setBusquedaIniciada] = useState(false);

  const proyectoSeleccionado = useMemo(
    () =>
      proyectosState.datos.find((proyecto) => proyecto.id === idProyecto) ??
      null,
    [idProyecto, proyectosState.datos],
  );

  const perfilesState = useListado(
    idProyecto !== "" ? `/proyectos/${idProyecto}/perfiles` : null,
  );

  // el endpoint de perfiles no repite el proyecto: agrego para q ResumenPerfil pueda mostrar el link a la ficha.
  const perfiles = useMemo(
    () =>
      perfilesState.datos.map((perfil) => ({
        ...perfil,
        proyecto: proyectoSeleccionado
          ? {
              id: proyectoSeleccionado.id,
              titulo: proyectoSeleccionado.titulo,
            }
          : undefined,
      })),
    [perfilesState.datos, proyectoSeleccionado],
  );

  useEffect(() => {
    if (idPerfil !== "" && !perfiles.some((perfil) => perfil.id === idPerfil)) {
      setIdPerfil("");
    }
  }, [idPerfil, perfiles]);

  const {
    grupos,
    cargando,
    cargandoMas,
    error,
    recargar,
    cargarMas,
    hayMas,
    cantidadPerfiles,
  } = useCandidatas(
    perfiles,
    idPerfilAplicado,
    busquedaIniciada,
  );

  const cambiarProyecto = (valor) => {
    setIdProyecto(valor);
    setIdPerfil("");
    setIdPerfilAplicado("");
    setBusquedaIniciada(false);
  };

  const buscar = () => {
    if (idProyecto === "") return;
    setIdPerfilAplicado(idPerfil);
    setBusquedaIniciada(true);
    if (busquedaIniciada) recargar();
  };

  const limpiarFiltros = () => {
    cambiarProyecto("");
  };

  const puedeBuscar =
    idProyecto !== "" &&
    !perfilesState.cargando &&
    !perfilesState.error &&
    perfiles.length > 0;

  const opcionesProyectos = proyectosState.datos.map((proyecto) => ({
    valor: proyecto.id,
    etiqueta: proyecto.titulo,
    secundario: proyecto.ubicacion?.nombreProvincia,
  }));

  const descripcionPerfiles = perfilesState.cargando
    ? "Cargando perfiles…"
    : perfilesState.error
      ? "No se pudieron cargar los perfiles"
      : `${perfiles.length} perfil${
          perfiles.length === 1 ? "" : "es"
        } de este proyecto`;

  const opcionesPerfiles = [
    {
      valor: "",
      etiqueta: "Todos los perfiles de este proyecto",
      secundario: descripcionPerfiles,
    },
    ...perfiles.map((perfil) => ({
      valor: perfil.id,
      etiqueta: perfil.descripcion,
      secundario: `${perfil.compromiso?.horas ?? "?"} h`,
    })),
  ];

  const mensajeVacio =
    idPerfilAplicado === ""
      ? "No encontramos personas que coincidan con las habilidades requeridas de los perfiles de este proyecto."
      : "No encontramos personas con las habilidades requeridas para este perfil (o ya están anotadas en el proyecto).";

  return (
    <div className="contenedor-pagina">
      <EncabezadoPagina
        titulo={t('buscadorColaboradoras.buscarColaboradoras')}
        subtitulo={t('buscadorColaboradoras.elegiUnoDeTusProyectos')}
        migas={[{ texto: t('navegacion.inicio'), to: "/" }, { texto: t('buscadorColaboradoras.buscarColaboradoras') }]}
      />

      <div className="filtros filtros--busqueda" role="search" aria-label={t('buscadorColaboradoras.filtrosDeColaboradoras')}>
        <div className="filtros__fila">
          <div className="filtros__grupo filtros__grupo--buscable">
            <CustomSelect
              id="proyecto"
              etiqueta="Proyecto"
              opciones={opcionesProyectos}
              seleccion={idProyecto ? [idProyecto] : []}
              onSeleccionar={cambiarProyecto}
              placeholder={
                proyectosState.cargando
                  ? "Cargando proyectos…"
                  : t('buscadorColaboradoras.ejPortalDeTurnos')
              }
              textoVacio={
                proyectosState.cargando
                  ? "Cargando proyectos…"
                  : "No hay proyectos activos con ese texto."
              }
            />
            {proyectosState.error && (
              <AlertaError error={proyectosState.error} titulo={t('buscadorColaboradoras.noPudimosCargarTusProyectos')} onReintentar={proyectosState.recargar} />
            )}
          </div>

          {idProyecto !== "" && (
            <div className="filtros__grupo filtros__grupo--buscable">
              <CustomSelect
                id="perfil"
                etiqueta="Perfil que necesitás cubrir"
                opciones={opcionesPerfiles}
                seleccion={idPerfil ? [idPerfil] : []}
                onSeleccionar={setIdPerfil}
                placeholder={
                  perfilesState.cargando
                    ? "Cargando perfiles…"
                    : t('buscadorColaboradoras.ejTester')
                }
                textoVacio={
                  perfilesState.cargando
                    ? "Cargando perfiles…"
                    : "No hay perfiles con ese texto."
                }
              />
              {perfilesState.error && (
                <AlertaError error={perfilesState.error} titulo={t('detalleProyecto.errorPerfilesTitulo')} onReintentar={perfilesState.recargar} />
              )}
            </div>
          )}
        </div>

        <p className="filtros__ayuda">
          {idProyecto === ""
            ? "Primero elegí un proyecto activo del colectivo."
            : "Podés buscar para todos los perfiles del proyecto o elegir uno solo."}
        </p>

        <div className="filtros__acciones">
          <Button
            type="button"
            variant="text"
            startIcon={<FiRotateCcw aria-hidden="true" />}
            onClick={limpiarFiltros}
          >
            Limpiar filtros
          </Button>
          <Button
            variant="contained"
            type="button"
            onClick={buscar}
            disabled={!puedeBuscar}
            startIcon={<FiSearch aria-hidden="true" />}
          >
            Buscar colaboradoras
          </Button>
        </div>
      </div>

      {proyectosState.cargando && (
        <EsqueletoLista cantidad={2} etiqueta={t('buscadorColaboradoras.cargandoTusProyectosActivos')} />
      )}

      {!proyectosState.cargando &&
        !proyectosState.error &&
        proyectosState.datos.length === 0 && (
          <EstadoVacio nivelTitulo="p" titulo={t('buscadorColaboradoras.noTenesProyectosActivosPara')} accion={<Button
              variant="outlined"
              component={Link}
              to="/proyectos/nuevo"
            >{t('proyectos.crearProyecto')}</Button>} />
        )}

      {idProyecto !== "" && perfilesState.cargando && (
        <EsqueletoLista cantidad={2} etiqueta={t('buscadorColaboradoras.cargandoLosPerfilesDeEste')} />
      )}

      {idProyecto !== "" &&
        !perfilesState.cargando &&
        !perfilesState.error &&
        perfiles.length === 0 && (
          <EstadoVacio nivelTitulo="p" titulo={t('detalleProyecto.sinPerfiles')} accion={<Button
              variant="outlined"
              component={Link}
              to={`/proyectos/${idProyecto}/perfiles`}
            >{t('buscadorColaboradoras.cargarPerfiles')}</Button>} />
        )}

      {busquedaIniciada && (
        <section className="resultados" aria-labelledby="candidatas-titulo">
          <div className="resultados__encabezado">
            <div>
              <h2 id="candidatas-titulo">Candidatas y candidatos</h2>
              <p className="resultados__bajada">
                {idPerfilAplicado === ""
                  ? `Revisando ${cantidadPerfiles} perfil${
                      cantidadPerfiles === 1 ? "" : "es"
                    } de ${proyectoSeleccionado?.titulo ?? "este proyecto"}.`
                  : `Resultados para el perfil elegido en ${
                      proyectoSeleccionado?.titulo ?? "este proyecto"
                    }.`}
              </p>
            </div>
          </div>

          {cargando && (
            <EsqueletoGrilla cantidad={3} etiqueta={t('buscadorColaboradoras.buscandoPersonasQueCoincidan')} />
          )}

          {error && (
            <AlertaError error={error} titulo={t('buscadorColaboradoras.noPudimosBuscarColaboradoresPara')} onReintentar={recargar} />
          )}

          {!cargando && !error && grupos.length === 0 && (
            <p className="contador-resultados" role="status" aria-live="polite">
              {mensajeVacio}
            </p>
          )}

          {!cargando &&
            !error &&
            grupos.map(({ perfil, candidatas }) => (
              <section
                className="grupo-candidatas"
                key={perfil.id}
                aria-label={`Candidatas para ${perfil.descripcion}`}
              >
                <ResumenPerfil perfil={perfil} />
                <p className="tarjeta__meta">
                  {candidatas.length} persona
                  {candidatas.length === 1 ? "" : "s"} con coincidencia.
                </p>
                <ul className="tarjetas">
                  {candidatas.map((colaboradora) => (
                    <CardColaboradora
                      key={`${perfil.id}-${colaboradora.id}`}
                      colaboradora={colaboradora}
                      idProyecto={idProyecto}
                      idPerfil={perfil.id}
                    />
                  ))}
                </ul>
              </section>
            ))}

          {hayMas && (
            <Button
              variant="outlined"
              type="button"
              disabled={cargandoMas}
              onClick={cargarMas}
            >
              {cargandoMas ? "Cargando…" : "Cargar más"}
            </Button>
          )}

        </section>
      )}
    </div>
  );
}
