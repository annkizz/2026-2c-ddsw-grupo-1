import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Alert, Button, CircularProgress, MenuItem, Switch, TextField } from '@mui/material';
import { FiArrowLeft, FiAlertCircle, FiCheck, FiLock } from 'react-icons/fi';
import CustomSelect from '../../components/CustomSelect/CustomSelect';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useListado } from '../../hooks/useListado';
import { PROVINCIAS } from '../../data/provincias';
import {
  crearProyecto,
  actualizarProyecto,
  obtenerProyectoPorId,
  configurarBusqueda,
  programarCierre,
} from '../../service/proyectos';
import { t } from '../../i18n/t';
import { ETIQUETAS_MAX, etiquetaLegible } from '../../utils/etiquetas';
import { aInputFecha, aIso, esFechaFutura } from '../../utils/fechas';
import './FormularioProyecto.css';

const DATOS_INICIALES = {
  titulo: '',
  descripcion: '',
  etiquetas: [],
  provincia: '',
  ciudad: '',
  fechaLimiteCierre: '',
  busquedaAbierta: false,
  fechaLimiteBusqueda: '',
};

const FormularioProyecto = () => {
  const { id } = useParams(); // si hay id, estamos editando
  const esEdicion = Boolean(id);
  const navigate = useNavigate();
  const { sesion, getAccessToken } = useAuth();

  const [datos, setDatos] = useState(DATOS_INICIALES);
  const [inicial, setInicial] = useState(null);
  const [esFinalizado, setEsFinalizado] = useState(false);
  const [errores, setErrores] = useState({});
  const [cargandoInicial, setCargandoInicial] = useState(esEdicion);
  const [guardando, setGuardando] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [errorServidor, setErrorServidor] = useState('');
  const etiquetasState = useListado('/etiquetas');

  useEffect(() => {
    if (!esEdicion) return;

    const cargar = async () => {
      setCargandoInicial(true);
      try {
        const proyecto = await obtenerProyectoPorId(id);
        const cargados = {
          titulo: proyecto.titulo || '',
          descripcion: proyecto.descripcion || '',
          etiquetas: proyecto.etiquetas ?? [],
          provincia: proyecto.ubicacion?.codigoProvincia ?? '',
          ciudad: proyecto.ubicacion?.ciudad ?? '',
          fechaLimiteCierre: aInputFecha(proyecto.fechaLimiteCierre),
          busquedaAbierta: Boolean(proyecto.busquedaAbierta),
          fechaLimiteBusqueda: aInputFecha(proyecto.fechaLimiteBusqueda),
        };
        setDatos(cargados);
        setInicial(cargados);
        setEsFinalizado(proyecto.estado === 'FINALIZADO');
      } catch (err) {
        setErrorServidor(err.response?.data?.error || t('formularioProyecto.errorCargarProyecto'));
      } finally {
        setCargandoInicial(false);
      }
    };

    cargar();
  }, [id, esEdicion]);

  // En edición, una fecha que no tocaste no se vuelve a validar
  const cambio = (campo) => !inicial || datos[campo] !== inicial[campo];

  const cambiarCampo = (campo, valor) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: '' }));
    if (errorServidor) setErrorServidor('');
  };

  const alternarEtiqueta = (etiqueta) => {
    setDatos((prev) => ({
      ...prev,
      etiquetas: prev.etiquetas.includes(etiqueta)
        ? prev.etiquetas.filter((una) => una !== etiqueta)
        : [...prev.etiquetas, etiqueta],
    }));
    if (errorServidor) setErrorServidor('');
  };

  const cambiarProvincia = (e) => {
    const provincia = e.target.value;
    setDatos((prev) => ({
      ...prev,
      provincia,
      ciudad: provincia ? prev.ciudad : '',
    }));
    if (errorServidor) setErrorServidor('');
  };

  const mensajeDeError = (campo) => {
    if (campo === 'titulo' && !datos.titulo.trim()) return t('formularioProyecto.errTituloVacio');
    if (campo === 'descripcion' && !datos.descripcion.trim()) {
      return t('formularioProyecto.errDescripcionVacia');
    }
    if (campo === 'fechaLimiteCierre' && datos.fechaLimiteCierre) {
      if (cambio('fechaLimiteCierre') && !esFechaFutura(datos.fechaLimiteCierre)) {
        return t('formularioProyecto.errFechaPasada');
      }
    }
    if (campo === 'fechaLimiteBusqueda' && datos.fechaLimiteBusqueda) {
      if (!datos.busquedaAbierta) return t('formularioProyecto.errFechaSinBusqueda');
      if (cambio('fechaLimiteBusqueda') && !esFechaFutura(datos.fechaLimiteBusqueda)) {
        return t('formularioProyecto.errFechaPasada');
      }
    }
    return '';
  };

  const validarCampoIndividual = (campo) => {
    setErrores((prev) => ({ ...prev, [campo]: mensajeDeError(campo) }));
  };

  const validarFormularioCompleto = () => {
    const nuevosErrores = {};
    ['titulo', 'descripcion', 'fechaLimiteCierre', 'fechaLimiteBusqueda'].forEach((campo) => {
      const mensaje = mensajeDeError(campo);
      if (mensaje) nuevosErrores[campo] = mensaje;
    });
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarSwitchBusqueda = (e) => {
    const activada = e.target.checked;
    setDatos((prev) => ({ ...prev, busquedaAbierta: activada }));

    if (activada && errores.fechaLimiteBusqueda === t('formularioProyecto.errFechaSinBusqueda')) {
      setErrores((prev) => ({ ...prev, fechaLimiteBusqueda: '' }));
    }
    if (!activada && datos.fechaLimiteBusqueda) {
      setErrores((prev) => ({
        ...prev,
        fechaLimiteBusqueda: t('formularioProyecto.errFechaSinBusqueda'),
      }));
    }
  };

  const opcionesEtiquetas = etiquetasState.datos.map((etiqueta) => ({
    valor: etiqueta,
    etiqueta: etiquetaLegible(etiqueta),
  }));

  const guardar = async (e) => {
    e.preventDefault();
    if (!validarFormularioCompleto()) return;

    setGuardando(true);
    setErrorServidor('');
    try {
      const token = await getAccessToken();
      const titulo = datos.titulo.trim();
      const descripcion = datos.descripcion.trim();
      const fechaCierre = datos.fechaLimiteCierre ? aIso(datos.fechaLimiteCierre) : null;
      const fechaBusqueda =
        datos.busquedaAbierta && datos.fechaLimiteBusqueda ? aIso(datos.fechaLimiteBusqueda) : null;
      const ubicacion = datos.provincia
        ? {
            provincia: datos.provincia,
            ...(datos.ciudad.trim() ? { ciudad: datos.ciudad.trim() } : {}),
          }
        : undefined;

      if (esEdicion) {
        await actualizarProyecto(token, id, {
          titulo,
          descripcion,
          etiquetas: datos.etiquetas,
        });

        if (!esFinalizado && (cambio('busquedaAbierta') || cambio('fechaLimiteBusqueda'))) {
          await configurarBusqueda(token, id, {
            busquedaAbierta: datos.busquedaAbierta,
            ...(fechaBusqueda ? { fechaLimiteBusqueda: fechaBusqueda } : {}),
          });
        }
        if (!esFinalizado && fechaCierre && cambio('fechaLimiteCierre')) {
          await programarCierre(token, id, fechaCierre);
        }
        setInicial(datos);
      } else {
        // Los campos vacíos NO se mandan: un null se interpreta como 1970 y da error
        await crearProyecto(token, {
          idColectivo: sesion?.idColectivo,
          titulo,
          descripcion,
          ...(datos.etiquetas.length > 0 ? { etiquetas: datos.etiquetas } : {}),
          ...(ubicacion ? { ubicacion } : {}),
          busquedaAbierta: datos.busquedaAbierta,
          ...(fechaCierre ? { fechaLimiteCierre: fechaCierre } : {}),
          ...(fechaBusqueda ? { fechaLimiteBusqueda: fechaBusqueda } : {}),
        });
      }

      setGuardadoExitoso(true);
    } catch (err) {
      setErrorServidor(
        err.response?.data?.error ||
          (esEdicion ? t('formularioProyecto.errorEditar') : t('formularioProyecto.errorCrear')),
      );
    } finally {
      setGuardando(false);
    }
  };

  if (cargandoInicial) {
    return (
      <div className="form-proyecto-cargando" role="status">
        <CircularProgress />
      </div>
    );
  }

  const camposBloqueados = guardando || guardadoExitoso;

  return (
    <div className="form-proyecto-contenedor">
      <Link to="/proyectos" className="form-proyecto-volver">
        <FiArrowLeft />
        <span>{t('formularioProyecto.volver')}</span>
      </Link>

      <header className="form-proyecto-cabecera">
        <h1>
          {esEdicion ? t('formularioProyecto.tituloEditar') : t('formularioProyecto.tituloCrear')}
        </h1>
        <p>{t('formularioProyecto.subtitulo')}</p>
      </header>

      {guardadoExitoso && (
        <Alert severity="success" icon={<FiCheck />} className="form-proyecto-banner">
          {esEdicion ? t('formularioProyecto.exitoEditar') : t('formularioProyecto.exitoCrear')}
        </Alert>
      )}

      <form onSubmit={guardar} noValidate>
        <div className="form-proyecto-grid">
          <section className="form-proyecto-card">
            <h2>{t('formularioProyecto.cardDatos')}</h2>
            <p className="form-proyecto-card-sub">{t('formularioProyecto.subtituloDatos')}</p>

            <div className="form-proyecto-campo">
              <label htmlFor="proyecto-titulo">{t('formularioProyecto.labelTitulo')}</label>
              <TextField
                id="proyecto-titulo"
                placeholder={t('formularioProyecto.placeholderTitulo')}
                value={datos.titulo}
                onChange={(e) => cambiarCampo('titulo', e.target.value)}
                onBlur={() => validarCampoIndividual('titulo')}
                error={Boolean(errores.titulo)}
                disabled={camposBloqueados}
                fullWidth
                size="small"
                InputProps={{
                  endAdornment: guardadoExitoso ? <FiLock className="icono-bloqueado" /> : null,
                }}
              />
              {errores.titulo && (
                <span className="form-proyecto-error">
                  <FiAlertCircle /> {errores.titulo}
                </span>
              )}
            </div>

            <div className="form-proyecto-campo">
              <label htmlFor="proyecto-descripcion">{t('formularioProyecto.labelDescripcion')}</label>
              <TextField
                id="proyecto-descripcion"
                placeholder={t('formularioProyecto.placeholderDescripcion')}
                value={datos.descripcion}
                onChange={(e) => cambiarCampo('descripcion', e.target.value)}
                onBlur={() => validarCampoIndividual('descripcion')}
                error={Boolean(errores.descripcion)}
                disabled={camposBloqueados}
                multiline
                minRows={6}
                fullWidth
              />
              {errores.descripcion && (
                <span className="form-proyecto-error">
                  <FiAlertCircle /> {errores.descripcion}
                </span>
              )}
            </div>

            <div className="form-proyecto-campo">
              <CustomSelect
                id="proyecto-etiquetas"
                etiqueta={t('formularioProyecto.labelEtiquetas')}
                opciones={opcionesEtiquetas}
                seleccion={datos.etiquetas}
                multiple
                maxSeleccion={ETIQUETAS_MAX}
                permiteCrear
                onSeleccionar={alternarEtiqueta}
                onQuitar={alternarEtiqueta}
                placeholder={
                  etiquetasState.cargando
                    ? t('formularioProyecto.cargandoEtiquetas')
                    : t('formularioProyecto.placeholderEtiquetas')
                }
                textoVacio={
                  etiquetasState.cargando
                    ? t('formularioProyecto.cargandoEtiquetas')
                    : t('formularioProyecto.textoVacioEtiquetas')
                }
              />
              {etiquetasState.error && (
                <Alert severity="warning" className="form-proyecto-aviso-etiquetas">
                  {t('formularioProyecto.errorEtiquetas')}
                  <Button size="small" onClick={etiquetasState.recargar}>
                    {t('formularioProyecto.reintentar')}
                  </Button>
                </Alert>
              )}
              <small className="form-proyecto-ayuda">
                {t('formularioProyecto.ayudaEtiquetas')}
              </small>
            </div>

            {!esEdicion && (
              <>
                <div className="form-proyecto-ubicacion">
                  <div className="form-proyecto-campo">
                    <label htmlFor="proyecto-provincia">
                      {t('formularioProyecto.labelProvincia')}
                    </label>
                    <TextField
                      id="proyecto-provincia"
                      select
                      value={datos.provincia}
                      onChange={cambiarProvincia}
                      disabled={camposBloqueados}
                      fullWidth
                      size="small"
                      SelectProps={{ displayEmpty: true }}
                    >
                      <MenuItem value="">
                        {t('formularioProyecto.opcionProvinciaHeredada')}
                      </MenuItem>
                      {PROVINCIAS.map(({ codigo, nombre }) => (
                        <MenuItem key={codigo} value={codigo}>
                          {nombre}
                        </MenuItem>
                      ))}
                    </TextField>
                  </div>

                  <div className="form-proyecto-campo">
                    <label htmlFor="proyecto-ciudad">
                      {t('formularioProyecto.labelCiudad')}
                    </label>
                    <TextField
                      id="proyecto-ciudad"
                      placeholder={t('formularioProyecto.placeholderCiudad')}
                      value={datos.ciudad}
                      onChange={(e) => cambiarCampo('ciudad', e.target.value)}
                      disabled={camposBloqueados || !datos.provincia}
                      fullWidth
                      size="small"
                    />
                  </div>
                </div>
                <small className="form-proyecto-ayuda">
                  {t('formularioProyecto.ayudaUbicacion')}
                </small>
              </>
            )}
          </section>

          <div className="form-proyecto-columna-derecha">
            <section className="form-proyecto-card">
              <h2>{t('formularioProyecto.cardCierre')}</h2>

              <div className="form-proyecto-campo">
                <label htmlFor="proyecto-cierre">{t('formularioProyecto.labelFechaCierre')}</label>
                <TextField
                  id="proyecto-cierre"
                  type="date"
                  value={datos.fechaLimiteCierre}
                  onChange={(e) => cambiarCampo('fechaLimiteCierre', e.target.value)}
                  onBlur={() => validarCampoIndividual('fechaLimiteCierre')}
                  error={Boolean(errores.fechaLimiteCierre)}
                  disabled={camposBloqueados || esFinalizado}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
                {errores.fechaLimiteCierre ? (
                  <span className="form-proyecto-error">
                    <FiAlertCircle /> {errores.fechaLimiteCierre}
                  </span>
                ) : (
                  <small className="form-proyecto-ayuda">{t('formularioProyecto.ayudaFechaCierre')}</small>
                )}
              </div>
            </section>

            <section className="form-proyecto-card">
              <h2>{t('formularioProyecto.cardBusqueda')}</h2>

              {esFinalizado && (
                <Alert severity="info" className="form-proyecto-aviso-finalizado">
                  {t('formularioProyecto.avisoFinalizado')}
                </Alert>
              )}

              <div className="form-proyecto-switch-fila">
                <div>
                  <strong>{t('formularioProyecto.labelBusquedaAbierta')}</strong>
                  <span className="form-proyecto-switch-estado">
                    {datos.busquedaAbierta
                      ? t('formularioProyecto.estadoActivada')
                      : t('formularioProyecto.estadoDesactivada')}
                  </span>
                </div>
                <div className="form-proyecto-switch-control">
                  {esFinalizado && <FiLock className="icono-bloqueado" />}
                  <Switch
                    checked={datos.busquedaAbierta}
                    onChange={manejarSwitchBusqueda}
                    disabled={camposBloqueados || esFinalizado}
                    color="primary"
                    inputProps={{ 'aria-label': t('formularioProyecto.labelBusquedaAbierta') }}
                  />
                </div>
              </div>

              <small className="form-proyecto-ayuda">{t('formularioProyecto.ayudaBusqueda')}</small>

              <div className="form-proyecto-campo" style={{ marginTop: 16 }}>
                <label htmlFor="proyecto-limite-busqueda">{t('formularioProyecto.labelFechaLimite')}</label>
                <TextField
                  id="proyecto-limite-busqueda"
                  type="date"
                  value={datos.fechaLimiteBusqueda}
                  onChange={(e) => cambiarCampo('fechaLimiteBusqueda', e.target.value)}
                  onBlur={() => validarCampoIndividual('fechaLimiteBusqueda')}
                  error={Boolean(errores.fechaLimiteBusqueda)}
                  disabled={
                    camposBloqueados ||
                    esFinalizado ||
                    (!datos.busquedaAbierta && !datos.fechaLimiteBusqueda)
                  }
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
                {errores.fechaLimiteBusqueda ? (
                  <>
                    <small className="form-proyecto-ayuda">
                      {t('formularioProyecto.ayudaFechaLimiteConservar')}
                    </small>
                    <span className="form-proyecto-error">
                      <FiAlertCircle /> {errores.fechaLimiteBusqueda}
                    </span>
                  </>
                ) : (
                  <small className="form-proyecto-ayuda">
                    {esFinalizado
                      ? t('formularioProyecto.ayudaNoDisponibleFinalizado')
                      : datos.busquedaAbierta
                      ? t('formularioProyecto.ayudaFechaLimiteActiva')
                      : t('formularioProyecto.ayudaFechaLimiteInactiva')}
                  </small>
                )}
              </div>
            </section>
          </div>
        </div>

        {errorServidor && (
          <Alert severity="error" className="form-proyecto-banner-error">
            {errorServidor}
          </Alert>
        )}

        <div className="form-proyecto-acciones">
          {guardadoExitoso ? (
            <Button
              variant="contained"
              onClick={() => navigate('/proyectos')}
              className="form-proyecto-btn-primario"
            >
              {t('formularioProyecto.volverAProyectos')}
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                type="button"
                onClick={() => navigate('/proyectos')}
                disabled={guardando}
              >
                {t('formularioProyecto.cancelar')}
              </Button>
              <Button
                variant="contained"
                type="submit"
                disabled={guardando}
                startIcon={guardando ? <CircularProgress size={18} color="inherit" /> : null}
                className="form-proyecto-btn-primario"
              >
                {guardando
                  ? t('formularioProyecto.guardando')
                  : errorServidor
                  ? t('formularioProyecto.reintentar')
                  : esEdicion
                  ? t('formularioProyecto.botonGuardar')
                  : t('formularioProyecto.botonCrear')}
              </Button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default FormularioProyecto;