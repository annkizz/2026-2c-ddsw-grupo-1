import { t } from '../../i18n/t';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Skeleton } from '@mui/material';
import {
  FiArrowRight,
  FiCheck,
  FiCode,
  FiFolder,
  FiPlus,
  FiRepeat,
  FiSearch,
  FiUserPlus,
  FiUsers,
  FiEdit3,
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth.jsx';
import { obtenerMiPerfilColectivo } from '../../service/colectivosService';
import { obtenerProyectos } from '../../service/proyectosService';
import {
  CAMPOS_REQUERIDOS_COLECTIVO,
  camposFaltantesPerfilColectivo,
} from '../../utils/perfilColectivo';
import { ID_AYUDA } from '../../utils/rutasUI';
import EncabezadoPagina from '../../components/EncabezadoPagina/EncabezadoPagina.jsx';
import AlertaError from '../../components/AlertaError/AlertaError.jsx';
import DashboardCard from './components/DashboardCard.jsx';
import DashboardEmptyState from './components/DashboardEmptyState.jsx';
import IndicadorProgresoPerfil from './components/IndicadorProgresoPerfil.jsx';
import DashboardColaboradora from './DashboardColaboradora.jsx';
import TipoCuenta from '../registro/TipoCuenta.jsx';
import './Home.css';

const PASOS_AYUDA = [
  {
    icono: FiUserPlus,
    titulo: t('inicio.creaTuCuenta'),
    texto: t('inicio.elegiSiTeSumasComo'),
  },
  {
    icono: FiEdit3,
    titulo: 'Completá tu perfil',
    texto: t('inicio.contaQueHaceTuColectivo'),
  },
  {
    icono: FiRepeat,
    titulo: t('inicio.conectaConProyectos'),
    texto: t('inicio.losColectivosPublicanProyectosY'),
  },
];

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
  const [errorProyectos, setErrorProyectos] = useState(null);
  const [intentoCarga, setIntentoCarga] = useState(0);
  const [camposPerfilFaltantes, setCamposPerfilFaltantes] = useState([]);
  const [cargandoPerfil, setCargandoPerfil] = useState(true);
  const [errorPerfil, setErrorPerfil] = useState(null);
  const [intentoPerfil, setIntentoPerfil] = useState(0);
  const esDashboardColectivo = sesion?.rol === 'COLECTIVO' && sesion?.tienePerfil;
  const esDashboardColaboradora = sesion?.rol === 'COLABORADOR' && sesion?.tienePerfil;

  // Cuentas con perfil pero sin panel propio (por ejemplo, administración) van al listado público.
  useEffect(() => {
    if (sesion?.tienePerfil && !esDashboardColectivo && !esDashboardColaboradora) {
      navigate('/proyectos', { replace: true });
    }
  }, [sesion, esDashboardColectivo, esDashboardColaboradora, navigate]);

  // Un enlace a /#como-funciona se desplaza a esa sección al llegar.
  useEffect(() => {
    if (window.location.hash === `#${ID_AYUDA}`) {
      document.getElementById(ID_AYUDA)?.scrollIntoView?.({ block: 'start' });
    }
  }, []);

  useEffect(() => {
    if (!esDashboardColectivo) return undefined;
    let vigente = true;

    const cargarProyectos = async () => {
      setCargandoProyectos(true);
      setErrorProyectos(null);
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
        if (vigente) setErrorProyectos(error);
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
      setErrorPerfil(null);
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
        if (vigente) setErrorPerfil(error);
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
      <div className="contenedor-pagina home--dashboard">
        <section className="dashboard" aria-labelledby="dashboard-titulo">
          <EncabezadoPagina
            id="dashboard-titulo"
            antetitulo={t('inicio.espacioDeTuColectivo')}
            titulo="¿Qué querés impulsar hoy?"
          />

          <div className="dashboard-grid">
            <DashboardCard
              className="dashboard-card--destacada"
              icon={sinProyectos ? null : <FiCode />}
              title={sinProyectos ? null : 'Publicar un proyecto'}
              description={sinProyectos ? null : 'Contá qué necesita tu colectivo y sumá colaboradoras.'}
            >
              {sinProyectos ? (
                <DashboardEmptyState
                  icon={FiPlus}
                  title="Empezá por tu primer proyecto"
                  description="Un proyecto cuenta qué necesita tu colectivo para sumar personas colaboradoras."
                  actionLabel="Crear mi primer proyecto"
                  actionVariant="contained"
                  onAction={() => navigate('/proyectos/nuevo')}
                  nivelTitulo="h2"
                />
              ) : (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => navigate('/proyectos/nuevo')}
                  startIcon={<FiPlus aria-hidden="true" />}
                >
                  Publicar proyecto
                </Button>
              )}
            </DashboardCard>

            <DashboardCard className="dashboard-card--proyectos" icon={<FiFolder />} title="Estado de tus proyectos">
              {cargandoProyectos ? (
                <div className="dashboard-contadores" aria-busy="true" role="status">
                  <span className="visualmente-oculto">Cargando tus proyectos…</span>
                  {[0, 1].map((i) => (
                    <div key={i} aria-hidden="true">
                      <Skeleton variant="text" width="var(--space-6)" height="var(--space-6)" />
                      <Skeleton variant="text" width="var(--space-10)" />
                    </div>
                  ))}
                </div>
              ) : errorProyectos ? (
                <AlertaError
                  error={errorProyectos}
                  titulo={t('buscadorColaboradoras.noPudimosCargarTusProyectos')}
                  onReintentar={() => setIntentoCarga((intento) => intento + 1)}
                />
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
                      <span>
                        <FiArrowRight aria-hidden="true" /> Activos
                      </span>
                    </div>
                    <div>
                      <strong>{finalizados}</strong>
                      <span>
                        <FiCheck aria-hidden="true" /> Finalizados
                      </span>
                    </div>
                  </div>
                  <Button variant="outlined" onClick={() => navigate('/proyectos')} endIcon={<FiArrowRight aria-hidden="true" />}>
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
                startIcon={<FiSearch aria-hidden="true" />}
              >
                Buscar colaboradoras
              </Button>
            </DashboardCard>
          </div>

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
    <div className="contenedor-pagina home">
      <div className="home-portada">
        <section className="home-hero" aria-labelledby="home-titulo">
          <EncabezadoPagina
            id="home-titulo"
            className="encabezado-pagina--hero"
            antetitulo={t('inicio.tecnologiaConProposito')}
            titulo="El código es mejor cuando nos conecta."
            subtitulo={t('inicio.unimosAColectivosQueNecesitan')}
          />
          <ul className="home-pares">
            <li>
              <FiUsers aria-hidden="true" /> Colectivos publican lo que necesitan
            </li>
            <li>
              <FiCode aria-hidden="true" /> Personas colaboradoras suman su código
            </li>
          </ul>
        </section>

        <section className="home-login" aria-labelledby="home-login-titulo">
          <h2 id="home-login-titulo">Iniciar sesión</h2>
          {/* El email y la contraseña se piden en la pantalla de Logto */}
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            size="large"
            onClick={iniciarSesion}
            loading={cargando && !errorLogto}
            endIcon={cargando && !errorLogto ? null : <FiArrowRight aria-hidden="true" />}
          >
            {cargando && !errorLogto ? 'Ingresando…' : 'Ingresar'}
          </Button>
          {errorLogto && (
            <AlertaError
              className="home-login__error"
              error={errorLogto}
              titulo={t('inicio.noPudimosAbrirElInicio')}
            />
          )}
          <p className="home-cambio">
            ¿Primera vez acá?
            <Button variant="text" onClick={() => setEligiendoTipo(true)}>
              Crear una cuenta
            </Button>
          </p>
        </section>
      </div>

      <section id={ID_AYUDA} className="home-ayuda" aria-labelledby="home-ayuda-titulo" tabIndex={-1}>
        <h2 id="home-ayuda-titulo">{t('navegacion.comoFunciona')}</h2>
        <p className="home-ayuda__intro">{t('inicio.tresPasosParaEmpezarA')}</p>
        <ol className="home-ayuda__pasos">
          {PASOS_AYUDA.map(({ icono: Icono, titulo, texto }, indice) => (
            <li key={titulo} className="home-ayuda__paso">
              <span className="home-ayuda__icono" aria-hidden="true">
                <Icono />
              </span>
              <h3>
                <span className="home-ayuda__numero">Paso {indice + 1}.</span> {titulo}
              </h3>
              <p>{texto}</p>
            </li>
          ))}
        </ol>
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
