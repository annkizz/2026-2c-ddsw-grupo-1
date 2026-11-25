import React, { useEffect, useState } from 'react';
import {
  Alert,
  AlertTitle,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import {
  FiActivity,
  FiEdit2,
  FiLink,
  FiPlus,
  FiRefreshCw,
  FiRotateCcw,
  FiSend,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useNotificar } from '../../components/Notificador/Notificador.jsx';
import EncabezadoPagina from '../../components/EncabezadoPagina/EncabezadoPagina.jsx';
import AlertaError from '../../components/AlertaError/AlertaError.jsx';
import Dialogo from '../../components/Dialogo/Dialogo.jsx';
import { obtenerLocale, t } from '../../i18n/t';
import { mensajeDeError } from '../../service/api';
import {
  actualizarWebhook,
  crearWebhook,
  eliminarWebhook,
  listarWebhooks,
  probarWebhook,
  regenerarSecretoWebhook,
} from '../../service/webhooksService';
import './Webhooks.css';

const EVENTOS = [
  'POSTULACION_CREADA',
  'COLABORACION_ACEPTADA',
  'PROYECTO_CERRADO',
];
const FORMATOS = ['GENERICO', 'SLACK', 'DISCORD'];
const LIMITE_WEBHOOKS = 5;

const FORMULARIO_VACIO = {
  url: '',
  eventos: [],
  formato: 'GENERICO',
  activo: true,
};

const fechaVisible = (fecha) => {
  if (!fecha) return null;
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(obtenerLocale(), { dateStyle: 'medium', timeStyle: 'short' });
};

const Webhooks = () => {
  const { sesion, getAccessToken } = useAuth();
  const notificar = useNotificar();
  const idColectivo = sesion?.idColectivo;
  const [webhooks, setWebhooks] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [errorAccion, setErrorAccion] = useState(null);
  const [formulario, setFormulario] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [procesandoId, setProcesandoId] = useState(null);
  const [webhookEnPrueba, setWebhookEnPrueba] = useState(null);
  const [resultadosPrueba, setResultadosPrueba] = useState({});
  const [secretoVisible, setSecretoVisible] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const [intentoCarga, setIntentoCarga] = useState(0);

  useEffect(() => {
    let vigente = true;
    const cargar = async () => {
      setCargando(true);
      setErrorCarga(null);
      try {
        if (!idColectivo) {
          throw new Error(t('webhooks.errorPerfil'));
        }
        const token = await getAccessToken();
        const resultado = await listarWebhooks(token, idColectivo);
        if (!vigente) return;
        setWebhooks(resultado);
      } catch (error) {
        if (vigente) setErrorCarga(error);
      } finally {
        if (vigente) setCargando(false);
      }
    };

    cargar();
    return () => {
      vigente = false;
    };
  }, [getAccessToken, idColectivo, intentoCarga]);

  const cambiarFormulario = (campo, valor) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  };

  const cambiarEvento = (evento) => {
    setFormulario((actual) => {
      const eventos = actual.eventos.includes(evento)
        ? actual.eventos.filter((seleccionado) => seleccionado !== evento)
        : [...actual.eventos, evento];
      return { ...actual, eventos };
    });
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    if (!formulario || formulario.eventos.length === 0) {
      setErrorAccion(new Error(t('webhooks.errorEventos')));
      return;
    }
    if (!formulario.id && !formulario.url.trim()) {
      setErrorAccion(new Error(t('webhooks.errorUrl')));
      return;
    }

    setGuardando(true);
    setErrorAccion(null);
    try {
      const token = await getAccessToken();
      const datos = {
        eventos: formulario.eventos,
        formato: formulario.formato,
        activo: formulario.activo,
      };
      if (formulario.url.trim()) datos.url = formulario.url.trim();

      if (formulario.id) {
        const actualizado = await actualizarWebhook(
          token,
          idColectivo,
          formulario.id,
          datos,
        );
        setWebhooks((actuales) =>
          actuales.map((webhook) =>
            webhook.id === actualizado.id ? actualizado : webhook,
          ),
        );
        notificar({ mensaje: t('webhooks.exitoActualizacion') });
      } else {
        const creado = await crearWebhook(token, idColectivo, datos);
        setWebhooks((actuales) => [...actuales, creado]);
        setSecretoVisible({
          nombre: creado.url,
          secreto: creado.secreto,
        });
        notificar({ mensaje: t('webhooks.exitoCreacion') });
      }
      setFormulario(null);
    } catch (error) {
      setErrorAccion(error);
    } finally {
      setGuardando(false);
    }
  };

  const iniciarEdicion = (webhook) => {
    setErrorAccion(null);
    setFormulario({
      id: webhook.id,
      url: '',
      eventos: [...webhook.eventos],
      formato: webhook.formato,
      activo: webhook.activo,
    });
  };

  const actualizarEstado = async (webhook, activo) => {
    setProcesandoId(webhook.id);
    setErrorAccion(null);
    try {
      const token = await getAccessToken();
      const actualizado = await actualizarWebhook(
        token,
        idColectivo,
        webhook.id,
        { activo },
      );
      setWebhooks((actuales) =>
        actuales.map((actual) => actual.id === actualizado.id ? actualizado : actual),
      );
      notificar({
        mensaje: t(activo ? 'webhooks.activado' : 'webhooks.desactivado'),
      });
    } catch (error) {
      setErrorAccion(error);
    } finally {
      setProcesandoId(null);
    }
  };

  const ejecutarPrueba = async (webhook) => {
    setProcesandoId(webhook.id);
    setWebhookEnPrueba(webhook.id);
    setErrorAccion(null);
    try {
      const token = await getAccessToken();
      const resultado = await probarWebhook(token, idColectivo, webhook.id);
      setResultadosPrueba((actuales) => ({
        ...actuales,
        [webhook.id]: resultado,
      }));
      setWebhooks((actuales) =>
        actuales.map((actual) =>
          actual.id === webhook.id
            ? {
                ...actual,
                ultimaEntrega: {
                  fecha: new Date().toISOString(),
                  estado: resultado.estado,
                  httpStatus: resultado.httpStatus,
                },
              }
            : actual,
        ),
      );
    } catch (error) {
      setErrorAccion(error);
    } finally {
      setProcesandoId(null);
      setWebhookEnPrueba(null);
    }
  };

  const ejecutarConfirmacion = async () => {
    if (!confirmacion) return;
    const { tipo, webhook } = confirmacion;
    setProcesandoId(webhook.id);
    setErrorAccion(null);
    try {
      const token = await getAccessToken();
      if (tipo === 'eliminar') {
        await eliminarWebhook(token, idColectivo, webhook.id);
        setWebhooks((actuales) =>
          actuales.filter((actual) => actual.id !== webhook.id),
        );
        setResultadosPrueba((actuales) => {
          const siguientes = { ...actuales };
          delete siguientes[webhook.id];
          return siguientes;
        });
        notificar({ mensaje: t('webhooks.exitoEliminacion') });
      } else {
        const actualizado = await regenerarSecretoWebhook(
          token,
          idColectivo,
          webhook.id,
        );
        setWebhooks((actuales) =>
          actuales.map((actual) =>
            actual.id === actualizado.id ? actualizado : actual,
          ),
        );
        setSecretoVisible({
          nombre: actualizado.url,
          secreto: actualizado.secreto,
        });
        notificar({ mensaje: t('webhooks.exitoSecreto') });
      }
      setConfirmacion(null);
    } catch (error) {
      setErrorAccion(error);
    } finally {
      setProcesandoId(null);
    }
  };

  const abrirFormulario = () => {
    setErrorAccion(null);
    setFormulario({ ...FORMULARIO_VACIO });
  };

  const recargar = () => setIntentoCarga((intento) => intento + 1);
  const bloquearAcciones = guardando || Boolean(procesandoId);

  return (
    <section className="webhooks-pagina">
      <EncabezadoPagina
        titulo={t('webhooks.titulo')}
        subtitulo={t('webhooks.subtitulo')}
        className="webhooks-encabezado"
      />

      <Alert severity="info" className="webhooks-ayuda">
        <AlertTitle>{t('webhooks.comoFuncionanTitulo')}</AlertTitle>
        {t('webhooks.comoFuncionan')}
      </Alert>

      {secretoVisible && (
        <Alert
          severity="warning"
          onClose={() => setSecretoVisible(null)}
          className="webhooks-secreto"
        >
          <AlertTitle>{t('webhooks.secretoTitulo')}</AlertTitle>
          <p>{t('webhooks.secretoAyuda', { nombre: secretoVisible.nombre })}</p>
          <code>{secretoVisible.secreto}</code>
        </Alert>
      )}

      {errorAccion && (
        <Alert severity="error" role="alert" className="webhooks-error">
          {mensajeDeError(errorAccion)}
        </Alert>
      )}

      {!idColectivo ? (
        <Alert severity="error">{t('webhooks.errorPerfil')}</Alert>
      ) : cargando ? (
        <p role="status">{t('webhooks.cargando')}</p>
      ) : errorCarga ? (
        <AlertaError
          error={errorCarga}
          titulo={t('webhooks.errorCarga')}
          onReintentar={recargar}
        />
      ) : (
        <>
          <div className="webhooks-lista-encabezado">
            <h2>{t('webhooks.listaTitulo', { cantidad: webhooks.length, maximo: LIMITE_WEBHOOKS })}</h2>
            {!formulario && webhooks.length < LIMITE_WEBHOOKS && (
              <Button
                variant="contained"
                startIcon={<FiPlus aria-hidden="true" />}
                onClick={abrirFormulario}
              >
                {t('webhooks.agregar')}
              </Button>
            )}
          </div>

          {formulario && (
            <Card component="form" onSubmit={guardar} className="webhooks-formulario">
              <CardContent>
                <h2>{t(formulario.id ? 'webhooks.editarTitulo' : 'webhooks.nuevoTitulo')}</h2>
                <TextField
                  label={t('webhooks.url')}
                  type="url"
                  value={formulario.url}
                  onChange={(evento) => cambiarFormulario('url', evento.target.value)}
                  required={!formulario.id}
                  fullWidth
                  helperText={
                    formulario.id
                      ? t('webhooks.urlEditarAyuda')
                      : t('webhooks.urlAyuda')
                  }
                  autoComplete="url"
                />
                <fieldset className="webhooks-eventos">
                  <legend>{t('webhooks.eventosTitulo')}</legend>
                  <FormGroup>
                    {EVENTOS.map((evento) => (
                      <FormControlLabel
                        key={evento}
                        control={
                          <Checkbox
                            checked={formulario.eventos.includes(evento)}
                            onChange={() => cambiarEvento(evento)}
                          />
                        }
                        label={t(`webhooks.eventos.${evento}`)}
                      />
                    ))}
                  </FormGroup>
                </fieldset>
                <div className="webhooks-formulario__fila">
                  <FormControl fullWidth>
                    <InputLabel id="webhooks-formato-label">{t('webhooks.formato')}</InputLabel>
                    <Select
                      labelId="webhooks-formato-label"
                      value={formulario.formato}
                      label={t('webhooks.formato')}
                      onChange={(evento) => cambiarFormulario('formato', evento.target.value)}
                    >
                      {FORMATOS.map((formato) => (
                        <MenuItem key={formato} value={formato}>
                          {t(`webhooks.formatos.${formato}`)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formulario.activo}
                        onChange={(evento) => cambiarFormulario('activo', evento.target.checked)}
                      />
                    }
                    label={t('webhooks.activo')}
                  />
                </div>
              </CardContent>
              <CardActions className="webhooks-formulario__acciones">
                <Button
                  type="button"
                  color="inherit"
                  startIcon={<FiX aria-hidden="true" />}
                  onClick={() => setFormulario(null)}
                  disabled={guardando}
                >
                  {t('comun.cancelar')}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<FiLink aria-hidden="true" />}
                  loading={guardando}
                >
                  {t(formulario.id ? 'webhooks.guardar' : 'webhooks.crear')}
                </Button>
              </CardActions>
            </Card>
          )}

          {webhooks.length === 0 && !formulario ? (
            <Alert severity="info">{t('webhooks.sinWebhooks')}</Alert>
          ) : webhooks.length > 0 ? (
            <div className="webhooks-lista">
              {webhooks.map((webhook) => {
                const resultado = resultadosPrueba[webhook.id];
                const entrega = webhook.ultimaEntrega;
                const probando = webhookEnPrueba === webhook.id;
                return (
                  <Card key={webhook.id} className="webhooks-tarjeta">
                    <CardContent>
                      <div className="webhooks-tarjeta__encabezado">
                        <div>
                          <h3>{webhook.url}</h3>
                          <p>
                            {t('webhooks.formato')}:{' '}
                            {t(`webhooks.formatos.${webhook.formato}`)}
                          </p>
                        </div>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={webhook.activo}
                              disabled={bloquearAcciones || Boolean(formulario)}
                              onChange={(evento) =>
                                actualizarEstado(webhook, evento.target.checked)
                              }
                              slotProps={{
                                input: {
                                  'aria-label': t(
                                    webhook.activo
                                      ? 'webhooks.desactivar'
                                      : 'webhooks.activar',
                                    { url: webhook.url },
                                  ),
                                },
                              }}
                            />
                          }
                          label={t(webhook.activo ? 'webhooks.activo' : 'webhooks.inactivo')}
                        />
                      </div>

                      <p className="webhooks-tarjeta__eventos">
                        <strong>{t('webhooks.eventosTitulo')}:</strong>{' '}
                        {webhook.eventos
                          .map((evento) => t(`webhooks.eventos.${evento}`))
                          .join(', ')}
                      </p>

                      <p className="webhooks-tarjeta__entrega">
                        <FiActivity aria-hidden="true" />
                        {entrega
                          ? t('webhooks.ultimaEntrega', {
                              fecha: fechaVisible(entrega.fecha) ?? '',
                              estado: t(`webhooks.estados.${entrega.estado}`),
                              status: entrega.httpStatus
                                ? ` · HTTP ${entrega.httpStatus}`
                                : '',
                            })
                          : t('webhooks.sinEntregas')}
                      </p>

                      {resultado && (
                        <Alert
                          severity={
                            resultado.estado === 'ENVIADO' ||
                            resultado.estado === 'SIMULADO'
                              ? 'success'
                              : 'error'
                          }
                          className="webhooks-resultado"
                        >
                          <strong>{t(`webhooks.estados.${resultado.estado}`)}</strong>
                          {resultado.httpStatus ? ` · HTTP ${resultado.httpStatus}` : ''}
                          {resultado.detalle ? ` · ${resultado.detalle}` : ''}
                        </Alert>
                      )}
                    </CardContent>
                    <CardActions className="webhooks-tarjeta__acciones">
                      <Button
                        startIcon={<FiSend aria-hidden="true" />}
                        onClick={() => ejecutarPrueba(webhook)}
                        disabled={bloquearAcciones || Boolean(formulario)}
                      >
                        {probando ? t('webhooks.probando') : t('webhooks.probar')}
                      </Button>
                      <Button
                        startIcon={<FiEdit2 aria-hidden="true" />}
                        onClick={() => iniciarEdicion(webhook)}
                        disabled={Boolean(formulario) || bloquearAcciones}
                      >
                        {t('webhooks.editar')}
                      </Button>
                      <Button
                        startIcon={<FiRotateCcw aria-hidden="true" />}
                        onClick={() => setConfirmacion({ tipo: 'secreto', webhook })}
                        disabled={Boolean(formulario) || bloquearAcciones}
                      >
                        {t('webhooks.regenerarSecreto')}
                      </Button>
                      <Button
                        color="error"
                        startIcon={<FiTrash2 aria-hidden="true" />}
                        onClick={() => setConfirmacion({ tipo: 'eliminar', webhook })}
                        disabled={Boolean(formulario) || bloquearAcciones}
                      >
                        {t('webhooks.eliminar')}
                      </Button>
                    </CardActions>
                  </Card>
                );
              })}
            </div>
          ) : null}

          {webhooks.length >= LIMITE_WEBHOOKS && (
            <Alert severity="info" className="webhooks-limite">
              {t('webhooks.limite', { maximo: LIMITE_WEBHOOKS })}
            </Alert>
          )}
        </>
      )}

      <Dialogo
        open={Boolean(confirmacion)}
        onClose={() => setConfirmacion(null)}
        aria-labelledby="webhooks-confirmacion-titulo"
      >
        <DialogTitle id="webhooks-confirmacion-titulo">
          {t(confirmacion?.tipo === 'eliminar' ? 'webhooks.confirmarEliminar' : 'webhooks.confirmarSecreto')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t(confirmacion?.tipo === 'eliminar' ? 'webhooks.confirmarEliminarAyuda' : 'webhooks.confirmarSecretoAyuda')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmacion(null)}
            disabled={Boolean(procesandoId)}
          >
            {t('comun.cancelar')}
          </Button>
          <Button
            color={confirmacion?.tipo === 'eliminar' ? 'error' : 'primary'}
            startIcon={
              confirmacion?.tipo === 'eliminar'
                ? <FiTrash2 aria-hidden="true" />
                : <FiRefreshCw aria-hidden="true" />
            }
            onClick={ejecutarConfirmacion}
            loading={Boolean(procesandoId)}
          >
            {t(confirmacion?.tipo === 'eliminar' ? 'webhooks.eliminar' : 'webhooks.regenerar')}
          </Button>
        </DialogActions>
      </Dialogo>
    </section>
  );
};

export default Webhooks;
