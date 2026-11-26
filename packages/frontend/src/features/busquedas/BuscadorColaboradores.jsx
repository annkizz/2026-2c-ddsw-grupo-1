import { t } from "../../i18n/t";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@mui/material";
import { FiRotateCcw, FiSearch } from "react-icons/fi";
import PropTypes from "prop-types";
import EncabezadoPagina from "../../components/EncabezadoPagina/EncabezadoPagina.jsx";
import AlertaError from "../../components/AlertaError/AlertaError.jsx";
import EstadoVacio from "../../components/EstadoVacio/EstadoVacio.jsx";
import {
  EsqueletoGrilla,
  EsqueletoLista,
} from "../../components/Esqueletos/Esqueletos.jsx";
import "../../components/Card.css";
import "../proyectos/ListaProyectos.css";

import CustomSelect from "../../components/CustomSelect/CustomSelect";
import CardColaboradora from "../../components/CardColaboradora/CardColaboradora";
import { useAuth } from "../../hooks/useAuth.jsx";
import { useCandidatas } from "../../hooks/useCandidatas";
import { useListado } from "../../hooks/useListado";
import "./Busquedas.css";
import "./BuscadorColaboradores.css";
import { MarkdownEnLinea } from "../../components/Markdown/Markdown.jsx";
import { markdownEnLineaATextoPlano } from "../../utils/markdown";
import { describirCompromiso, listarHabilidades } from "../../utils/perfiles";
//lo uso solo aca asi q vive aca en vez de en otra carpeta a components/

function ResumenPerfil({ perfil }) {
  return (
    <div className="resumen-perfil">
      <h3>
        <MarkdownEnLinea texto={perfil.descripcion} />
      </h3>
      <p className="tarjeta__meta">
        {t("buscadorColaboradoras.proyectoEtiqueta")}{" "}
        <Link to={`/proyectos/${perfil.idProyecto}`}>
          {perfil.proyecto?.titulo ?? t("tarjetas.verProyecto")}
        </Link>
      </p>
      <p className="tarjeta__meta">{describirCompromiso(perfil.compromiso)}</p>
      <p>
        <strong>{t("buscadorColaboradoras.requeridas")}</strong>{" "}
        {listarHabilidades(perfil.habilidadesRequeridas)}
      </p>
      <p>
        <strong>{t("buscadorColaboradoras.opcionales")}</strong>{" "}
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
    idColectivo ? `/proyectos?estado=ACTIVO&idColectivo=${idColectivo}` : null,
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
  } = useCandidatas(perfiles, idPerfilAplicado, busquedaIniciada);

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
    ? t("buscadorColaboradoras.cargandoPerfiles")
    : perfilesState.error
      ? t("buscadorColaboradoras.errorPerfiles")
      : t(
          perfiles.length === 1
            ? "buscadorColaboradoras.unPerfilProyecto"
            : "buscadorColaboradoras.variosPerfilesProyecto",
          { cantidad: perfiles.length },
        );

  const opcionesPerfiles = [
    {
      valor: "",
      etiqueta: t("buscadorColaboradoras.todosPerfiles"),
      secundario: descripcionPerfiles,
    },
    ...perfiles.map((perfil) => ({
      valor: perfil.id,
      etiqueta: markdownEnLineaATextoPlano(perfil.descripcion),
      secundario: `${perfil.compromiso?.horas ?? "?"} h`,
    })),
  ];

  const mensajeVacio =
    idPerfilAplicado === ""
      ? t("buscadorColaboradoras.sinCandidatasProyecto")
      : t("buscadorColaboradoras.sinCandidatasPerfil");

  return (
    <div className="contenedor-pagina">
      <EncabezadoPagina
        titulo={t("buscadorColaboradoras.buscarColaboradoras")}
        subtitulo={t("buscadorColaboradoras.elegiUnoDeTusProyectos")}
        migas={[
          { texto: t("navegacion.inicio"), to: "/" },
          { texto: t("buscadorColaboradoras.buscarColaboradoras") },
        ]}
      />

      <div
        className="filtros filtros--busqueda"
        role="search"
        aria-label={t("buscadorColaboradoras.filtrosDeColaboradoras")}
      >
        <div className="filtros__fila">
          <div className="filtros__grupo filtros__grupo--buscable">
            <CustomSelect
              id="proyecto"
              etiqueta={t("buscadorColaboradoras.proyecto")}
              opciones={opcionesProyectos}
              seleccion={idProyecto ? [idProyecto] : []}
              onSeleccionar={cambiarProyecto}
              placeholder={
                proyectosState.cargando
                  ? t("buscadorColaboradoras.cargandoProyectos")
                  : t("buscadorColaboradoras.ejPortalDeTurnos")
              }
              textoVacio={
                proyectosState.cargando
                  ? t("buscadorColaboradoras.cargandoProyectos")
                  : t("buscadorColaboradoras.sinProyectosTexto")
              }
            />
            {proyectosState.error && (
              <AlertaError
                error={proyectosState.error}
                titulo={t("buscadorColaboradoras.noPudimosCargarTusProyectos")}
                onReintentar={proyectosState.recargar}
              />
            )}
          </div>

          {idProyecto !== "" && (
            <div className="filtros__grupo filtros__grupo--buscable">
              <CustomSelect
                id="perfil"
                etiqueta={t("buscadorColaboradoras.perfilCubrir")}
                opciones={opcionesPerfiles}
                seleccion={idPerfil ? [idPerfil] : []}
                onSeleccionar={setIdPerfil}
                placeholder={
                  perfilesState.cargando
                    ? t("buscadorColaboradoras.cargandoPerfiles")
                    : t("buscadorColaboradoras.ejTester")
                }
                textoVacio={
                  perfilesState.cargando
                    ? t("buscadorColaboradoras.cargandoPerfiles")
                    : t("buscadorColaboradoras.sinPerfilesTexto")
                }
              />
              {perfilesState.error && (
                <AlertaError
                  error={perfilesState.error}
                  titulo={t("detalleProyecto.errorPerfilesTitulo")}
                  onReintentar={perfilesState.recargar}
                />
              )}
            </div>
          )}
        </div>

        <p className="filtros__ayuda">
          {idProyecto === ""
            ? t("buscadorColaboradoras.primeroProyecto")
            : t("buscadorColaboradoras.todosOUnPerfil")}
        </p>

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
            type="button"
            onClick={buscar}
            disabled={!puedeBuscar}
            startIcon={<FiSearch aria-hidden="true" />}
          >
            {t("navegacion.buscarColaboradoras")}
          </Button>
        </div>
      </div>

      {proyectosState.cargando && (
        <EsqueletoLista
          cantidad={2}
          etiqueta={t("buscadorColaboradoras.cargandoTusProyectosActivos")}
        />
      )}

      {!proyectosState.cargando &&
        !proyectosState.error &&
        proyectosState.datos.length === 0 && (
          <EstadoVacio
            nivelTitulo="p"
            titulo={t("buscadorColaboradoras.noTenesProyectosActivosPara")}
            accion={
              <Button variant="outlined" component={Link} to="/proyectos/nuevo">
                {t("proyectos.crearProyecto")}
              </Button>
            }
          />
        )}

      {idProyecto !== "" && perfilesState.cargando && (
        <EsqueletoLista
          cantidad={2}
          etiqueta={t("buscadorColaboradoras.cargandoLosPerfilesDeEste")}
        />
      )}

      {idProyecto !== "" &&
        !perfilesState.cargando &&
        !perfilesState.error &&
        perfiles.length === 0 && (
          <EstadoVacio
            nivelTitulo="p"
            titulo={t("detalleProyecto.sinPerfiles")}
            accion={
              <Button
                variant="outlined"
                component={Link}
                to={`/proyectos/${idProyecto}/perfiles`}
                state={{ crearPerfil: true }}
              >
                {t("buscadorColaboradoras.cargarPerfiles")}
              </Button>
            }
          />
        )}

      {busquedaIniciada && (
        <section className="resultados" aria-labelledby="candidatas-titulo">
          <div className="resultados__encabezado">
            <div>
              <h2 id="candidatas-titulo">
                {t("buscadorColaboradoras.candidatas")}
              </h2>
              <p className="resultados__bajada">
                {idPerfilAplicado === ""
                  ? t(
                      cantidadPerfiles === 1
                        ? "buscadorColaboradoras.revisandoUnPerfil"
                        : "buscadorColaboradoras.revisandoVariosPerfiles",
                      {
                        cantidad: cantidadPerfiles,
                        proyecto:
                          proyectoSeleccionado?.titulo ??
                          t("buscadorColaboradoras.esteProyecto"),
                      },
                    )
                  : t("buscadorColaboradoras.resultadosPerfil", {
                      proyecto:
                        proyectoSeleccionado?.titulo ??
                        t("buscadorColaboradoras.esteProyecto"),
                    })}
              </p>
            </div>
          </div>

          {cargando && (
            <EsqueletoGrilla
              cantidad={3}
              etiqueta={t("buscadorColaboradoras.buscandoPersonasQueCoincidan")}
            />
          )}

          {error && (
            <AlertaError
              error={error}
              titulo={t(
                "buscadorColaboradoras.noPudimosBuscarColaboradoresPara",
              )}
              onReintentar={recargar}
            />
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
                aria-label={t("buscadorColaboradoras.candidatasPara", {
                  perfil: markdownEnLineaATextoPlano(perfil.descripcion),
                })}
              >
                <ResumenPerfil perfil={perfil} />
                <p className="tarjeta__meta">
                  {t(
                    candidatas.length === 1
                      ? "buscadorColaboradoras.unaCoincidencia"
                      : "buscadorColaboradoras.variasCoincidencias",
                    { cantidad: candidatas.length },
                  )}
                </p>
                <ul className="tarjetas">
                  {candidatas.map((colaboradora) => (
                    <CardColaboradora
                      key={`${perfil.id}-${colaboradora.id}`}
                      colaboradora={colaboradora}
                      idProyecto={idProyecto}
                      idPerfil={perfil.id}
                      nombreProyecto={proyectoSeleccionado?.titulo}
                      descripcionPerfil={markdownEnLineaATextoPlano(
                        perfil.descripcion,
                      )}
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
              {cargandoMas
                ? t("notificaciones.cargandoMas")
                : t("notificaciones.cargarMas")}
            </Button>
          )}
        </section>
      )}
    </div>
  );
}
