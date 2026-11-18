import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
} from '@mui/material';
import { FiArrowLeft, FiPlus, FiTrash2, FiEdit2, FiX, FiCheck, FiLock } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth.jsx';
import {
  obtenerProyectoPorId,
  obtenerPerfiles,
  crearPerfil,
  actualizarPerfil,
  eliminarPerfil,
} from '../../service/proyectosService';
import { obtenerHabilidades } from '../../service/habilidadesService';
import { t } from '../../i18n/t';
import {
  TIPOS_COMPROMISO,
  MODALIDADES,
  resumenCompromiso,
  etiquetaModalidad,
  textoCupo,
} from '../../utils/perfiles';
import './PerfilesProyecto.css';

const PERFIL_VACIO = {
  descripcion: '',
  habilidadesRequeridas: [],
  habilidadesOpcionales: [],
  tipoCompromiso: 'MENSUALES',
  horas: '',
  tipoColaboracion: 'GRATUITA',
  limiteColaboraciones: '',
};

const PerfilesProyecto = () => {
  const { id } = useParams();
  const { sesion, getAccessToken } = useAuth();

  const [proyecto, setProyecto] = useState(null);
  const [perfiles, setPerfiles] = useState([]);
  const [habilidades, setHabilidades] = useState([]);
  const [errorHabilidades, setErrorHabilidades] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [perfilEditandoId, setPerfilEditandoId] = useState(null);
  const [form, setForm] = useState(PERFIL_VACIO);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState('');
  const [perfilAEliminar, setPerfilAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');
  const [alertaExito, setAlertaExito] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga(false);
    try {
      const [dataProyecto, dataPerfiles] = await Promise.all([
        obtenerProyectoPorId(id),
        obtenerPerfiles(id),
      ]);
      setProyecto(dataProyecto);
      setPerfiles(dataPerfiles);
    } catch (e) {
      setErrorCarga(true);
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    obtenerHabilidades()
      .then((lista) =>
        setHabilidades(
          lista.map((h) => (typeof h === 'string' ? h : h.titulo)).filter(Boolean),
        ),
      )
      .catch(() => setErrorHabilidades(true));
  }, []);

  const recargarPerfiles = async () => setPerfiles(await obtenerPerfiles(id));

  const abrirModalCrear = () => {
    setPerfilEditandoId(null);
    setForm(PERFIL_VACIO);
    setErrores({});
    setErrorGuardar('');
    setModalAbierto(true);
  };

  const abrirModalEditar = (perfil) => {
    setPerfilEditandoId(perfil.id);
    setForm({
      descripcion: perfil.descripcion,
      habilidadesRequeridas: perfil.habilidadesRequeridas,
      habilidadesOpcionales: perfil.habilidadesOpcionales,
      tipoCompromiso: perfil.compromiso.tipoCompromiso,
      horas: String(perfil.compromiso.horas),
      tipoColaboracion: perfil.compromiso.tipoColaboracion,
      limiteColaboraciones: perfil.limiteColaboraciones ? String(perfil.limiteColaboraciones) : '',
    });
    setErrores({});
    setErrorGuardar('');
    setModalAbierto(true);
  };

  const validar = () => {
    const errs = {};
    if (!form.descripcion.trim()) errs.descripcion = t('perfilesProyecto.errDescripcion');
    if (form.habilidadesRequeridas.length === 0) {
      errs.habilidadesRequeridas = t('perfilesProyecto.errHabilidadesRequeridas');
    }
    const horas = Number(form.horas);
    if (!form.horas || !Number.isInteger(horas) || horas < 1) {
      errs.horas = t('perfilesProyecto.errHoras');
    }
    if (form.limiteColaboraciones !== '') {
      const limite = Number(form.limiteColaboraciones);
      if (!Number.isInteger(limite) || limite < 1) {
        errs.limiteColaboraciones = t('perfilesProyecto.errLimite');
      }
    }
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const guardarPerfil = async (e) => {
    e.preventDefault();
    if (!validar()) return;

    setGuardando(true);
    setErrorGuardar('');
    try {
      const token = await getAccessToken();
      const payload = {
        descripcion: form.descripcion.trim(),
        habilidadesRequeridas: form.habilidadesRequeridas,
        habilidadesOpcionales: form.habilidadesOpcionales,
        compromiso: {
          tipoCompromiso: form.tipoCompromiso,
          horas: Number(form.horas),
          tipoColaboracion: form.tipoColaboracion,
        },
        // Sin límite: el campo no se manda
        ...(form.limiteColaboraciones !== ''
          ? { limiteColaboraciones: Number(form.limiteColaboraciones) }
          : {}),
      };

      if (perfilEditandoId) {
        await actualizarPerfil(token, id, perfilEditandoId, payload);
        setAlertaExito(t('perfilesProyecto.exitoEditado'));
      } else {
        await crearPerfil(token, id, payload);
        setAlertaExito(t('perfilesProyecto.exitoAgregado'));
      }

      setModalAbierto(false);
      setForm(PERFIL_VACIO);
      setPerfilEditandoId(null);
      await recargarPerfiles();
    } catch (err) {
      setErrorGuardar(err.response?.data?.error || t('perfilesProyecto.errorGuardar'));
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminacion = async () => {
    if (!perfilAEliminar) return;
    setEliminando(true);
    setErrorEliminar('');
    try {
      const token = await getAccessToken();
      await eliminarPerfil(token, id, perfilAEliminar.id);
      setPerfilAEliminar(null);
      setAlertaExito(t('perfilesProyecto.exitoEliminado'));
      await recargarPerfiles();
    } catch (err) {
      setErrorEliminar(err.response?.data?.error || t('perfilesProyecto.errorEliminar'));
    } finally {
      setEliminando(false);
    }
  };

  if (cargando) {
    return (
      <div className="perfiles-estado" role="status">
        <CircularProgress />
      </div>
    );
  }

  if (errorCarga || !proyecto) {
    return (
      <div className="perfiles-contenedor">
        <Link to={`/proyectos/${id}`} className="perfiles-volver">
          <FiArrowLeft /> <span>{t('perfilesProyecto.volverAlProyecto')}</span>
        </Link>
        <Alert severity="error">{t('perfilesProyecto.errorCarga')}</Alert>
        <Button variant="outlined" onClick={cargar} sx={{ mt: 2 }}>
          {t('perfilesProyecto.reintentar')}
        </Button>
      </div>
    );
  }

  const esOtroColectivo = sesion?.idColectivo && proyecto.idColectivo !== sesion.idColectivo;
  if (esOtroColectivo) {
    return (
      <div className="perfiles-contenedor">
        <Link to={`/proyectos/${id}`} className="perfiles-volver">
          <FiArrowLeft /> <span>{t('perfilesProyecto.volverAlProyecto')}</span>
        </Link>
        <Alert severity="info" icon={<FiLock />}>
          {t('perfilesProyecto.soloDueno')}
        </Alert>
      </div>
    );
  }

  return (
    <div className="perfiles-contenedor">
      <Link to={`/proyectos/${id}`} className="perfiles-volver">
        <FiArrowLeft /> <span>{t('perfilesProyecto.volverAlProyecto')}</span>
      </Link>

      <div className="perfiles-header">
        <div>
          <h1>{t('perfilesProyecto.titulo')}</h1>
          <p className="perfiles-proyecto-nombre">{proyecto.titulo}</p>
          <small>{t('perfilesProyecto.subtitulo')}</small>
        </div>
        <Button variant="contained" onClick={abrirModalCrear} startIcon={<FiPlus />}>
          {t('perfilesProyecto.agregarPerfilBtn')}
        </Button>
      </div>

      {alertaExito && (
        <Alert severity="success" icon={<FiCheck />} sx={{ mb: 3 }} onClose={() => setAlertaExito('')}>
          {alertaExito}
        </Alert>
      )}

      {perfiles.length === 0 ? (
        <p className="texto-muted">{t('perfilesProyecto.sinPerfiles')}</p>
      ) : (
        <div className="perfiles-grid">
          {perfiles.map((perfil) => (
            <div key={perfil.id} className="perfil-card-admin">
              <h3>{perfil.descripcion}</h3>

              <div className="perfil-bloque">
                <small>{t('perfilesProyecto.requeridasObligatorio')}</small>
                <div className="chips-fila">
                  {perfil.habilidadesRequeridas.map((h) => (
                    <span key={h} className="chip-hab">
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              <div className="perfil-bloque">
                <small>{t('perfilesProyecto.opcionalesOpcional')}</small>
                <div className="chips-fila">
                  {perfil.habilidadesOpcionales.length > 0 ? (
                    perfil.habilidadesOpcionales.map((h) => (
                      <span key={h} className="chip-hab opcional">
                        {h}
                      </span>
                    ))
                  ) : (
                    <span className="texto-muted">{t('perfilesProyecto.ayudaOpcionales')}</span>
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

              <div className="perfil-acciones-card">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FiEdit2 />}
                  onClick={() => abrirModalEditar(perfil)}
                >
                  {t('perfilesProyecto.editar')}
                </Button>
                <Button
                  variant="text"
                  size="small"
                  color="error"
                  startIcon={<FiTrash2 />}
                  onClick={() => {
                    setErrorEliminar('');
                    setPerfilAEliminar(perfil);
                  }}
                >
                  {t('perfilesProyecto.eliminar')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Agregar / editar perfil */}
      <Dialog
        open={modalAbierto}
        onClose={() => !guardando && setModalAbierto(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="modal-titulo-flex">
          <h2>
            {perfilEditandoId
              ? t('perfilesProyecto.modalEditarTitulo')
              : t('perfilesProyecto.modalAgregarTitulo')}
          </h2>
          <IconButton
            onClick={() => setModalAbierto(false)}
            disabled={guardando}
            aria-label={t('perfilesProyecto.cerrar')}
          >
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <form onSubmit={guardarPerfil} className="modal-formulario" noValidate>
            <TextField
              label={t('perfilesProyecto.labelDescripcion')}
              placeholder={t('perfilesProyecto.placeholderDescripcion')}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              error={Boolean(errores.descripcion)}
              helperText={errores.descripcion}
              disabled={guardando}
              fullWidth
              size="small"
            />

            {errorHabilidades && (
              <Alert severity="warning">{t('perfilesProyecto.errorHabilidades')}</Alert>
            )}

            <Autocomplete
              multiple
              filterSelectedOptions
              options={habilidades.filter((h) => !form.habilidadesOpcionales.includes(h))}
              value={form.habilidadesRequeridas}
              onChange={(_, valor) => setForm({ ...form, habilidadesRequeridas: valor })}
              disabled={guardando}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label={t('perfilesProyecto.requeridasObligatorio')}
                  placeholder={t('perfilesProyecto.placeholderHabilidades')}
                  error={Boolean(errores.habilidadesRequeridas)}
                  helperText={errores.habilidadesRequeridas}
                />
              )}
            />

            <Autocomplete
              multiple
              filterSelectedOptions
              options={habilidades.filter((h) => !form.habilidadesRequeridas.includes(h))}
              value={form.habilidadesOpcionales}
              onChange={(_, valor) => setForm({ ...form, habilidadesOpcionales: valor })}
              disabled={guardando}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label={t('perfilesProyecto.opcionalesOpcional')}
                  placeholder={t('perfilesProyecto.placeholderHabilidades')}
                  helperText={t('perfilesProyecto.ayudaOpcionales')}
                />
              )}
            />

            <div className="form-row-2">
              <TextField
                select
                label={t('perfilesProyecto.tipoCompromiso')}
                value={form.tipoCompromiso}
                onChange={(e) => setForm({ ...form, tipoCompromiso: e.target.value })}
                disabled={guardando}
                size="small"
              >
                {TIPOS_COMPROMISO.map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>
                    {t(`enumeraciones.tipoCompromiso.${tipo}`)}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                type="number"
                label={t('perfilesProyecto.cantidadHoras')}
                value={form.horas}
                onChange={(e) => setForm({ ...form, horas: e.target.value })}
                error={Boolean(errores.horas)}
                helperText={errores.horas || t('perfilesProyecto.ayudaHoras')}
                disabled={guardando}
                size="small"
                inputProps={{ min: 1, step: 1 }}
              />
            </div>

            <TextField
              select
              label={t('perfilesProyecto.modalidadColaboracion')}
              value={form.tipoColaboracion}
              onChange={(e) => setForm({ ...form, tipoColaboracion: e.target.value })}
              disabled={guardando}
              size="small"
              fullWidth
            >
              {MODALIDADES.map((modalidad) => (
                <MenuItem key={modalidad} value={modalidad}>
                  {etiquetaModalidad(modalidad)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              type="number"
              label={t('perfilesProyecto.limiteColaboraciones')}
              value={form.limiteColaboraciones}
              onChange={(e) => setForm({ ...form, limiteColaboraciones: e.target.value })}
              error={Boolean(errores.limiteColaboraciones)}
              helperText={errores.limiteColaboraciones || t('perfilesProyecto.ayudaCupo')}
              disabled={guardando}
              size="small"
              fullWidth
              inputProps={{ min: 1, step: 1 }}
            />

            {errorGuardar && <Alert severity="error">{errorGuardar}</Alert>}

            <div className="modal-acciones">
              <Button onClick={() => setModalAbierto(false)} disabled={guardando}>
                {t('perfilesProyecto.cancelar')}
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={guardando}
                startIcon={guardando ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {guardando
                  ? t('perfilesProyecto.guardando')
                  : errorGuardar
                  ? t('perfilesProyecto.reintentar')
                  : t('perfilesProyecto.guardarPerfil')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmar eliminación */}
      <Dialog
        open={Boolean(perfilAEliminar)}
        onClose={() => !eliminando && setPerfilAEliminar(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('perfilesProyecto.modalEliminarTitulo')}</DialogTitle>
        <DialogContent>
          <p style={{ margin: 0 }}>{t('perfilesProyecto.mensajeEliminar')}</p>
          {errorEliminar && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errorEliminar}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPerfilAEliminar(null)} disabled={eliminando}>
            {t('perfilesProyecto.cancelar')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmarEliminacion}
            disabled={eliminando}
            startIcon={eliminando ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {eliminando ? t('perfilesProyecto.eliminando') : t('perfilesProyecto.confirmarEliminar')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PerfilesProyecto;