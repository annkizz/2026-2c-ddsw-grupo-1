import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Skeleton } from "@mui/material";
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
      <h2>{perfil.descripcion}</h2>
      <p className="tarjeta__meta">
        Proyecto:{" "}
        <Link
          className="tarjeta__enlace"
          to={`/proyectos/${perfil.idProyecto}`}
        >
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

  const { grupos, cargando, error, recargar, cantidadPerfiles } = useCandidatas(
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
    <section className="pagina">
      <h1>Buscar colaboradores</h1>
      <p className="pagina__bajada">
        Elegí uno de tus proyectos y el perfil que necesitás cubrir. La búsqueda
        revisa solo los perfiles de ese proyecto.
      </p>

      <div className="filtros filtros--busqueda">
        <div className="filtros__fila">
          <div className="filtros__grupo filtros__grupo--buscable">
            <CustomSelect
              id="proyecto"
              etiqueta="Proyecto"
              opciones={opcionesProyectos}
              seleccion={[idProyecto]}
              onSeleccionar={cambiarProyecto}
              placeholder={
                proyectosState.cargando
                  ? "Cargando proyectos…"
                  : "Buscá uno de tus proyectos"
              }
              textoVacio={
                proyectosState.cargando
                  ? "Cargando proyectos…"
                  : "No hay proyectos activos con ese texto."
              }
            />
            {proyectosState.error && (
              <div className="estado-bloque estado-bloque--compacto">
                <p className="estado estado--error">
                  No pudimos cargar tus proyectos. ¿Está corriendo el backend?
                </p>
                <button
                  type="button"
                  className="boton boton--secundario"
                  onClick={proyectosState.recargar}
                >
                  Reintentar
                </button>
              </div>
            )}
          </div>

          {idProyecto !== "" && (
            <div className="filtros__grupo filtros__grupo--buscable">
              <CustomSelect
                id="perfil"
                etiqueta="Perfil que necesitás cubrir"
                opciones={opcionesPerfiles}
                seleccion={[idPerfil]}
                onSeleccionar={setIdPerfil}
                placeholder={
                  perfilesState.cargando
                    ? "Cargando perfiles…"
                    : "Buscá por perfil"
                }
                textoVacio={
                  perfilesState.cargando
                    ? "Cargando perfiles…"
                    : "No hay perfiles con ese texto."
                }
              />
              {perfilesState.error && (
                <div className="estado-bloque estado-bloque--compacto">
                  <p className="estado estado--error">
                    No pudimos cargar los perfiles de este proyecto.
                  </p>
                  <button
                    type="button"
                    className="boton boton--secundario"
                    onClick={perfilesState.recargar}
                  >
                    Reintentar
                  </button>
                </div>
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
          <button
            type="button"
            className="boton boton--secundario"
            onClick={limpiarFiltros}
          >
            Limpiar filtros
          </button>
          <button
            type="button"
            className="boton"
            onClick={buscar}
            disabled={!puedeBuscar}
          >
            Buscar
          </button>
        </div>
      </div>

      {proyectosState.cargando && (
        <p className="estado">Cargando tus proyectos activos…</p>
      )}

      {!proyectosState.cargando &&
        !proyectosState.error &&
        proyectosState.datos.length === 0 && (
          <div className="estado-bloque">
            <p className="estado">
              No tenés proyectos activos para buscar colaboradores.
            </p>
            <Link className="boton boton--secundario" to="/proyectos/nuevo">
              Crear proyecto
            </Link>
          </div>
        )}

      {idProyecto !== "" && perfilesState.cargando && (
        <p className="estado">Cargando los perfiles de este proyecto…</p>
      )}

      {idProyecto !== "" &&
        !perfilesState.cargando &&
        !perfilesState.error &&
        perfiles.length === 0 && (
          <div className="estado-bloque">
            <p className="estado">
              Este proyecto todavía no tiene perfiles cargados.
            </p>
            <Link
              className="boton boton--secundario"
              to={`/proyectos/${idProyecto}/perfiles`}
            >
              Cargar perfiles
            </Link>
          </div>
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
            <>
              <p className="estado" role="status">
                Buscando personas que coincidan…
              </p>
              <div className="tarjetas" aria-hidden="true">
                {[0, 1, 2].map((indice) => (
                  <Skeleton key={indice} variant="rounded" height={190} />
                ))}
              </div>
            </>
          )}

          {error && (
            <div className="estado-bloque">
              <p className="estado estado--error">
                No pudimos buscar colaboradores para los perfiles elegidos.
              </p>
              <button
                type="button"
                className="boton boton--secundario"
                onClick={recargar}
              >
                Reintentar
              </button>
            </div>
          )}

          {!cargando && !error && grupos.length === 0 && (
            <p className="estado" role="status" aria-live="polite">
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

        </section>
      )}
    </section>
  );
}
