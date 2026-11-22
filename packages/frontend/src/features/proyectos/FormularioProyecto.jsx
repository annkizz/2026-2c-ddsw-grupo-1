import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  AlertTitle,
  Button,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Step,
  StepButton,
  StepLabel,
  Stepper,
  Switch,
  TextField,
} from '@mui/material';
import { FiAlertCircle, FiArrowLeft, FiArrowRight, FiCalendar, FiFileText, FiLock, FiMapPin, FiSave, FiTag } from 'react-icons/fi';
import EncabezadoPagina from '../../components/EncabezadoPagina/EncabezadoPagina.jsx';
import AlertaError from '../../components/AlertaError/AlertaError.jsx';
import ResumenErrores from '../../components/ResumenErrores/ResumenErrores.jsx';
import Dialogo from '../../components/Dialogo/Dialogo.jsx';
import { EsqueletoFormulario } from '../../components/Esqueletos/Esqueletos.jsx';
import { useNotificar } from '../../components/Notificador/Notificador.jsx';
import CustomSelect from '../../components/CustomSelect/CustomSelect';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useListado } from '../../hooks/useListado';
import { PROVINCIAS } from '../../data/provincias';
import {
  crearProyecto,
  actualizarProyecto,
  obtenerProyectoPorId,
  programarCierre,
} from '../../service/proyectosService';
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

// Crear: pasos cortos, solo el primero es obligatorio; se puede ir y volver entre pasos y crear desde cualquiera.
// Editar: las mismas partes en un menú lateral. La búsqueda se configura desde "Administrar" del proyecto.
const PASOS_FORMULARIO = [
  { titulo: t('formularioProyecto.pasoBasico'), campos: ['titulo', 'descripcion'], icono: FiFileText },
  { titulo: t('formularioProyecto.pasoEtiquetas'), campos: [], opcional: true, icono: FiTag },
  {
    titulo: t('formularioProyecto.pasoFechas'),
    tituloEdicion: t('formularioProyecto.pasoCierre'),
    campos: ['fechaLimiteCierre', 'fechaLimiteBusqueda'],
    opcional: true,
    icono: FiCalendar,
  },
];
const ULTIMO_PASO = PASOS_FORMULARIO.length - 1;
const pasoDelCampo = (campo) => Math.max(0, PASOS_FORMULARIO.findIndex(({ campos }) => campos.includes(campo)));

const FormularioProyecto = () => {
  const { id } = useParams(); // si hay id, estamos editando
  const esEdicion = Boolean(id);
  const navigate = useNavigate();
  const { sesion, getAccessToken } = useAuth();
  const notificar = useNotificar();

  const [datos, setDatos] = useState(DATOS_INICIALES);
  const [inicial, setInicial] = useState(null);
  const [esFinalizado, setEsFinalizado] = useState(false);
  const [errores, setErrores] = useState({});
  const [cargandoInicial, setCargandoInicial] = useState(esEdicion);
  const [guardando, setGuardando] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);
  const [intentoResumen, setIntentoResumen] = useState(0);
  const [confirmandoSalida, setConfirmandoSalida] = useState(false);
  const [paso, setPaso] = useState(0);
  const etiquetasState = useListado('/etiquetas');

  const cargar = useCallback(async () => {
      if (!esEdicion) return;
      setCargandoInicial(true);
      setErrorCarga(null);
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
        setErrorCarga(err);
      } finally {
        setCargandoInicial(false);
      }
  }, [id, esEdicion]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // En edición, una fecha que no tocaste no se vuelve a validar
  const cambio = (campo) => !inicial || datos[campo] !== inicial[campo];

  const cambiarCampo = (campo, valor) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: '' }));
    if (errorServidor) setErrorServidor(null);
  };

  const alternarEtiqueta = (etiqueta) => {
    setDatos((prev) => ({
      ...prev,
      etiquetas: prev.etiquetas.includes(etiqueta)
        ? prev.etiquetas.filter((una) => una !== etiqueta)
        : [...prev.etiquetas, etiqueta],
    }));
    if (errorServidor) setErrorServidor(null);
  };

  const cambiarProvincia = (e) => {
    const provincia = e.target.value;
    setDatos((prev) => ({
      ...prev,
      provincia,
      ciudad: provincia ? prev.ciudad : '',
    }));
    if (errorServidor) setErrorServidor(null);
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

  const validarCampos = (campos) => {
    const nuevosErrores = {};
    campos.forEach((campo) => {
      const mensaje = mensajeDeError(campo);
      if (mensaje) nuevosErrores[campo] = mensaje;
    });
    setErrores((prev) => ({ ...prev, ...Object.fromEntries(campos.map((campo) => [campo, nuevosErrores[campo] ?? ''])) }));
    setIntentoResumen((n) => n + 1);
    const conError = Object.keys(nuevosErrores);
    // Si el error está en otro paso, se vuelve a ese paso para que el campo se pueda corregir.
    if (conError.length > 0) setPaso(pasoDelCampo(conError[0]));
    return conError.length === 0;
  };

  const validarFormularioCompleto = () =>
    validarCampos(esEdicion ? ['titulo', 'descripcion', 'fechaLimiteCierre'] : ['titulo', 'descripcion', 'fechaLimiteCierre', 'fechaLimiteBusqueda']);

  const irAPaso = (destino) => {
    // Para avanzar se revisa el paso actual; para volver atrás, nunca.
    if (destino > paso && !validarCampos(PASOS_FORMULARIO[paso].campos)) return;
    setIntentoResumen(0);
    setPaso(Math.max(0, Math.min(ULTIMO_PASO, destino)));
  };
  const siguientePaso = () => irAPaso(paso + 1);
  const tituloDePaso = (indice) =>
    esEdicion ? PASOS_FORMULARIO[indice].tituloEdicion ?? PASOS_FORMULARIO[indice].titulo : PASOS_FORMULARIO[indice].titulo;

  // Enter en un campo de una línea no envía el formulario: se crea/guarda solo con el botón.
  const evitarEnvioConEnter = (evento) => {
    if (evento.key === 'Enter' && evento.target.tagName === 'INPUT' && evento.target.type !== 'checkbox') {
      evento.preventDefault();
    }
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
    setErrorServidor(null);
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
      notificar({ mensaje: esEdicion ? t('formularioProyecto.exitoEditar') : t('formularioProyecto.exitoCrear') });
    } catch (err) {
      // Lo ingresado se conserva: el formulario no se limpia ante un error.
      setErrorServidor(err);
    } finally {
      setGuardando(false);
    }
  };

  const camposBloqueados = guardando || guardadoExitoso;
  const titulo = esEdicion ? t('formularioProyecto.tituloEditar') : t('formularioProyecto.tituloCrear');
  const migas = [
    { texto: t('navegacion.inicio'), to: '/' },
    { texto: t('formularioProyecto.migaMisProyectos'), to: '/proyectos' },
    ...(esEdicion && inicial?.titulo ? [{ texto: inicial.titulo, to: `/proyectos/${id}` }] : []),
    { texto: titulo },
  ];
  const hayCambios =
    !guardadoExitoso &&
    (esEdicion ? inicial && JSON.stringify(datos) !== JSON.stringify(inicial) : JSON.stringify(datos) !== JSON.stringify(DATOS_INICIALES));

  const salir = () => {
    if (hayCambios) {
      setConfirmandoSalida(true);
      return;
    }
    navigate('/proyectos');
  };

  const mensajeCampo = (error, ayuda) =>
    error ? (
      <>
        <FiAlertCircle aria-hidden="true" />
        <span>{error}</span>
      </>
    ) : (
      ayuda
    );

  const IDS_CAMPOS = {
    titulo: 'proyecto-titulo',
    descripcion: 'proyecto-descripcion',
    fechaLimiteCierre: 'proyecto-cierre',
    fechaLimiteBusqueda: 'proyecto-limite-busqueda',
  };
  const listaErrores = Object.entries(errores)
    .filter(([, mensaje]) => mensaje)
    .map(([campo, mensaje]) => ({ campoId: IDS_CAMPOS[campo], mensaje }));

  if (cargandoInicial) {
    return (
      <div className="contenedor-pagina">
        <EncabezadoPagina titulo={titulo} migas={migas} />
        <EsqueletoFormulario campos={5} />
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="contenedor-pagina contenedor-pagina--formulario">
        <EncabezadoPagina titulo={titulo} migas={migas} />
        <AlertaError error={errorCarga} titulo={t('formularioProyecto.errorCargarTitulo')} onReintentar={cargar} />
      </div>
    );
  }

  return (
    <div className={`contenedor-pagina${esEdicion ? '' : ' contenedor-pagina--formulario'}`}>
      <EncabezadoPagina titulo={titulo} migas={migas} />

      {guardadoExitoso && (
        <Alert severity="success" role="status" className="form-proyecto-banner">
          <AlertTitle>{esEdicion ? t('formularioProyecto.exitoEditar') : t('formularioProyecto.exitoCrear')}</AlertTitle>
          {esEdicion ? t('formularioProyecto.exitoEditarDetalle') : t('formularioProyecto.exitoCrearDetalle')}
        </Alert>
      )}

      <ResumenErrores errores={listaErrores.length > 0 && intentoResumen > 0 ? listaErrores : []} intento={intentoResumen} />

      <form onSubmit={guardar} onKeyDown={evitarEnvioConEnter} noValidate>
        {!esEdicion && (
          <Stepper
            nonLinear
            activeStep={paso}
            className="form-proyecto-pasos"
            aria-label={t('formularioProyecto.pasosEtiqueta')}
          >
            {PASOS_FORMULARIO.map(({ titulo: tituloPaso, opcional }, indice) => (
              <Step key={tituloPaso} completed={indice < paso}>
                <StepButton
                  type="button"
                  onClick={() => irAPaso(indice)}
                  optional={opcional ? <span className="texto-caption">{t('comun.opcional')}</span> : undefined}
                  aria-current={indice === paso ? 'step' : undefined}
                >
                  {tituloPaso}
                </StepButton>
              </Step>
            ))}
          </Stepper>
        )}
        <p className="visualmente-oculto" aria-live="polite">
          {esEdicion
            ? tituloDePaso(paso)
            : t('formularioProyecto.pasoActual', { actual: paso + 1, total: PASOS_FORMULARIO.length, titulo: tituloDePaso(paso) })}
        </p>

        <div className={esEdicion ? 'con-lateral form-proyecto-edicion' : ''}>
        {esEdicion && (
          <nav className="lateral" aria-label={t('formularioProyecto.seccionesEdicion')}>
            <ul className="lateral-nav">
              {PASOS_FORMULARIO.map(({ icono: Icono, campos }, indice) => {
                const conError = campos.some((campo) => errores[campo]);
                return (
                  <li key={indice}>
                    <button
                      type="button"
                      className="lateral-nav__item"
                      aria-current={indice === paso ? 'true' : undefined}
                      onClick={() => setPaso(indice)}
                    >
                      <Icono aria-hidden="true" />
                      <span>{tituloDePaso(indice)}</span>
                      {conError && (
                        <span className="insignia insignia--error">
                          <FiAlertCircle aria-hidden="true" />
                          <span className="visualmente-oculto">{t('formularioProyecto.seccionConError')}</span>
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
        <div className="form-proyecto-contenido">
        {paso === 0 && (
          <section className="form-proyecto-card" aria-labelledby="form-proyecto-datos">
            <h2 id="form-proyecto-datos">{tituloDePaso(0)}</h2>
            <TextField
              id="proyecto-titulo"
              label={t('formularioProyecto.labelTitulo')}
              placeholder={t('formularioProyecto.placeholderTitulo')}
              value={datos.titulo}
              onChange={(e) => cambiarCampo('titulo', e.target.value)}
              onBlur={() => validarCampoIndividual('titulo')}
              error={Boolean(errores.titulo)}
              helperText={mensajeCampo(errores.titulo)}
              disabled={camposBloqueados}
              required
              fullWidth
              slotProps={{ input: { endAdornment: guardadoExitoso ? <FiLock aria-hidden="true" /> : null } }}
            />

            <TextField
              id="proyecto-descripcion"
              label={t('formularioProyecto.labelDescripcion')}
              placeholder={t('formularioProyecto.placeholderDescripcion')}
              value={datos.descripcion}
              onChange={(e) => cambiarCampo('descripcion', e.target.value)}
              onBlur={() => validarCampoIndividual('descripcion')}
              error={Boolean(errores.descripcion)}
              helperText={mensajeCampo(errores.descripcion, t('formularioProyecto.ayudaDescripcion'))}
              disabled={camposBloqueados}
              required
              multiline
              minRows={5}
              fullWidth
            />
          </section>
        )}

        {paso === 1 && (
          <section className="form-proyecto-card" aria-labelledby="form-proyecto-etiquetas-titulo">
            <h2 id="form-proyecto-etiquetas-titulo">{tituloDePaso(1)}</h2>
            <div>
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
                ayuda={t('formularioProyecto.ayudaEtiquetas')}
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
                <Alert severity="warning" className="form-proyecto-aviso">
                  {t('formularioProyecto.errorEtiquetas')}
                  <div className="alerta-acciones">
                    <Button variant="outlined" onClick={etiquetasState.recargar}>
                      {t('formularioProyecto.reintentar')}
                    </Button>
                  </div>
                </Alert>
              )}
            </div>

            {esEdicion ? (
              <div className="form-proyecto-ubicacion form-proyecto-ubicacion--fija">
                <p className="perfil-buscado__etiqueta">{t('formularioProyecto.ubicacion')}</p>
                <p>
                  <FiMapPin aria-hidden="true" />{' '}
                  {[datos.ciudad, PROVINCIAS.find(({ codigo }) => codigo === datos.provincia)?.nombre].filter(Boolean).join(', ') ||
                    t('formularioProyecto.ubicacionDelColectivo')}
                </p>
                <p className="texto-secundario">{t('formularioProyecto.ubicacionNoEditable')}</p>
              </div>
            ) : (
              <fieldset className="form-proyecto-ubicacion">
                <legend>{t('formularioProyecto.ubicacion')}</legend>
                <p className="texto-secundario">{t('formularioProyecto.ayudaUbicacion')}</p>
                <div className="form-proyecto-ubicacion__campos">
                  <TextField
                    id="proyecto-provincia"
                    select
                    label={t('formularioProyecto.labelProvincia')}
                    value={datos.provincia}
                    onChange={cambiarProvincia}
                    disabled={camposBloqueados}
                    fullWidth
                    slotProps={{ select: { displayEmpty: true } }}
                  >
                    <MenuItem value="">{t('formularioProyecto.opcionProvinciaHeredada')}</MenuItem>
                    {PROVINCIAS.map(({ codigo, nombre }) => (
                      <MenuItem key={codigo} value={codigo}>
                        {nombre}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    id="proyecto-ciudad"
                    label={t('formularioProyecto.labelCiudad')}
                    placeholder={t('formularioProyecto.placeholderCiudad')}
                    value={datos.ciudad}
                    onChange={(e) => cambiarCampo('ciudad', e.target.value)}
                    disabled={camposBloqueados || !datos.provincia}
                    helperText={!datos.provincia ? t('formularioProyecto.ayudaCiudad') : undefined}
                    fullWidth
                  />
                </div>
              </fieldset>
            )}
          </section>
        )}

        {paso === 2 && (
          <div className="form-proyecto-columna">
            <section className="form-proyecto-card" aria-labelledby="form-proyecto-cierre">
              <h2 id="form-proyecto-cierre">{t('formularioProyecto.cardCierre')}</h2>
              <TextField
                id="proyecto-cierre"
                type="date"
                label={t('formularioProyecto.labelFechaCierre')}
                value={datos.fechaLimiteCierre}
                onChange={(e) => cambiarCampo('fechaLimiteCierre', e.target.value)}
                onBlur={() => validarCampoIndividual('fechaLimiteCierre')}
                error={Boolean(errores.fechaLimiteCierre)}
                helperText={mensajeCampo(errores.fechaLimiteCierre, t('formularioProyecto.ayudaFechaCierre'))}
                disabled={camposBloqueados || esFinalizado}
                fullWidth
              />
            </section>

            {!esEdicion && (
            <section className="form-proyecto-card" aria-labelledby="form-proyecto-busqueda">
              <h2 id="form-proyecto-busqueda">{t('formularioProyecto.cardBusqueda')}</h2>

              {esFinalizado && <Alert severity="info">{t('formularioProyecto.avisoFinalizado')}</Alert>}

              <div className="interruptor-fila">
                <div>
                  <strong>{t('formularioProyecto.labelBusquedaAbierta')}</strong>
                  <p className="texto-secundario">
                    {datos.busquedaAbierta ? t('formularioProyecto.estadoActivada') : t('formularioProyecto.estadoDesactivada')}
                  </p>
                </div>
                <div className="interruptor-fila__control">
                  {esFinalizado && <FiLock aria-hidden="true" />}
                  <Switch
                    checked={datos.busquedaAbierta}
                    onChange={manejarSwitchBusqueda}
                    disabled={camposBloqueados || esFinalizado}
                    slotProps={{
                      input: { 'aria-label': t('formularioProyecto.labelBusquedaAbierta'), 'aria-describedby': 'ayuda-busqueda' },
                    }}
                  />
                </div>
              </div>
              <p className="texto-secundario" id="ayuda-busqueda">
                {t('formularioProyecto.ayudaBusqueda')}
              </p>

              <TextField
                id="proyecto-limite-busqueda"
                type="date"
                label={t('formularioProyecto.labelFechaLimite')}
                value={datos.fechaLimiteBusqueda}
                onChange={(e) => cambiarCampo('fechaLimiteBusqueda', e.target.value)}
                onBlur={() => validarCampoIndividual('fechaLimiteBusqueda')}
                error={Boolean(errores.fechaLimiteBusqueda)}
                helperText={mensajeCampo(
                  errores.fechaLimiteBusqueda
                    ? `${errores.fechaLimiteBusqueda}. ${t('formularioProyecto.ayudaFechaLimiteConservar')}`
                    : '',
                  esFinalizado
                    ? t('formularioProyecto.ayudaNoDisponibleFinalizado')
                    : datos.busquedaAbierta
                      ? t('formularioProyecto.ayudaFechaLimiteActiva')
                      : t('formularioProyecto.ayudaFechaLimiteInactiva')
                )}
                disabled={camposBloqueados || esFinalizado || (!datos.busquedaAbierta && !datos.fechaLimiteBusqueda)}
                fullWidth
              />
            </section>
            )}
            {esEdicion && <p className="texto-secundario">{t('formularioProyecto.busquedaEnAdministrar')}</p>}
          </div>
        )}

        </div>
        </div>

        {errorServidor && (
          <AlertaError
            className="form-proyecto-banner"
            error={errorServidor}
            titulo={t('formularioProyecto.errorGuardarTitulo')}
          >
            <span> {t('formularioProyecto.datosConservados')}</span>
          </AlertaError>
        )}

        <div className="form-proyecto-acciones">
          {guardadoExitoso ? (
            <Button variant="contained" onClick={() => navigate('/proyectos')} endIcon={<FiArrowRight aria-hidden="true" />}>
              {t('formularioProyecto.volverAProyectos')}
            </Button>
          ) : (
            <>
              <Button variant="text" type="button" onClick={salir} disabled={guardando} className="form-proyecto-acciones__cancelar">
                {t('formularioProyecto.cancelar')}
              </Button>
              {!esEdicion && paso > 0 && (
                <Button
                  key="anterior"
                  variant="outlined"
                  type="button"
                  onClick={() => irAPaso(paso - 1)}
                  disabled={guardando}
                  startIcon={<FiArrowLeft aria-hidden="true" />}
                >
                  {t('formularioProyecto.anterior')}
                </Button>
              )}
              {!esEdicion && paso < ULTIMO_PASO && (
                <Button
                  key="siguiente"
                  variant="outlined"
                  type="button"
                  onClick={siguientePaso}
                  disabled={guardando}
                  endIcon={<FiArrowRight aria-hidden="true" />}
                >
                  {t('formularioProyecto.siguiente', { titulo: PASOS_FORMULARIO[paso + 1].titulo })}
                </Button>
              )}
              {/* Siempre disponible: lo opcional se puede completar o saltear. */}
              <Button
                key="guardar"
                variant="contained"
                color="secondary"
                type="submit"
                loading={guardando}
                startIcon={<FiSave aria-hidden="true" />}
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

      <Dialogo open={confirmandoSalida} onClose={() => setConfirmandoSalida(false)} aria-labelledby="salir-titulo">
        <DialogTitle id="salir-titulo">{t('formularioProyecto.salirTitulo')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('formularioProyecto.salirTexto')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setConfirmandoSalida(false)}>
            {t('formularioProyecto.seguirEditando')}
          </Button>
          <Button variant="contained" color="error" onClick={() => navigate('/proyectos')}>
            {t('formularioProyecto.salirSinGuardar')}
          </Button>
        </DialogActions>
      </Dialogo>
    </div>
  );
};

export default FormularioProyecto;
