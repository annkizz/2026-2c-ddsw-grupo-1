import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Alert,
  AlertTitle,
  Button,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
  ListItemIcon,
  Menu,
  MenuItem,
  Switch,
  Tab,
  Tabs,
  TextField,
} from '@mui/material';
import {
  FiAlertCircle,
  FiAward,
  FiBarChart2,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiEdit2,
  FiExternalLink,
  FiInbox,
  FiInfo,
  FiLinkedin,
  FiLock,
  FiPlus,
  FiSearch,
  FiSend,
  FiSettings,
  FiUserCheck,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth.jsx';
import {
  obtenerProyectoPorId,
  obtenerPerfiles,
  obtenerLogros,
  obtenerColaboraciones,
  obtenerColaboracionesParaGestion,
  crearPostulacion,
  obtenerPostulaciones,
  resolverPostulacion,
  crearLogro,
  configurarBusqueda,
  actualizarAvance,
} from '../../service/proyectosService';
import { t } from '../../i18n/t';
import { formatearFecha, aInputFecha, aIso, esFechaFutura } from '../../utils/fechas';
import { resumenCompromiso, etiquetaModalidad, textoCupo } from '../../utils/perfiles';
import { mensajeDeError } from '../../utils/mensajeDeError';
import { useLinkedin } from '../../hooks/useLinkedin.js';
import { codigoDeError } from '../../service/api';
import { publicarLogroEnLinkedin } from '../../service/proyectosService.js';
import {
  obtenerColaboradoraPorId,
  obtenerMiPerfilColaboradora,
  obtenerMisColaboraciones,
} from '../../service/colaboradorasService';
import CoincidenciaHabilidades from '../../components/CoincidenciaHabilidades/CoincidenciaHabilidades.jsx';
import PaginaError from '../../components/PaginaError/PaginaError.jsx';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import EncabezadoPagina from '../../components/EncabezadoPagina/EncabezadoPagina.jsx';
import AlertaError from '../../components/AlertaError/AlertaError.jsx';
import ChipEstado from '../../components/ChipEstado/ChipEstado.jsx';
import Dialogo from '../../components/Dialogo/Dialogo.jsx';
import DialogoBajaColaboracion from '../../components/DialogoBajaColaboracion/DialogoBajaColaboracion.jsx';
import EstadoVacio from '../../components/EstadoVacio/EstadoVacio.jsx';
import { EsqueletoDetalle } from '../../components/Esqueletos/Esqueletos.jsx';
import { useNotificar } from '../../components/Notificador/Notificador.jsx';
import './DetalleProyecto.css';
import CampoMarkdown from '../../components/CampoMarkdown/CampoMarkdown.jsx';
import Markdown, { MarkdownEnLinea } from '../../components/Markdown/Markdown.jsx';

const ES_ENLACE = /^https?:\/\/\S+$/i;

// El detalle técnico del proveedor no se muestra: solo el resultado en lenguaje claro.
const avisoDePublicacion = (publicacion) =>
  publicacion.estado === 'ENVIADO'
    ? { severity: 'success', texto: t('linkedin.okPublicado') }
    : { severity: 'warning', texto: t('linkedin.falloPublicacion') };

const mensajeCampo = (error, ayuda) =>
  error ? (
    <>
      <FiAlertCircle aria-hidden="true" />
      <span>{error}</span>
    </>
  ) : (
    ayuda
  );

const DetalleProyecto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const notificar = useNotificar();
  const { sesion, getAccessToken, isAuthenticated, cargando: authCargando, iniciarSesion } = useAuth();
  const linkedin = useLinkedin(sesion?.rol === 'COLECTIVO');

  const [proyecto, setProyecto] = useState(null);
  const [perfiles, setPerfiles] = useState([]);
  const [colaboraciones, setColaboraciones] = useState(null);
  const [logros, setLogros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null); // null | 'NO_ENCONTRADO' | error
  // Errores por bloque: antes se ocultaban devolviendo [] o null.
  const [errorPerfiles, setErrorPerfiles] = useState(null);
  const [errorLogros, setErrorLogros] = useState(null);
  const [errorColaboraciones, setErrorColaboraciones] = useState(null);
  const [colaboracionesGestion, setColaboracionesGestion] = useState([]);
  const [cargandoGestion, setCargandoGestion] = useState(false);
  const [errorGestion, setErrorGestion] = useState(null);
  const [bajaSeleccionada, setBajaSeleccionada] = useState(null);
  const [avisoBaja, setAvisoBaja] = useState('');

  const [modalPostulacionAbierto, setModalPostulacionAbierto] = useState(false);
  const [perfilPostulando, setPerfilPostulando] = useState(null);
  const [esAnonima, setEsAnonima] = useState(false);
  const [guardandoPostulacion, setGuardandoPostulacion] = useState(false);
  const [errorPostulacion, setErrorPostulacion] = useState('');
  const [postulacionesEnviadas, setPostulacionesEnviadas] = useState({});
  const [postulacionesPendientes, setPostulacionesPendientes] = useState({});
  const [misColaboraciones, setMisColaboraciones] = useState(null);
  const [errorVerificarParticipacion, setErrorVerificarParticipacion] = useState(null);
  const [intentoVerificacion, setIntentoVerificacion] = useState(0);
  const [postulacionesProyecto, setPostulacionesProyecto] = useState([]);
  const [cargandoPostulaciones, setCargandoPostulaciones] = useState(false);
  const [errorCargarPostulaciones, setErrorCargarPostulaciones] = useState(null);
  const [resolviendoPostulacionId, setResolviendoPostulacionId] = useState(null);
  const [erroresResolucion, setErroresResolucion] = useState({});

  // Pantalla segmentada en pestañas (antes era una sola página muy larga).
  // Quien visita (no es dueño) entra directo a Perfiles: es donde decide en qué postularse.
  const [pestana, setPestana] = useState(null);
  const [anclaAdmin, setAnclaAdmin] = useState(null);
  // Habilidades propias (colaboradora) y de las personas aceptadas (colectivo), para mostrar qué cumple cada una.
  const [misHabilidades, setMisHabilidades] = useState(null);
  const [habilidadesPorColaboradora, setHabilidadesPorColaboradora] = useState({});

  const [modalEditarAvance, setModalEditarAvance] = useState(false);
  const [formAvance, setFormAvance] = useState({ porcentaje: '', enlaceSistema: '', enlaceCodigoFuente: '' });
  const [erroresAvance, setErroresAvance] = useState({});
  const [guardandoAvance, setGuardandoAvance] = useState(false);
  const [avisoAvance, setAvisoAvance] = useState('');
  const [errorAvance, setErrorAvance] = useState(null);

  const [modalBusquedaAbierto, setModalBusquedaAbierto] = useState(false);
  const [busquedaSwitch, setBusquedaSwitch] = useState(false);
  const [fechaBusqueda, setFechaBusqueda] = useState('');
  const [errorFechaBusqueda, setErrorFechaBusqueda] = useState('');
  const [guardandoBusqueda, setGuardandoBusqueda] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState(null);

  const [nuevoLogro, setNuevoLogro] = useState({ titulo: '', descripcion: '', publicarLogroEnLinkedin: false });
  const [erroresLogro, setErroresLogro] = useState({});
  const [errorLogro, setErrorLogro] = useState(null);
  const [guardandoLogro, setGuardandoLogro] = useState(false);

  const [avisoLinkedin, setAvisoLinkedin] = useState(null); // { severity, texto }
  const [publicandoId, setPublicandoId] = useState(null);
  const esDueño = Boolean(
    sesion?.idColectivo &&
    proyecto?.idColectivo &&
    String(proyecto.idColectivo) === String(sesion.idColectivo)
  );

  const cargarPerfiles = useCallback(async () => {
    setErrorPerfiles(null);
    try {
      setPerfiles(await obtenerPerfiles(id));
    } catch (error) {
      setPerfiles([]);
      setErrorPerfiles(error);
    }
  }, [id]);

  const cargarLogros = useCallback(async () => {
    setErrorLogros(null);
    try {
      setLogros(await obtenerLogros(id));
    } catch (error) {
      setLogros([]);
      setErrorLogros(error);
    }
  }, [id]);

  const cargarColaboraciones = useCallback(async () => {
    setErrorColaboraciones(null);
    try {
      setColaboraciones(await obtenerColaboraciones(id));
    } catch (error) {
      setColaboraciones(null);
      setErrorColaboraciones(error);
    }
  }, [id]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const [dataProyecto] = await Promise.all([
        obtenerProyectoPorId(id),
        cargarPerfiles(),
        cargarLogros(),
        cargarColaboraciones(),
      ]);
      setProyecto(dataProyecto);
    } catch (error) {
      setErrorCarga(error.response?.status === 404 ? 'NO_ENCONTRADO' : error);
    } finally {
      setCargando(false);
    }
  }, [id, cargarPerfiles, cargarLogros, cargarColaboraciones]);

  const cargarPostulaciones = useCallback(async () => {
    if (!esDueño) return;
    setCargandoPostulaciones(true);
    setErrorCargarPostulaciones(null);
    try {
      const token = await getAccessToken();
      setPostulacionesProyecto(await obtenerPostulaciones(token, id));
    } catch (error) {
      setErrorCargarPostulaciones(error);
    } finally {
      setCargandoPostulaciones(false);
    }
  }, [esDueño, getAccessToken, id]);

  const verificarParticipacion = useCallback(async () => {
    if (sesion?.rol !== 'COLABORADOR') {
      setMisColaboraciones([]);
      setErrorVerificarParticipacion(null);
      return;
    }

    setMisColaboraciones(null);
    setErrorVerificarParticipacion(null);
    try {
      const token = await getAccessToken();
      setMisColaboraciones(await obtenerMisColaboraciones(token));
    } catch (error) {
      setErrorVerificarParticipacion(error);
    }
  }, [getAccessToken, sesion?.rol]);

  const cargarColaboracionesGestion = useCallback(async () => {
    if (!esDueño) return;
    setCargandoGestion(true);
    setErrorGestion(null);
    try {
      const token = await getAccessToken();
      setColaboracionesGestion(await obtenerColaboracionesParaGestion(token, id));
    } catch (error) {
      setErrorGestion(error);
    } finally {
      setCargandoGestion(false);
    }
  }, [esDueño, getAccessToken, id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    verificarParticipacion();
  }, [verificarParticipacion, intentoVerificacion]);

  useEffect(() => {
    if (esDueño) cargarPostulaciones();
  }, [esDueño, cargarPostulaciones]);

  useEffect(() => {
    if (esDueño) cargarColaboracionesGestion();
  }, [esDueño, cargarColaboracionesGestion]);

  useEffect(() => {
    if (sesion?.rol !== 'COLABORADOR') return undefined;
    let vigente = true;
    (async () => {
      try {
        const token = await getAccessToken();
        const perfil = await obtenerMiPerfilColaboradora(token);
        if (vigente) setMisHabilidades(Array.isArray(perfil?.habilidades) ? perfil.habilidades : []);
      } catch {
        // Si no se pueden leer, se listan las habilidades del perfil sin la comparación.
        if (vigente) setMisHabilidades(null);
      }
    })();
    return () => {
      vigente = false;
    };
  }, [sesion?.rol, getAccessToken]);

  useEffect(() => {
    const faltantes = postulacionesProyecto
      .map((postulacion) => postulacion.colaborador?.id)
      .filter((idColaboradora) => idColaboradora && !(idColaboradora in habilidadesPorColaboradora));
    if (faltantes.length === 0) return undefined;
    let vigente = true;
    Promise.all(
      faltantes.map((idColaboradora) =>
        obtenerColaboradoraPorId(idColaboradora)
          .then((colaboradora) => [idColaboradora, Array.isArray(colaboradora?.habilidades) ? colaboradora.habilidades : undefined])
          .catch(() => [idColaboradora, undefined]),
      ),
    ).then((pares) => {
      if (vigente) setHabilidadesPorColaboradora((actual) => ({ ...actual, ...Object.fromEntries(pares) }));
    });
    return () => {
      vigente = false;
    };
  }, [postulacionesProyecto, habilidadesPorColaboradora]);

  const migasBase = [{ texto: t('detalleProyecto.proyectosMigas'), to: '/proyectos' }];

  if (cargando) {
    return (
      <div className="contenedor-pagina">
        <EsqueletoDetalle etiqueta={t('detalleProyecto.cargando')} />
      </div>
    );
  }

  if (errorCarga === 'NO_ENCONTRADO') {
    return (
      <div className="contenedor-pagina">
        <PaginaError
          codigo={404}
          titulo={t('detalleProyecto.noEncontradoTitulo')}
          descripcion={t('detalleProyecto.noEncontradoSub')}
          accion={
            <Button component={Link} to="/proyectos" variant="contained">
              {t('detalleProyecto.volverALista')}
            </Button>
          }
        />
      </div>
    );
  }

  if (errorCarga || !proyecto) {
    return (
      <div className="contenedor-pagina contenedor-pagina--lectura">
        <EncabezadoPagina
          titulo={t('detalleProyecto.errorCargaTitulo')}
          migas={[...migasBase, { texto: t('detalleProyecto.errorCargaTitulo') }]}
        />
        <AlertaError error={errorCarga} titulo={t('detalleProyecto.errorCargaTitulo')} onReintentar={cargar} />
      </div>
    );
  }

  const esFinalizado = proyecto.estado === 'FINALIZADO';
  const yaColaboraEnProyecto = Boolean(
    sesion?.rol === 'COLABORADOR' &&
    misColaboraciones?.some(
      (colaboracion) => String(colaboracion.idProyecto) === String(id),
    ),
  );
  const verificandoParticipacion =
    sesion?.rol === 'COLABORADOR' &&
    misColaboraciones === null &&
    !errorVerificarParticipacion;
  const avance = Math.min(100, Math.max(0, Number(proyecto.porcentajeConcrecion) || 0));
  const busquedaVigente = Boolean(proyecto.busquedaVigente);
  const fechaLimiteBusqueda = formatearFecha(proyecto.fechaLimiteBusqueda);

  const abrirPostulacion = (perfil) => {
    if (!isAuthenticated) {
      iniciarSesion();
      return;
    }
    if (sesion?.rol !== 'COLABORADOR') return;
    setPerfilPostulando(perfil);
    setEsAnonima(false);
    setErrorPostulacion('');
    setModalPostulacionAbierto(true);
  };

  const enviarPostulacion = async () => {
    if (!perfilPostulando) return;
    setGuardandoPostulacion(true);
    setErrorPostulacion('');
    try {
      const token = await getAccessToken();
      if (!token) {
        setErrorPostulacion(t('detalleProyecto.errorSesionPostulacion'));
        return;
      }
      await crearPostulacion(token, id, perfilPostulando.id, { esAnonima });
      setPostulacionesEnviadas((actuales) => ({
        ...actuales,
        [perfilPostulando.id]: true,
      }));
      notificar({ mensaje: t('detalleProyecto.exitoPostulacion') });
    } catch (error) {
      const codigo = error.response?.data?.codigo;
      const traducciones = {
        BUSQUEDA_CERRADA: 'errorBusquedaCerradaPostulacion',
        PROYECTO_FINALIZADO: 'errorProyectoFinalizadoPostulacion',
        POSTULACION_YA_EXISTENTE: 'errorPostulacionExistente',
        COLABORACION_YA_EXISTENTE: 'errorColaboracionExistente',
        LIMITE_COLABORACIONES_ALCANZADO: 'errorVacantesCompletas',
        ACCESO_POSTULACION_DENEGADO: 'errorSoloColaboradoras',
      };
      setErrorPostulacion(
        codigo && traducciones[codigo]
          ? t(`detalleProyecto.${traducciones[codigo]}`)
          : mensajeDeError(error, t('detalleProyecto.errorPostulacionContexto'))
      );
      if (codigo === 'POSTULACION_YA_EXISTENTE') {
        setPostulacionesPendientes((actuales) => ({
          ...actuales,
          [perfilPostulando.id]: true,
        }));
      }
    } finally {
      setGuardandoPostulacion(false);
    }
  };

  const resolverSolicitud = async (postulacion, decision) => {
    setResolviendoPostulacionId(postulacion.id);
    setErroresResolucion((actuales) => ({
      ...actuales,
      [postulacion.id]: '',
    }));
    try {
      const token = await getAccessToken();
      const resuelta = await resolverPostulacion(
        token,
        id,
        postulacion.id,
        decision,
      );
      setPostulacionesProyecto((actuales) =>
        actuales.map((actual) =>
          actual.id === resuelta.id ? resuelta : actual,
        ),
      );
      if (decision === 'ACEPTADA') {
        setColaboraciones((actuales) =>
          actuales === null
            ? actuales
            : [...actuales, { idPerfil: resuelta.idPerfil }],
        );
      }
      await cargarPostulaciones();
    } catch (error) {
      const mensaje =
        codigoDeError(error) === 'LIMITE_COLABORACIONES_ALCANZADO'
          ? t('detalleProyecto.errorLimitePostulacion')
          : mensajeDeError(error, t('detalleProyecto.errorResolverPostulacion'));
      setErroresResolucion((actuales) => ({
        ...actuales,
        [postulacion.id]: mensaje,
      }));
    } finally {
      setResolviendoPostulacionId(null);
    }
  };

  // ---- Búsqueda ----
  const abrirConfigurarBusqueda = () => {
    setBusquedaSwitch(Boolean(proyecto.busquedaAbierta));
    setFechaBusqueda(aInputFecha(proyecto.fechaLimiteBusqueda));
    setErrorFechaBusqueda('');
    setErrorBusqueda(null);
    setModalBusquedaAbierto(true);
  };

  const guardarConfigBusqueda = async () => {
    const fechaCambio = fechaBusqueda !== aInputFecha(proyecto.fechaLimiteBusqueda);
    if (busquedaSwitch && fechaBusqueda && fechaCambio && !esFechaFutura(fechaBusqueda)) {
      setErrorFechaBusqueda(t('formularioProyecto.errFechaPasada'));
      document.getElementById('busqueda-fecha-limite')?.focus();
      return;
    }

    setGuardandoBusqueda(true);
    setErrorBusqueda(null);
    setErrorFechaBusqueda('');
    try {
      const token = await getAccessToken();
      const actualizado = await configurarBusqueda(token, id, {
        busquedaAbierta: busquedaSwitch,
        ...(busquedaSwitch && fechaBusqueda ? { fechaLimiteBusqueda: aIso(fechaBusqueda) } : {}),
      });
      setProyecto(actualizado);
      setModalBusquedaAbierto(false);
      notificar({ mensaje: t('detalleProyecto.exitoBusqueda') });
    } catch (err) {
      setErrorBusqueda(err);
    } finally {
      setGuardandoBusqueda(false);
    }
  };

  // ---- Avance ----
  const abrirEditarAvance = () => {
    setFormAvance({
      porcentaje: String(proyecto.porcentajeConcrecion ?? 0),
      enlaceSistema: proyecto.enlaceSistema || '',
      enlaceCodigoFuente: proyecto.enlaceCodigoFuente || '',
    });
    setErroresAvance({});
    setAvisoAvance('');
    setErrorAvance(null);
    setModalEditarAvance(true);
  };

  const guardarAvance = async (e) => {
    e.preventDefault();
    const porcentaje = formAvance.porcentaje.trim();
    const enlaceSistema = formAvance.enlaceSistema.trim();
    const enlaceCodigoFuente = formAvance.enlaceCodigoFuente.trim();

    const errores = {};
    if (porcentaje !== '') {
      const valor = Number(porcentaje);
      if (!Number.isFinite(valor) || valor < 0 || valor > 100) {
        errores.porcentaje = t('detalleProyecto.errPorcentaje');
      }
    }
    if (enlaceSistema && !ES_ENLACE.test(enlaceSistema)) {
      errores.enlaceSistema = t('detalleProyecto.errEnlace');
    }
    if (enlaceCodigoFuente && !ES_ENLACE.test(enlaceCodigoFuente)) {
      errores.enlaceCodigoFuente = t('detalleProyecto.errEnlace');
    }
    setErroresAvance(errores);
    if (Object.keys(errores).length > 0) {
      const primero = { porcentaje: 'avance-porcentaje', enlaceSistema: 'avance-enlace-sistema', enlaceCodigoFuente: 'avance-enlace-repo' }[Object.keys(errores)[0]];
      document.getElementById(primero)?.focus();
      return;
    }

    // Solo se mandan los datos cargados: un campo vacío no se envía
    const cambios = {};
    if (porcentaje !== '') cambios.porcentajeConcrecion = Number(porcentaje);
    if (enlaceSistema) cambios.enlaceSistema = enlaceSistema;
    if (enlaceCodigoFuente) cambios.enlaceCodigoFuente = enlaceCodigoFuente;
    if (Object.keys(cambios).length === 0) {
      setAvisoAvance(t('detalleProyecto.errAvanceVacio'));
      return;
    }

    setGuardandoAvance(true);
    setAvisoAvance('');
    setErrorAvance(null);
    try {
      const token = await getAccessToken();
      const actualizado = await actualizarAvance(token, id, cambios);
      setProyecto((actual) => ({
        ...actual,
        porcentajeConcrecion: actualizado.porcentajeConcrecion,
        enlaceSistema: actualizado.enlaceSistema,
        enlaceCodigoFuente: actualizado.enlaceCodigoFuente,
      }));
      setModalEditarAvance(false);
      notificar({ mensaje: t('detalleProyecto.exitoAvance') });
    } catch (err) {
      setErrorAvance(err);
    } finally {
      setGuardandoAvance(false);
    }
  };

  // ---- Logros ----
  const handleCrearLogro = async (e) => {
    e.preventDefault();
    const titulo = nuevoLogro.titulo.trim();
    const descripcion = nuevoLogro.descripcion.trim();
    const errores = {};
    if (!titulo) errores.titulo = t('detalleProyecto.errLogroTitulo');
    if (!descripcion) errores.descripcion = t('detalleProyecto.errLogroDescripcion');
    setErroresLogro(errores);
    if (Object.keys(errores).length > 0) {
      document.getElementById(errores.titulo ? 'logro-titulo' : 'logro-descripcion')?.focus();
      return;
    }

    setGuardandoLogro(true);
    setErrorLogro(null);
    try {
      const token = await getAccessToken();
      const creado = await crearLogro(token, id, {
        titulo,
        descripcion,
        fecha: new Date().toISOString(),
        // solo se manda si está tildado (así no depende de que el backend ya esté desplegado)
        ...(nuevoLogro.publicarEnLinkedin && { publicarEnLinkedin: true }),
      });
      setLogros((actuales) => [...actuales, creado]);
      setNuevoLogro({ titulo: '', descripcion: '', publicarEnLinkedin: false });
      notificar({ mensaje: t('detalleProyecto.exitoLogro') });
      if (creado.publicacionLinkedin) setAvisoLinkedin(avisoDePublicacion(creado.publicacionLinkedin));
    } catch (err) {
      const codigo = codigoDeError(err);
      if (codigo === 'LINKEDIN_NO_CONECTADO' || codigo === 'LINKEDIN_CONEXION_VENCIDA') {
        linkedin.recargar(); // el estado local estaba desactualizado
      }
      setErrorLogro(err);
    } finally {
      setGuardandoLogro(false);
    }
  };

  const handlePublicarLogro = async (logro) => {
    if (!linkedin.estado?.conectado) {
      linkedin.conectar();
      return;
    }
    setPublicandoId(logro.id);
    setAvisoLinkedin(null);
    try {
      const token = await getAccessToken();
      const actualizado = await publicarLogroEnLinkedin(token, id, logro.id);
      setLogros((actuales) => actuales.map((l) => (l.id === actualizado.id ? actualizado : l)));
      setAvisoLinkedin(avisoDePublicacion(actualizado.publicacionLinkedin));
    } catch (err) {
      const codigo = codigoDeError(err);
      if (codigo === 'LINKEDIN_NO_CONECTADO' || codigo === 'LINKEDIN_CONEXION_VENCIDA') {
        linkedin.recargar();
      }
      setAvisoLinkedin({ severity: 'error', texto: mensajeDeError(err, t('linkedin.errorPublicarContexto')) });
    } finally {
      setPublicandoId(null);
    }
  };

  const textoBotonPostular = (perfil) =>
    yaColaboraEnProyecto
      ? t('detalleProyecto.yaColaboraEnProyecto')
      : verificandoParticipacion
        ? t('detalleProyecto.verificandoParticipacion')
        : errorVerificarParticipacion
          ? t('detalleProyecto.errorVerificarParticipacionCorto')
          : postulacionesEnviadas[perfil.id]
      ? t('detalleProyecto.postulacionEnviada')
      : postulacionesPendientes[perfil.id]
        ? t('detalleProyecto.postulacionPendiente')
        : !busquedaVigente
          ? t('detalleProyecto.busquedaCerradaBtn')
          : sesion?.rol === 'COLECTIVO'
            ? t('detalleProyecto.soloColaboradoras')
            : !isAuthenticated
              ? t('detalleProyecto.iniciarSesionPostulacion')
              : t('detalleProyecto.postularme');

  const pendientes = postulacionesProyecto.filter((postulacion) => postulacion.estado === 'PENDIENTE').length;
  const pestanaResumen = { valor: 'resumen', texto: t('detalleProyecto.pestanaResumen'), icono: <FiInfo aria-hidden="true" /> };
  const pestanaPerfiles = { valor: 'perfiles', texto: t('detalleProyecto.pestanaPerfiles'), icono: <FiUsers aria-hidden="true" />, cantidad: perfiles.length };
  const pestanas = [
    ...(esDueño ? [pestanaResumen, pestanaPerfiles] : [pestanaPerfiles, pestanaResumen]),
    ...(esDueño
      ? [
          {
            valor: 'postulaciones',
            texto: t('detalleProyecto.pestanaPostulaciones'),
            icono: <FiInbox aria-hidden="true" />,
            destacado: pendientes,
            textoDestacado: pendientes === 1
              ? t('detalleProyecto.pendientesUna')
              : t('detalleProyecto.pendientesVarias', { cantidad: pendientes }),
          },
          {
            valor: 'equipo',
            texto: t('detalleProyecto.pestanaEquipo'),
            icono: <FiUserCheck aria-hidden="true" />,
            cantidad: colaboracionesGestion.length,
          },
        ]
      : []),
    { valor: 'logros', texto: t('detalleProyecto.pestanaLogros'), icono: <FiAward aria-hidden="true" />, cantidad: logros.length },
  ];
  const pestanaVisible = pestanas.some((p) => p.valor === pestana) ? pestana : pestanas[0].valor;
  const abrirAdmin = (accion) => {
    setAnclaAdmin(null);
    accion();
  };

  const nombreDe = (colaboradora) =>
    colaboradora?.nombreFantasia ||
    [colaboradora?.nombre, colaboradora?.apellido].filter(Boolean).join(' ') ||
    colaboradora?.usuarioGitHub ||
    t('detalleProyecto.nombreNoDisponible');

  // Un solo punto de entrada para quien administra: datos, perfiles, búsqueda y avance.
  const accionesDueño = esDueño ? (
    <>
      <Button
        variant="contained"
        color="secondary"
        startIcon={<FiSettings aria-hidden="true" />}
        endIcon={<FiChevronDown aria-hidden="true" />}
        aria-haspopup="menu"
        aria-expanded={Boolean(anclaAdmin)}
        aria-controls={anclaAdmin ? 'menu-admin-proyecto' : undefined}
        onClick={(evento) => setAnclaAdmin(evento.currentTarget)}
      >
        {t('detalleProyecto.btnAdministrar')}
      </Button>
      <Menu
        id="menu-admin-proyecto"
        anchorEl={anclaAdmin}
        open={Boolean(anclaAdmin)}
        onClose={() => setAnclaAdmin(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => abrirAdmin(() => navigate(`/proyectos/${id}/editar`))}>
          <ListItemIcon><FiEdit2 aria-hidden="true" /></ListItemIcon>
          {t('detalleProyecto.btnEditarDatos')}
        </MenuItem>
        <MenuItem onClick={() => abrirAdmin(() => navigate(`/proyectos/${id}/perfiles`))}>
          <ListItemIcon><FiUsers aria-hidden="true" /></ListItemIcon>
          {t('detalleProyecto.btnGestionarPerfiles')}
        </MenuItem>
        <MenuItem onClick={() => abrirAdmin(abrirConfigurarBusqueda)}>
          <ListItemIcon><FiSearch aria-hidden="true" /></ListItemIcon>
          {t('detalleProyecto.btnConfigurarBusqueda')}
        </MenuItem>
        <MenuItem onClick={() => abrirAdmin(abrirEditarAvance)}>
          <ListItemIcon><FiBarChart2 aria-hidden="true" /></ListItemIcon>
          {t('detalleProyecto.btnActualizarAvance')}
        </MenuItem>
      </Menu>
    </>
  ) : null;

  return (
    <div className="contenedor-pagina detalle">
      <EncabezadoPagina
        titulo={proyecto.titulo}
        migas={[...migasBase, { texto: proyecto.titulo }]}
        accion={accionesDueño}
      >
        <div className="detalle-meta">
          <ChipEstado estado={esFinalizado ? 'FINALIZADO' : 'ACTIVO'} />
          <ChipEstado
            estado={busquedaVigente ? 'ABIERTA' : 'CERRADA'}
            texto={busquedaVigente ? t('detalleProyecto.busquedaAbiertaChip') : t('detalleProyecto.busquedaCerradaChip')}
          />
          <Link className="detalle-meta__colectivo" to={`/colectivos/${proyecto.idColectivo}`}>
            <FiUsers aria-hidden="true" />
            {t('detalleProyecto.verColectivo')}
          </Link>
        </div>
      </EncabezadoPagina>

      <Tabs
        value={pestanaVisible}
        onChange={(_, valor) => setPestana(valor)}
        aria-label={t('detalleProyecto.pestanas')}
        className="pestanas"
      >
        {pestanas.map(({ valor, texto, icono, cantidad, destacado, textoDestacado }) => (
          <Tab
            key={valor}
            value={valor}
            id={`pestana-${valor}`}
            aria-controls={`panel-${valor}`}
            icon={icono}
            iconPosition="start"
            label={
              <span className="pestana-etiqueta">
                {texto}
                {cantidad > 0 && <span className="pestana-contador"> ({cantidad})</span>}
                {destacado > 0 && (
                  <span className="insignia insignia--acento">
                    {destacado}
                    <span className="visualmente-oculto"> {textoDestacado}</span>
                  </span>
                )}
              </span>
            }
          />
        ))}
      </Tabs>

      <div
        role="tabpanel"
        id={`panel-${pestanaVisible}`}
        aria-labelledby={`pestana-${pestanaVisible}`}
        className="panel-pestana"
      >
        {pestanaVisible === 'resumen' && (
          <div className="con-lateral con-lateral--derecha">
            <div className="detalle-columna">
              {esDueño && !errorPerfiles && perfiles.length === 0 && (
                <Alert
                  severity="warning"
                  action={
                    <Button
                      color="inherit"
                      variant="outlined"
                      startIcon={<FiPlus aria-hidden="true" />}
                      onClick={() => navigate(`/proyectos/${id}/perfiles`, { state: { crearPerfil: true } })}
                    >
                      {t('detalleProyecto.btnCargarPerfiles')}
                    </Button>
                  }
                >
                  <AlertTitle>{t('detalleProyecto.sinPerfiles')}</AlertTitle>
                  {t('detalleProyecto.sinPerfilesDueño')}
                </Alert>
              )}
              <section className="panel" aria-labelledby="detalle-descripcion-titulo">
                <h2 id="detalle-descripcion-titulo">{t('detalleProyecto.descripcion')}</h2>
                <Markdown texto={proyecto.descripcion} className="detalle-descripcion" />
              </section>

              <section className="panel" aria-labelledby="detalle-enlaces-titulo">
                <h2 id="detalle-enlaces-titulo">{t('detalleProyecto.seccionEnlaces')}</h2>
                {proyecto.enlaceSistema || proyecto.enlaceCodigoFuente ? (
                  <div className="detalle-enlaces">
                    {proyecto.enlaceSistema && (
                      <Button
                        variant="outlined"
                        href={proyecto.enlaceSistema}
                        target="_blank"
                        rel="noopener noreferrer"
                        endIcon={<FiExternalLink aria-hidden="true" />}
                      >
                        {t('detalleProyecto.enlaceSistemaBtn')}
                        <span className="visualmente-oculto"> {t('detalleProyecto.nuevaPestana')}</span>
                      </Button>
                    )}
                    {proyecto.enlaceCodigoFuente && (
                      <Button
                        variant="outlined"
                        href={proyecto.enlaceCodigoFuente}
                        target="_blank"
                        rel="noopener noreferrer"
                        endIcon={<FiExternalLink aria-hidden="true" />}
                      >
                        {t('detalleProyecto.enlaceRepoBtn')}
                        <span className="visualmente-oculto"> {t('detalleProyecto.nuevaPestana')}</span>
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="texto-secundario">{t('detalleProyecto.sinEnlaces')}</p>
                )}
              </section>

              {!esDueño && (yaColaboraEnProyecto || avisoBaja) && (
                <section className="panel" aria-label={t('misColaboraciones.titulo')}>
                  {avisoBaja && <Alert severity="success" role="status">{avisoBaja}</Alert>}
                  {yaColaboraEnProyecto && (
                    <div>
                      <Button color="error" variant="outlined" disabled={!sesion?.idColaborador} onClick={() => {
                        setAvisoBaja('');
                        setBajaSeleccionada({
                          idProyecto: id,
                          idColaborador: sesion.idColaborador,
                          nombre: proyecto.titulo,
                        });
                      }}>
                        {t('bajaColaboracion.confirmarPropia')}
                      </Button>
                    </div>
                  )}
                </section>
              )}
            </div>

            <aside className="lateral" aria-label={t('detalleProyecto.datosProyecto')}>
              <section className="panel detalle-avance" aria-labelledby="detalle-avance-titulo">
                <h2 id="detalle-avance-titulo">{t('detalleProyecto.seccionAvance')}</h2>
                <p className="detalle-avance__valor">{t('detalleProyecto.porcentajeCompletado', { porcentaje: avance })}</p>
                <LinearProgress variant="determinate" value={avance} aria-label={t('detalleProyecto.seccionAvance')} />
              </section>

              <section className="panel" aria-labelledby="detalle-datos-titulo">
                <h2 id="detalle-datos-titulo">{t('detalleProyecto.datosProyecto')}</h2>
                <dl className="detalle-datos">
                  <div>
                    <dt>{t('detalleProyecto.fechaInicio')}</dt>
                    <dd>{formatearFecha(proyecto.fechaInicio) ?? t('detalleProyecto.sinFecha')}</dd>
                  </div>
                  <div>
                    <dt>{esFinalizado ? t('detalleProyecto.cierrePrevisto') : t('detalleProyecto.cierreProgramado')}</dt>
                    <dd>{formatearFecha(proyecto.fechaLimiteCierre) ?? t('detalleProyecto.sinFecha')}</dd>
                  </div>
                  <div>
                    <dt>{t('detalleProyecto.estadoBusqueda')}</dt>
                    <dd>
                      {busquedaVigente ? (
                        fechaLimiteBusqueda
                          ? t('detalleProyecto.abiertaHasta', { fecha: fechaLimiteBusqueda })
                          : t('detalleProyecto.abiertaSinFecha')
                      ) : (
                        <>
                          <FiLock aria-hidden="true" /> {t('detalleProyecto.mensajeBusquedaCerrada')}
                        </>
                      )}
                    </dd>
                  </div>
                </dl>
              </section>
            </aside>
          </div>
        )}

        {pestanaVisible === 'perfiles' && (
          <section className="detalle-seccion" aria-labelledby="detalle-perfiles-titulo">
            <h2 id="detalle-perfiles-titulo" className="visualmente-oculto">{t('detalleProyecto.seccionPerfiles')}</h2>
            {sesion?.rol === 'COLABORADOR' && errorVerificarParticipacion && (
              <AlertaError
                error={errorVerificarParticipacion}
                titulo={t('detalleProyecto.errorVerificarParticipacion')}
                onReintentar={() => setIntentoVerificacion((intento) => intento + 1)}
              />
            )}
            {errorPerfiles && (
              <AlertaError error={errorPerfiles} titulo={t('detalleProyecto.errorPerfilesTitulo')} onReintentar={cargarPerfiles} />
            )}
            {errorColaboraciones && perfiles.some((perfil) => perfil.limiteColaboraciones != null) && (
              <AlertaError
                error={errorColaboraciones}
                titulo={t('detalleProyecto.errorVacantesTitulo')}
                onReintentar={cargarColaboraciones}
              />
            )}
            {!errorPerfiles && perfiles.length === 0 ? (
              <EstadoVacio
                icono={FiUsers}
                nivelTitulo="h3"
                titulo={t('detalleProyecto.sinPerfiles')}
                descripcion={esDueño ? t('detalleProyecto.sinPerfilesDueño') : undefined}
                accion={
                  esDueño ? (
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<FiPlus aria-hidden="true" />}
                      onClick={() => navigate(`/proyectos/${id}/perfiles`)}
                    >
                      {t('detalleProyecto.btnCargarPerfiles')}
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <ul className="detalle-perfiles">
                {perfiles.map((perfil) => {
                  const ocupadas = (colaboraciones ?? []).filter(
                    (colaboracion) => String(colaboracion.idPerfil) === String(perfil.id)
                  ).length;
                  const sinLimite = perfil.limiteColaboraciones == null;
                  const vacantesDisponibles =
                    sinLimite || colaboraciones == null
                      ? null
                      : Math.max(0, perfil.limiteColaboraciones - ocupadas);
                  const idPerfil = `perfil-${perfil.id}`;

                  return (
                    <li key={perfil.id} className="tarjeta perfil-buscado" aria-labelledby={idPerfil}>
                      <div className="tarjeta__cuerpo">
                        <h3 id={idPerfil}><MarkdownEnLinea texto={perfil.descripcion} /></h3>

                        <CoincidenciaHabilidades
                          perfil={perfil}
                          habilidadesPersona={sesion?.rol === 'COLABORADOR' ? misHabilidades ?? undefined : undefined}
                          sujeto="vos"
                        />

                        <dl className="perfil-buscado__datos">
                          <div>
                            <dt>{t('detalleProyecto.compromiso')}</dt>
                            <dd>{resumenCompromiso(perfil.compromiso)}</dd>
                          </div>
                          <div>
                            <dt>{t('detalleProyecto.modalidad')}</dt>
                            <dd>{etiquetaModalidad(perfil.compromiso.tipoColaboracion)}</dd>
                          </div>
                          <div>
                            <dt>{t('detalleProyecto.cupo')}</dt>
                            <dd>{textoCupo(perfil.limiteColaboraciones)}</dd>
                          </div>
                        </dl>

                        {/* Siempre se informa la disponibilidad: con cupo muestra cuántas quedan; sin cupo, que no hay límite. */}
                        {sinLimite && (
                          <p className="perfil-buscado__vacantes">
                            <FiCheckCircle aria-hidden="true" />
                            <span>{t('detalleProyecto.vacantesSinLimite')}</span>
                          </p>
                        )}
                        {vacantesDisponibles != null && (
                          <p className={`perfil-buscado__vacantes${vacantesDisponibles === 0 ? ' perfil-buscado__vacantes--agotadas' : ''}`}>
                            {vacantesDisponibles === 0 ? <FiLock aria-hidden="true" /> : <FiCheckCircle aria-hidden="true" />}
                            <span>
                              {vacantesDisponibles === 0
                                ? t('detalleProyecto.vacantesCompletas')
                                : vacantesDisponibles === 1
                                  ? t('detalleProyecto.unaVacanteDisponible')
                                  : t('detalleProyecto.vacantesDisponibles', { cantidad: vacantesDisponibles })}
                            </span>
                          </p>
                        )}
                      </div>

                      {!esDueño && (
                        <div className="tarjeta__acciones">
                          <Button
                            variant="contained"
                            color="secondary"
                            fullWidth
                            startIcon={<FiSend aria-hidden="true" />}
                            disabled={
                              !busquedaVigente ||
                              authCargando ||
                              yaColaboraEnProyecto ||
                              verificandoParticipacion ||
                              Boolean(errorVerificarParticipacion) ||
                              (isAuthenticated && sesion?.rol !== 'COLABORADOR') ||
                              Boolean(postulacionesEnviadas[perfil.id]) ||
                              Boolean(postulacionesPendientes[perfil.id]) ||
                              vacantesDisponibles === 0
                            }
                            onClick={() => abrirPostulacion(perfil)}
                          >
                            {textoBotonPostular(perfil)}
                          </Button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {pestanaVisible === 'postulaciones' && esDueño && (
          <section className="detalle-seccion" aria-labelledby="detalle-postulaciones-titulo">
            <h2 id="detalle-postulaciones-titulo" className="visualmente-oculto">{t('detalleProyecto.seccionPostulaciones')}</h2>
            <p className="texto-secundario">{t('detalleProyecto.ayudaPostulaciones')}</p>
            {errorCargarPostulaciones && (
              <AlertaError
                error={errorCargarPostulaciones}
                titulo={t('detalleProyecto.errorCargarPostulaciones')}
                onReintentar={cargarPostulaciones}
              />
            )}
            {cargandoPostulaciones ? (
              <p role="status">{t('detalleProyecto.cargandoPostulaciones')}</p>
            ) : !errorCargarPostulaciones && postulacionesProyecto.length === 0 ? (
              <EstadoVacio icono={FiInbox} nivelTitulo="p" titulo={t('detalleProyecto.sinPostulaciones')} />
            ) : (
              <ul className="detalle-perfiles detalle-perfiles--lista">
                {postulacionesProyecto.map((postulacion) => {
                  const perfil = perfiles.find(
                    (item) => String(item.id) === String(postulacion.idPerfil),
                  );
                  const ocupadas = (colaboraciones ?? []).filter(
                    (item) => String(item.idPerfil) === String(postulacion.idPerfil),
                  ).length;
                  const sinVacantes =
                    perfil?.limiteColaboraciones != null &&
                    ocupadas >= perfil.limiteColaboraciones;
                  const colaboradora = postulacion.colaborador;
                  const nombreColaboradora = nombreDe(colaboradora);
                  const pendiente = postulacion.estado === 'PENDIENTE';
                  const habilidadesPersona = postulacion.perfilPublico?.habilidades ?? (colaboradora?.id ? habilidadesPorColaboradora[colaboradora.id] : undefined);

                  return (
                    <li key={postulacion.id} className={`tarjeta perfil-buscado postulacion postulacion--${postulacion.estado?.toLowerCase()}`}>
                      <div className="tarjeta__cuerpo">
                        <div className="postulacion__cabecera">
                          <h3>{perfil ? <MarkdownEnLinea texto={perfil.descripcion} /> : t('detalleProyecto.nombreNoDisponible')}</h3>
                          <ChipEstado
                            estado={postulacion.estado}
                            texto={t(`detalleProyecto.estado${postulacion.estado === 'ACEPTADA' ? 'Aceptada' : postulacion.estado === 'RECHAZADA' ? 'Rechazada' : 'Pendiente'}`)}
                          />
                        </div>
                        {postulacion.fechaPostulacion && (
                          <p className="texto-secundario">
                            {t('detalleProyecto.fechaPostulacion', {
                              fecha: formatearFecha(postulacion.fechaPostulacion),
                            })}
                          </p>
                        )}
                        {postulacion.esAnonima && (
                          <p>{t('detalleProyecto.postulacionAnonima')}</p>
                        )}

                        {perfil && (
                          <CoincidenciaHabilidades
                            perfil={perfil}
                            habilidadesPersona={habilidadesPersona}
                          />
                        )}

                        {pendiente ? (
                          <>
                            {postulacion.perfilPublico && (
                              <div>
                                <p><strong>Perfil público:</strong> {nombreDe(postulacion.perfilPublico)}</p>
                                {postulacion.perfilPublico.pronombres?.length > 0 && <p>Pronombres: {postulacion.perfilPublico.pronombres.join(', ')}</p>}
                                {postulacion.perfilPublico.presentacion && <p>{postulacion.perfilPublico.presentacion}</p>}
                                {postulacion.perfilPublico.usuarioGitHub && <p>GitHub: {postulacion.perfilPublico.usuarioGitHub}</p>}
                                <p><strong>Habilidades:</strong> {postulacion.perfilPublico.habilidades?.join(', ') || 'No informadas'}</p>
                                {postulacion.perfilPublico.id && <Link to={`/colaboradoras/${postulacion.perfilPublico.id}`}>Ver perfil público</Link>}
                              </div>
                            )}
                            <p className="texto-secundario">Los datos de contacto se habilitan al aceptar.</p>
                          </>
                        ) : postulacion.estado === 'ACEPTADA' ? (
                          <div className="postulacion__contacto">
                            <p>
                              <strong>{t('detalleProyecto.colaboradoraAceptada')}: {nombreColaboradora}</strong>
                            </p>
                            <p className="perfil-buscado__etiqueta">
                              {t('detalleProyecto.contactoColaboradora')}
                            </p>
                            {colaboradora?.mediosDeContacto?.length ? (
                              <ul>
                                {colaboradora.mediosDeContacto.map((medio, indice) => (
                                  <li key={`${medio.tipoDeContacto}-${indice}`}>
                                    {medio.tipoDeContacto}: {medio.contacto}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p>{t('detalleProyecto.sinContactoColaboradora')}</p>
                            )}
                          </div>
                        ) : null}
                        {erroresResolucion[postulacion.id] && (
                          <Alert severity="error" role="alert">
                            {erroresResolucion[postulacion.id]}
                          </Alert>
                        )}
                        {pendiente && sinVacantes && (
                          <Alert severity="warning">
                            {t('detalleProyecto.sinVacantesParaAceptar')}
                          </Alert>
                        )}
                      </div>
                      {pendiente && (
                        <div className="tarjeta__acciones">
                          <Button
                            variant="contained"
                            startIcon={<FiCheck aria-hidden="true" />}
                            disabled={
                              sinVacantes ||
                              resolviendoPostulacionId === postulacion.id
                            }
                            loading={resolviendoPostulacionId === postulacion.id}
                            onClick={() => resolverSolicitud(postulacion, 'ACEPTADA')}
                          >
                            {resolviendoPostulacionId === postulacion.id
                              ? t('detalleProyecto.resolviendoPostulacion')
                              : t('detalleProyecto.aceptarPostulacion')}
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<FiX aria-hidden="true" />}
                            disabled={resolviendoPostulacionId === postulacion.id}
                            loading={resolviendoPostulacionId === postulacion.id}
                            onClick={() => resolverSolicitud(postulacion, 'RECHAZADA')}
                          >
                            {t('detalleProyecto.rechazarPostulacion')}
                          </Button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {pestanaVisible === 'equipo' && esDueño && (
          <section className="detalle-seccion" aria-labelledby="detalle-colaboraciones-titulo">
            <h2 id="detalle-colaboraciones-titulo" className="visualmente-oculto">{t('bajaColaboracion.tituloGestion')}</h2>
            {avisoBaja && <Alert severity="success" role="status">{avisoBaja}</Alert>}
            {errorGestion && (
              <AlertaError error={errorGestion} titulo={t('bajaColaboracion.errorCarga')} onReintentar={cargarColaboracionesGestion} />
            )}
            {cargandoGestion ? (
              <p role="status">{t('misColaboraciones.cargando')}</p>
            ) : !errorGestion && colaboracionesGestion.length === 0 ? (
              <EstadoVacio icono={FiUserCheck} nivelTitulo="p" titulo={t('bajaColaboracion.vacio')} />
            ) : !errorGestion && (
              <ul className="detalle-perfiles">
                {colaboracionesGestion.map((colaboracion) => {
                  const nombre = nombreDe(colaboracion);
                  const perfil = perfiles.find((item) => String(item.id) === String(colaboracion.idPerfil));
                  return (
                    <li key={colaboracion.idColaborador} className="tarjeta perfil-buscado">
                      <div className="tarjeta__cuerpo">
                        <h3>{nombre}</h3>
                        {perfil && <p><MarkdownEnLinea texto={perfil.descripcion} /></p>}
                        {colaboracion.esAnonima && <p>{t('bajaColaboracion.anonima')}</p>}
                      </div>
                      <div className="tarjeta__acciones">
                        <Button color="error" variant="outlined" onClick={() => {
                          setAvisoBaja('');
                          setBajaSeleccionada({ idProyecto: id, idColaborador: colaboracion.idColaborador, nombre });
                        }}>
                          {t('bajaColaboracion.confirmarColectivo')}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {pestanaVisible === 'logros' && (
          <section className="detalle-seccion" aria-labelledby="detalle-logros-titulo">
            <h2 id="detalle-logros-titulo" className="visualmente-oculto">{t('detalleProyecto.seccionLogros')}</h2>
            <div className={esDueño ? 'con-lateral con-lateral--derecha' : ''}>
              <div>
                {errorLogros ? (
                  <AlertaError error={errorLogros} titulo={t('detalleProyecto.errorLogrosTitulo')} onReintentar={cargarLogros} />
                ) : logros.length === 0 ? (
                  <EstadoVacio icono={FiAward} nivelTitulo="p" titulo={t('detalleProyecto.sinLogros')} />
                ) : (
                  <ol className="detalle-logros">
                    {logros.map((logro) => (
                      <li key={logro.id} className="detalle-logro">
                        <div className="detalle-logro__cabecera">
                          <h3>{logro.titulo}</h3>
                          {formatearFecha(logro.fecha) && <span className="texto-caption">{formatearFecha(logro.fecha)}</span>}
                        </div>
                        <Markdown texto={logro.descripcion} nivelTitulo={4} />
                        {esDueño && (
                          <div className="detalle-logro__linkedin">
                            {logro.publicacionLinkedin?.estado === 'ENVIADO' ? (
                              <p className="texto-secundario detalle-logro__publicado">
                                <FiCheckCircle aria-hidden="true" /> {t('linkedin.publicado')}
                                {logro.publicacionLinkedin.urnPost && (
                                  <>
                                    {' · '}
                                    <a
                                      href={`https://www.linkedin.com/feed/update/${logro.publicacionLinkedin.urnPost}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {t('linkedin.verPublicacion')}
                                      <span className="visualmente-oculto"> {t('detalleProyecto.nuevaPestana')}</span>
                                    </a>
                                  </>
                                )}
                              </p>
                            ) : (
                              <Button
                                variant="text"
                                startIcon={<FiLinkedin aria-hidden="true" />}
                                loading={publicandoId === logro.id}
                                onClick={() => handlePublicarLogro(logro)}
                              >
                                {logro.publicacionLinkedin?.estado === 'FALLIDO'
                                  ? t('linkedin.reintentar')
                                  : linkedin.estado?.conectado
                                    ? t('linkedin.compartir')
                                    : t('linkedin.conectar')}
                              </Button>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {esDueño && (
                <form onSubmit={handleCrearLogro} noValidate className="panel detalle-form-logro" aria-labelledby="nuevo-logro-titulo">
                  <h3 id="nuevo-logro-titulo">{t('detalleProyecto.nuevoLogroTitulo')}</h3>
                  <TextField
                    id="logro-titulo"
                    label={t('detalleProyecto.labelLogroTitulo')}
                    placeholder={t('detalleProyecto.placeholderLogroTitulo')}
                    value={nuevoLogro.titulo}
                    onChange={(e) => setNuevoLogro({ ...nuevoLogro, titulo: e.target.value })}
                    onBlur={() =>
                      setErroresLogro((actual) => ({ ...actual, titulo: nuevoLogro.titulo.trim() ? undefined : actual.titulo }))
                    }
                    error={Boolean(erroresLogro.titulo)}
                    helperText={mensajeCampo(erroresLogro.titulo)}
                    disabled={guardandoLogro}
                    required
                    fullWidth
                  />
                  <CampoMarkdown
                    id="logro-descripcion"
                    label={t('detalleProyecto.labelLogroDescripcion')}
                    placeholder={t('detalleProyecto.placeholderLogroDescripcion')}
                    value={nuevoLogro.descripcion}
                    onChange={(e) => setNuevoLogro({ ...nuevoLogro, descripcion: e.target.value })}
                    onBlur={() =>
                      setErroresLogro((actual) => ({ ...actual, descripcion: nuevoLogro.descripcion.trim() ? undefined : actual.descripcion }))
                    }
                    error={Boolean(erroresLogro.descripcion)}
                    helperText={mensajeCampo(erroresLogro.descripcion)}
                    disabled={guardandoLogro}
                    required
                    multiline
                    minRows={3}
                    fullWidth
                  />

                  {linkedin.estado &&
                    (linkedin.estado.conectado ? (
                      <div>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={nuevoLogro.publicarEnLinkedin}
                              onChange={(e) => setNuevoLogro({ ...nuevoLogro, publicarEnLinkedin: e.target.checked })}
                              disabled={guardandoLogro}
                            />
                          }
                          label={t('linkedin.publicarAlCrear')}
                        />
                        <p className="texto-secundario">
                          {t('linkedin.conectadoComo')} {linkedin.estado.nombre}
                        </p>
                      </div>
                    ) : (
                      <Alert severity="info">
                        {linkedin.estado.vencida ? t('linkedin.avisoVencida') : t('linkedin.avisoNoConectado')}
                        <div className="alerta-acciones">
                          <Button variant="outlined" startIcon={<FiLinkedin aria-hidden="true" />} onClick={linkedin.conectar}>
                            {linkedin.estado.vencida ? t('linkedin.reconectar') : t('linkedin.conectar')}
                          </Button>
                        </div>
                      </Alert>
                    ))}
                  {linkedin.error && (
                    <Alert severity="error" role="alert">
                      {linkedin.error}
                    </Alert>
                  )}
                  {avisoLinkedin && (
                    <Alert
                      severity={avisoLinkedin.severity}
                      role={avisoLinkedin.severity === 'error' ? 'alert' : 'status'}
                      onClose={() => setAvisoLinkedin(null)}
                    >
                      {avisoLinkedin.texto}
                    </Alert>
                  )}

                  {errorLogro && <AlertaError error={errorLogro} titulo={t('detalleProyecto.errorLogroTitulo')} />}
                  <div>
                    <Button type="submit" variant="contained" loading={guardandoLogro} startIcon={<FiPlus aria-hidden="true" />}>
                      {t('detalleProyecto.btnAgregarLogro')}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </section>
        )}
      </div>

      <DialogoBajaColaboracion
        propia={!esDueño}
        seleccion={bajaSeleccionada}
        onCerrar={() => setBajaSeleccionada(null)}
        onConfirmada={({ idColaborador }) => {
          if (esDueño) {
            setColaboracionesGestion((actuales) => actuales.filter((item) => item.idColaborador !== idColaborador));
            setAvisoBaja(t('bajaColaboracion.exitoColectivo'));
          } else {
            setMisColaboraciones((actuales) => actuales.filter((item) => String(item.idProyecto) !== String(id)));
            setAvisoBaja(t('bajaColaboracion.exitoPropia'));
          }
          cargarColaboraciones();
        }}
      />

      <Dialogo
        open={modalPostulacionAbierto}
        onClose={() => !guardandoPostulacion && setModalPostulacionAbierto(false)}
        aria-labelledby="dialogo-postulacion-titulo"
      >
        <DialogTitle id="dialogo-postulacion-titulo">{t('detalleProyecto.modalPostulacionTitulo')}</DialogTitle>
        <DialogContent className="dialogo-postulacion">
          <div className="dialogo-postulacion__resumen">
            <strong>{proyecto.titulo}</strong>
            <span><MarkdownEnLinea texto={perfilPostulando?.descripcion} /></span>
          </div>
          {perfilPostulando && postulacionesEnviadas[perfilPostulando.id] ? (
            <Alert severity="success" role="status">
              <AlertTitle>{t('detalleProyecto.postulacionEnviadaTitulo')}</AlertTitle>
              {t('detalleProyecto.postulacionEnviadaDescripcion')}
            </Alert>
          ) : (
            <>
              <p>{t('detalleProyecto.postulacionInstruccion')}</p>
              {perfilPostulando && (
                <div className="dialogo-postulacion__coincidencia">
                  <p className="perfil-buscado__etiqueta">{t('detalleProyecto.tuCoincidencia')}</p>
                  <CoincidenciaHabilidades perfil={perfilPostulando} habilidadesPersona={misHabilidades ?? undefined} sujeto="vos" />
                </div>
              )}
              <div className="dialogo-postulacion__anonimato">
                <div>
                  <strong id="anonimato-label">{t('detalleProyecto.anonimatoLabel')}</strong>
                  <p className="texto-secundario" id="anonimato-ayuda">
                    {t('detalleProyecto.anonimatoAyuda')}
                  </p>
                </div>
                <Switch
                  checked={esAnonima}
                  onChange={(event) => setEsAnonima(event.target.checked)}
                  disabled={guardandoPostulacion}
                  slotProps={{
                    input: { 'aria-label': t('detalleProyecto.anonimatoLabel'), 'aria-describedby': 'anonimato-ayuda' },
                  }}
                />
              </div>
              {errorPostulacion && (
                <Alert severity="error" role="alert">
                  {errorPostulacion}
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          {perfilPostulando && postulacionesEnviadas[perfilPostulando.id] ? (
            <Button variant="outlined" onClick={() => setModalPostulacionAbierto(false)}>
              {t('detalleProyecto.cerrar')}
            </Button>
          ) : (
            <>
              <Button variant="outlined" onClick={() => setModalPostulacionAbierto(false)} disabled={guardandoPostulacion}>
                {t('detalleProyecto.cancelar')}
              </Button>
              <Button
                variant="contained"
                onClick={enviarPostulacion}
                disabled={Boolean(postulacionesPendientes[perfilPostulando?.id])}
                loading={guardandoPostulacion}
                startIcon={<FiSend aria-hidden="true" />}
              >
                {guardandoPostulacion ? t('detalleProyecto.enviandoPostulacion') : t('detalleProyecto.enviarPostulacion')}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialogo>

      {/* Actualizar avance (solo el colectivo dueño) */}
      <Dialogo
        open={modalEditarAvance}
        onClose={() => !guardandoAvance && setModalEditarAvance(false)}
        aria-labelledby="dialogo-editar-avance-titulo"
      >
        <form onSubmit={guardarAvance} noValidate>
          <DialogTitle id="dialogo-editar-avance-titulo">{t('detalleProyecto.modalEditarAvanceTitulo')}</DialogTitle>
          <DialogContent className="dialogo-formulario">
            <TextField
              id="avance-porcentaje"
              type="number"
              label={t('detalleProyecto.labelPorcentaje')}
              placeholder={t('detalleProyecto.placeholderPorcentaje')}
              value={formAvance.porcentaje}
              onChange={(e) => setFormAvance({ ...formAvance, porcentaje: e.target.value })}
              error={Boolean(erroresAvance.porcentaje)}
              helperText={mensajeCampo(erroresAvance.porcentaje)}
              disabled={guardandoAvance}
              slotProps={{ htmlInput: { min: 0, max: 100 } }}
              fullWidth
            />
            <TextField
              id="avance-enlace-sistema"
              label={t('detalleProyecto.labelEnlaceSistema')}
              placeholder={t('detalleProyecto.placeholderEnlaceSistema')}
              value={formAvance.enlaceSistema}
              onChange={(e) => setFormAvance({ ...formAvance, enlaceSistema: e.target.value })}
              error={Boolean(erroresAvance.enlaceSistema)}
              helperText={mensajeCampo(erroresAvance.enlaceSistema, t('detalleProyecto.ayudaEnlace'))}
              disabled={guardandoAvance}
              fullWidth
            />
            <TextField
              id="avance-enlace-repo"
              label={t('detalleProyecto.labelEnlaceRepo')}
              placeholder={t('detalleProyecto.placeholderEnlaceRepo')}
              value={formAvance.enlaceCodigoFuente}
              onChange={(e) => setFormAvance({ ...formAvance, enlaceCodigoFuente: e.target.value })}
              error={Boolean(erroresAvance.enlaceCodigoFuente)}
              helperText={mensajeCampo(erroresAvance.enlaceCodigoFuente, t('detalleProyecto.ayudaEnlace'))}
              disabled={guardandoAvance}
              fullWidth
            />
            {avisoAvance && (
              <Alert severity="warning" role="alert">
                {avisoAvance}
              </Alert>
            )}
            {errorAvance && <AlertaError error={errorAvance} titulo={t('detalleProyecto.errorAvanceTitulo')} />}
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" onClick={() => setModalEditarAvance(false)} disabled={guardandoAvance}>
              {t('detalleProyecto.cancelar')}
            </Button>
            <Button type="submit" variant="contained" loading={guardandoAvance}>
              {guardandoAvance ? t('detalleProyecto.guardando') : t('detalleProyecto.btnActualizarAvance')}
            </Button>
          </DialogActions>
        </form>
      </Dialogo>

      {/* Configurar búsqueda (solo el colectivo dueño) */}
      <Dialogo
        open={modalBusquedaAbierto}
        onClose={() => !guardandoBusqueda && setModalBusquedaAbierto(false)}
        aria-labelledby="dialogo-busqueda-titulo"
      >
        <DialogTitle id="dialogo-busqueda-titulo">{t('detalleProyecto.modalBusquedaTitulo')}</DialogTitle>
        <DialogContent className="dialogo-formulario">
          <DialogContentText>
            <strong>{proyecto.titulo}.</strong>{' '}
            {busquedaSwitch ? t('detalleProyecto.modalBusquedaSubActiva') : t('detalleProyecto.modalBusquedaSubInactiva')}
          </DialogContentText>

          <div className="interruptor-fila">
            <div>
              <strong id="busqueda-switch-label">{t('formularioProyecto.labelBusquedaAbierta')}</strong>
              <p className="texto-secundario">
                {busquedaSwitch ? t('formularioProyecto.estadoActivada') : t('formularioProyecto.estadoDesactivada')}
              </p>
            </div>
            <Switch
              checked={busquedaSwitch}
              onChange={(e) => setBusquedaSwitch(e.target.checked)}
              disabled={guardandoBusqueda || esFinalizado}
              slotProps={{ input: { 'aria-label': t('formularioProyecto.labelBusquedaAbierta') } }}
            />
          </div>

          <TextField
            id="busqueda-fecha-limite"
            type="date"
            label={t('formularioProyecto.labelFechaLimite')}
            value={fechaBusqueda}
            onChange={(e) => setFechaBusqueda(e.target.value)}
            error={Boolean(errorFechaBusqueda)}
            helperText={mensajeCampo(
              errorFechaBusqueda,
              busquedaSwitch ? t('formularioProyecto.ayudaFechaLimiteActiva') : t('formularioProyecto.ayudaFechaLimiteInactiva')
            )}
            disabled={guardandoBusqueda || esFinalizado || !busquedaSwitch}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />

          {errorBusqueda && <AlertaError error={errorBusqueda} titulo={t('detalleProyecto.errorBusquedaTitulo')} />}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setModalBusquedaAbierto(false)} disabled={guardandoBusqueda}>
            {t('detalleProyecto.cancelar')}
          </Button>
          <Button variant="contained" onClick={guardarConfigBusqueda} disabled={esFinalizado} loading={guardandoBusqueda}>
            {guardandoBusqueda ? t('detalleProyecto.guardando') : t('detalleProyecto.guardar')}
          </Button>
        </DialogActions>
      </Dialogo>
    </div>
  );
};

export default DetalleProyecto;
