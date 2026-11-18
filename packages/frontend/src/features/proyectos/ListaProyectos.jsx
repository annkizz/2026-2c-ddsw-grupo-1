import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Snackbar,
  TextField,
} from '@mui/material';
import { FiPlus, FiEye, FiEdit2, FiCheck, FiInfo, FiLock, FiFolder } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth.jsx';
import { obtenerProyectos, cerrarProyecto } from '../../service/proyectosService';
import { t } from '../../i18n/t';
import { formatearFecha } from '../../utils/fechas';
import './ListaProyectos copy.css';

const filtros = [
  { labelKey: 'proyectos.todos', value: 'TODOS' },
  { labelKey: 'proyectos.activos', value: 'ACTIVO' },
  { labelKey: 'proyectos.finalizados', value: 'FINALIZADO' },
];

const estadoDe = (proyecto) => (proyecto.estado === 'FINALIZADO' ? 'FINALIZADO' : 'ACTIVO');

const ListaProyectos = () => {
  const { sesion, getAccessToken } = useAuth();
  const navigate = useNavigate();
  const idColectivo = sesion?.idColectivo;
  const esColectivo = Boolean(idColectivo);

  const [proyectos, setProyectos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [proyectoACerrar, setProyectoACerrar] = useState(null);
  const [cerrando, setCerrando] = useState(false);
  const [notificacion, setNotificacion] = useState({ mensaje: '', severidad: 'success' });

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');
    try {
      setProyectos(await obtenerProyectos());
    } catch (error) {
      setErrorCarga(error.response?.data?.error || t('proyectos.errorCarga'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Un colectivo con sesión ve los suyos; el resto ve todos
  const proyectosBase = useMemo(
    () => proyectos.filter((p) => !esColectivo || p.idColectivo === idColectivo),
    [proyectos, esColectivo, idColectivo],
  );

  const proyectosVisibles = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase('es');
    return proyectosBase.filter(
      (p) =>
        p.titulo.toLocaleLowerCase('es').includes(texto) &&
        (filtroEstado === 'TODOS' || estadoDe(p) === filtroEstado),
    );
  }, [proyectosBase, busqueda, filtroEstado]);

  const manejarCierreProyecto = async () => {
    if (!proyectoACerrar) return;
    setCerrando(true);
    try {
      const token = await getAccessToken();
      const actualizado = await cerrarProyecto(token, proyectoACerrar.id);
      setProyectos((actual) => actual.map((p) => (p.id === actualizado.id ? actualizado : p)));
      setProyectoACerrar(null);
      setNotificacion({ mensaje: t('proyectos.exitoCierre'), severidad: 'success' });
    } catch (error) {
      setNotificacion({
        mensaje: error.response?.data?.error || t('proyectos.errorCierre'),
        severidad: 'error',
      });
    } finally {
      setCerrando(false);
    }
  };

  const cerrarNotificacion = () => setNotificacion({ mensaje: '', severidad: 'success' });

  return (
    <div className="proyectos-contenedor">
      <div className="proyectos-intro">
        <div>
          <h1>{esColectivo ? t('proyectos.titulo') : t('proyectos.tituloPublico')}</h1>
          <p>{esColectivo ? t('proyectos.subtitulo') : t('proyectos.subtituloPublico')}</p>
        </div>
        {esColectivo && (
          <Button
            variant="contained"
            onClick={() => navigate('/proyectos/nuevo')}
            startIcon={<FiPlus />}
            className="proyectos-boton-crear"
          >
            {t('proyectos.crearProyecto')}
          </Button>
        )}
      </div>

      <div className="proyectos-filtros">
        <div className="proyectos-campo-busqueda">
          <label htmlFor="busqueda-titulo">{t('proyectos.buscarTitulo')}</label>
          <TextField
            id="busqueda-titulo"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={t('proyectos.placeholderBusqueda')}
            fullWidth
            size="small"
          />
        </div>
        <fieldset className="proyectos-grupo-estado">
          <legend>{t('proyectos.estado')}</legend>
          <div className="proyectos-opciones-estado">
            {filtros.map((filtro) => (
              <Button
                key={filtro.value}
                variant={filtroEstado === filtro.value ? 'contained' : 'outlined'}
                onClick={() => setFiltroEstado(filtro.value)}
                aria-pressed={filtroEstado === filtro.value}
                size="small"
              >
                {t(filtro.labelKey)}
              </Button>
            ))}
          </div>
        </fieldset>
      </div>

      {cargando ? (
        <div className="proyectos-mensaje-estado" role="status">
          <CircularProgress />
          <p>{t('proyectos.cargando')}</p>
        </div>
      ) : errorCarga ? (
        <div className="proyectos-mensaje-estado">
          <Alert severity="error">{errorCarga}</Alert>
          <Button variant="outlined" onClick={cargarDatos} sx={{ mt: 2 }}>
            {t('proyectos.reintentar')}
          </Button>
        </div>
      ) : proyectosBase.length === 0 ? (
        <div className="proyectos-mensaje-estado">
          <p>
            <strong>{esColectivo ? t('proyectos.sinProyectos') : t('proyectos.sinResultados')}</strong>
          </p>
          {esColectivo && (
            <>
              <p>{t('proyectos.sinProyectosSub')}</p>
              <Button variant="contained" onClick={() => navigate('/proyectos/nuevo')}>
                {t('proyectos.crearProyecto')}
              </Button>
            </>
          )}
        </div>
      ) : (
        <>
          <p className="proyectos-conteo" aria-live="polite">
            {proyectosVisibles.length === 1
              ? t('proyectos.unProyecto')
              : t('proyectos.variosProyectos', { cantidad: proyectosVisibles.length })}
          </p>

          {proyectosVisibles.length === 0 ? (
            <div className="proyectos-mensaje-estado">
              <p>{t('proyectos.sinResultados')}</p>
            </div>
          ) : (
            <div className="proyectos-grid">
              {proyectosVisibles.map((proyecto) => {
                const esFinalizado = estadoDe(proyecto) === 'FINALIZADO';
                const avance = Math.min(100, Math.max(0, Number(proyecto.porcentajeConcrecion) || 0));
                const cierre = formatearFecha(proyecto.fechaLimiteCierre);
                const esDueño = esColectivo && proyecto.idColectivo === idColectivo;

                return (
                  <div key={proyecto.id} className="proyecto-card">
                    <span className={`proyecto-badge ${esFinalizado ? 'finalizado' : 'activo'}`}>
                      {esFinalizado ? <FiCheck /> : <FiInfo />}
                      {esFinalizado ? t('proyectos.finalizado') : t('proyectos.activo')}
                    </span>
                    <h2>{proyecto.titulo}</h2>
                    <div className="proyecto-progreso-seccion">
                      <div className="proyecto-progreso-cabecera">
                        <span>{t('proyectos.avance')}</span>
                        <span>{avance} %</span>
                      </div>
                      <LinearProgress
                        variant="determinate"
                        value={avance}
                        aria-label={t('proyectos.avance')}
                      />
                    </div>
                    <div className="proyecto-meta">
                      <div>
                        {proyecto.busquedaVigente ? <FiFolder /> : <FiLock />}
                        <span>
                          {proyecto.busquedaVigente
                            ? t('proyectos.busquedaAbierta')
                            : t('proyectos.busquedaCerrada')}
                        </span>
                      </div>
                      <small>
                        {esFinalizado
                          ? t('proyectos.proyectoFinalizado')
                          : cierre
                          ? t('proyectos.cierreProgramado', { fecha: cierre })
                          : t('proyectos.sinCierreProgramado')}
                      </small>
                    </div>
                    <div className="proyecto-acciones">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/proyectos/${proyecto.id}`)}
                        startIcon={<FiEye />}
                      >
                        {t('proyectos.ver')}
                      </Button>
                      {esDueño && (
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => navigate(`/proyectos/${proyecto.id}/editar`)}
                          startIcon={<FiEdit2 />}
                        >
                          {t('proyectos.editar')}
                        </Button>
                      )}
                      {esDueño && !esFinalizado && (
                        <Button
                          variant="text"
                          size="small"
                          color="error"
                          onClick={() => setProyectoACerrar(proyecto)}
                        >
                          {t('proyectos.cerrarProyecto')}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <Dialog open={Boolean(proyectoACerrar)} onClose={() => !cerrando && setProyectoACerrar(null)}>
        <DialogTitle>{t('proyectos.modalCerrarTitulo')}</DialogTitle>
        <DialogContent>
          <p>
            {proyectoACerrar ? t('proyectos.mensajeCerrar', { titulo: proyectoACerrar.titulo }) : ''}
          </p>
          <p>
            <strong>{t('proyectos.advertenciaPermanente')}</strong>
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProyectoACerrar(null)} disabled={cerrando}>
            {t('proyectos.cancelar')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={manejarCierreProyecto}
            disabled={cerrando}
            startIcon={cerrando ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {cerrando ? t('proyectos.cerrando') : t('proyectos.cerrarProyecto')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(notificacion.mensaje)}
        autoHideDuration={4500}
        onClose={cerrarNotificacion}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={cerrarNotificacion} severity={notificacion.severidad} variant="filled">
          {notificacion.mensaje}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ListaProyectos;