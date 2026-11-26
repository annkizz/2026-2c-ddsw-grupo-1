import { t } from "../../i18n/t";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Skeleton } from "@mui/material";
import { FiMapPin, FiSearch } from "react-icons/fi";
import CardProyecto from "../../components/CardProyecto/CardProyecto.jsx";
import EncabezadoPagina from "../../components/EncabezadoPagina/EncabezadoPagina.jsx";
import AlertaError from "../../components/AlertaError/AlertaError.jsx";
import { EsqueletoGrilla } from "../../components/Esqueletos/Esqueletos.jsx";
import { useAuth } from "../../hooks/useAuth.jsx";
import { useListado } from "../../hooks/useListado";
import { obtenerMiPerfilColaboradora } from "../../service/colaboradorasService";
import {
  CAMPOS_REQUERIDOS_COLABORADORA,
  camposFaltantesPerfilColaboradora,
} from "../../utils/perfilColaboradora";
import DashboardCard from "./components/DashboardCard.jsx";
import DashboardEmptyState from "./components/DashboardEmptyState.jsx";
import IndicadorProgresoPerfil from "./components/IndicadorProgresoPerfil.jsx";
import DestacadosPortada from "./components/DestacadosPortada.jsx";

const DashboardColaboradora = () => {
  const navigate = useNavigate();
  const { sesion, getAccessToken } = useAuth();
  const idColaborador = sesion?.idColaborador;
  const recomendacionesState = useListado(
    idColaborador ? `/colaboradoras/${idColaborador}/proyectos` : null,
  );
  const [camposFaltantes, setCamposFaltantes] = useState([]);
  const [cargandoPerfil, setCargandoPerfil] = useState(true);
  const [errorPerfil, setErrorPerfil] = useState(null);
  const [intentoPerfil, setIntentoPerfil] = useState(0);

  useEffect(() => {
    let vigente = true;

    const cargarPerfil = async () => {
      setCargandoPerfil(true);
      setErrorPerfil(null);
      try {
        const token = await getAccessToken();
        const perfil = await obtenerMiPerfilColaboradora(token);
        if (vigente) {
          setCamposFaltantes(
            camposFaltantesPerfilColaboradora({
              nombreFantasia: perfil?.nombreFantasia ?? "",
              habilidades: perfil?.habilidades ?? [],
            }),
          );
        }
      } catch (error) {
        if (vigente) setErrorPerfil(error);
      } finally {
        if (vigente) setCargandoPerfil(false);
      }
    };

    cargarPerfil();
    return () => {
      vigente = false;
    };
  }, [getAccessToken, intentoPerfil]);

  const totalCamposPerfil = CAMPOS_REQUERIDOS_COLABORADORA.length;
  const completados = totalCamposPerfil - camposFaltantes.length;
  const proyectosRecomendados = recomendacionesState.datos.slice(0, 3);

  return (
    <div className="contenedor-pagina home--dashboard">
      <section className="dashboard" aria-labelledby="dashboard-titulo">
        <EncabezadoPagina
          id="dashboard-titulo"
          antetitulo={t("inicio.tuEspacioDeColaboradora")}
          titulo={t("inicio.encontraProyecto")}
        />

        <div className="dashboard-grid">
          <DashboardCard
            className="dashboard-card--destacada"
            icon={<FiSearch />}
            title={t("navegacion.buscarProyectos")}
            description={t("inicio.filtraProyectos")}
          >
            <Button
              variant="contained"
              color="secondary"
              onClick={() => navigate("/buscar-proyectos")}
              startIcon={<FiSearch aria-hidden="true" />}
            >
              {t("inicio.explorarProyectos")}
            </Button>
          </DashboardCard>

          <DashboardCard
            className="dashboard-card--ubicacion"
            icon={<FiMapPin />}
            title={t("inicio.explorarUbicacion")}
            description={t("inicio.descubriEnMapa")}
          >
            <Button
              variant="outlined"
              onClick={() => navigate("/mapa")}
              startIcon={<FiMapPin aria-hidden="true" />}
            >
              {t("inicio.abrirMapa")}
            </Button>
          </DashboardCard>
        </div>

        <DestacadosPortada />

        <section
          className="dashboard-recomendaciones"
          aria-labelledby="recomendaciones-titulo"
        >
          <div className="dashboard-recomendaciones__encabezado">
            <h2 id="recomendaciones-titulo">{t("inicio.recomendados")}</h2>
            <p>{t("inicio.coincidenHabilidades")}</p>
          </div>

          {!idColaborador ? (
            <AlertaError
              titulo={t("inicio.noPudimosIdentificarTuPerfil")}
              mensaje={t("inicio.volveAIniciarSesionPara")}
            />
          ) : recomendacionesState.cargando ? (
            <EsqueletoGrilla
              cantidad={3}
              etiqueta={t("inicio.buscandoRecomendaciones")}
            />
          ) : recomendacionesState.error ? (
            <AlertaError
              error={recomendacionesState.error}
              titulo={t("inicio.noPudimosCargarLasRecomendaciones")}
              onReintentar={recomendacionesState.recargar}
            >
              <span> {t("inicio.mientrasTantoPodesAbrirEl")}</span>
            </AlertaError>
          ) : proyectosRecomendados.length === 0 ? (
            <DashboardEmptyState
              icon={FiSearch}
              title={t("inicio.sinCoincidencias")}
              description={t("inicio.explorarSinCoincidencias")}
            />
          ) : (
            <ul className="tarjetas dashboard-recomendaciones-lista">
              {proyectosRecomendados.map((proyecto) => (
                <CardProyecto key={proyecto.id} proyecto={proyecto} />
              ))}
            </ul>
          )}
        </section>

        {cargandoPerfil ? (
          <div
            className="dashboard-perfil-cargando"
            aria-busy="true"
            role="status"
          >
            <span className="visualmente-oculto">
              {t("inicio.comprobandoPerfil")}
            </span>
            <Skeleton
              variant="rounded"
              height="var(--space-10)"
              aria-hidden="true"
            />
          </div>
        ) : errorPerfil ? (
          <AlertaError
            className="dashboard-alerta-perfil"
            error={errorPerfil}
            titulo={t("inicio.noPudimosComprobarSiTu")}
            onReintentar={() => setIntentoPerfil((intento) => intento + 1)}
          />
        ) : camposFaltantes.length > 0 ? (
          <IndicadorProgresoPerfil
            completados={completados}
            total={totalCamposPerfil}
            faltantes={camposFaltantes}
            beneficio={t("inicio.beneficioPerfil")}
            titulo={t("inicio.completarPerfilColaboradora")}
            accion={t("inicio.completarMiPerfil")}
            onCompletar={() => navigate("/perfil")}
          />
        ) : null}
      </section>
    </div>
  );
};

export default DashboardColaboradora;
