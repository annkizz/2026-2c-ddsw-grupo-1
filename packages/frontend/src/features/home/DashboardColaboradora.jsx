import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, CircularProgress } from '@mui/material';
import { FiMapPin, FiSearch, FiUsers } from 'react-icons/fi';
import CardProyecto from '../../components/CardProyecto/CardProyecto.jsx';
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
  const [errorPerfil, setErrorPerfil] = useState('');
  const [intentoPerfil, setIntentoPerfil] = useState(0);

  useEffect(() => {
    let vigente = true;

    const cargarPerfil = async () => {
      setCargandoPerfil(true);
      setErrorPerfil('');
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
        if (vigente) {
          setErrorPerfil(
            error?.response?.data?.error ||
              (error?.message && error.message !== 'Network Error'
                ? error.message
                : 'No pudimos comprobar si tu perfil está completo. Intentá nuevamente.'),
          );
        }
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
    <div className="home home--dashboard">
      <section
        className="dashboard-colectivo dashboard-colaboradora"
        aria-labelledby="dashboard-titulo"
      >
        <div className="dashboard-encabezado">
          <p className="dashboard-eyebrow">Tu espacio de colaboradora</p>
          <h1 id="dashboard-titulo">Encontrá un proyecto para aportar</h1>
          <p>Explorá oportunidades según tus habilidades o buscá por ubicación.</p>
        </div>

        <div className="dashboard-grid dashboard-grid--colaboradora">
          <DashboardCard
            className="dashboard-card--destacada"
            icon={<FiSearch />}
            title="Buscar proyectos"
            description="Revisá proyectos activos y usá filtros para encontrar una oportunidad."
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/buscar-proyectos')}
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
            <Button
              variant="outlined"
              onClick={() => navigate('/mapa')}
              endIcon={<FiMapPin />}
            >
              Abrir mapa
            </Button>
          </DashboardCard>
        </div>

        <section className="dashboard-recomendaciones" aria-labelledby="recomendaciones-titulo">
          <div className="dashboard-recomendaciones__encabezado">
            <div>
              <h2 id="recomendaciones-titulo">Recomendados para vos</h2>
              <p>
                Proyectos que coinciden con las habilidades de tu perfil. Podés ajustar la búsqueda
                en cualquier momento.
              </p>
            </div>
            <FiUsers aria-hidden="true" />
          </div>

          {!idColaborador ? (
            <Alert severity="error">
              No pudimos identificar tu perfil para cargar recomendaciones. Volvé a iniciar sesión.
            </Alert>
          ) : recomendacionesState.cargando ? (
            <div className="dashboard-estado" role="status" aria-live="polite">
              <CircularProgress size={20} aria-label="Cargando proyectos recomendados" />
              <span>Buscando proyectos para vos…</span>
            </div>
          ) : recomendacionesState.error ? (
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={recomendacionesState.recargar}>
                  Reintentar
                </Button>
              }
            >
              No pudimos cargar las recomendaciones. Podés abrir el buscador para explorar proyectos.
            </Alert>
          ) : proyectosRecomendados.length === 0 ? (
            <DashboardEmptyState
              icon={<FiSearch />}
              title="Todavía no encontramos coincidencias"
              description="Explorá los proyectos activos y ajustá tus filtros para encontrar dónde aportar."
              actionLabel="Explorar proyectos"
              onAction={() => navigate('/buscar-proyectos')}
            />
          ) : (
            <>
              <ul className="dashboard-recomendaciones-lista">
                {proyectosRecomendados.map((proyecto) => (
                  <CardProyecto key={proyecto.id} proyecto={proyecto} />
                ))}
              </ul>
              <Button
                variant="outlined"
                onClick={() => navigate('/buscar-proyectos')}
                className="dashboard-recomendaciones__ver-mas"
              >
                Ver más proyectos
              </Button>
            </>
          )}
        </section>

        {cargandoPerfil ? (
          <div className="dashboard-estado dashboard-estado--perfil" role="status" aria-live="polite">
            <CircularProgress size={20} aria-label="Comprobando perfil" />
            <span>Comprobando si falta completar tu perfil…</span>
          </div>
        ) : errorPerfil ? (
          <Alert
            className="dashboard-alerta-perfil"
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => setIntentoPerfil((intento) => intento + 1)}
              >
                Reintentar
              </Button>
            }
          >
            {errorPerfil}
          </Alert>
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
