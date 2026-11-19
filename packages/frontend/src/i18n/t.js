import es from '../assets/es.json';

export const t = (key, params = {}) => {
  const valor = key.split('.').reduce((actual, segmento) => actual?.[segmento], es);
  if (typeof valor !== 'string') return key;

  return Object.entries(params).reduce(
    (texto, [nombre, reemplazo]) => texto.replaceAll(`{${nombre}}`, String(reemplazo)),
    valor
  );
};
