import { t } from '../../i18n/t';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Skeleton } from '@mui/material';
import { FiArrowRight, FiMapPin, FiSearch } from 'react-icons/fi';
import CardProyecto from '../../components/CardProyecto/CardProyecto.jsx';
import EncabezadoPagina from '../../components/EncabezadoPagina/EncabezadoPagina.jsx';
import AlertaError from '../../components/AlertaError/AlertaError.jsx';
import { EsqueletoGrilla } from '../../components/Esqueletos/Esqueletos.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useListado } from '../../hooks/useListado';
import { obtenerMiPerfilColaboradora } from '../../service/colaboradorasService';
import {
  CAMPOS_REQUERIDOS_COLABORADORA,
  camposFaltantesPerfilColaboradora,
} from '../../utils/perfilColaboradora';
import DashboardCard from './components/DashboardCard.jsx';
import DashboardEmptyState from './components/DashboardEmptyState.jsx';
import IndicadorProgresoPerfil from './components/IndicadorProgresoPerfil.jsx';

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
              nombreFantasia: perfil?.nombreFantasia ?? '',
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
          antetitulo={t('inicio.tuEspacioDeColaboradora')}
          titulo="Encontrá un proyecto para aportar"
          subtitulo="Explorá oportunidades según tus habilidades o buscá por ubicación."
        />

        <div className="dashboard-grid">
          <DashboardCard
            className="dashboard-card--destacada"
            icon={<FiSearch />}
            title="Buscar proyectos"
            description="Revisá proyectos activos y usá filtros para encontrar una oportunidad."
          >
            <Button
              variant="contained"
              onClick={() => navigate('/buscar-proyectos')}
              startIcon={<FiSearch aria-hidden="true" />}
            >
              Explorar proyectos
            </Button>
          </DashboardCard>

          <DashboardCard
            className="dashboard-card--ubicacion"
            icon={<FiMapPin />}
            title="Explorar por ubicación"
            description="Descubrí proyectos activos en el mapa y elegí una provincia."
          >
            <Button variant="outlined" onClick={() => navigate('/mapa')} startIcon={<FiMapPin aria-hidden="true" />}>
              Abrir mapa
            </Button>
          </DashboardCard>
        </div>

        <section className="dashboard-recomendaciones" aria-labelledby="recomendaciones-titulo">
          <div className="dashboard-recomendaciones__encabezado">
            <h2 id="recomendaciones-titulo">Recomendados para vos</h2>
            <p>
              Proyectos que coinciden con las habilidades de tu perfil. Podés ajustar la búsqueda en
              cualquier momento.
            </p>
          </div>

          {!idColaborador ? (
            <AlertaError
              titulo={t('inicio.noPudimosIdentificarTuPerfil')}
              mensaje={t('inicio.volveAIniciarSesionPara')}
            />
          ) : recomendacionesState.cargando ? (
            <EsqueletoGrilla cantidad={3} etiqueta="Buscando proyectos para vos…" />
          ) : recomendacionesState.error ? (
            <AlertaError
              error={recomendacionesState.error}
              titulo={t('inicio.noPudimosCargarLasRecomendaciones')}
              onReintentar={recomendacionesState.recargar}
            >
              <span> {t('inicio.mientrasTantoPodesAbrirEl')}</span>
            </AlertaError>
          ) : proyectosRecomendados.length === 0 ? (
            <DashboardEmptyState
              icon={FiSearch}
              title="Todavía no encontramos coincidencias"
              description="Explorá los proyectos activos y ajustá tus filtros para encontrar dónde aportar."
              actionLabel="Explorar proyectos"
              onAction={() => navigate('/buscar-proyectos')}
            />
          ) : (
            <>
              <ul className="tarjetas dashboard-recomendaciones-lista">
                {proyectosRecomendados.map((proyecto) => (
                  <CardProyecto key={proyecto.id} proyecto={proyecto} />
                ))}
              </ul>
              <Button
                variant="outlined"
                onClick={() => navigate('/buscar-proyectos')}
                endIcon={<FiArrowRight aria-hidden="true" />}
              >
                Ver más proyectos
              </Button>
            </>
          )}
        </section>

        {cargandoPerfil ? (
          <div className="dashboard-perfil-cargando" aria-busy="true" role="status">
            <span className="visualmente-oculto">Comprobando si falta completar tu perfil…</span>
            <Skeleton variant="rounded" height="var(--space-10)" aria-hidden="true" />
          </div>
        ) : errorPerfil ? (
          <AlertaError
            className="dashboard-alerta-perfil"
            error={errorPerfil}
            titulo={t('inicio.noPudimosComprobarSiTu')}
            onReintentar={() => setIntentoPerfil((intento) => intento + 1)}
          />
        ) : camposFaltantes.length > 0 ? (
          <IndicadorProgresoPerfil
            completados={completados}
            total={totalCamposPerfil}
            faltantes={camposFaltantes}
            beneficio="Un perfil completo ayuda a los colectivos a encontrarte."
            titulo="Completá tu perfil de colaboradora"
            accion="Completar mi perfil"
            onCompletar={() => navigate('/perfil')}
          />
        ) : null}
      </section>
    </div>
  );
};

export default DashboardColaboradora;
