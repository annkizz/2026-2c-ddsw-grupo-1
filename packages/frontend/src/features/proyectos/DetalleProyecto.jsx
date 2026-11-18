import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Switch,
  TextField,
} from '@mui/material';
import { FiArrowLeft, FiInfo, FiLock, FiCheckCircle, FiShield } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth.jsx';
import Markdown from '../../components/Markdown.jsx';
import {
  obtenerProyectoPorId,
  obtenerPerfiles,
  obtenerLogros,
  crearLogro,
  configurarBusqueda,
  actualizarAvance,
} from '../../service/proyectos';
import { t } from '../../i18n/t';
import { formatearFecha, aInputFecha, aIso, esFechaFutura } from '../../utils/fechas';
import { resumenCompromiso, etiquetaModalidad, textoCupo } from '../../utils/perfiles';
import './DetalleProyecto.css';

const ES_ENLACE = /^https?:\/\/\S+$/i;

const DetalleProyecto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { sesion, getAccessToken } = useAuth();

  const [proyecto, setProyecto] = useState(null);
  const [perfiles, setPerfiles] = useState([]);
  const [logros, setLogros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null); // null | 'NO_ENCONTRADO' | 'ERROR'

  const [modalAvanceAbierto, setModalAvanceAbierto] = useState(false);

  const [modalEditarAvance, setModalEditarAvance] = useState(false);
  const [formAvance, setFormAvance] = useState({ porcentaje: '', enlaceSistema: '', enlaceCodigoFuente: '' });
  const [erroresAvance, setErroresAvance] = useState({});
  const [guardandoAvance, setGuardandoAvance] = useState(false);
  const [errorAvance, setErrorAvance] = useState('');

  const [modalBusquedaAbierto, setModalBusquedaAbierto] = useState(false);
  const [busquedaSwitch, setBusquedaSwitch] = useState(false);
  const [fechaBusqueda, setFechaBusqueda] = useState('');
  const [errorFechaBusqueda, setErrorFechaBusqueda] = useState('');
  const [guardandoBusqueda, setGuardandoBusqueda] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState('');

  const [nuevoLogro, setNuevoLogro] = useState({ titulo: '', descripcion: '' });
  const [errorLogro, setErrorLogro] = useState('');
  const [guardandoLogro, setGuardandoLogro] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const [dataProyecto, dataPerfiles, dataLogros] = await Promise.all([
        obtenerProyectoPorId(id),
        obtenerPerfiles(id).catch(() => []),
        obtenerLogros(id).catch(() => []),
      ]);
      setProyecto(dataProyecto);
      setPerfiles(dataPerfiles);
      setLogros(dataLogros);
    } catch (error) {
      setErrorCarga(error.response?.status === 404 ? 'NO_ENCONTRADO' : 'ERROR');
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (cargando) {
    return (
      <div className="detalle-estado" role="status">
        <CircularProgress />
        <p>{t('detalleProyecto.cargando')}</p>
      </div>
    );
  }

  if (errorCarga || !proyecto) {
    const noEncontrado = errorCarga === 'NO_ENCONTRADO';
    return (
      <div className="detalle-contenedor">
        <Link to="/proyectos" className="detalle-volver">
          <FiArrowLeft /> <span>{t('detalleProyecto.volverALista')}</span>
        </Link>
        <div className="detalle-tarjeta-error" role="alert">
          <FiInfo size={24} />
          <h2>
            {noEncontrado
              ? t('detalleProyecto.noEncontradoTitulo')
              : t('detalleProyecto.errorCargaTitulo')}
          </h2>
          <p>
            {noEncontrado ? t('detalleProyecto.noEncontradoSub') : t('detalleProyecto.errorCargaSub')}
          </p>
          {!noEncontrado && (
            <Button variant="outlined" onClick={cargar}>
              {t('detalleProyecto.reintentar')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  const esFinalizado = proyecto.estado === 'FINALIZADO';
  const esDueño = Boolean(sesion?.idColectivo) && proyecto.idColectivo === sesion.idColectivo;
  const avance = Math.min(100, Math.max(0, Number(proyecto.porcentajeConcrecion) || 0));
  const busquedaVigente = Boolean(proyecto.busquedaVigente);
  const fechaLimiteBusqueda = formatearFecha(proyecto.fechaLimiteBusqueda);

  // ---- Búsqueda ----
  const abrirConfigurarBusqueda = () => {
    setBusquedaSwitch(Boolean(proyecto.busquedaAbierta));
    setFechaBusqueda(aInputFecha(proyecto.fechaLimiteBusqueda));
    setErrorFechaBusqueda('');
    setErrorBusqueda('');
    setModalBusquedaAbierto(true);
  };

  const guardarConfigBusqueda = async () => {
    const fechaCambio = fechaBusqueda !== aInputFecha(proyecto.fechaLimiteBusqueda);
    if (busquedaSwitch && fechaBusqueda && fechaCambio && !esFechaFutura(fechaBusqueda)) {
      setErrorFechaBusqueda(t('formularioProyecto.errFechaPasada'));
      return;
    }

    setGuardandoBusqueda(true);
    setErrorBusqueda('');
    setErrorFechaBusqueda('');
    try {
      const token = await getAccessToken();
      const actualizado = await configurarBusqueda(token, id, {
        busquedaAbierta: busquedaSwitch,
        ...(busquedaSwitch && fechaBusqueda ? { fechaLimiteBusqueda: aIso(fechaBusqueda) } : {}),
      });
      setProyecto(actualizado);
      setModalBusquedaAbierto(false);
    } catch (err) {
      setErrorBusqueda(err.response?.data?.error || t('detalleProyecto.errorConfigBusqueda'));
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
    setErrorAvance('');
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
    if (Object.keys(errores).length > 0) return;

    // Solo se mandan los datos cargados: un campo vacío no se envía
    const cambios = {};
    if (porcentaje !== '') cambios.porcentajeConcrecion = Number(porcentaje);
    if (enlaceSistema) cambios.enlaceSistema = enlaceSistema;
    if (enlaceCodigoFuente) cambios.enlaceCodigoFuente = enlaceCodigoFuente;
    if (Object.keys(cambios).length === 0) {
      setErrorAvance(t('detalleProyecto.errAvanceVacio'));
      return;
    }

    setGuardandoAvance(true);
    setErrorAvance('');
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
    } catch (err) {
      setErrorAvance(err.response?.data?.error || t('detalleProyecto.errorAvance'));
    } finally {
      setGuardandoAvance(false);
    }
  };

  // ---- Logros ----
  const handleCrearLogro = async (e) => {
    e.preventDefault();
    const titulo = nuevoLogro.titulo.trim();
    const descripcion = nuevoLogro.descripcion.trim();
    if (!titulo || !descripcion) {
      setErrorLogro(t('detalleProyecto.errLogroCampos'));
      return;
    }

    setGuardandoLogro(true);
    setErrorLogro('');
    try {
      const token = await getAccessToken();
      const creado = await crearLogro(token, id, {
        titulo,
        descripcion,
        fecha: new Date().toISOString(),
      });
      setLogros((actuales) => [...actuales, creado]);
      setNuevoLogro({ titulo: '', descripcion: '' });
    } catch (err) {
      setErrorLogro(err.response?.data?.error || t('detalleProyecto.errorLogro'));
    } finally {
      setGuardandoLogro(false);
    }
  };

  return (
    <div className="detalle-contenedor">
      <Link to="/proyectos" className="detalle-volver">
        <FiArrowLeft /> <span>{t('detalleProyecto.volverALista')}</span>
      </Link>

      <div className="detalle-grid-principal">
        <div className="detalle-info">
          <div className="detalle-badges-fila">
            <span className={`detalle-badge ${esFinalizado ? 'finalizado' : 'activo'}`}>
              {esFinalizado ? <FiCheckCircle /> : <FiInfo />}
              {esFinalizado ? t('proyectos.finalizado') : t('proyectos.activo')}
            </span>
            <Link className="detalle-colectivo-badge" to={`/colectivos/${proyecto.idColectivo}`}>
              {t('detalleProyecto.verColectivo')}
            </Link>
          </div>

          <h1>{proyecto.titulo}</h1>
          <Markdown className="detalle-descripcion">{proyecto.descripcion}</Markdown>

          <div className="detalle-fechas-grid">
            <div>
              <small>{t('detalleProyecto.fechaInicio')}</small>
              <strong>{formatearFecha(proyecto.fechaInicio) ?? t('detalleProyecto.sinFecha')}</strong>
            </div>
            <div>
              <small>
                {esFinalizado
                  ? t('detalleProyecto.cierrePrevisto')
                  : t('detalleProyecto.cierreProgramado')}
              </small>
              <strong>
                {formatearFecha(proyecto.fechaLimiteCierre) ?? t('detalleProyecto.sinFecha')}
              </strong>
            </div>
          </div>
        </div>

        <div className="detalle-card-avance">
          <h3>{t('detalleProyecto.seccionAvance')}</h3>
          <p>{t('detalleProyecto.porcentajeCompletado', { porcentaje: avance })}</p>
          <LinearProgress
            variant="determinate"
            value={avance}
            className="detalle-barra"
            aria-label={t('detalleProyecto.seccionAvance')}
          />
          <Button
            variant="outlined"
            fullWidth
            onClick={() => setModalAvanceAbierto(true)}
            sx={{ mt: 2 }}
          >
            {t('detalleProyecto.verAvance')}
          </Button>
        </div>
      </div>

      {esDueño && (
        <div className="detalle-admin-panel">
          <div className="detalle-admin-titulo">
            <FiShield /> <span>{t('detalleProyecto.adminProyecto')}</span>
          </div>
          <div className="detalle-admin-botones">
            <Button variant="outlined" onClick={() => navigate(`/proyectos/${id}/editar`)}>
              {t('detalleProyecto.btnEditarProyecto')}
            </Button>
            <Button variant="outlined" onClick={() => navigate(`/proyectos/${id}/perfiles`)}>
              {t('detalleProyecto.btnGestionarPerfiles')}
            </Button>
            <Button variant="outlined" onClick={abrirConfigurarBusqueda}>
              {t('detalleProyecto.btnConfigurarBusqueda')}
            </Button>
            <Button variant="outlined" onClick={abrirEditarAvance}>
              {t('detalleProyecto.btnActualizarAvance')}
            </Button>
          </div>
        </div>
      )}

      <div className={`detalle-busqueda-card ${!busquedaVigente ? 'cerrada' : ''}`}>
        <div className="detalle-busqueda-header">
          <div>
            <h3>{t('detalleProyecto.seccionBusqueda')}</h3>
            <p>
              {busquedaVigente
                ? fechaLimiteBusqueda
                  ? t('detalleProyecto.abiertaHasta', { fecha: fechaLimiteBusqueda })
                  : t('detalleProyecto.abiertaSinFecha')
                : t('detalleProyecto.busquedaCerrada')}
            </p>
          </div>
          {!busquedaVigente && <FiLock />}
        </div>
        <small className="detalle-busqueda-sub">
          {busquedaVigente
            ? t('detalleProyecto.busquedaAbierta')
            : t('detalleProyecto.mensajeBusquedaCerrada')}
        </small>
      </div>

      <div className="detalle-perfiles-seccion">
        <h2>{t('detalleProyecto.seccionPerfiles')}</h2>
        <div className="detalle-perfiles-grid">
          {perfiles.length > 0 ? (
            perfiles.map((perfil) => (
              <div key={perfil.id} className="perfil-card-publico">
                <h3>{perfil.descripcion}</h3>

                <div className="perfil-bloque-hab">
                  <small>{t('detalleProyecto.habilidadesRequeridas')}</small>
                  <div className="chips-fila">
                    {perfil.habilidadesRequeridas.map((h) => (
                      <span key={h} className="chip-hab">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="perfil-bloque-hab">
                  <small>{t('detalleProyecto.habilidadesOpcionales')}</small>
                  <div className="chips-fila">
                    {perfil.habilidadesOpcionales.length > 0 ? (
                      perfil.habilidadesOpcionales.map((h) => (
                        <span key={h} className="chip-hab opcional">
                          {h}
                        </span>
                      ))
                    ) : (
                      <span className="texto-muted">{t('detalleProyecto.sinHabilidadesOpcionales')}</span>
                    )}
                  </div>
                </div>

                <div className="perfil-meta-tabla">
                  <div>
                    <span>{t('detalleProyecto.compromiso')}</span>{' '}
                    <strong>{resumenCompromiso(perfil.compromiso)}</strong>
                  </div>
                  <div>
                    <span>{t('detalleProyecto.modalidad')}</span>{' '}
                    <strong>{etiquetaModalidad(perfil.compromiso.tipoColaboracion)}</strong>
                  </div>
                  <div>
                    <span>{t('detalleProyecto.cupo')}</span>{' '}
                    <strong>{textoCupo(perfil.limiteColaboraciones)}</strong>
                  </div>
                </div>

                <Button variant="contained" fullWidth disabled={!busquedaVigente} sx={{ mt: 2 }}>
                  {busquedaVigente
                    ? t('detalleProyecto.postularme')
                    : t('detalleProyecto.busquedaCerradaBtn')}
                </Button>
              </div>
            ))
          ) : (
            <p className="texto-muted">{t('detalleProyecto.sinPerfiles')}</p>
          )}
        </div>
      </div>

      <div className="detalle-enlaces-externos" style={{ margin: '24px 0' }}>
        <h2>{t('detalleProyecto.seccionEnlaces')}</h2>
        {proyecto.enlaceSistema || proyecto.enlaceCodigoFuente ? (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {proyecto.enlaceSistema && (
              <Button
                variant="contained"
                href={proyecto.enlaceSistema}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('detalleProyecto.enlaceSistemaBtn')} {t('detalleProyecto.nuevaPestana')}
              </Button>
            )}
            {proyecto.enlaceCodigoFuente && (
              <Button
                variant="outlined"
                href={proyecto.enlaceCodigoFuente}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('detalleProyecto.enlaceRepoBtn')} {t('detalleProyecto.nuevaPestana')}
              </Button>
            )}
          </div>
        ) : (
          <p className="texto-muted">{t('detalleProyecto.sinEnlaces')}</p>
        )}
      </div>

      <div className="detalle-logros-seccion" style={{ marginTop: '32px' }}>
        <h2>{t('detalleProyecto.seccionLogros')}</h2>
        {logros.length === 0 ? (
          <p className="texto-muted">{t('detalleProyecto.sinLogros')}</p>
        ) : (
          <ul style={{ paddingLeft: '20px' }}>
            {logros.map((logro) => (
              <li key={logro.id} style={{ marginBottom: '12px' }}>
                <strong>{logro.titulo}</strong>
                {formatearFecha(logro.fecha) && <small> · {formatearFecha(logro.fecha)}</small>}
                <br />
                <span>{logro.descripcion}</span>
              </li>
            ))}
          </ul>
        )}

        {esDueño && (
          <form
            onSubmit={handleCrearLogro}
            noValidate
            style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}
          >
            <TextField
              size="small"
              label={t('detalleProyecto.labelLogroTitulo')}
              value={nuevoLogro.titulo}
              onChange={(e) => setNuevoLogro({ ...nuevoLogro, titulo: e.target.value })}
              disabled={guardandoLogro}
              fullWidth
            />
            <TextField
              size="small"
              label={t('detalleProyecto.labelLogroDescripcion')}
              value={nuevoLogro.descripcion}
              onChange={(e) => setNuevoLogro({ ...nuevoLogro, descripcion: e.target.value })}
              disabled={guardandoLogro}
              multiline
              minRows={2}
              fullWidth
            />
            {errorLogro && <Alert severity="error">{errorLogro}</Alert>}
            <div>
              <Button
                type="submit"
                variant="outlined"
                disabled={guardandoLogro}
                startIcon={guardandoLogro ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {t('detalleProyecto.btnAgregarLogro')}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Resumen de avance (lo ve cualquiera) */}
      <Dialog open={modalAvanceAbierto} onClose={() => setModalAvanceAbierto(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('detalleProyecto.modalAvanceTitulo')}</DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          <p style={{ margin: '0 0 8px' }}>{proyecto.titulo}</p>
          <h2 style={{ margin: '0 0 16px', fontSize: '24px' }}>
            {t('detalleProyecto.porcentajeCompletado', { porcentaje: avance })}
          </h2>
          <LinearProgress
            variant="determinate"
            value={avance}
            sx={{ mb: 3 }}
            aria-label={t('detalleProyecto.seccionAvance')}
          />
          <Button variant="outlined" onClick={() => setModalAvanceAbierto(false)} fullWidth>
            {t('detalleProyecto.volverAlDetalle')}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Actualizar avance (solo el colectivo dueño) */}
      <Dialog
        open={modalEditarAvance}
        onClose={() => !guardandoAvance && setModalEditarAvance(false)}
        maxWidth="xs"
        fullWidth
      >
        <form onSubmit={guardarAvance} noValidate>
          <DialogTitle>{t('detalleProyecto.modalEditarAvanceTitulo')}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              size="small"
              type="number"
              label={t('detalleProyecto.labelPorcentaje')}
              value={formAvance.porcentaje}
              onChange={(e) => setFormAvance({ ...formAvance, porcentaje: e.target.value })}
              error={Boolean(erroresAvance.porcentaje)}
              helperText={erroresAvance.porcentaje}
              disabled={guardandoAvance}
              inputProps={{ min: 0, max: 100 }}
              fullWidth
              sx={{ mt: 1 }}
            />
            <TextField
              size="small"
              label={t('detalleProyecto.labelEnlaceSistema')}
              value={formAvance.enlaceSistema}
              onChange={(e) => setFormAvance({ ...formAvance, enlaceSistema: e.target.value })}
              error={Boolean(erroresAvance.enlaceSistema)}
              helperText={erroresAvance.enlaceSistema || t('detalleProyecto.ayudaEnlace')}
              disabled={guardandoAvance}
              fullWidth
            />
            <TextField
              size="small"
              label={t('detalleProyecto.labelEnlaceRepo')}
              value={formAvance.enlaceCodigoFuente}
              onChange={(e) => setFormAvance({ ...formAvance, enlaceCodigoFuente: e.target.value })}
              error={Boolean(erroresAvance.enlaceCodigoFuente)}
              helperText={erroresAvance.enlaceCodigoFuente || t('detalleProyecto.ayudaEnlace')}
              disabled={guardandoAvance}
              fullWidth
            />
            {errorAvance && <Alert severity="error">{errorAvance}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalEditarAvance(false)} disabled={guardandoAvance}>
              {t('detalleProyecto.cancelar')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={guardandoAvance}
              startIcon={guardandoAvance ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {guardandoAvance ? t('detalleProyecto.guardando') : t('detalleProyecto.guardar')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Configurar búsqueda (solo el colectivo dueño) */}
      <Dialog
        open={modalBusquedaAbierto}
        onClose={() => !guardandoBusqueda && setModalBusquedaAbierto(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('detalleProyecto.modalBusquedaTitulo')}</DialogTitle>
        <DialogContent>
          <p style={{ margin: '0 0 8px', fontWeight: 600 }}>{proyecto.titulo}</p>
          <p style={{ margin: '0 0 16px', fontSize: 14 }}>
            {busquedaSwitch
              ? t('detalleProyecto.modalBusquedaSubActiva')
              : t('detalleProyecto.modalBusquedaSubInactiva')}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <strong style={{ display: 'block', fontSize: 14 }}>
                {t('formularioProyecto.labelBusquedaAbierta')}
              </strong>
              <span style={{ fontSize: 14 }}>
                {busquedaSwitch
                  ? t('formularioProyecto.estadoActivada')
                  : t('formularioProyecto.estadoDesactivada')}
              </span>
            </div>
            <Switch
              checked={busquedaSwitch}
              onChange={(e) => setBusquedaSwitch(e.target.checked)}
              disabled={guardandoBusqueda || esFinalizado}
              inputProps={{ 'aria-label': t('formularioProyecto.labelBusquedaAbierta') }}
            />
          </div>

          <TextField
            type="date"
            size="small"
            label={t('formularioProyecto.labelFechaLimite')}
            value={fechaBusqueda}
            onChange={(e) => setFechaBusqueda(e.target.value)}
            error={Boolean(errorFechaBusqueda)}
            helperText={
              errorFechaBusqueda ||
              (busquedaSwitch
                ? t('formularioProyecto.ayudaFechaLimiteActiva')
                : t('formularioProyecto.ayudaFechaLimiteInactiva'))
            }
            disabled={guardandoBusqueda || esFinalizado || !busquedaSwitch}
            InputLabelProps={{ shrink: true }}
            fullWidth
            sx={{ mt: 2 }}
          />

          {errorBusqueda && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errorBusqueda}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalBusquedaAbierto(false)} disabled={guardandoBusqueda}>
            {t('detalleProyecto.cancelar')}
          </Button>
          <Button
            variant="contained"
            onClick={guardarConfigBusqueda}
            disabled={guardandoBusqueda || esFinalizado}
            startIcon={guardandoBusqueda ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {guardandoBusqueda ? t('detalleProyecto.guardando') : t('detalleProyecto.guardar')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DetalleProyecto;