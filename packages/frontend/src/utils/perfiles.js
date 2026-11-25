import { t } from '../i18n/t';

export const TIPOS_COMPROMISO = ['TOTALES', 'MENSUALES', 'SEMANALES'];
export const MODALIDADES = ['GRATUITA', 'INCENTIVO', 'CONTRATACION'];

export const describirCompromiso = (compromiso) => {
  if (!compromiso) return t('tarjetas.compromisoNoInformado');
  const horas = compromiso.horas ?? '?';
  const tipoCompromiso = (compromiso.tipoCompromiso ?? '').toUpperCase();
  const tipoColaboracion = (compromiso.tipoColaboracion ?? '').toUpperCase();
  const frecuencia = TIPOS_COMPROMISO.includes(tipoCompromiso)
    ? t(`tarjetas.frecuencia.${tipoCompromiso}`)
    : tipoCompromiso.toLowerCase();
  const colaboracion = MODALIDADES.includes(tipoColaboracion)
    ? t(`tarjetas.colaboracion.${tipoColaboracion}`)
    : tipoColaboracion.toLowerCase();
  return t(horas === 1 ? 'tarjetas.compromisoUnaHora' : 'tarjetas.compromisoVariasHoras', {
    horas, frecuencia, colaboracion,
  });
};

export const listarHabilidades = (habilidades) =>
  habilidades?.length > 0 ? habilidades.join(', ') : t('tarjetas.ninguna');

export const resumenCompromiso = (compromiso) =>
  t(`enumeraciones.compromisoResumen.${compromiso.tipoCompromiso}`, {
    horas: compromiso.horas,
  });

export const etiquetaModalidad = (modalidad) =>
  t(`enumeraciones.tipoColaboracion.${modalidad}`);

export const textoCupo = (cantidad) =>
  cantidad == null
    ? t('enumeraciones.sinLimite')
    : t('enumeraciones.cupoLimitado', { cantidad });
