import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  FiArrowRight,
  FiCheck,
  FiCode,
  FiFolder,
  FiPlus,
  FiRepeat,
  FiUsers,
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth.jsx';
import { obtenerMiPerfilColectivo } from '../../service/colectivosService';
import { obtenerProyectos } from '../../service/proyectosService';
import {
  CAMPOS_REQUERIDOS_COLECTIVO,
  camposFaltantesPerfilColectivo,
} from '../../utils/perfilColectivo';
import DashboardCard from './components/DashboardCard.jsx';
import DashboardEmptyState from './components/DashboardEmptyState.jsx';
import IndicadorProgresoPerfil from './components/IndicadorProgresoPerfil.jsx';
import DashboardColaboradora from './DashboardColaboradora.jsx';
import TipoCuenta from '../registro/TipoCuenta.jsx';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const {
    cargando,
    sesion,
    errorLogto,
    iniciarSesion,
    registrarse,
    getAccessToken,
  } = useAuth();
  const [eligiendoTipo, setEligiendoTipo] = useState(false);
  const [proyectos, setProyectos] = useState([]);
  const [cargandoProyectos, setCargandoProyectos] = useState(true);
  const [errorProyectos, setErrorProyectos] = useState('');
  const [intentoCarga, setIntentoCarga] = useState(0);
  const [camposPerfilFaltantes, setCamposPerfilFaltantes] = useState([]);
  const [cargandoPerfil, setCargandoPerfil] = useState(true);
  const [errorPerfil, setErrorPerfil] = useState('');
  const [intentoPerfil, setIntentoPerfil] = useState(0);
  const esDashboardColectivo = sesion?.rol === 'COLECTIVO' && sesion?.tienePerfil;
  const esDashboardColaboradora = sesion?.rol === 'COLABORADOR' && sesion?.tienePerfil;

  // El colectivo autenticado usa el inicio como panel; el resto conserva el flujo actual.
  useEffect(() => {
    if (sesion?.tienePerfil && !esDashboardColectivo && !esDashboardColaboradora) {
      navigate('/perfil', { replace: true });
    }
  }, [sesion, esDashboardColectivo, esDashboardColaboradora, navigate]);

  useEffect(() => {
    if (!esDashboardColectivo) return undefined;
    let vigente = true;

    const cargarProyectos = async () => {
      setCargandoProyectos(true);
      setErrorProyectos('');
      try {
        if (!sesion.idColectivo) {
          throw new Error('No pudimos identificar tu colectivo para cargar los proyectos.');
        }

        const resultado = await obtenerProyectos();
        if (!Array.isArray(resultado)) {
          throw new Error('No pudimos leer la lista de proyectos.');
        }

        if (vigente) {
          setProyectos(resultado.filter((proyecto) => proyecto.idColectivo === sesion.idColectivo));
        }
      } catch (error) {
        if (vigente) {
          const mensajeError =
            error?.response?.data?.error ||
            (error?.message && error.message !== 'Network Error'
              ? error.message
              : 'No pudimos cargar tus proyectos. Revisá tu conexión e intentá de nuevo.');
          setErrorProyectos(mensajeError);
        }
      } finally {
        if (vigente) setCargandoProyectos(false);
      }
    };

    cargarProyectos();
    return () => {
      vigente = false;
    };
  }, [esDashboardColectivo, sesion, intentoCarga]);

  useEffect(() => {
    if (!esDashboardColectivo) return undefined;
    let vigente = true;

    const cargarPerfil = async () => {
      setCargandoPerfil(true);
      setErrorPerfil('');
      try {
        const token = await getAccessToken();
        const perfil = await obtenerMiPerfilColectivo(token);
        if (vigente) {
          setCamposPerfilFaltantes(
            camposFaltantesPerfilColectivo({
              nombreColectivo: perfil?.nombre ?? '',
              tipoDeColectivo: perfil?.tipoDeColectivo ?? '',
              descripcion: perfil?.descripcion ?? '',
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
  }, [esDashboardColectivo, getAccessToken, intentoPerfil]);

  if (esDashboardColaboradora) return <DashboardColaboradora />;

  if (esDashboardColectivo) {
    const sinProyectos = !cargandoProyectos && !errorProyectos && proyectos.length === 0;
    const activos = proyectos.filter((proyecto) => proyecto.estado !== 'FINALIZADO').length;
    const finalizados = proyectos.filter((proyecto) => proyecto.estado === 'FINALIZADO').length;

    return (
      <div className="home home--dashboard">
        <section className="dashboard-colectivo" aria-labelledby="dashboard-titulo">
          <div className="dashboard-encabezado">
            <p className="dashboard-eyebrow">Espacio de tu colectivo</p>
            <h1 id="dashboard-titulo">¿Qué querés impulsar hoy?</h1>
            <p>Publicá proyectos, revisá su estado y encontrá colaboradoras.</p>
          </div>

          <div className="dashboard-grid">
            <DashboardCard
              className="dashboard-card--destacada"
              icon={sinProyectos ? null : <FiCode />}
              title={sinProyectos ? null : 'Publicar un proyecto'}
              description={
                sinProyectos
                  ? null
                  : 'Compartí una iniciativa y contá qué tipo de colaboración necesitás.'
              }
            >
              {sinProyectos ? (
                <DashboardEmptyState
                  icon={<FiPlus />}
                  title="Empezá por tu primer proyecto"
                  description="Un proyecto cuenta qué necesita tu colectivo para sumar personas colaboradoras."
                  actionLabel="Crear mi primer proyecto"
                  actionVariant="contained"
                  onAction={() => navigate('/proyectos/nuevo')}
                  className="dashboard-empty-state--destacada"
                />
              ) : (
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/proyectos/nuevo')}
                  startIcon={<FiArrowRight />}
                >
                  Publicar proyecto
                </Button>
              )}
            </DashboardCard>

            <DashboardCard
              className="dashboard-card--proyectos"
              icon={<FiFolder />}
              title="Estado de tus proyectos"
            >
                {cargandoProyectos ? (
                  <div className="dashboard-estado" role="status" aria-live="polite">
                    <CircularProgress size={20} aria-label="Cargando proyectos" />
                    <span>Cargando tus proyectos…</span>
                  </div>
                ) : errorProyectos ? (
                  <Alert
                    severity="error"
                    action={
                      <Button
                        color="inherit"
                        size="small"
                        onClick={() => setIntentoCarga((intento) => intento + 1)}
                      >
                        Reintentar
                      </Button>
                    }
                  >
                    {errorProyectos}
                  </Alert>
                ) : sinProyectos ? (
                  <DashboardEmptyState
                    title="Aún no hay proyectos publicados"
                    description="Cuando publiques el primero, acá vas a ver cuántos están activos y finalizados."
                  />
                ) : (
                  <>
                    <div className="dashboard-contadores" aria-live="polite">
                      <div>
                        <strong>{activos}</strong>
                        <span><FiArrowRight aria-hidden="true" /> Activos</span>
                      </div>
                      <div>
                        <strong>{finalizados}</strong>
                        <span><FiCheck aria-hidden="true" /> Finalizados</span>
                      </div>
                    </div>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/proyectos')}
                      endIcon={<FiArrowRight />}
                    >
                      Ver mis proyectos
                    </Button>
                  </>
                )}
            </DashboardCard>

            <DashboardCard
              className="dashboard-card--buscar"
              icon={<FiUsers />}
              title="Encontrar colaboradoras"
              description="Explorá perfiles y habilidades para sumar a tu iniciativa."
            >
                <Button
                  variant="outlined"
                  onClick={() => navigate('/buscar-colaboradores')}
                  endIcon={<FiArrowRight />}
                >
                  Buscar colaboradoras
                </Button>
            </DashboardCard>
          </div>

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
          ) : camposPerfilFaltantes.length > 0 ? (
            <IndicadorProgresoPerfil
              completados={CAMPOS_REQUERIDOS_COLECTIVO.length - camposPerfilFaltantes.length}
              total={CAMPOS_REQUERIDOS_COLECTIVO.length}
              faltantes={camposPerfilFaltantes}
              titulo="Completá el perfil de tu colectivo"
              accion="Completar mi perfil"
              onCompletar={() => navigate('/perfil')}
            />
          ) : null}
        </section>
      </div>
    );
  }

  return (
    <div className="home">
      <section className="home-hero">
        <p className="home-eyebrow">Tecnología con propósito</p>
        <h1>El código es mejor cuando nos conecta.</h1>
        <p className="home-lead">Unimos a colectivos que necesitan software con personas que quieren colaborar.</p>
        <div className="home-pares">
          <span><FiCode /> Personas</span>
          <FiRepeat />
          <span><FiUsers /> Colectivos</span>
        </div>
        <small>Software compartido. Impacto colectivo.</small>
      </section>

      <section className="home-login">
        <h2>Iniciar sesión</h2>
        <p className="home-sub">Qué bueno encontrarte de nuevo.</p>
        {/* El email y la contraseña se piden en la pantalla de Logto */}
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={iniciarSesion}
          disabled={cargando && !errorLogto}
          startIcon={cargando && !errorLogto ? <CircularProgress size={18} color="inherit" /> : null}
          endIcon={cargando && !errorLogto ? null : <FiArrowRight />}
        >
          {cargando && !errorLogto ? 'Ingresando…' : 'Ingresar'}
        </Button>
        {errorLogto && (
          <Alert severity="error" sx={{ marginTop: 2 }}>
            No pudimos abrir el inicio de sesión de Logto: {errorLogto.message}
          </Alert>
        )}
        <p className="home-cambio">
          ¿Primera vez acá?
          <Button variant="text" onClick={() => setEligiendoTipo(true)}>
            Crear una cuenta
          </Button>
        </p>
      </section>

      {eligiendoTipo && (
        <TipoCuenta
          onCerrar={() => setEligiendoTipo(false)}
          onElegir={() => registrarse()}
        />
      )}
    </div>
  );
};

export default Home;
