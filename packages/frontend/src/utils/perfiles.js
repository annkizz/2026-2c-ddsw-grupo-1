import { t } from '../i18n/t';

export const TIPOS_COMPROMISO = ['TOTALES', 'MENSUALES', 'SEMANALES'];
export const MODALIDADES = ['GRATUITA', 'INCENTIVO', 'CONTRATACION'];

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
