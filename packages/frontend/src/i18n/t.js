import es from '../assets/es.json';
import pt from '../assets/pt.json';
import gr from '../assets/gr.json';
import { useSyncExternalStore } from 'react';

const catalogos = { es, pt, gr };
const claveIdioma = 'idioma';
const listeners = new Set();

const leerIdioma = () => {
  try {
    const guardado = localStorage.getItem(claveIdioma);
    return Object.prototype.hasOwnProperty.call(catalogos, guardado) ? guardado : 'es';
  } catch (error) {
    console.warn('No se pudo leer el idioma guardado.', error);
    return 'es';
  }
};

let idioma = leerIdioma();

export const obtenerIdioma = () => idioma;
export const obtenerLocale = () => {
  if (idioma === 'pt') return 'pt-BR';
  if (idioma === 'gr') return 'gn-PY';
  return 'es-AR';
};

export const cambiarIdioma = (nuevoIdioma) => {
  if (!Object.prototype.hasOwnProperty.call(catalogos, nuevoIdioma)) {
    throw new Error(`Idioma no soportado: ${nuevoIdioma}`);
  }
  if (idioma === nuevoIdioma) return;
  idioma = nuevoIdioma;
  try {
    localStorage.setItem(claveIdioma, idioma);
  } catch (error) {
    console.warn('No se pudo guardar el idioma elegido.', error);
  }
  listeners.forEach((listener) => listener());
};

const suscribir = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useIdioma = () => useSyncExternalStore(suscribir, obtenerIdioma, () => 'es');

export const t = (key, params = {}, idiomaElegido = idioma) => {
  const buscar = (catalogo) => key.split('.').reduce((actual, segmento) => actual?.[segmento], catalogo);
  const traducido = buscar(catalogos[idiomaElegido]);
  if (idiomaElegido !== 'es' && typeof traducido !== 'string') {
    console.warn(`Falta la traducción "${key}" para el idioma "${idiomaElegido}".`);
  }
  const valor = traducido ?? buscar(es);
  if (typeof valor !== 'string') return key;

  return Object.entries(params).reduce(
    (texto, [nombre, reemplazo]) => texto.replaceAll(`{${nombre}}`, String(reemplazo)),
    valor
  );
};
