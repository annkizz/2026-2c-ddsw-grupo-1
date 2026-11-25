import { t } from '../i18n/t';

// Clasifica un error (de axios u otro) sin mostrar nunca el texto del backend,
// error.message ni códigos internos. Cada tipo tiene su texto en es.json (errores.*).
export const TIPOS_ERROR = {
  sinConexion: 'sinConexion',
  sesionVencida: 'sesionVencida',
  sinPermisos: 'sinPermisos',
  noEncontrado: 'noEncontrado',
  validacion: 'validacion',
  conflicto: 'conflicto',
  servidor: 'servidor',
  inesperado: 'inesperado'
};

const estaOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

export const clasificarError = (error) => {
  if (!error) return TIPOS_ERROR.inesperado;
  if (estaOffline()) return TIPOS_ERROR.sinConexion;

  const status = error.response?.status;
  if (!status) {
    const esDeRed =
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.message === 'Network Error' ||
      Boolean(error.request);
    return esDeRed ? TIPOS_ERROR.sinConexion : TIPOS_ERROR.inesperado;
  }
  if (status === 401) return TIPOS_ERROR.sesionVencida;
  if (status === 403) return TIPOS_ERROR.sinPermisos;
  if (status === 404) return TIPOS_ERROR.noEncontrado;
  if (status === 409) return TIPOS_ERROR.conflicto;
  if (status === 400 || status === 422) return TIPOS_ERROR.validacion;
  if (status >= 500) return TIPOS_ERROR.servidor;
  return TIPOS_ERROR.inesperado;
};

// Código HTTP visible (401, 403, 404, 500…): se muestra como "Error 403" en vez de un
// "no autorizado" genérico. Nunca se muestra el texto ni el código interno del backend.
export const codigoHttp = (error) => {
  const status = error?.response?.status;
  return Number.isInteger(status) && status >= 400 && status <= 599 ? status : null;
};

// { tipo, mensaje, accion, codigo } donde accion es 'iniciarSesion', 'reintentar' o null.
export const describirError = (error) => {
  const tipo = clasificarError(error);
  const codigo = codigoHttp(error);
  const accion =
    tipo === TIPOS_ERROR.sesionVencida
      ? 'iniciarSesion'
      : [TIPOS_ERROR.sinConexion, TIPOS_ERROR.servidor, TIPOS_ERROR.inesperado, TIPOS_ERROR.conflicto].includes(tipo)
        ? 'reintentar'
        : null;
  return { tipo, mensaje: t(`errores.${tipo}`), accion, codigo };
};

// Texto listo para mostrar. Si se pasa un contexto ("No pudimos guardar el perfil."),
// se antepone a la explicación del tipo de error.
export const mensajeDeError = (error, contexto) => {
  const { mensaje, codigo } = describirError(error);
  const conCodigo = codigo ? `${mensaje} (${t('errores.etiquetaCodigo', { codigo })})` : mensaje;
  return contexto ? `${contexto} ${conCodigo}` : conCodigo;
};

export default mensajeDeError;
